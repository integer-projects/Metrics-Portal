# Operations And Recovery Guide

## Service Components

- Node/Express web application.
- PostgreSQL Windows service.
- Smartsheet synchronization worker.
- PM2 process management.
- Scheduled database backup job.
- Central logs and health monitoring.

## Health Checks

### Liveness

Confirms the Node process is running and able to answer HTTP requests. It must not depend on Smartsheet.

### Readiness

Confirms the application can safely accept production work. It should verify database connectivity, expected migration version, and required internal services.

### Integration Health

Reports active, pending, processing, failed, and `needs_review` queue counts; the oldest active item and its age; the recent error count; and the last successful delivery. Health becomes degraded when active work reaches five minutes or terminal work exists. Smartsheet degradation does not make database-backed capture unavailable.

## Automated Local Health Monitor

`Test-MetricsPortalOperations.ps1` combines the production checks that previously required several manual commands. It verifies:

- PM2 `metrics-portal` and `metrics-portal-worker` are online.
- The PostgreSQL 18 Windows service is running.
- Portal liveness and database readiness are healthy.
- The integration queue has no five-minute active item, failed item, or `needs_review` item.
- The backup scheduled task is enabled and its previous result is `0`.
- The latest backup is within the age limit and its SHA-256 sidecar still matches.
- The application drive retains the configured minimum free space.

Each run atomically replaces `C:\serverdata\monitoring\metrics-portal-health.json` with a timestamped, structured result and exits nonzero when any check fails. This result is suitable for local review and for a future company-approved alert collector. The monitor never reads or writes production payloads and does not expose secrets.

The confirmation-gated installer registers `Metrics Portal Operations Health` every five minutes under the current server identity:

```powershell
& 'C:\serverdata\repos\metrics-portal\scripts\windows\Install-MetricsPortalHealthMonitor.ps1' `
    -BaseUrl 'http://10.15.3.47:3002' `
    -BackupRoot '\\TRN-FIL-02\Sys\Johnny Bercegeay\PortalDataBackup' `
    -Confirmation 'INSTALL METRICS PORTAL HEALTH MONITOR'
```

After installation, start it once, wait for completion, and inspect the persisted result:

```powershell
Start-ScheduledTask -TaskName 'Metrics Portal Operations Health'
Start-Sleep -Seconds 30
Get-ScheduledTaskInfo -TaskName 'Metrics Portal Operations Health' |
    Select-Object LastRunTime,LastTaskResult,NextRunTime
Get-Content 'C:\serverdata\monitoring\metrics-portal-health.json' -Raw |
    ConvertFrom-Json | Format-List CheckedAt,Hostname,OverallStatus
```

The current interactive-logon task identity is an interim local monitor, like the backup task. Company-approved email, Teams, or enterprise monitoring transport remains an operations/IT decision; installation of the local task does not claim that routed alerting is complete.

## Monitoring And Alerts

Monitor at minimum:

- Application process availability and restart count.
- Database service availability.
- Disk free space.
- Database connection failures.
- Queue depth and age of oldest pending submission.
- Failed and `needs_review` submission counts.
- Smartsheet response time, rate limits, and authentication failures.
- Backup job completion and backup age.
- Unexpected duplicate submission IDs.

Alert messages should identify the affected component, department, first failure time, current count, and the first safe action to take.

## Logging

- Use structured logs with timestamp, level, request ID, submission ID, department, and operation.
- Do not log tokens, passwords, or complete sensitive payloads.
- Separate normal application logs from error logs.
- Retain logs for an approved period and rotate them before disk growth threatens the server.
- Record deployment commit and application version at startup.

## Backup Policy

- Run an automated PostgreSQL backup at least daily.
- Store backups off the application server.
- Encrypt backups when required by company policy.
- Retain daily, weekly, and monthly copies according to the approved retention period.
- Monitor backup completion and age.
- Keep database migration files and application releases in Git; backups protect production data, not source code.

## Current Backup Implementation Status

The repository includes Windows backup tooling, and the target server has already produced verified off-machine backups during readiness work. The backup script creates a PostgreSQL custom-format dump, verifies it with `pg_restore --list`, writes a SHA-256 metadata sidecar, and removes partial artifacts if backup or verification fails.

Current state as of August 13, 2026:

- Manual verified backups have been proven against the approved off-server backup share.
- Backup freshness/hash verification tooling exists.
- An isolated restore drill has been proven against a disposable PostgreSQL database.
- The Windows scheduled task `Metrics Portal PostgreSQL Backup` is registered for daily 1:00 AM execution and has completed a manual scheduled-task run with result `0`.
- The scheduled task continued to run daily after PL cutover. The August 13 run completed at 1:00 AM with result `0`, and the next run was scheduled for August 14 at 1:00 AM.
- PL production submissions are database-backed, and the August 13 review found the latest ten jobs/events delivered with remote row IDs and no stuck outbox records.

Daily and after every deployment, confirm:

1. The scheduled backup task's latest run is successful.
2. `Test-BackupFreshness.ps1` passes with the agreed maximum age.
3. The scheduled task identity remains valid and can read the protected backup environment file.
4. The task identity can still write to the approved off-server backup share.
5. At least one recent backup has either passed a restore drill or is covered by the documented restore-drill cadence.
6. PM2 shows both `metrics-portal` and `metrics-portal-worker` online.
7. PL database and outbox rows converge to `submitted`; investigate any pending item older than five minutes or any `failed`/`needs_review` row.

The initial scheduled task uses the current server account with interactive logon. This is acceptable for the current workstation/server operating model, but an IT-owned service account or password-backed scheduled task is preferred for fully unattended operation.

## Current Process Ownership

- Keep `metrics-portal` online; it is the production web application.
- Keep `metrics-portal-worker` online; it is required for PL Smartsheet synchronization.
- The legacy `PL-Portal` PM2 process was stopped and saved on August 13. Do not delete its PM2 entry or files until the 30-day PL observation and rollback-retention review closes.
- `capacity-report` and the capacity-monitor process are separate applications and are not changed by this playbook.

## Restore Testing

A backup is not considered valid until restored successfully.

At least quarterly:

1. Select a recent backup.
2. Restore it into an isolated database.
3. Apply any required migrations.
4. Start the application against the restored database.
5. Verify users, workspaces, submissions, outbox records, and audit history.
6. Record duration, issues, and recovery point.
7. Correct deficiencies immediately.

## Incident Priorities

- **P1:** acknowledged data loss, widespread duplicate creation, security incident, or all departments unavailable.
- **P2:** one department blocked, database unavailable, queue not processing, or material data mismatch.
- **P3:** isolated failure with a safe workaround.
- **P4:** minor defect or improvement request.

## Incident Response

1. Record start time, reporter, affected department, and visible message.
2. Preserve screenshots, submission IDs, logs, and release version.
3. Determine whether database saves are succeeding before asking users to retry.
4. Stop or disable only the unsafe component when possible.
5. Do not manually resubmit uncertain records until their IDs are checked.
6. Communicate a clear operator instruction.
7. Restore service through rollback, repair, or fail-safe mode.
8. Reconcile affected submissions.
9. Document cause, corrective action, and prevention.

## Routine Maintenance

- Review failed submissions each production day.
- Confirm backup success daily.
- Review disk space and PM2 restarts weekly.
- Apply supported Node, PostgreSQL, and dependency updates through the normal branch and release workflow.
- Run restore drills quarterly.
- Review access and inactive accounts quarterly.
- Review this playbook after significant incidents or architecture changes.

## Recovery Objectives To Approve

- Recovery Point Objective: maximum acceptable data age lost after a server failure.
- Recovery Time Objective: maximum acceptable time to restore portal operation.
- Maximum acceptable Smartsheet synchronization delay.
- Escalation contacts and after-hours responsibilities.

The initial recommendation is an RPO of 24 hours for catastrophic server loss with daily backups, improved later with more frequent backups or replication. Acknowledged submissions since the last backup remain at risk if the server disk is completely lost, so the final RPO must be explicitly accepted or improved.
