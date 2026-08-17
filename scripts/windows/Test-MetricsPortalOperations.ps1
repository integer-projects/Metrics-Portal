[CmdletBinding()]
param(
    [string]$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [Parameter(Mandatory = $true)][ValidatePattern('^https?://')][string]$BaseUrl,
    [Parameter(Mandatory = $true)][string]$BackupRoot,
    [string]$BackupTaskName = 'Metrics Portal PostgreSQL Backup',
    [string]$OutputPath = 'C:\serverdata\monitoring\metrics-portal-health.json',
    [int]$MaximumBackupAgeHours = 26,
    [int]$MaximumQueueAgeSeconds = 300,
    [int]$MinimumFreeGb = 20
)

$ErrorActionPreference = 'Stop'
$checks = [System.Collections.Generic.List[object]]::new()

function Add-Check([string]$Name, [bool]$Healthy, [string]$Detail, $Data = $null) {
    $checks.Add([pscustomobject]@{
        Name = $Name
        Healthy = $Healthy
        Detail = $Detail
        Data = $Data
    })
}

function Get-Pm2Applications {
    $raw = (& pm2.cmd jlist 2>$null | Out-String).Trim()
    $start = $raw.IndexOf('[{')
    if ($start -lt 0) {
        if ($raw -eq '[]') { return @() }
        throw 'PM2 did not return a readable application list.'
    }
    $javascript = @'
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
    const applications = JSON.parse(input);
    const summary = applications.map(application => ({
        name: application.name,
        pid: application.pid,
        pm2_env: {
            status: application.pm2_env && application.pm2_env.status,
            restart_time: application.pm2_env && application.pm2_env.restart_time
        }
    }));
    process.stdout.write(JSON.stringify(summary));
});
'@
    $summary = ($raw.Substring($start) | & node -e $javascript | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $summary) {
        throw 'PM2 process-list normalization failed.'
    }
    @($summary | ConvertFrom-Json)
}

try {
    $apps = Get-Pm2Applications
    foreach ($name in @('metrics-portal','metrics-portal-worker')) {
        $app = $apps | Where-Object name -eq $name | Select-Object -First 1
        $status = $app.pm2_env.status
        Add-Check "PM2 $name" ($status -eq 'online') $(if ($app) { "Status $status; PID $($app.pid); restarts $($app.pm2_env.restart_time)" } else { 'Application not registered' })
    }
} catch {
    Add-Check 'PM2 process list' $false $_.Exception.Message
}

$postgres = Get-Service | Where-Object { $_.Name -match '^postgresql.*18' } | Select-Object -First 1
Add-Check 'PostgreSQL service' ($postgres.Status -eq 'Running') $(if ($postgres) { "$($postgres.Name): $($postgres.Status)" } else { 'PostgreSQL 18 service not found' })

try {
    $liveness = Invoke-RestMethod -Uri "$BaseUrl/api/v2/health" -TimeoutSec 10
    Add-Check 'Portal liveness' ($liveness.status -eq 'alive') "Status $($liveness.status); version $($liveness.version); commit $($liveness.commit)" $liveness
} catch { Add-Check 'Portal liveness' $false $_.Exception.Message }

try {
    $readiness = Invoke-RestMethod -Uri "$BaseUrl/api/v2/health/ready" -TimeoutSec 10
    Add-Check 'Portal readiness' ($readiness.status -eq 'ready') "Status $($readiness.status)" $readiness
} catch { Add-Check 'Portal readiness' $false $_.Exception.Message }

try {
    $integration = Invoke-RestMethod -Uri "$BaseUrl/api/v2/health/integrations" -TimeoutSec 10
    $queue = $integration.queue
    $queueHealthy = $integration.status -eq 'ok' -and
        [int]$queue.failedCount -eq 0 -and
        [int]$queue.needsReviewCount -eq 0 -and
        [int]$queue.oldestActiveAgeSeconds -lt $MaximumQueueAgeSeconds
    Add-Check 'Smartsheet outbox' $queueHealthy "Status $($integration.status); active $($queue.activeCount); failed $($queue.failedCount); needs review $($queue.needsReviewCount); oldest $($queue.oldestActiveAgeSeconds)s" $integration
} catch { Add-Check 'Smartsheet outbox' $false $_.Exception.Message }

try {
    $task = Get-ScheduledTask -TaskName $BackupTaskName -ErrorAction Stop
    $taskInfo = Get-ScheduledTaskInfo -TaskName $BackupTaskName -ErrorAction Stop
    $taskHealthy = $task.State -ne 'Disabled' -and $taskInfo.LastTaskResult -eq 0
    Add-Check 'Backup scheduled task' $taskHealthy "State $($task.State); last result $($taskInfo.LastTaskResult); next $($taskInfo.NextRunTime.ToString('o'))" $taskInfo
} catch { Add-Check 'Backup scheduled task' $false $_.Exception.Message }

try {
    $freshness = & (Join-Path $AppRoot 'scripts\windows\Test-BackupFreshness.ps1') -BackupRoot $BackupRoot -MaximumAgeHours $MaximumBackupAgeHours
    Add-Check 'Verified backup freshness' $true "Age $($freshness.AgeHours)h; hash verified" $freshness
} catch { Add-Check 'Verified backup freshness' $false $_.Exception.Message }

try {
    $driveName = [System.IO.Path]::GetPathRoot($AppRoot).TrimEnd('\').TrimEnd(':')
    $drive = Get-PSDrive -Name $driveName -ErrorAction Stop
    $freeGb = [math]::Round($drive.Free / 1GB, 1)
    Add-Check 'Application disk space' ($freeGb -ge $MinimumFreeGb) "$freeGb GB free; minimum $MinimumFreeGb GB" ([pscustomobject]@{ FreeGb = $freeGb })
} catch { Add-Check 'Application disk space' $false $_.Exception.Message }

$healthy = $checks.Where({ -not $_.Healthy }).Count -eq 0
$result = [ordered]@{
    CheckedAt = (Get-Date).ToString('o')
    Hostname = $env:COMPUTERNAME
    OverallStatus = $(if ($healthy) { 'healthy' } else { 'unhealthy' })
    Checks = @($checks)
}

$directory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $directory -Force | Out-Null
$temporary = "$OutputPath.tmp"
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $temporary -Encoding UTF8
Move-Item -LiteralPath $temporary -Destination $OutputPath -Force

$checks | Select-Object Name,Healthy,Detail | Format-Table -AutoSize
Write-Output "Overall status: $($result.OverallStatus)"
Write-Output "Result file: $OutputPath"
if (-not $healthy) { exit 1 }
