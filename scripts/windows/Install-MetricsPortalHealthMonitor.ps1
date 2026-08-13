[CmdletBinding()]
param(
    [string]$AppRoot = 'C:\serverdata\repos\metrics-portal',
    [Parameter(Mandatory = $true)][ValidatePattern('^https?://')][string]$BaseUrl,
    [Parameter(Mandatory = $true)][string]$BackupRoot,
    [string]$TaskName = 'Metrics Portal Operations Health',
    [string]$OutputPath = 'C:\serverdata\monitoring\metrics-portal-health.json',
    [int]$Minutes = 5,
    [Parameter(Mandatory = $true)][ValidateSet('INSTALL METRICS PORTAL HEALTH MONITOR')][string]$Confirmation
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath (Join-Path $AppRoot 'scripts\windows\Test-MetricsPortalOperations.ps1') -PathType Leaf)) {
    throw "Health-monitor script is missing beneath AppRoot: $AppRoot"
}
if (-not (Test-Path -LiteralPath $BackupRoot -PathType Container)) { throw "BackupRoot does not exist: $BackupRoot" }
if ($Minutes -lt 1 -or $Minutes -gt 60) { throw 'Minutes must be between 1 and 60.' }

$monitor = Join-Path $AppRoot 'scripts\windows\Test-MetricsPortalOperations.ps1'
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$monitor`" -AppRoot `"$AppRoot`" -BaseUrl `"$BaseUrl`" -BackupRoot `"$BackupRoot`" -OutputPath `"$OutputPath`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $Minutes)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 4)
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
$task = Get-ScheduledTask -TaskName $TaskName
[pscustomobject]@{
    TaskName = $task.TaskName
    State = $task.State
    IntervalMinutes = $Minutes
    ResultPath = $OutputPath
}
