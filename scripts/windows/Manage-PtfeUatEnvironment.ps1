[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateSet('Start','PauseWorker','ResumeWorker','Rollback','Stop')][string]$Action,
    [string]$RepositoryPath = 'C:\serverdata\staging\metrics-portal-ptfe-uat',
    [string]$EnvironmentFile = 'C:\serverdata\repos\metrics-portal\.env',
    [string]$StateDirectory = 'C:\serverdata\staging\metrics-portal-ptfe-uat-runtime',
    [Parameter(Mandatory = $true)][string]$MasterIntegrationSheetId,
    [Parameter(Mandatory = $true)][string]$JobIntegrationSheetId,
    [int]$Port = 3103,
    [string]$DatabaseName = 'metrics_portal_ptfe_uat',
    [string]$Superuser = 'postgres',
    [string]$OwnerRole = 'metrics_portal_owner',
    [string]$MigrationRole = 'metrics_portal_migrator',
    [string]$ApplicationRole = 'metrics_portal_app',
    [Parameter(Mandatory = $true)][ValidateSet('MANAGE ISOLATED PTFE UAT')][string]$Confirmation
)

$ErrorActionPreference = 'Stop'
$statePath = Join-Path $StateDirectory 'state.json'
$script:environmentSnapshot = @{}

function Protect-EnvironmentName([string]$Name) {
    if ($script:environmentSnapshot.ContainsKey($Name)) { return }
    $current = [Environment]::GetEnvironmentVariable($Name, 'Process')
    $script:environmentSnapshot[$Name] = [pscustomobject]@{ Exists = ($null -ne $current); Value = $current }
}

function Restore-ProtectedEnvironment {
    foreach ($name in $script:environmentSnapshot.Keys) {
        $entry = $script:environmentSnapshot[$name]
        [Environment]::SetEnvironmentVariable($name, $(if ($entry.Exists) { $entry.Value } else { $null }), 'Process')
    }
}

function Find-PgTool([string]$Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $candidate = Join-Path $env:ProgramFiles "PostgreSQL\18\bin\$Name.exe"
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    throw "$Name is not available in PATH or the PostgreSQL 18 default directory."
}

function Convert-Secret([Security.SecureString]$Value) {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

function Import-DotEnv([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Environment file not found: $Path" }
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { continue }
        $name = $Matches[1]
        Protect-EnvironmentName $name
        $value = $Matches[2].Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

function Assert-SafeIdentifier([string]$Value) {
    if ($Value -notmatch '^[a-z][a-z0-9_]{2,62}$') { throw "Unsafe PostgreSQL identifier: $Value" }
}

function Get-LivePortalSnapshot {
    $ports = 3000,3002
    $snapshot = @($ports | ForEach-Object {
        $connection = Get-NetTCPConnection -State Listen -LocalPort $_ -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($connection) { [pscustomobject]@{ Port = $_; ProcessId = $connection.OwningProcess } }
    })
    if (-not ($snapshot | Where-Object Port -eq 3002)) { throw 'Required Metrics Portal listener 3002 is missing.' }
    $snapshot
}

function Assert-LivePortalsUnchanged($Before) {
    foreach ($portal in $Before) {
        $connection = Get-NetTCPConnection -State Listen -LocalPort $portal.Port -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $connection -or $connection.OwningProcess -ne $portal.ProcessId) {
            throw "Live portal on port $($portal.Port) changed during UAT management."
        }
    }
}

function Stop-StateProcesses($State) {
    $targets = @(
        [pscustomobject]@{ ProcessId = $State.workerPid; Script = 'smartsheet-worker.js' },
        [pscustomobject]@{ ProcessId = $State.webPid; Script = 'server.js' }
    )
    foreach ($target in $targets) {
        $processId = $target.ProcessId
        if (-not $processId) { continue }
        $details = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
        if ($details -and ($details.Name -ne 'node.exe' -or $details.CommandLine -notmatch [regex]::Escape($target.Script))) {
            throw "Refusing to stop PID $processId because it is not the recorded $($target.Script) process."
        }
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Stop-Process -Id $processId
            $process.WaitForExit(10000) | Out-Null
        }
    }
}

function Stop-RecordedWorker($State) {
    $processId = $State.workerPid
    if (-not $processId) { throw 'The isolated PTFE worker is not recorded as running.' }
    $details = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    if ($details -and ($details.Name -ne 'node.exe' -or $details.CommandLine -notmatch 'smartsheet-worker\.js')) {
        throw "Refusing to stop PID $processId because it is not the recorded isolated worker."
    }
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $processId
        $process.WaitForExit(10000) | Out-Null
    }
}

function Start-UatProcess([string]$Script, [string]$OutLog, [string]$ErrorLog) {
    Start-Process -FilePath (Get-Command node).Source -ArgumentList $Script -WorkingDirectory $RepositoryPath `
        -WindowStyle Hidden -RedirectStandardOutput $OutLog -RedirectStandardError $ErrorLog -PassThru
}

@(
    'PTFE_INTEGRATION_MASTER_LOG_SHEET_ID','PTFE_INTEGRATION_JOB_LOG_SHEET_ID','PTFE_PRODUCTION_MASTER_LOG_SHEET_ID','PTFE_PRODUCTION_JOB_LOG_SHEET_ID','PORTAL_USAGE_LOG_SHEET_ID','NODE_ENV','PORT','SERVER_HOST','CORS_ORIGIN',
    'DATABASE_ENABLED','DATABASE_REQUIRED','DATABASE_URL','DURABLE_SUBMISSIONS_ENABLED','SERVER_SESSIONS_ENABLED',
    'SERVER_WORKSPACES_ENABLED','PL_SERVER_SESSIONS_ENABLED','PTFE_SERVER_SESSIONS_ENABLED','PI_SERVER_SESSIONS_ENABLED',
    'PL_DATABASE_SUBMISSIONS_ENABLED','PTFE_DATABASE_SUBMISSIONS_ENABLED','SESSION_COOKIE_NAME','SESSION_COOKIE_SECURE','DEPT_PTFE_MASTER_LOG_SHEET_ID','DEPT_PTFE_JOB_LOG_SHEET_ID',
    'PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE'
) | ForEach-Object { Protect-EnvironmentName $_ }

try {
@($DatabaseName,$Superuser,$OwnerRole,$MigrationRole,$ApplicationRole) | ForEach-Object { Assert-SafeIdentifier $_ }
$liveBefore = Get-LivePortalSnapshot

if ($Action -eq 'Start') {
    if (-not $MasterIntegrationSheetId -or -not $JobIntegrationSheetId) { throw 'Both PTFE integration sheet IDs are required for Start.' }
    if (-not (Test-Path -LiteralPath (Join-Path $RepositoryPath 'server.js') -PathType Leaf)) { throw "UAT checkout not found: $RepositoryPath" }
    if (Test-Path -LiteralPath $statePath) { throw "UAT state already exists: $statePath" }
    if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) { throw "Port $Port is already in use." }

    Import-DotEnv $EnvironmentFile
    $productionMasterId = $env:DEPT_PTFE_MASTER_LOG_SHEET_ID
    $productionJobId = $env:DEPT_PTFE_JOB_LOG_SHEET_ID
    if (-not $productionMasterId -or -not $productionJobId) { throw 'Production PTFE destination settings are missing.' }
    if ($MasterIntegrationSheetId -eq $JobIntegrationSheetId) { throw 'PTFE integration sheets must be distinct.' }
    if (@($productionMasterId,$productionJobId) -contains $MasterIntegrationSheetId -or @($productionMasterId,$productionJobId) -contains $JobIntegrationSheetId) {
        throw 'PTFE integration sheets must not equal either production destination.'
    }

    $env:PTFE_INTEGRATION_MASTER_LOG_SHEET_ID = $MasterIntegrationSheetId
    $env:PTFE_INTEGRATION_JOB_LOG_SHEET_ID = $JobIntegrationSheetId
    $env:PTFE_PRODUCTION_MASTER_LOG_SHEET_ID = $productionMasterId
    $env:PTFE_PRODUCTION_JOB_LOG_SHEET_ID = $productionJobId
    Push-Location $RepositoryPath
    try { & npm.cmd run validate:ptfe-uat-sheets; if ($LASTEXITCODE -ne 0) { throw 'The PTFE UAT sheet guard failed.' } }
    finally { Pop-Location }

    $adminPassword = Convert-Secret (Read-Host 'PostgreSQL superuser password' -AsSecureString)
    $migrationPassword = Convert-Secret (Read-Host 'Migration-role password' -AsSecureString)
    $applicationPassword = Convert-Secret (Read-Host 'Application-role password' -AsSecureString)
    $psqlExe = Find-PgTool 'psql'
    $previousPg = @{}
    @('PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE') | ForEach-Object { $previousPg[$_] = [Environment]::GetEnvironmentVariable($_, 'Process') }
    try {
        $env:PGHOST='127.0.0.1'; $env:PGPORT='5432'; $env:PGUSER=$Superuser; $env:PGPASSWORD=$adminPassword; $env:PGDATABASE='postgres'
        $exists = & $psqlExe -X -Atq --set ON_ERROR_STOP=1 -c "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"
        if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the isolated UAT database.' }
        if ($exists) { throw "Isolated database $DatabaseName already exists; run Stop cleanup before starting." }
        & $psqlExe -X --quiet --set ON_ERROR_STOP=1 -c "CREATE DATABASE $DatabaseName OWNER $OwnerRole;"
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the isolated UAT database.' }
        $env:PGDATABASE=$DatabaseName
        "GRANT CONNECT ON DATABASE $DatabaseName TO $MigrationRole, $ApplicationRole;" | & $psqlExe -X --quiet --set ON_ERROR_STOP=1
        if ($LASTEXITCODE -ne 0) { throw 'Could not grant isolated database connections.' }

        $encodedMigration = [Uri]::EscapeDataString($migrationPassword)
        $env:DATABASE_URL = "postgresql://${MigrationRole}:$encodedMigration@127.0.0.1:5432/$DatabaseName"
        Push-Location $RepositoryPath
        try { & npm.cmd run migrate:up; if ($LASTEXITCODE -ne 0) { throw 'UAT migrations failed.' } }
        finally { Pop-Location }

        $env:PGPASSWORD=$adminPassword
        @"
GRANT USAGE ON SCHEMA public TO $ApplicationRole;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $ApplicationRole;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO $ApplicationRole;
"@ | & $psqlExe -X --quiet --set ON_ERROR_STOP=1
        if ($LASTEXITCODE -ne 0) { throw 'UAT runtime grants failed.' }
    } catch {
        $env:PGDATABASE='postgres'; $env:PGPASSWORD=$adminPassword
        & $psqlExe -X --quiet --set ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $DatabaseName WITH (FORCE);" | Out-Null
        throw
    } finally {
        foreach ($name in $previousPg.Keys) { [Environment]::SetEnvironmentVariable($name, $previousPg[$name], 'Process') }
        $adminPassword=$null; $migrationPassword=$null
    }

    $encodedApplication = [Uri]::EscapeDataString($applicationPassword)
    $env:DATABASE_URL = "postgresql://${ApplicationRole}:$encodedApplication@127.0.0.1:5432/$DatabaseName"
    $applicationPassword=$null
    # Keep the original production IDs in the dedicated safety variables above before
    # replacing the runtime destinations with the isolated test sheets.
    $env:DEPT_PTFE_MASTER_LOG_SHEET_ID=$MasterIntegrationSheetId
    $env:DEPT_PTFE_JOB_LOG_SHEET_ID=$JobIntegrationSheetId
    $env:PORTAL_USAGE_LOG_SHEET_ID=''
    $env:NODE_ENV='development'; $env:PORT=[string]$Port; $env:SERVER_HOST='127.0.0.1'; $env:CORS_ORIGIN="http://127.0.0.1:$Port"
    $env:DATABASE_ENABLED='true'; $env:DATABASE_REQUIRED='true'; $env:DURABLE_SUBMISSIONS_ENABLED='true'
    $env:SERVER_SESSIONS_ENABLED='true'; $env:SERVER_WORKSPACES_ENABLED='true'; $env:PL_SERVER_SESSIONS_ENABLED='false'
    $env:PL_DATABASE_SUBMISSIONS_ENABLED='false'; $env:PTFE_SERVER_SESSIONS_ENABLED='true'; $env:PTFE_DATABASE_SUBMISSIONS_ENABLED='true'; $env:PI_SERVER_SESSIONS_ENABLED='false'
    $env:SESSION_COOKIE_NAME='metrics_ptfe_uat_session'; $env:SESSION_COOKIE_SECURE='false'

    New-Item -ItemType Directory -Path $StateDirectory -Force | Out-Null
    $state = [ordered]@{ mode='initializing'; port=$Port; database=$DatabaseName; repository=$RepositoryPath; webPid=$null; workerPid=$null; startedAt=(Get-Date).ToString('o') }
    $state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    Push-Location $RepositoryPath
    try {
        & npm.cmd run validate:ptfe-outbox-integration -- --confirmation='VALIDATE PTFE DATABASE OUTBOX'
        if ($LASTEXITCODE -ne 0) { throw 'The PTFE database/outbox proof failed. Run Stop to remove the isolated environment.' }
    } finally { Pop-Location }

    $web = Start-UatProcess 'server.js' (Join-Path $StateDirectory 'web.out.log') (Join-Path $StateDirectory 'web.error.log')
    $worker = Start-UatProcess 'workers/smartsheet-worker.js' (Join-Path $StateDirectory 'worker.out.log') (Join-Path $StateDirectory 'worker.error.log')
    $state.mode='full'; $state.webPid=$web.Id; $state.workerPid=$worker.Id
    $state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    $ready=$false
    for ($attempt=1; $attempt -le 30; $attempt++) {
        try { $response=Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/api/v2/health/ready" -TimeoutSec 3; if ($response.StatusCode -eq 200) { $ready=$true; break } } catch {}
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { Stop-StateProcesses $state; throw "UAT portal did not become ready; inspect logs in $StateDirectory." }
    if (-not (Get-Process -Id $worker.Id -ErrorAction SilentlyContinue)) { Stop-StateProcesses $state; throw 'UAT worker exited during startup; inspect its error log.' }
    Assert-LivePortalsUnchanged $liveBefore
    Write-Output "PTFE UAT environment READY at http://127.0.0.1:$Port/login.html"
    Write-Output 'Use the test-ptfe training account. Live ports 3000 and 3002 are unchanged.'
}

if ($Action -eq 'PauseWorker') {
    if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) { throw 'No UAT state exists to pause.' }
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    if ($state.mode -ne 'full') { throw 'Worker recovery requires the full-feature PTFE UAT environment.' }
    Stop-RecordedWorker $state
    $state.workerPid = $null
    $state | Add-Member -NotePropertyName workerPaused -NotePropertyValue $true -Force
    $state | Add-Member -NotePropertyName workerPausedAt -NotePropertyValue (Get-Date).ToString('o') -Force
    $state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    if (-not (Get-Process -Id $state.webPid -ErrorAction SilentlyContinue)) { throw 'The isolated web process is not running after worker pause.' }
    Assert-LivePortalsUnchanged $liveBefore
    Write-Output 'PTFE UAT worker PAUSED. The isolated web/database remain available; production is unchanged.'
}

if ($Action -eq 'ResumeWorker') {
    if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) { throw 'No UAT state exists to resume.' }
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    if ($state.mode -ne 'full' -or -not $state.workerPaused) { throw 'The isolated PTFE worker is not in the guarded paused state.' }
    if ($state.workerPid -and (Get-Process -Id $state.workerPid -ErrorAction SilentlyContinue)) { throw 'A recorded isolated worker is already running.' }
    Import-DotEnv $EnvironmentFile
    $productionMasterId = $env:DEPT_PTFE_MASTER_LOG_SHEET_ID
    $productionJobId = $env:DEPT_PTFE_JOB_LOG_SHEET_ID
    if (-not $productionMasterId -or -not $productionJobId) { throw 'Production PTFE destination settings are missing.' }
    if ($MasterIntegrationSheetId -eq $productionMasterId -or $MasterIntegrationSheetId -eq $productionJobId -or
        $JobIntegrationSheetId -eq $productionMasterId -or $JobIntegrationSheetId -eq $productionJobId) {
        throw 'PTFE integration sheets must not equal either production destination.'
    }
    $applicationPassword = Convert-Secret (Read-Host 'PostgreSQL application-role password' -AsSecureString)
    $encodedApplication = [Uri]::EscapeDataString($applicationPassword)
    $env:DATABASE_URL = "postgresql://${ApplicationRole}:$encodedApplication@127.0.0.1:5432/$($state.database)"
    $applicationPassword = $null
    $env:DEPT_PTFE_MASTER_LOG_SHEET_ID=$MasterIntegrationSheetId
    $env:DEPT_PTFE_JOB_LOG_SHEET_ID=$JobIntegrationSheetId
    $env:PORTAL_USAGE_LOG_SHEET_ID=''; $env:NODE_ENV='development'
    $env:DATABASE_ENABLED='true'; $env:DATABASE_REQUIRED='true'; $env:DURABLE_SUBMISSIONS_ENABLED='true'
    $env:SERVER_SESSIONS_ENABLED='true'; $env:SERVER_WORKSPACES_ENABLED='true'; $env:PL_SERVER_SESSIONS_ENABLED='false'
    $env:PL_DATABASE_SUBMISSIONS_ENABLED='false'; $env:PTFE_SERVER_SESSIONS_ENABLED='true'; $env:PTFE_DATABASE_SUBMISSIONS_ENABLED='true'; $env:PI_SERVER_SESSIONS_ENABLED='false'
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $worker = Start-UatProcess 'workers/smartsheet-worker.js' (Join-Path $StateDirectory "worker-resume-$stamp.out.log") (Join-Path $StateDirectory "worker-resume-$stamp.error.log")
    Start-Sleep -Seconds 2
    if (-not (Get-Process -Id $worker.Id -ErrorAction SilentlyContinue)) { throw 'The isolated PTFE worker exited during recovery startup.' }
    $state.workerPid = $worker.Id
    $state.workerPaused = $false
    $state | Add-Member -NotePropertyName workerResumedAt -NotePropertyValue (Get-Date).ToString('o') -Force
    $state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    Assert-LivePortalsUnchanged $liveBefore
    Write-Output 'PTFE UAT worker RESUMED. Pending isolated deliveries can continue; production is unchanged.'
}

if ($Action -eq 'Rollback') {
    if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) { throw 'No UAT state exists to roll back.' }
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    if ($state.mode -ne 'full') { throw 'The UAT environment is not in full-feature mode.' }
    Stop-StateProcesses $state
    Import-DotEnv $EnvironmentFile
    $env:PORTAL_USAGE_LOG_SHEET_ID=''; $env:NODE_ENV='development'; $env:PORT=[string]$state.port
    $env:SERVER_HOST='127.0.0.1'; $env:CORS_ORIGIN="http://127.0.0.1:$($state.port)"
    $env:DATABASE_ENABLED='false'; $env:DATABASE_REQUIRED='false'; $env:DURABLE_SUBMISSIONS_ENABLED='false'
    $env:SERVER_SESSIONS_ENABLED='false'; $env:SERVER_WORKSPACES_ENABLED='false'; $env:PL_SERVER_SESSIONS_ENABLED='false'
    $env:PL_DATABASE_SUBMISSIONS_ENABLED='false'; $env:PTFE_SERVER_SESSIONS_ENABLED='false'; $env:PTFE_DATABASE_SUBMISSIONS_ENABLED='false'; $env:PI_SERVER_SESSIONS_ENABLED='false'
    $env:SESSION_COOKIE_NAME='metrics_ptfe_uat_rollback_session'; $env:SESSION_COOKIE_SECURE='false'
    $web = Start-UatProcess 'server.js' (Join-Path $StateDirectory 'rollback.out.log') (Join-Path $StateDirectory 'rollback.error.log')
    $state.mode='rollback'; $state.webPid=$web.Id; $state.workerPid=$null
    $state | Add-Member -NotePropertyName rolledBackAt -NotePropertyValue (Get-Date).ToString('o') -Force
    $state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    Start-Sleep -Seconds 2
    $features = Invoke-RestMethod -Uri "http://127.0.0.1:$($state.port)/api/v2/features" -TimeoutSec 5
    if ($features.features.ptfeDatabaseSubmissions -or $features.features.sessionDepartments.PTFE) { Stop-StateProcesses $state; throw 'Rollback flags did not disable PTFE migration features.' }
    Assert-LivePortalsUnchanged $liveBefore
    Write-Output "PTFE rollback rehearsal READY at http://127.0.0.1:$($state.port)/login.html"
    Write-Output 'New PTFE logins now use the compatibility portal; the isolated UAT database remains intact for cleanup.'
}

if ($Action -eq 'Stop') {
    if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) { throw 'No UAT state exists to stop.' }
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    Stop-StateProcesses $state
    Import-DotEnv $EnvironmentFile
    $env:PTFE_INTEGRATION_MASTER_LOG_SHEET_ID=$MasterIntegrationSheetId
    $env:PTFE_INTEGRATION_JOB_LOG_SHEET_ID=$JobIntegrationSheetId
    Push-Location $RepositoryPath
    try { & npm.cmd run cleanup:ptfe-uat-sheets -- --confirmation='CLEAR PTFE UAT TEST SHEETS'; if ($LASTEXITCODE -ne 0) { throw 'PTFE UAT sheet cleanup failed.' } }
    finally { Pop-Location }
    $adminPassword = Convert-Secret (Read-Host 'PostgreSQL superuser password' -AsSecureString)
    $psqlExe = Find-PgTool 'psql'
    $previousPg=@{}
    @('PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE') | ForEach-Object { $previousPg[$_] = [Environment]::GetEnvironmentVariable($_, 'Process') }
    try {
        $env:PGHOST='127.0.0.1'; $env:PGPORT='5432'; $env:PGUSER=$Superuser; $env:PGPASSWORD=$adminPassword; $env:PGDATABASE='postgres'
        & $psqlExe -X --quiet --set ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $DatabaseName WITH (FORCE);"
        if ($LASTEXITCODE -ne 0) { throw 'Could not remove the isolated UAT database.' }
    } finally {
        foreach ($name in $previousPg.Keys) { [Environment]::SetEnvironmentVariable($name, $previousPg[$name], 'Process') }
        $adminPassword=$null
    }
    Remove-Item -LiteralPath $statePath -Force
    Assert-LivePortalsUnchanged $liveBefore
    Write-Output 'PTFE UAT environment removed. Test sheets are empty; isolated database is removed; live portals are unchanged.'
}
} finally {
    Restore-ProtectedEnvironment
}
