# Windows Operations Tooling

These scripts are intended to be run locally on the Windows application server from an approved release checkout. They do not install PostgreSQL, create service accounts, configure Windows Firewall, issue certificates, or create off-machine storage; those actions require server/IT access.

## Preflight

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/Test-ProductionPrerequisites.ps1 `
  -BackupRoot 'X:\MetricsPortalBackups' `
  -BaseUrl 'http://10.15.3.47:3002'
```

The preflight checks required commands, `.env`, an existing backup destination, free disk, clean Git state, current commit, application identity, and application liveness. `BaseUrl` is mandatory so a host running multiple Node portals cannot silently validate the wrong process. It does not print environment values.

The production service is currently bound to its server address rather than loopback, so health checks use `http://10.15.3.47:3002`. The root title and `/api/v2/health` endpoint must both identify the Metrics Portal; a PM2 `online` label alone is insufficient.

## Verified Database Backup

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/Backup-Postgres.ps1 -BackupRoot 'X:\MetricsPortalBackups'
```

The backup command uses PostgreSQL custom format, verifies the archive with `pg_restore --list`, and writes a SHA-256 sidecar. It does not delete backups. `manage:backup-retention` now provides a separate dry-run-first, hash-verifying 14-daily/8-weekly/12-monthly plan and exact-confirmation apply mode. Apply or scheduled deletion remains prohibited until the approved off-machine destination's snapshot/copy behavior is known.

For a scheduled task, provide `-EnvironmentFile 'C:\path\to\.env'`; the script reads only `DATABASE_URL` and never prints it. The task identity must have read access to that file and write access to the backup destination.

Scheduling status: the Windows Task Scheduler job `Metrics Portal PostgreSQL Backup` was registered and verified on July 23, 2026 and continued running after PL cutover. The August 13 run returned result `0`. Continue checking both task result and `Test-BackupFreshness.ps1`; do not treat an old manual backup as proof that recurring backups are still active.

Verify backup age and integrity independently:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/Test-BackupFreshness.ps1 -BackupRoot 'X:\MetricsPortalBackups'
```

## Isolated Restore Drill

Create an empty database whose name ends in `_restore_drill`, then run. PostgreSQL requires `CREATE DATABASE` to be the only statement in its `psql -c` invocation; issue owner, connection, and schema grants in separate commands after creation.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/Restore-PostgresDrill.ps1 `
  -BackupFile 'X:\MetricsPortalBackups\metrics-portal-YYYYMMDD-HHMMSS.dump' `
  -RestoreDatabaseUrl 'postgresql://restore_user:password@127.0.0.1/metrics_portal_restore_drill' `
  -Confirmation 'RESTORE INTO ISOLATED DATABASE'
```

The drill refuses a nonempty target, refuses a target without the `_restore_drill` suffix, applies pending migrations, and verifies the required operational tables. Destroying the isolated drill database remains an explicit administrator action.

## Health Smoke Test

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/Test-PortalHealth.ps1 -BaseUrl 'http://10.15.3.47:3002'
```

Run after migrations and PM2 restart. The script first proves the root page title contains `Metrics Portal`, preventing the old PL portal from satisfying a health check. A deployment is not accepted until liveness, readiness, and integration health return expected states and PM2 shows both the web and worker processes stable.

The HTTP address above is the current internal production endpoint. Replace it with the approved HTTPS DNS name when the TLS/DNS hardening gate is completed.

## Intentionally Manual Gates

- PostgreSQL installation and Windows service identity.
- Database roles and secret entry into the server-local `.env`.
- Internal DNS, TLS certificate, and firewall configuration.
- Creation and permissioning of the off-machine backup path.
- Future conversion of the backup scheduled task to an IT-owned service account or other fully unattended identity.
- Release tag selection, production checkout, migration execution, and PM2 restart.

These remain manual so the operator must verify the target server, release, destination, and maintenance window before changing production state.
