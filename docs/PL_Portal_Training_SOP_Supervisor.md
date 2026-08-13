# Precision Liner Metrics Portal - Supervisor and Support SOP

**Document version:** 2.0<br>
**Effective date:** August 13, 2026<br>
**Applies to:** Production Precision Liner page, PL Admin, and Submission Status

## Purpose

This procedure covers PL configuration support, submission monitoring, safe retry and resolution, associate support, and incident escalation. The Metrics Portal database is the operational record; Smartsheet is the downstream reporting destination.

## 1. Supervisor Access

1. Sign in through the normal Metrics Portal login and select **Precision Liner**.
2. Confirm your name and **Supervisor** role on the PL page.
3. Choose **Admin** to open the PL configuration page.
4. From PL Admin, choose **Submission Status** to review database-to-Smartsheet delivery.

Do not share supervisor credentials. If the Admin control is missing, verify the account role in the approved configuration source.

## 2. Support an Associate First

When an associate reports a problem, collect:

- associate name and workstation;
- work date and approximate submission time;
- job, event, sequence, lot, and item identifiers as applicable;
- the exact header status, submission banner, or centered error;
- a screenshot if available.

Use these rules:

- **Saved to server** means only the form workspace is saved.
- **Database saved - Smartsheet pending** means the entry is safe. The associate may continue and must not re-enter it.
- **Database saved - Smartsheet synced** means the destination row is confirmed.
- **Tab conflict** requires **Load server copy**; do not try to preserve the stale tab by retyping over it.
- A pending item becomes operationally alertable after five minutes. Failed and `needs_review` items require immediate review.

## 3. Submission Status

The Submission Status page refreshes automatically every 30 seconds and can also be refreshed manually. Filters include status, department, associate, work date, and entry type.

Statuses mean:

- `pending` - committed to PostgreSQL and waiting for the worker.
- `processing` - leased by the worker for delivery.
- `submitted` - the Smartsheet destination row is confirmed.
- `failed` - delivery stopped after a classified failure.
- `needs_review` - an uncertain/permanent condition requires a supervisor decision.
- `resolved` - a supervisor intentionally stopped automatic delivery with a recorded reason.

### Retry

Use **Retry** only after the cause is corrected or confirmed temporary. Enter a specific reason. The worker uses the permanent Submission ID to search for an already accepted Smartsheet row before inserting another row.

### Resolve

Use **Resolve** only when automatic delivery should stop and the record has been reconciled through an approved correction. Enter the reconciliation reason. Resolve is not a delete and must not be used merely to clear the list.

Retry and resolution are department-scoped and audited.

## 4. Configuration Administration

PL Admin manages associates, schedules, roles, training status, password resets, sequences, defects, events, and the approved operator roster.

Before saving:

1. Confirm you are in **Master Configuration Admin** for PL.
2. Change only the intended row or list.
3. Verify names and numeric targets before saving.
4. Confirm the success result.
5. Ask an affected user to refresh only when a configuration list must reload.

Administrative saves, deletes, password resets, and authorized lock-release outcomes are written to the database audit history when the database is available. Password values and configuration contents are not written to audit metadata.

### Password reset

1. Find the associate.
2. Choose **Reset Pass** and confirm.
3. Tell the associate to complete password setup at the next login.
4. Never request or record the new password.

### Associate deletion

Delete only after confirming the correct employee and approved removal. Deletion affects login configuration; it does not erase previously submitted production history.

## 5. Stale Workstation Locks

An associate may be prevented from signing in when an earlier workstation session still owns the PL kiosk lock. First ask the associate to sign out from the original workstation. If that is impossible, use the authorized supervisor lock-release procedure with a reason. Never release an active associate's lock merely to bypass a sign-in warning.

## 6. Daily Health Review

Confirm at minimum:

1. PM2 processes `metrics-portal` and `metrics-portal-worker` are online.
2. Portal liveness and readiness are healthy.
3. No PL item is pending or processing for five minutes or more.
4. No PL item is `failed` or `needs_review`.
5. The scheduled backup task's last result is `0` and the latest hash-verified backup is fresh.
6. The PostgreSQL service is running and disk space remains above the approved minimum.

The repository's operations monitor automates these checks and writes a structured health result once installed on the target server.

## 7. Incident Response

### Portal unavailable or database save failing

Stop new PL entry attempts and contact technical support. Do not direct associates to repeatedly submit. Record the first failure time and affected workstations.

### Smartsheet unavailable while database saves succeed

Associates may continue. Monitor queue age and count. The worker retries recoverable failures. Escalate at five minutes or immediately for terminal status.

### Worker offline

Database capture remains authoritative, but Smartsheet becomes stale. Restore the approved PM2 worker process, confirm queue movement, and verify exact destination rows before closing the incident.

### Suspected duplicate or incorrect destination row

Do not delete production rows merely to make counts match. Preserve the database Submission ID and Smartsheet row ID, stop unsafe retries, and reconcile through the documented supervisor/technical process.

## 8. Escalation Record

Provide:

- first failure time and current time;
- affected component and department;
- associate/workstation and submission ID when available;
- current status and attempt count;
- exact error message without passwords, tokens, or full sensitive payloads;
- actions already taken and their results.

## Support Boundaries

- Keep `metrics-portal` and `metrics-portal-worker` online.
- Do not restart or delete the stopped legacy `PL-Portal` except under an approved rollback.
- Do not disable PL database flags during normal troubleshooting.
- Do not manually edit PostgreSQL submission or outbox rows.
- Do not expose `.env`, database passwords, or Smartsheet tokens.
- Use the approved release, backup, rollback, and reconciliation procedures for production changes.
