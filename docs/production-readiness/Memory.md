# Production-Readiness Program Memory

## Purpose

This is the durable handoff record for the production-readiness program. It records the current state of the work so a future session or agent can continue without relying on conversation history.

Read this file before beginning production-readiness work. Update it before ending any session that changes code, documentation, architecture decisions, requirements, roadmap status, migrations, deployment configuration, or operational procedures.

Do not store passwords, tokens, connection strings, employee-sensitive data, or production payloads in this file.

## Current Program State

- Status: The PL production migration is complete. The July 20 staged release was followed by the supervised August 3 database cutover. PL now uses PostgreSQL-backed sessions, server workspaces, durable submission capture, and the separate PM2 Smartsheet worker. Real production jobs and events have converged to `submitted` with remote row IDs, no stuck PL records were found during the August 13 review, and the daily backup task continues returning success. The legacy `PL-Portal` was stopped and saved in PM2 on August 13 without uninstalling or deleting it. PTFE and PI remain on compatibility/direct-Smartsheet behavior pending their phases.
- Current phase: Phase 4 PL stabilization and Phase 5 PTFE target validation, with Phase 7 operations hardening in parallel.
- Production: `C:\serverdata\repos\metrics-portal` runs PM2 web process `metrics-portal` on port 3002 and worker `metrics-portal-worker`. PL database/session/workspace features are enabled; PTFE and PI session/database features are disabled. The legacy `PL-Portal` PM2 entry is stopped and retained temporarily for rollback.
- Target architecture: One platform with separate PL, PTFE, and PI applications, PostgreSQL as the operational system of record, and asynchronous Smartsheet synchronization.
- First department migration: Precision Liner.
- Last updated: 2026-08-13.

## Completed Work

- Drafted the product requirements.
- Drafted the target architecture.
- Drafted the phased delivery roadmap.
- Defined Git branching, pull request, merge, release, hotfix, and rollback rules.
- Drafted data migration, cutover, testing, operations, recovery, risk, and decision documents.
- Established this program memory and handoff requirement.
- Inventoried the local host, application routes, browser state, configuration names, Smartsheet mappings, and operational utilities without recording secrets.
- Approved PostgreSQL, asynchronous Smartsheet delivery, PL-first migration, tooling, worker, session, HTTPS, backup, retention, and alert defaults.
- Added validated database configuration, pooled PostgreSQL transactions, the initial versioned migration, structured request logging, correlation IDs, graceful shutdown, liveness/readiness endpoints, automated tests, CI, and setup documentation.
- Proved the foundation migration and transaction behavior against clean PostgreSQL 18 in GitHub Actions.
- Implemented the Phase 2 submission, outbox, delivery-attempt, and audit schema; idempotent capture API; leased worker; Smartsheet exact-ID check; retry classification; integration health; and supervisor status/retry/resolution interface behind a disabled-by-default feature gate.
- Proved Phase 2 migrations, concurrent idempotency, worker leasing and expired-lease recovery, API authorization, and failure handling against clean PostgreSQL 18 in CI run 27828636152.
- Implemented the Phase 3 server-session and versioned-workspace foundation with hashed opaque tokens, department rollout flags, durable kiosk locks, stale-tab protection, sign-out blocking, and audited discard/release behavior.
- Implemented the isolated PL page, durable jobs/events, browser autosave and conflict handling, validation tooling, Windows backup/restore/health scripts, and guarded target-server bootstrap tooling.
- Installed and secured PostgreSQL 18.4 on the target, then initialized the `metrics_portal` database and separate owner, migration, application, and backup roles without exposing credentials.
- Completed the staged production deployment on July 20 and the separate PL database cutover on August 3.
- Corrected HTTP submission-ID generation and Smartsheet worker value normalization through production hotfixes, then verified successful database-to-Smartsheet delivery.
- Verified PL supervisor routing to `/pl/` with an Admin return path.
- Verified the daily scheduled backup task, production health and feature state, recent PL database/outbox convergence, and zero stuck PL records on August 13.
- Stopped and saved the legacy `PL-Portal` process without deleting its PM2 entry or files.
- Audited the PTFE compatibility page, server write paths, calculations, validation, master-log mapping, and Job x Job End Shift contract; recorded the bounded Phase 5 durable design.
- Implemented the first PTFE durable foundation slice: an independent disabled runtime flag, dependency validation, feature reporting, a browser-compatible calculation/validation/payload/shift model, and focused automated coverage.
- Implemented the isolated PTFE database page, guarded login/API routing, versioned server-workspace controller, server-owned idempotent job/event-to-shift transition, and partial-safe per-row End Shift database capture without enabling production PTFE flags.
- Implemented and live-proved exact two-destination PTFE contracts against dedicated non-production Master Log and Job Log sheets, including permanent-ID replay and complete synthetic cleanup.
- Implemented guarded PTFE production-destination validation and dry-run-first `Submission ID` expansion; the live read-only audit found only that column missing on each production destination and planned no row changes.
- Implemented isolated PTFE target-server Start, Rollback, and Stop orchestration for port 3103, a disposable database, separate web/worker processes, and both test sheets. Target execution and named UAT approval remain pending.
- Implemented a five-minute local operations monitor, guarded tiered backup-retention tooling, and safe compatibility administrative audit events. The monitor and audit update are not yet deployed to the target server; retention apply remains prohibited pending policy confirmation.
- Added the completion audit that maps every program requirement to authoritative evidence, remaining proof, execution order, and current stop conditions.
- Replaced the obsolete PL multi-user/hour-by-hour training content with current associate and supervisor/support SOPs for the isolated database-backed page, asynchronous Smartsheet status, tab conflicts, quality rules, retries/resolution, daily health, and incident escalation.
- Added safe deployed-commit identity to the web process, worker, structured startup logs, health APIs, and local operations-monitor evidence so an approved release can be matched to the running source.
- The first PTFE target Start proved both dedicated sheets empty and migrated the isolated database, then stopped before launching the portal because the outbox proof compared the test IDs with already-overridden runtime destination IDs. The source fix now retains the original production IDs separately for the safety comparison; failed state cleanup and a fresh Start remain required.
- The corrected PTFE target environment is running on isolated port 3103 from `C:\serverdata\staging\metrics-portal-ptfe-uat`. Browser UAT confirmed PL-compatible quantity entry, a synced persistent Break event, stale-tab protection, low-yield Pull validation/capture, successful End Shift, numeric/status regressions, and worker restart recovery. Read-only reconciliation found four submitted Master Log rows and three submitted Job x Job rows before recovery testing; all seven outboxes submitted on attempt one with remote row IDs, exactly matching test-sheet counts 4 and 3. Deterministic partial End Shift, rollback, named approval, and final cleanup remain.

## Active Work

- Continue the 30-day PL stabilization observation through September 2, 2026, finish PL SOP/support handoff, and execute the isolated PTFE UAT/rollback work package without changing production PTFE routing.

## Next Actions

1. Continue daily PL queue and backup-result review through the 30-day observation close on September 2, 2026.
2. Obtain named acceptance of the updated PL associate and supervisor/support SOPs and record the observation close decision.
3. Retain the stopped legacy `PL-Portal` through the observation window; do not delete it before the close review.
4. Complete browser acceptance in the running isolated PTFE environment, rehearse rollback, obtain named PTFE associate/supervisor approval, and clean the isolated environment.
5. Install and prove the five-minute local operations monitor on the target before PTFE production cutover.
6. After UAT approval, add `Submission ID` to both PTFE production destinations in an approved window and revalidate both contracts.
7. Complete internal DNS/TLS, routed synchronization alerts, retention-policy confirmation, unattended task ownership, and quarterly restore-drill ownership as Phase 7 hardening.

## Open Decisions

- PostgreSQL installation service account and eventual company IT owner.
- Backup encryption mechanism (the physical off-machine destination is approved).
- Internal DNS name and certificate issuer.
- Monitoring and alert transport destination.
- Production maintenance and department cutover windows.
- Named department representatives for PTFE and PI UAT.
- Final owner and target date for PL SOP/support handoff.

## Known Risks And Blockers

- The application and proposed database will initially share one physical server.
- PTFE and PI still share the compatibility page and browser-owned active-work state.
- PTFE and PI production submissions still depend on synchronous Smartsheet responses.
- Production currently uses an internal HTTP endpoint; TLS/DNS and secure-cookie enforcement remain open.
- Synchronization health is inspectable, but routed automatic alerts are not yet configured.
- The backup task currently depends on the server account's interactive-logon model.

## Latest Validation

- Syntax checked across application, migration, script, and test JavaScript files.
- The current local suite passes 125 tests with 122 passes and three expected database-dependent skips outside the CI database job.
- On August 13, production `GET /api/v2/health` returned HTTP 200 and `/api/v2/features` confirmed PL durable submissions, sessions, workspaces, and database routing enabled while PTFE and PI remained disabled.
- PM2 showed `metrics-portal` and `metrics-portal-worker` online. The latest ten PL job/event rows were `submitted` in both submission and outbox state with Smartsheet remote row IDs; the stuck-item query returned zero rows.
- The scheduled backup task last ran August 13 at 1:00 AM with result `0` and the next run scheduled for August 14 at 1:00 AM.
- Local Markdown links pass validation and the production dependency audit reports zero vulnerabilities.
- PTFE focused model, routing, submission-gate, workspace-transition, page-contract, two-destination delivery, outbox, UAT-orchestration, and browser checks pass. The rendered page completed job, server-owned shift append, refresh persistence, and event workflows without console errors. Focused page-contract coverage now requires PTFE Time worked, Start quantity, and End quantity to use the same zero selection, mouse handling, and hidden spinner-arrow contract as the proven PL Time worked field.
- Both dedicated PTFE test sheets passed exact-ID insert, replay-without-duplicate, mapped-value verification, and synthetic cleanup. The target-server isolated database/browser/rollback rehearsal remains the next evidence gate.
- The full administrative-audit branch validation passed 122 tests with three expected database-only skips, JavaScript and inline-HTML checks, PowerShell parsing, Markdown links, zero production dependency vulnerabilities, and GitHub Actions before merge as `471f55e`.
- The corrected PTFE target Start passed two-destination database/outbox proof and launched the isolated portal/worker at port 3103 without changing live production ports. Its proof rows were removed from both Smartsheets and PostgreSQL before browser UAT.
- Target Edge browser acceptance confirmed the PTFE quantity-entry controls replace the default zero correctly when clicked or reached by keyboard, and their increment/decrement arrows are absent after loading commit `5d8d191` from the actual PTFE UAT worktree.
- Target browser acceptance captured a five-minute Break event, confirmed database-to-test-Smartsheet synchronization, retained the Events tracker row across refresh, and blocked a stale duplicate tab from overwriting the server workspace; Load server copy restored Tab A's `UAT-TAB-A` value.
- Target browser acceptance confirmed an 80% Pull requires a Pulling Pareto before capture, then accepted and synchronized the corrected row into the isolated database/test destination and retained it for End Shift.
- Target End Shift returned to login only after accepting all tracker rows. Read-only PostgreSQL reconciliation showed two jobs, two events, and three Job x Job rows, all `submitted/submitted` on attempt one with remote row IDs; the dedicated test sheets contained the matching four Master Log rows and three Job x Job rows.
- Release PR #9 GitHub Actions run 29741738237 passed against PostgreSQL 18 on July 20, 2026 after refreshing the branch against current `main`.

## Deployment State

- PostgreSQL 18.4 and the migrated application schema are installed on the target; manual and scheduled off-server backups plus an isolated restore drill have passed. The PL production Smartsheet destination has the required `Submission ID` column.
- The last directly verified production behavior includes the PL cutover hotfixes, enabled PL database workflow, healthy `metrics-portal` and `metrics-portal-worker`, and successful database-to-Smartsheet convergence. Repository `main` is now ahead with PTFE and operations tooling through merge `471f55e`; the target server commit must be re-read before the next controlled pull.
- PTFE and PI database/session flags remain disabled until their own destination, UAT, rollback, and cutover gates pass.
- The legacy `PL-Portal` is stopped but retained as a rollback artifact through the PL observation window.
- Production deployments must use an approved commit or release tag and the documented release checklist.

## Session Update Template

Append a concise entry below whenever work is performed. Keep the current-state sections above accurate as well.

```text
### YYYY-MM-DD - Short title

- Branch:
- Commit or PR:
- Phase/work package:
- Work completed:
- Files or schema changed:
- Decisions made:
- Validation performed:
- Deployment status:
- Risks/blockers:
- Exact next action:
```

## Session History

### 2026-08-13 - PTFE durable foundation and isolated page implemented

- Branch: `codex/ptfe-durable-foundation` from merged production-readiness state `f2fafc2`.
- Commit or PR: Foundation commit `b8d9ef7`; GitHub PR #11 (`codex/ptfe-durable-foundation`) contains the continuing isolated-page work.
- Phase/work package: Phase 5 PTFE migration, durable model, runtime feature, isolated page, and server-workspace capture foundation.
- Work completed: Added the independent PTFE database-submission flag and dependency guard, exposed its non-secret feature state, implemented the PTFE model and isolated `/ptfe/` page, guarded login and submission routing, preserved configured calculations and validation, moved Master Log-to-shift append to an idempotent server transition, and implemented partial-safe per-row End Shift capture.
- Files or schema changed: Runtime and login/submission routing, shared browser API, PTFE model/page/controller/styles, workspace repository/service, browser test harness, automated tests, and production-readiness documentation. No production environment, database schema, Smartsheet sheet, or enabled production route changed.
- Decisions made: Keep the feature disabled by default; explicitly map PTFE work date to the Master Log `Date` title; preserve one logical durable submission per Master Log or Job x Job row; append job/event shift rows on the server after database acceptance; persist each End Shift row ID before capture and reload authoritative state after acceptance.
- Validation performed: The full local suite passed 100 tests with three expected database-only skips. JavaScript syntax checked 62 files; inline scripts in nine HTML files, 36 Markdown files, PowerShell syntax, the production dependency audit, and `git diff --check` passed. The rendered page loaded configured standards, calculated Pull values, captured a job, appended the server-owned shift row, retained it across refresh, captured an event, and reported no browser-console errors.
- Deployment status: Local implementation only. PL remains live and unchanged; PTFE remains on the compatibility/direct-Smartsheet path.
- Risks/blockers: Destination validators, guarded production-column expansion, isolated test destinations, named UAT representatives, rollback rehearsal, TLS/alerts, and supervised cutover remain.
- Exact next action: Implement PTFE Master Log and Job Log contract validators plus guarded `Submission ID` expansion without changing production sheets.

### 2026-08-13 - PL post-cutover health passed and legacy portal stopped

- Branch: `codex/production-readiness-current-state` from production-aligned `main`.
- Commit or PR: Production `main` and `origin/main` were at `5508c37`; documentation commit pending in this work package.
- Phase/work package: Phase 4 PL stabilization and Phase 7 operations-state reconciliation.
- Work completed: Reviewed the live production health output, feature state, PM2 processes, scheduled backup result, recent PL database/outbox rows, and stuck-item query. Confirmed real PL jobs/events are successfully reaching Smartsheet. Stopped and saved the legacy `PL-Portal` without deleting it. Reconciled the production-readiness playbook from the stale pre-cutover state to the actual post-cutover state.
- Files or schema changed: Production PM2 saved state changed only by stopping `PL-Portal`; its files and PM2 entry remain. Production-readiness documentation (including the new PTFE work package), program memory, and the stale PL supervisor routing test changed locally. No database schema, production payload, Smartsheet row, `metrics-portal`, or worker configuration changed in this work package.
- Decisions made: Keep `metrics-portal` and `metrics-portal-worker` online. Retain the stopped legacy PL portal through the 30-day observation window ending September 2, 2026. Treat PL Phase 3 as complete and Phase 4 stabilization as active; PTFE Phase 5 is next.
- Validation performed: Production health returned HTTP 200; feature state showed PL enabled and PTFE/PI disabled; PM2 showed the web and worker online; ten recent PL jobs/events were `submitted/submitted` with remote row IDs; zero stuck PL items were returned; the scheduled backup task returned result `0`. Local checks passed for 58 JavaScript files, inline scripts in nine HTML files, PowerShell syntax, 35 Markdown files, 78 tests with three expected database-only skips, zero production dependency vulnerabilities, and `git diff --check`. The one initially failing auth-routing assertion was stale and was updated to the approved PL supervisor `/pl/` routing behavior.
- Deployment status: PL database workflow remains live and healthy on port 3002. The old PL-only process is stopped and recoverable. PTFE and PI remain unchanged on direct-Smartsheet compatibility behavior.
- Risks/blockers: TLS/DNS, routed alerts, unattended backup identity, PL SOP/support handoff, quarterly restore ownership, and PTFE/PI migration work remain. No current PL production blocker is known.
- Exact next action: Implement the PTFE model and independent runtime/routing feature foundation from `16-ptfe-migration.md` while PL observation continues; do not enable or change production PTFE behavior.

### 2026-07-23 - Daily PostgreSQL backup scheduling verified

- Branch: `main`.
- Commit or PR: Pending documentation commit in this change.
- Phase/work package: Phase 7 operations hardening before PL database cutover.
- Work completed: Created the protected backup environment file `C:\serverdata\secrets\metrics-portal-backup.env` on the production server, proved `Backup-Postgres.ps1` can read it without printing secrets, registered the Windows scheduled task `Metrics Portal PostgreSQL Backup`, ran the scheduled task once, and verified the resulting backup.
- Files or schema changed: Production server secret file and Windows scheduled task were created; program memory/readiness docs updated locally. No production portal deployment, database schema, Smartsheet data, PM2 process, PL database workflow flag, or worker process changed.
- Decisions made: Use the current server account with `LogonType Interactive` for the initial daily scheduled backup task. This is acceptable for the current kiosk/server account model, but a future IT-owned service account is still preferable for unattended operation.
- Validation performed: Backup env file exists and contains `DATABASE_URL` without printing the value. Manual backup through `-EnvironmentFile` created `metrics-portal-20260723-082846.dump` and passed freshness/hash verification. Scheduled task run returned `LastTaskResult = 0`, next run `2026-07-24 01:00:00`, and freshness JSON verified `metrics-portal-20260723-083005.dump` with `AgeHours = 0.03` and `HashVerified = true`.
- Deployment status: Production remains on staged code deployment with database workflow feature flags disabled and direct-Smartsheet compatibility behavior active.
- Risks/blockers: Worker-process readiness, final PL database cutover approval, alert transport, TLS/DNS, and PTFE/PI UAT representatives remain before broader database-backed rollout.
- Exact next action: Confirm production PL destination contract and worker readiness, then schedule the supervised PL database cutover window.

### 2026-07-20 - Staged production code deployment completed

- Branch: `main`.
- Commit or PR: PR #9 merged to `main` as release commit `2638a89`.
- Phase/work package: Phase 7 staged production code deployment.
- Work completed: Marked PR #9 ready, merged it to `main`, pulled the approved release commit onto `C:\serverdata\repos\metrics-portal`, installed locked dependencies, created a fresh verified off-server PostgreSQL backup, confirmed migrations were already current, granted runtime database access, restarted only the `metrics-portal` PM2 web process, and verified the live application on port 3002.
- Files or schema changed: Production server checkout advanced from `1cb14df` to `2638a89`; npm dependencies installed from the lockfile; no new database migrations were applied because all migrations were already current. Program memory updated after deployment. No production Smartsheet rows, PL database workflow flags, or worker process were changed.
- Decisions made: Keep `PL_DATABASE_SUBMISSIONS_ENABLED`, server sessions, server workspaces, and durable submissions disabled for this staged deployment. Do not start `metrics-portal-worker` until the separate PL database cutover is approved.
- Validation performed: Fresh backup `metrics-portal-20260720-083325.dump` was created on the approved UNC backup destination and passed hash freshness verification. `npm ci` reported zero vulnerabilities. `npm run migrate:up` reported no migrations to run. Runtime grants succeeded. PM2 showed `metrics-portal` online. Root page at `http://10.15.3.47:3002/` returned title `Metrics Portal - v1.2.0`; `/api/v2/health` returned HTTP 200; `/api/v2/features` returned all database/session workflow flags disabled.
- Deployment status: Production code deployment complete; production remains on direct-Smartsheet compatibility behavior for PL, PTFE, and PI.
- Risks/blockers: Recurring Windows scheduled backups, worker-process readiness, final PL database cutover approval, alert transport, TLS/DNS, and PTFE/PI UAT representatives remain before broader database-backed rollout.
- Exact next action: Monitor normal production use on the deployed code, then prepare the separate supervised PL database cutover checklist when ready.

### 2026-07-20 - Delayed deployment prep refreshed against main

- Branch: `codex/pl-release-candidate`.
- Commit or PR: Draft PR #9 to `main`; pending commit in this change.
- Phase/work package: Phase 7 delayed release preparation.
- Work completed: Began the delayed production code-deployment prep by merging current `origin/main` into the PL release candidate. The mainline merge brought forward the numbered-associate-name parser change. Updated readiness documentation to replace stale July 4 wording with the July 20 delayed staged-deployment plan.
- Files or schema changed: `lib/config.js` through the `origin/main` merge, production-readiness cutover plan, readiness index, and program memory. No production portal deployment, database schema, Smartsheet data, PM2 process, or feature flag changed.
- Decisions made: Do not deploy the stale June 30 release candidate directly; refresh it against current `main`, validate, and keep PL database workflow flags disabled for the first production code deployment.
- Validation performed: `npm run check:syntax`, `npm run check:html`, `npm run check:docs`, `npm run check:powershell`, `npm test`, and `git diff --check` passed locally; the suite reported 78 passing tests and three expected database-dependent skips.
- Deployment status: Not deployed to production; production remains on current `main` direct-Smartsheet behavior.
- Risks/blockers: Final release approval, fresh pre-deployment backup, production merge/tag, production pull, migration execution, PM2 restart, and post-deployment health checks remain.
- Exact next action: Commit and push the refreshed release candidate, then wait for PR #9 CI.

### 2026-06-30 - July 4 staged deployment and backup scheduling documented

- Branch: `codex/pl-release-candidate`.
- Commit or PR: Draft PR #9 to `main`; pending commit in this change.
- Phase/work package: Phase 7 deployment planning and operations handoff.
- Work completed: Documented the July 4 plan as a code deployment with production database workflow flags disabled, clarified that PL database cutover is a separate supervised action, documented that production database-backed PL submissions still synchronize to the production PL master log through the worker, and clarified that the UAT test sheet is never a production destination. Documented backup implementation status: manual verified off-server backups and restore drill have passed, while Windows Task Scheduler registration remains a required operations gate before PL database cutover.
- Files or schema changed: Production-readiness cutover plan, operations/recovery guide, Windows tooling guide, readiness index, and program memory only. No production portal deployment, database schema, Smartsheet data, PM2 process, or feature flag changed.
- Decisions made: July 4 should deploy the approved code and migrations without enabling PL database traffic. PL database cutover should happen later only after recurring backups are registered/verified and the first real entries can be supervised.
- Validation performed: `npm run check:docs` and `git diff --check` passed locally.
- Deployment status: Not deployed to production; PR #9 remains draft for extended UAT and planned July 4 code deployment.
- Risks/blockers: Recurring backup schedule, TLS/DNS, alert transport, final release approval, production code deployment, and separate PL database cutover approval remain.
- Exact next action: Commit and push the documentation update, then keep UAT running for continued testing.

### 2026-06-30 - PL event duration simplified for UAT

- Branch: `codex/pl-release-candidate`.
- Commit or PR: Draft PR #9 to `main`; pending commit in this change.
- Phase/work package: Phase 7 extended PL UAT polish.
- Work completed: Replaced PL event entry start/end time inputs with a single direct `Duration (minutes)` field, preserved one-time compatibility for existing drafts that still have start/end times, and recorded the change in the testing changelog and PL readiness documentation.
- Files or schema changed: PL page HTML, browser controller, PL model, focused tests, changelog, Precision Liner production-readiness page, and program memory only. No production portal deployment, database schema, Smartsheet data, PM2 process, or feature flag changed.
- Decisions made: The floor workflow only needs `Time worked (Min)` for event submissions, so direct duration entry is simpler and less error-prone than start/end time entry.
- Validation performed: `npm run check:syntax`, `npm run check:html`, `npm run check:docs`, `git diff --check`, and `npm test` passed locally; the suite reported 78 passing tests and three expected database-dependent skips.
- Deployment status: Not deployed to production; PR #9 remains draft for extended UAT and the planned July 4 office-closure deployment window.
- Risks/blockers: The UAT server must be refreshed to this commit before testers see the duration input. The latest tester observation that Spool Check still writes to `Notes` likely indicates the running UAT process is not yet on the corrected commit, but it must be verified after refresh.
- Exact next action: Commit and push, wait for PR #9 CI, then provide a UAT refresh and commit-verification command.

### 2026-06-30 - PL Spool Check notes mapping matched compatibility behavior

- Branch: `codex/pl-release-candidate`.
- Commit or PR: Draft PR #9 to `main`; pending commit in this change.
- Phase/work package: Phase 7 extended PL UAT polish.
- Work completed: Verified the compatibility portal writes Spool Check failure text to `Reason for Fail`, uses `Spool Check Sequence` and `Check #`, and only writes the general `Notes` column from a separate next-shift note value. Updated the new PL page model so Spool Check submissions no longer duplicate the reason text into `Notes`.
- Files or schema changed: PL model, PL model tests, Precision Liner production-readiness page, and program memory only. No production portal deployment, database schema, Smartsheet data, PM2 process, or feature flag changed.
- Decisions made: Treat the PL page's Spool Check text area as `Reason for Fail`; leave the general `Notes` field absent for Spool Check jobs until/unless a distinct next-shift note input is added.
- Validation performed: `npm run check:syntax`, `npm run check:html`, `npm run check:docs`, `git diff --check`, and `npm test` passed locally; the suite reported 77 passing tests and three expected database-dependent skips.
- Deployment status: Not deployed to production; PR #9 remains draft for extended UAT and the planned July 4 office-closure deployment window.
- Risks/blockers: Server UAT checkout must be refreshed after commit/push before floor testing sees the corrected mapping; final release approval and deployment window remain.
- Exact next action: Commit and push, wait for PR #9 CI, then provide the server UAT refresh command if requested.

### 2026-06-30 - PL Spool Check and theme contrast matched compatibility behavior

- Branch: `codex/pl-release-candidate`.
- Commit or PR: Draft PR #9 to `main`; pending commit in this change.
- Phase/work package: Phase 7 extended PL UAT polish.
- Work completed: Traced compatibility Spool Check behavior, replaced the new page's Spool Check dropdowns with the original-style sequence/check toggle buttons, relabeled Notes to Reason for Fail when Spool Check is selected, preserved payload mapping for `Reason for Fail`, `Spool Check Sequence`, and `Check #`, and made notices, status pills, buttons, toggles, errors, dialogs, and toast messages theme-readable across all four themes.
- Files or schema changed: PL page HTML, CSS, browser controller, PL model/browser contract tests, UAT scenarios, changelog, and program memory only. No production portal deployment, database schema, Smartsheet data, PM2 process, or feature flag changed.
- Decisions made: Match the compatibility portal's Spool Check interaction exactly enough for floor muscle memory: button toggles instead of dropdowns and Reason for Fail labeling. Treat theme readability as a cross-control contract, not just banner text.
- Validation performed: Focused PL model/browser contract tests, JavaScript syntax, and HTML script parsing passed before this entry.
- Deployment status: Not deployed to production; PR #9 remains draft for extended UAT and the planned July 4 office-closure deployment window.
- Risks/blockers: Server UAT checkout must be refreshed to this commit before floor testing sees the Spool Check/theme polish; final release approval and deployment window remain.
- Exact next action: Run full local validation, commit and push, wait for PR #9 CI, then provide the server update command for the UAT checkout.

### 2026-06-30 - PL RCA operators moved to configuration

- Branch: `codex/pl-release-candidate`.
- Commit or PR: Draft PR #9 to `main`; pending commit in this change.
- Phase/work package: Phase 7 extended PL UAT polish.
- Work completed: Traced original RCA operator dropdowns to the legacy hardcoded `ROSTER`, added parser support for a PL config-sheet `Operators` column, changed the isolated PL page to use `config.operators`, added a guarded Smartsheet migration script, and seeded the PL configuration sheet from the legacy roster.
- Files or schema changed: PL configuration Smartsheet gained one `Operators` column; 33 existing config rows were updated in that new column and 7 bottom rows were added to hold the full 40-name roster. Local code changed in config parsing, PL page controller, migration script, tests, changelog, and production-readiness documentation. No production master-log rows, portal deployment, PM2 process, database schema, or feature flag changed.
- Decisions made: RCA operator choices are operational configuration, not department associates. Keep the legacy roster as code fallback only so the page remains safe if an environment has not yet received the config column.
- Validation performed: Dry run reported the column missing and planned 40 seeded operators. Apply verified 17 columns, 40 operators, 33 rows updated, 7 rows added, and result READY. A follow-up dry run reported READY with no change required. Config fetch returned 40 operators and 33 associates as separate lists.
- Deployment status: Not deployed to production; PR #9 remains draft for extended UAT and the planned July 4 office-closure deployment window.
- Risks/blockers: Server UAT checkout must be refreshed to this commit before floor testing sees the configuration-backed operator list; final release approval and deployment window remain.
- Exact next action: Run full local validation, commit and push, wait for PR #9 CI, then provide the server update command for the UAT checkout.

### 2026-06-29 - PL UAT polish restored theme selector and time entry

- Branch: `codex/pl-release-candidate`.
- Commit or PR: Draft PR #9 to `main`; pending commit in this change.
- Phase/work package: Phase 7 extended PL UAT polish.
- Work completed: Updated the isolated PL migration page so the Time worked field selects and replaces the default zero on focus/click, hides spinner controls for that operator-entry field, and restores the existing portal Theme selector with the same saved `portalTheme` preference used by the compatibility portal.
- Files or schema changed: PL page HTML, PL page CSS, PL browser controller, focused PL browser contract tests, changelog, and program memory only. No production portal, database schema, Smartsheet data, PM2 process, or feature flag changed.
- Decisions made: Preserve the existing operator theme choice in the PL migration page because it is current portal behavior. Treat the Time worked default-zero replacement as low-risk UAT polish, while keeping greater-than-zero validation unchanged.
- Validation performed: JavaScript syntax, HTML script parsing, focused PL browser contract tests, full local automated tests, documentation links, and diff checks passed.
- Deployment status: Not deployed to production; PR #9 remains draft for extended UAT and the planned July 4 office-closure deployment window.
- Risks/blockers: Server UAT checkout must be refreshed to this commit before floor testing sees the polish; final release approval and deployment window remain.
- Exact next action: Commit and push the polish, wait for PR #9 CI, then provide the server update command for the UAT checkout.

### 2026-06-29 - Live process preflight baseline recorded

- Branch: `codex/pl-release-candidate`, created from validated stack branch `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #9 to `main`; stacked draft PRs #3 through #8; release candidate commit `7311d51`; live production process remains on approved `main` commit `2e936a4fe0c53564cc455843b53b48386aba81b4`.
- Phase/work package: Phase 7 target deployment preflight.
- Work completed: Ran the production prerequisite script and follow-up HTTP identity diagnostics against the actual Metrics Portal process on port 3002, confirmed the stacked PR chain is clean/green, and reconciled stale readiness dashboard/cutover status text with the completed PL validation gates.
- Files or schema changed: Program memory, operations documentation, readiness index, PL migration notes, and cutover documentation only. No production portal code, database schema, Smartsheet data, PM2 process, or feature flag changed.
- Decisions made: Treat the target prerequisites, backup root, PostgreSQL tooling, local-only PostgreSQL listener, clean production checkout, and root-page identity as ready. Treat `/api/v2/health` returning 404 as expected for the currently live compatibility release because that approved commit predates the v2 health endpoints.
- Validation performed: Required commands were present, `.env` existed, backup root was reachable, free disk was 76.7 GB, PostgreSQL listened only on loopback, the production Git worktree was clean at `2e936a4`, port 3002 listened under the `metrics-portal` PM2 process, and `curl http://127.0.0.1:3002/` returned title `Metrics Portal - v1.2.0`. `curl http://127.0.0.1:3002/api/v2/health` returned 404 until the release code is deployed. GitHub CI runs 28396278012 and 28396434176 passed on the stacked branch; release PR #9 CI run 28396612198 passed against `main`.
- Deployment status: Not deployed to production; production feature flags remain disabled and live users remain on the existing Metrics Portal process.
- Risks/blockers: Final release approval, CI confirmation on the release commit, maintenance window, TLS/DNS, alert transport, deployment restart, and post-deployment health checks remain.
- Exact next action: Obtain final release/maintenance-window approval, then merge the release PR or tag the approved commit and deploy to `metrics-portal` on port 3002 with feature flags still disabled.

### 2026-06-29 - Production deployment deferred for active operations

- Branch: `codex/pl-release-candidate`.
- Commit or PR: Draft PR #9 to `main`; release candidate commit `f24bdbf`.
- Phase/work package: Phase 7 release scheduling.
- Work completed: Recorded the deployment decision after confirming the department is actively running on the current live `main`.
- Files or schema changed: Program memory only. No production portal code, database schema, Smartsheet data, PM2 process, or feature flag changed.
- Decisions made: Do not merge, pull, migrate, or restart production during current active operations. Keep PR #9 draft and use local/isolated testing over the next few days. Target the July 4 office closure for merge and production pull if testing remains clean and final approval is given.
- Validation performed: No new validation in this entry; prior PR #9 CI passed on commit `f24bdbf`.
- Deployment status: Not deployed to production; current live `main` remains in service.
- Risks/blockers: Final office-closure approval, fresh pre-deployment backup/freshness check, production merge/tag, deployment restart, and post-deployment health checks remain.
- Exact next action: Launch or relaunch the isolated local/UAT portal for extended testing without touching production.

### 2026-06-22 - PL production destination expansion passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; production utility validated at tested release lineage `599007c`.
- Phase/work package: Phase 7 PL production destination preparation.
- Work completed: Created a fresh off-machine PostgreSQL backup, independently verified its age and SHA-256 metadata, then ran the approved production expansion. The guarded utility added exactly one empty `Submission ID` column and the read-only destination audit passed afterward.
- Files or schema changed: One verified PostgreSQL dump and sidecar on the approved backup destination; PL production Smartsheet expanded from 58 to 59 columns with `Submission ID` as `TEXT_NUMBER`; program memory updated. Existing production row values changed: zero.
- Decisions made: Count the PL destination prerequisite as complete. Keep every database/session/workspace/PL rollout feature disabled until deployment preflight and cutover approval.
- Validation performed: Backup age was 0 hours with hash verification true. Expansion dry run planned only ADD; apply verified 59 columns and zero existing rows changed; destination audit found all 36 expected writable columns and returned READY.
- Deployment status: Production destination expanded; application code and feature flags not deployed or enabled.
- Risks/blockers: Target deployment preflight, TLS/DNS, alert transport, maintenance window, and controlled release deployment remain.
- Exact next action: Run target prerequisite and health preflight against the actual Metrics Portal process on port 3002.

### 2026-06-22 - Approved PL UAT rollback and cleanup passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; tested release commit `599007c`.
- Phase/work package: Phase 7 PL acceptance cleanup.
- Work completed: Rehearsed final rollback after department approval, confirmed new PL login routing to the compatibility portal, then ran guarded cleanup. Cleanup removed all three synthetic test-sheet rows, removed the isolated UAT database, and left both live portals unchanged.
- Files or schema changed: Dedicated non-production test sheet returned to zero rows; isolated UAT database removed; acceptance documentation and program memory updated. No production row, production database, or live portal process changed.
- Decisions made: Close PL floor UAT and rollback as passed. Proceed to the separately guarded production destination expansion only after a fresh verified database backup.
- Validation performed: Rollback reported READY; compatibility portal was visually confirmed; cleanup reported production destination untouched, test sheet empty, isolated database removed, and live portals unchanged.
- Deployment status: Not deployed to production; production feature flags remain disabled.
- Risks/blockers: Fresh verified backup and additive production `Submission ID` expansion remain the next controlled gates.
- Exact next action: Create and verify a fresh PostgreSQL backup on the approved off-machine destination.

### 2026-06-22 - PL floor UAT approved

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; tested release commit `599007c`.
- Phase/work package: Phase 7 PL floor acceptance.
- Work completed: Ashley West completed the corrected isolated PL workflow and reported that everything worked; Joey Cox also approved the workflow. The accepted behavior includes the 50% root-cause requirement, configured operator dropdowns, centered blocking warnings, durable database save, and automatic background Smartsheet synchronization.
- Files or schema changed: Acceptance documentation and program memory only. The isolated UAT database and test sheet remain active pending final rollback and cleanup; production remains unchanged.
- Decisions made: Count PL associate and supervisor floor acceptance as passed. Operators may continue working after the database-save banner; Refresh status only updates the displayed synchronization state.
- Validation performed: PL-UAT-01 through PL-UAT-12 passed with no open department-blocking defect; Ashley West and Joey Cox approved the tested workflow.
- Deployment status: Not deployed to production; production feature flags remain disabled.
- Risks/blockers: Final rollback rehearsal and guarded cleanup remain required before production destination expansion.
- Exact next action: Run the isolated UAT rollback check, then remove the isolated database and clear the dedicated test sheet.

### 2026-06-22 - Floor UAT requested operator dropdowns and centered alerts

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; implementation commit `a402654`; GitHub Actions run 27957662030 passed.
- Phase/work package: Phase 7 PL floor acceptance feedback.
- Work completed: Restored the four PL root-cause operator dropdowns using the existing department configuration associate roster and added a centered, keyboard-accessible blocking alert for validation and request failures.
- Files or schema changed: Isolated PL HTML, CSS, browser controller, browser fixture, focused source-contract tests, UAT scenario, changelog, and program memory. No production portal, database, Smartsheet, or live process state changed.
- Decisions made: PTFE, Etch, Teco, and Pebax operator fields are single-choice configured-associate dropdowns, matching the compatibility workflow; oven-head fields remain free text. Success remains a nonblocking toast/status banner, while warnings and failures use the centered alert.
- Validation performed: All 70 runnable tests passed with three expected database-dependent skips; syntax, inline HTML parsing, documentation-link, and diff checks passed. An isolated local browser preview confirmed all four configured operator dropdowns and the centered validation alert with keyboard focus.
- Deployment status: Awaiting isolated floor retest; not deployed to production.
- Risks/blockers: Ashley and Joey must verify the revised controls in isolated UAT before approval.
- Exact next action: Load the validated commit into the active isolated UAT worktree, refresh the browser, and have Ashley confirm PL-UAT-11 and PL-UAT-12.

### 2026-06-22 - Floor UAT confirmed low-yield root-cause rule

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; implementation commit `4c13fc9`; GitHub Actions run 27955998040 passed.
- Phase/work package: Phase 7 PL floor acceptance.
- Work completed: Verified the deployed compatibility behavior with Ashley West and Joey Cox, captured their intended rule, and updated the isolated PL page to open root-cause details and require at least one completed root-cause field at exactly 50% yield or lower.
- Files or schema changed: PL browser page/model, focused boundary and dirty-state tests, UAT scenario, changelog, and program memory. No production portal, database, Smartsheet, or live process state changed.
- Decisions made: Keep notes mandatory below 75%. At 50% yield or lower, require at least one of the seven root-cause text fields or an affirmative operator-comment indicator.
- Validation performed: All 68 runnable tests passed with three expected database-dependent skips; the 50/50 boundary blocks without root cause, accepts one populated detail, and does not trigger at 51% yield. Syntax, HTML parsing, and diff checks passed.
- Deployment status: Awaiting isolated floor retest; not deployed to production.
- Risks/blockers: Ashley and Joey must retest PL-UAT-11 and then complete job/event approval before production destination expansion.
- Exact next action: Publish the fix, load its static assets into the active isolated UAT worktree, and have Ashley verify the 50% boundary.


### 2026-06-22 - PL floor-UAT participants named

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; documentation commit pending at session entry creation.
- Phase/work package: Phase 7 department acceptance.
- Work completed: Recorded Ashley West as PL associate representative, Joey Cox as PL supervisor approver, and Johnny Bercegeay as technical observer.
- Files or schema changed: PL UAT acceptance record and program memory only. No application, server, database, Smartsheet, or process state changed.
- Decisions made: Final PL acceptance will use the isolated test account and destination through the supervised server browser; no unfinished application deployment to floor PCs is required.
- Validation performed: Participant roles are now explicit; technical rehearsal evidence remains complete.
- Deployment status: Not deployed to production.
- Risks/blockers: Ashley and Joey must personally complete and approve the normal job/event workflow before production destination expansion.
- Exact next action: Restart the isolated UAT environment at the latest approved commit and conduct the supervised floor workflow.


### 2026-06-22 - Guarded production Submission ID expansion prepared

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; commit pending at session entry creation.
- Phase/work package: Phase 7 production destination preparation.
- Work completed: Added a dry-run-by-default production destination planner and command that can add exactly one empty `Submission ID` column after floor-UAT approval.
- Files or schema changed: Migration planner, guarded command, focused tests, package command, PL migration runbook, changelog, and program memory. No Smartsheet, database, server, or live process state changed.
- Decisions made: Production expansion remains prohibited before department approval. The command blocks unrelated missing columns, duplicates, formulas, and incompatible existing ID types rather than repairing broader drift.
- Validation performed: All 65 runnable tests passed with three expected database-dependent skips; JavaScript syntax, HTML parsing, documentation links, and diff checks passed. The read-only production dry run found the existing 58-column destination ready for exactly one additive `Submission ID` column and changed zero rows.
- Deployment status: Prepared only; not run against production.
- Risks/blockers: PL associate and department-lead approval is required before apply mode. TLS/DNS, alert transport, and cutover window remain external gates.
- Exact next action: Identify the PL associate representative and department lead or supervisor who will execute and sign the floor-UAT record.
### 2026-06-22 - Isolated PL technical UAT and rollback passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; status fix `9928f7f`.
- Phase/work package: Phase 7 technical browser acceptance and rollback.
- Work completed: Completed the isolated PL job and event workflow, corrected and retested the synchronization label, rehearsed feature-flag rollback to the compatibility page, and removed all isolated artifacts.
- Files or schema changed: During rehearsal, two visibly synthetic test-sheet rows and isolated database records were created. Cleanup removed both test-sheet rows and dropped the isolated database. Production data and both live portal processes remained unchanged.
- Decisions made: Count the technical browser and rollback rehearsal as passed. Do not count this as final department acceptance until a PL associate representative and department lead or supervisor sign the same workflow record.
- Validation performed: Required-field errors, autosaved draft persistence across refresh, stale-tab rejection, unsent-work sign-out blocking, durable job capture, durable event capture, background Smartsheet synchronization, corrected submitted-status display, clean sign-out, rollback routing to the compatibility page, test-sheet cleanup, isolated database removal, and live-process invariants all passed.
- Deployment status: Not deployed to production; production database features remain disabled on the Metrics Portal at port 3002.
- Risks/blockers: Named floor UAT participants, production `Submission ID` expansion approval, TLS/DNS, alert routing, and cutover window remain external gates.
- Exact next action: Prepare the guarded expand-only production destination migration, but do not execute it until PL floor-user approval is recorded.


### 2026-06-22 - PL UAT found synchronization-label mismatch

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; implementation commit `9928f7f`; GitHub Actions run 27952445024 passed.
- Phase/work package: Phase 7 supervised PL acceptance and rollback.
- Work completed: Ran the initial isolated browser scenarios through durable job delivery. Corrected the browser banner to recognize the database contract's terminal `submitted` state instead of the unsupported `delivered` label.
- Files or schema changed: PL browser rendering, browser preview support, focused contract test, changelog, and program memory. The isolated UAT database and test sheet contain one synthetic job pending final cleanup; production remained untouched.
- Decisions made: Treat this as a UAT-blocking display defect until the corrected asset is loaded and the same submitted record renders as Smartsheet synced.
- Validation performed: Empty-field validation, server-owned draft refresh, stale-tab rejection, unsent-work sign-out blocking, durable database capture, form clearing, and background delivery all passed. The API reported `syncStatus: submitted`; the stale headline incorrectly remained pending.
- Deployment status: Not deployed to production. Isolated UAT remains active on loopback port 3102; both live portals remained unchanged.
- Risks/blockers: Corrected banner retest, event entry, rollback, and cleanup remain before UAT completion.
- Exact next action: Validate and publish the status fix, load the corrected static asset into the isolated worktree, and confirm the existing submitted job displays as synced.

### 2026-06-19 - Isolated PL browser UAT package prepared

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; UAT package commit in this change.
- Phase/work package: Phase 7 supervised PL acceptance and rollback.
- Work completed: Added guarded UAT-sheet inspection/cleanup, an isolated Windows UAT environment manager with Start/Rollback/Stop actions, and a ten-scenario browser acceptance and rollback record.
- Files or schema changed: Package scripts, one Smartsheet guard utility, one Windows environment manager, the production-readiness index, UAT runbook, changelog, and program memory. No server, database, Smartsheet, or live process state changed locally.
- Decisions made: Run UAT on loopback port 3102 with an isolated database, dedicated empty test sheet, separate web/worker processes, and the built-in PL training identity. Treat the live port 3002 Metrics Portal and out-of-scope port 3000 legacy portal as immutable process-ID invariants.
- Validation performed: JavaScript syntax, PowerShell parser, documentation-link, and diff checks passed; all 61 runnable unit/API tests passed with three database-dependent tests skipped as designed outside the CI database job.
- Deployment status: Tooling prepared but not run on the target; production flags remain disabled.
- Risks/blockers: Physical browser execution, participant names, and written acceptance are now required. TLS/DNS, alert routing, production destination expansion, and cutover approval remain later gates.
- Exact next action: Validate and publish the UAT package, then have the technical observer run Start, the browser scenarios, Rollback, and Stop on the target.

### 2026-06-19 - Target PL database/outbox integration passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; validation commit `70f0f19`.
- Phase/work package: Phase 3 full controlled integration.
- Work completed: Executed the one-shot proof on the target using the application role, migrated Metrics Portal database, and isolated PL test sheet.
- Files or schema changed: Synthetic submission, outbox, delivery, audit, and test-sheet row were created and then removed by the guarded validator. No production Smartsheet row, live portal process, or persistent test record changed.
- Decisions made: Close the controlled technical integration gate and advance to human workflow UAT; retain production flags disabled and defer the production `Submission ID` column until UAT approval.
- Validation performed: Database capture committed, exactly one outbox attempt completed, submission/outbox/delivery converged to `submitted`, the remote row ID was linked, no unexpected pending work remained, and both Smartsheet and database test artifacts were removed. PM2 `metrics-portal` remained PID 6936 on port 3002 and legacy `PL-Portal` remained PID 1928 on port 3000. Clean CI run 27841952233 passed before target execution.
- Deployment status: Technical integration validated but not deployed; live Metrics Portal remains unchanged on port 3002 with database features disabled.
- Risks/blockers: Supervised browser UAT, rollback rehearsal, production destination expansion, TLS/DNS, alert routing, and cutover approval remain pending.
- Exact next action: Prepare an isolated target UAT environment and written PL workflow/rollback acceptance record.

### 2026-06-19 - One-shot target PL outbox validation prepared

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; not committed yet.
- Phase/work package: Phase 3 full controlled integration.
- Work completed: Added a guarded one-shot validation spanning target database capture, outbox leasing, real non-production Smartsheet delivery, durable evidence, idle-queue proof, and synthetic cleanup.
- Files or schema changed: Outbox integration command, package script, PL guide, changelog, and program memory. No production external state changed.
- Decisions made: Refuse the production sheet and any nonempty queue; use the application role; process exactly one synthetic submission; require database/outbox/delivery convergence; remove both remote and database test artifacts.
- Validation performed: 50 JavaScript files passed syntax, 34 Markdown files passed links, and 61 local tests passed with 3 expected database skips. Target execution is pending clean CI.
- Deployment status: Not deployed; live Metrics Portal remains unchanged on port 3002.
- Risks/blockers: Execution requires physical target access to enter the application-role password without exposing it.
- Exact next action: Validate and publish the command, then execute it from the pinned target worktree with process-scoped credentials and the isolated sheet ID.

### 2026-06-19 - Controlled PL delivery validation tooling prepared

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; probe not committed yet.
- Phase/work package: Phase 3 controlled Smartsheet validation.
- Work completed: Added a confirmation-guarded non-production delivery probe for exact mapped values, search visibility, permanent Submission ID replay, and test-row cleanup.
- Files or schema changed: Integration-delivery command, package script, PL migration guide, changelog, and program memory. Production Smartsheet remains unchanged.
- Decisions made: The probe must refuse the configured production sheet, use visibly synthetic values, create exactly one row, prove replay returns that same row, and delete all rows it created.
- Validation performed: The probe passed JavaScript syntax, documentation links, the 61-test local suite with 3 expected database skips, and clean CI runs 27841334056, 27841465705, and 27841666256. Its first live attempt created exactly one test row and removed it, but the new value was not yet searchable after 60 seconds; no replay insert was attempted. With bounded extended polling, the next attempt became searchable after 32 searches, replay found the original without insertion, all 11 representative values matched, and cleanup passed. The final full-contract run became searchable after 36 attempts, verified all 36 mapped values, inserted no replay row, and removed its single test row.
- Deployment status: Not deployed; the combined Metrics Portal remains unchanged on port 3002.
- Risks/blockers: Smartsheet search indexing is asynchronous and can require provisioning; cleanup failure would leave only a marked row in the isolated test sheet.
- Exact next action: Run the one-shot target database/outbox proof against the same isolated destination, then prepare supervised browser UAT.

### 2026-06-19 - Empty PL integration destination tooling prepared

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; creation commit `c3c9134`.
- Phase/work package: Phase 3 controlled Smartsheet validation preparation.
- Work completed: Added a confirmation-guarded creator for a standalone empty PL integration sheet built from exact destination-contract metadata and configured defect names.
- Files or schema changed: PL integration-sheet definition, creation command, unit tests, package script, migration guide, changelog, and program memory; one standalone empty integration sheet created in the API identity's Sheets folder. No production sheet changed.
- Decisions made: Prefer a separate blank integration sheet over temporary production rows. Copy no production rows, formulas, automation, attachments, sharing, or employee data; store the returned sheet ID only in approved environment configuration.
- Validation performed: 48 JavaScript files passed syntax, 9 HTML files passed inline-script parsing, 34 Markdown files passed link checks, PowerShell parsed, and 61 local tests passed with 3 expected database skips. The live-config dry run generated a valid 36-column empty contract and created no object; clean CI run 27841158599 passed; the guarded apply then created an empty 36-column sheet, copied zero rows, and passed the destination audit.
- Deployment status: Not deployed; production Metrics Portal remains unchanged on port 3002 and the legacy PL portal remains out of scope on port 3000.
- Risks/blockers: Controlled row delivery/replay/cleanup proof and later floor UAT remain pending.
- Exact next action: Run the guarded delivery probe against the isolated integration sheet and retain only non-sensitive validation evidence.

### 2026-06-19 - Production portal identity corrected and locked down

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; correction not committed yet.
- Phase/work package: Phase 7 target deployment mapping.
- Work completed: Proved that the server hosts two independent portals, corrected the production target from port 3000 to 3002, renamed stale PL-only npm/login branding in the combined repository, and required explicit URL plus page-title verification in Windows health tooling.
- Files or schema changed: Package metadata, login title, Windows preflight/health scripts, target operations documentation, changelog, risk evidence, and program memory. No server process, database, or Smartsheet state changed.
- Decisions made: `PL-Portal` at port 3000 and `Precision-Liner-Portal` are explicitly out of scope. Only PM2 `metrics-portal`, `Metrics-Portal`, and port 3002 may be used for this program's application operations.
- Validation performed: Server listener and HTTP evidence mapped PID 1928/port 3000 to the legacy Precision Liner page and PID 6936/port 3002 to `Metrics Portal - v1.2.0`. PM2 mapped `PL-Portal` to `C:\ServerData\Repos\Precision-Liner-Portal` and `metrics-portal` to `C:\ServerData\Repos\Metrics-Portal`; the latter is GitHub `Jbercegeay/Metrics-Portal` on approved `main` commit `2e936a4`. Locally, PowerShell parsing, JavaScript syntax, inline HTML parsing, Markdown links, and 59 runnable tests passed with 3 expected database skips under the corrected `metrics-portal` package identity.
- Deployment status: Metrics Portal remains live and unchanged on port 3002; legacy PL portal remains live and unchanged on port 3000. Database foundation remains migrated but disabled.
- Risks/blockers: Earlier port-3000 liveness observations are invalid for Metrics Portal and are superseded by this mapping. Controlled Smartsheet validation and remaining release gates are still pending.
- Exact next action: Validate the identity-safety corrections locally and in CI, then continue only against the Metrics Portal target on port 3002.

### 2026-06-19 - Isolated target restore drill passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; restore tooling release candidate `b584521`.
- Phase/work package: Phase 7 recovery validation.
- Work completed: Restored the verified post-migration backup into a disposable isolated database, applied the recovery-time migration check, restored runtime grants, verified schema/data/privilege invariants, and removed the drill database after success.
- Files or schema changed: Temporary `metrics_portal_restore_drill` database created and removed; risk register and program memory updated. Production database and live portal were not modified by the drill.
- Decisions made: Target preflight and HTTP health acceptance remain deployment-rehearsal gates because the currently live compatibility commit predates the v2 health endpoints; recovery proof does not require changing the live process.
- Validation performed: Restore script found all seven required operational tables and no pending migrations; `pgmigrations` contained three records, foundation version was 1, application database/schema/table/sequence privileges were correct, and `DROP DATABASE ... WITH (FORCE)` completed without error. R-006 is mitigated by target evidence.
- Deployment status: Database foundation is migrated, backed up, and recoverable but unused; compatibility portal remains live and unchanged.
- Risks/blockers: Controlled Smartsheet exact-ID proof, named PL UAT participants, TLS/DNS, alert transport, and deployment window remain external gates.
- Exact next action: Prepare the guarded `Submission ID` destination schema migration and controlled validation procedure, then identify the approved non-production PL destination and UAT participants.

### 2026-06-19 - Restore drill database creation correction

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; target release candidate `b584521`.
- Phase/work package: Phase 7 isolated restore drill.
- Work completed: Corrected the operator sequence so `CREATE DATABASE` runs alone before connection and schema grants, as required by PostgreSQL.
- Files or schema changed: Restore-drill documentation and program memory only. The rejected statement created no database or schema and did not read or modify the production database.
- Decisions made: Every restore-drill database creation must use a dedicated autocommit command, followed by separately checked grants.
- Validation performed: PostgreSQL rejected the combined creation/grant batch with `CREATE DATABASE cannot run inside a transaction block`; the guarded flow stopped before setting its database-created marker or invoking the restore script.
- Deployment status: No database or portal change; verified post-migration backup remains ready.
- Risks/blockers: Isolated restore proof still pending.
- Exact next action: Rerun the drill with database creation and grants in distinct `psql` calls.

### 2026-06-19 - Verified post-migration backup created

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; backup tooling release candidate `b584521`.
- Phase/work package: Phase 7 post-migration recovery protection.
- Work completed: Created and independently verified an off-server custom-format backup after applying all target migrations.
- Files or schema changed: One post-migration dump and SHA-256 metadata sidecar on the approved backup destination; program memory only in Git. No portal process or configuration changed.
- Decisions made: Use this artifact for the isolated restore drill and retain the smaller pre-migration artifact as the original rollback baseline.
- Validation performed: The 31,237-byte archive passed `pg_restore --list`, matched its recorded SHA-256, and contained `pgmigrations` plus all seven required operational tables.
- Deployment status: Pre- and post-migration backups are verified; database remains unused by the unchanged compatibility portal.
- Risks/blockers: Isolated restore proof, target preflight/health, and external release gates remain pending.
- Exact next action: Restore the post-migration artifact into a disposable `_restore_drill` database, verify migration/data/runtime-access invariants, and remove the disposable database only after success.

### 2026-06-19 - Target migrations and runtime grants passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; target release candidate `b584521`.
- Phase/work package: Phase 7 target schema migration.
- Work completed: Installed locked dependencies in the isolated detached worktree, applied migrations 001 through 003 with the migration role, and granted the application role runtime access to existing objects with the guarded superuser script.
- Files or schema changed: Target `metrics_portal` schema now contains the foundation metadata, durable submissions/outbox/audit objects, and sessions/kiosk/workspace objects. The live portal checkout and process were unchanged.
- Decisions made: Treat node-pg-migrate's inability to infer timestamps from deliberately sequential numeric filenames as informational because all three files were explicitly ordered, applied atomically, and recorded in `pgmigrations`.
- Validation performed: `pgmigrations` contains exactly `001_foundation`, `002_durable_submissions`, and `003_sessions_and_workspaces`; all seven required operational tables are present; the application role has schema usage and table read/write while schema creation is denied. The production checkout remains clean on `main`, and the existing portal still listens on port 3000 under the same process.
- Deployment status: Database schema deployed but unused; all database/session/submission flags remain disabled in the unchanged compatibility portal.
- Risks/blockers: Post-migration backup, isolated restore proof, target preflight/health, and external release gates remain pending.
- Exact next action: Create and verify an off-server post-migration backup with the dedicated backup role.

### 2026-06-19 - Pinned worktree verified; portable integrity check corrected

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; target release candidate `b584521`.
- Phase/work package: Phase 7 target migration preparation.
- Work completed: Fetched the release branch and created an isolated detached target worktree at the exact approved commit. Replaced an ad hoc raw SHA-256 check for the runtime-grant script with the commit's Git blob identity plus a clean-worktree check because Windows checkout line-ending conversion legitimately changes raw file bytes.
- Files or schema changed: Program memory only; target release worktree created. Dependency installation and database operations did not run because the integrity check stopped first.
- Decisions made: Verify checked-out release files through the pinned commit, expected Git blob, and clean index rather than platform-dependent post-checkout hashes unless `.gitattributes` enforces byte-identical line endings.
- Validation performed: Target fetched commit `b5845218cbb58dd16fc5dadff8a6eadacb6f09a4`, checked it out detached, and stopped on the expected CRLF-sensitive SHA-256 mismatch before `npm ci`, migrations, or grants. The canonical grant-script blob is `c5dd14df155c578dda8a0df373f68b11f896753f`.
- Deployment status: No schema or live portal change; isolated release worktree is ready to continue.
- Risks/blockers: Migrations and runtime grants remain pending.
- Exact next action: Verify the worktree HEAD, canonical Git blob, and clean grant script, then install locked dependencies and apply the migrations.

### 2026-06-19 - Verified target baseline backup created

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; backup correction head `b584521`.
- Phase/work package: Phase 7 target baseline backup.
- Work completed: Created the first off-server custom-format backup of the initialized pre-migration database with the dedicated backup role. The script verified archive readability and emitted a SHA-256 sidecar.
- Files or schema changed: One verified dump and metadata sidecar on the approved backup destination; program memory only in Git. No database or portal state changed.
- Decisions made: Preserve this pre-migration artifact as the rollback baseline and take another verified backup after migrations.
- Validation performed: The dump completed without an interactive child-process password prompt, contained 891 bytes, passed `pg_restore --list`, and independently matched its recorded SHA-256. Clean CI run 27839735000 passed the backup-script correction and the full PostgreSQL 18 suite.
- Deployment status: Baseline backup gate passed; live compatibility portal remains unchanged.
- Risks/blockers: Target migrations, runtime grants, post-migration backup, isolated restore proof, and external release gates remain pending.
- Exact next action: Create a detached worktree at immutable commit `b584521`, install locked dependencies there, run migrations with the migration role, and grant the application role access to existing objects.

### 2026-06-19 - Backup connection identity correction

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; correction not committed yet.
- Phase/work package: Phase 7 target baseline backup.
- Work completed: Corrected the Windows backup script to parse the supplied PostgreSQL URL into process-scoped libpq variables, explicitly overriding any PostgreSQL identity inherited by the Windows service account while keeping the password out of child-process arguments. Failed or unverified attempts now remove their partial dump and sidecar artifacts.
- Files or schema changed: Windows PostgreSQL backup script, changelog, and program memory; no database or portal state changed.
- Decisions made: Operational database scripts must explicitly set and restore all five connection variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE`) before invoking PostgreSQL tools.
- Validation performed: The first target attempt failed safely before creating a dump because `pg_dump` inherited the `trnhrkiosk` identity. The failure exposed no credentials and made no database change. The correction passed PowerShell parsing, Markdown-link checks, 59 local tests with 3 expected database skips, and `git diff --check`.
- Deployment status: Baseline backup not yet created; live compatibility portal remains unchanged.
- Risks/blockers: The corrected pinned script must pass validation and then be rerun on the target.
- Exact next action: Validate and publish the correction, then download it by immutable commit and retry the baseline backup.

### 2026-06-19 - Target database initialization gate passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; head `bb29732`.
- Phase/work package: Phase 1/7 target database initialization.
- Work completed: Initialized the empty `metrics_portal` database and separate no-login owner, migration, application, and backup roles with guarded least-privilege grants. Credentials were entered only in the target's interactive session and were not captured.
- Files or schema changed: Target PostgreSQL roles and empty database only; application migrations have not run. This entry updates program memory.
- Decisions made: Require a verified off-server baseline backup before applying the first application migration.
- Validation performed: The pinned bootstrap script passed its SHA-256 check and reported successful database and role initialization; PostgreSQL notices confirmed expected role memberships.
- Deployment status: Database bootstrap complete; live compatibility portal remains unchanged on approved `main`.
- Risks/blockers: Baseline backup, target migrations, runtime grants, isolated restore proof, and external validation gates remain pending.
- Exact next action: Run the pinned backup script with the backup role against the approved UNC destination and retain its verified dump and checksum sidecar.

### 2026-06-19 - PostgreSQL 18 installation gate passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; follow-up not committed yet.
- Phase/work package: Phase 1 target PostgreSQL installation.
- Work completed: Removed the mistaken PostgreSQL 13.23 installation, installed PostgreSQL 18.4, enabled automatic service startup, set `listen_addresses=localhost`, and created an enabled inbound block for TCP 5432. Hardened operational scripts to discover PostgreSQL 18 tools even when PATH propagation differs between sessions.
- Files or schema changed: PostgreSQL tool-discovery logic in database initialization, grants, backup, and restore scripts; program memory. No application database has been created yet.
- Decisions made: Standardize on PostgreSQL 18.4 and port 5432; accept the installation only with both local-only binding and defense-in-depth firewall enforcement.
- Validation performed: Server evidence confirmed service `postgresql-x64-18` running automatically; `psql`, `pg_dump`, and `pg_restore` all report 18.4; listeners exist only on `127.0.0.1` and `::1`; inbound block is enabled.
- Deployment status: PostgreSQL service installed and secured; portal remains on compatibility `main` with no database features enabled.
- Risks/blockers: Least-privilege roles/database, migrations, backup, and restore verification remain pending.
- Exact next action: Validate and publish the tool-discovery update, then run the pinned database initialization script on the server.

### 2026-06-19 - Incorrect PostgreSQL 13 installation identified

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; follow-up not committed yet.
- Phase/work package: Phase 1 target PostgreSQL installation.
- Work completed: Identified that the newly installed listener and service are PostgreSQL 13.23, not the approved PostgreSQL 18 release. Confirmed from the installer screenshot that this was the new, mistaken installation rather than a pre-existing workload.
- Files or schema changed: Target bootstrap scripts, production preflight, target runbook, and program memory. No server state changed.
- Decisions made: Remove the unused PostgreSQL 13.23 installation completely, then install PostgreSQL 18 on the standard local port 5432. Do not retain an unnecessary side-by-side cluster.
- Validation performed: Server process and service evidence identified `postgresql-x64-13` under the PostgreSQL 13 installation path. No PostgreSQL 18 service was present.
- Deployment status: PostgreSQL 13.23 is installed but unused; PostgreSQL 18 is not yet installed; compatibility portal remains unchanged.
- Risks/blockers: PostgreSQL 13.23 must be removed, including its empty data directory, before PostgreSQL 18 installation.
- Exact next action: User uninstalls PostgreSQL 13.23, verifies service/port removal, then downloads an installer whose filename begins with `postgresql-18`.

### 2026-06-19 - Initial PostgreSQL listener misidentified

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; follow-up not committed yet.
- Phase/work package: Phase 1 target PostgreSQL installation.
- Work completed: Initial verification found a live PostgreSQL listener and the assumed service-name check failed. Process-based discovery was added before later evidence proved this listener belonged to a pre-existing PostgreSQL 13 installation, not PostgreSQL 18.
- Files or schema changed: Target-server runbook and program memory only.
- Decisions made: Never assume the EDB installation directory or Windows service name; discover both from the port owner. Block inbound TCP 5432 regardless of local-only PostgreSQL binding.
- Validation performed: Server evidence showed PostgreSQL listening on `0.0.0.0` and `::`; the backup UNC path was reachable. No portal or database schema change occurred.
- Deployment status: No new PostgreSQL installation was proven; the compatibility portal remains unchanged.
- Risks/blockers: The existing listener's version and ownership required identification before any action.
- Exact next action: Discover the executable and service from PID ownership without modifying the listener.

### 2026-06-19 - Target server inventoried and PostgreSQL bootstrap prepared

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; bootstrap commit `1422bc4`.
- Phase/work package: Phase 1/7 target database and operations bootstrap.
- Work completed: Recorded the target Windows 11 baseline; confirmed adequate disk, live compatibility portal, installed Node/Git/PM2, absent PostgreSQL tooling, and an identified off-server UNC backup destination. Added guarded scripts for separate owner/migration/application/backup roles and post-migration runtime grants, plus a target-specific bootstrap runbook.
- Files or schema changed: PostgreSQL initialization/grant PowerShell scripts, target-server runbook, playbook index, changelog, and program memory. No server or production schema changed.
- Decisions made: Install the current PostgreSQL 18 Windows release; bind database access locally; use separate least-privilege roles; never print or pass passwords as process arguments; keep all portal database flags disabled until migration, backup, and restore proof pass.
- Validation performed: PowerShell AST parsing passed, 34 documentation files passed local-link checks, 62 tests ran with 59 passing and 3 expected local PostgreSQL skips, and diff formatting passed.
- Deployment status: Not deployed; current production remains on `main` at its pre-readiness compatibility release.
- Risks/blockers: PostgreSQL installation requires an interactive elevated server session. Backup-share permissions for the eventual task identity are not yet proven.
- Exact next action: User installs PostgreSQL 18 from the official Windows installer and returns the non-secret verification output.

### 2026-06-19 - Target bootstrap CI passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; bootstrap commit `1422bc4`.
- Phase/work package: Phase 1/7 target database bootstrap validation.
- Work completed: Closed the target bootstrap clean-environment CI gate.
- Files or schema changed: Program memory only.
- Decisions made: None.
- Validation performed: GitHub Actions run 27831977151 passed PowerShell parsing, all migrations, application and PostgreSQL integration tests, syntax, HTML, documentation, and dependency audit against PostgreSQL 18.
- Deployment status: Not deployed.
- Risks/blockers: Interactive PostgreSQL installation is required on the target Windows host.
- Exact next action: Install PostgreSQL 18 with server and command-line tools, then verify its service, versions, and local listener.

### 2026-06-19 - Backup verification and restore drill safeguards added

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; follow-up commit `318679c`.
- Phase/work package: Phase 7 backup and recovery preparation.
- Work completed: Added backup freshness/hash monitoring, server-local `.env` support for scheduled backups, and a guarded isolated restore drill that refuses production-equivalent or nonempty targets, applies migrations, and verifies required tables.
- Files or schema changed: Windows backup, freshness, and restore scripts; operations guide; changelog; and program memory. No production schema changed.
- Decisions made: Scheduled-task registration remains manual until the target service identity and share permissions are known; restore targets must end in `_restore_drill`; credentials are passed through child-process environment variables rather than command arguments; drill database deletion is never automated.
- Validation performed: All PowerShell scripts passed AST parsing. Backup freshness and SHA-256 verification passed against a generated local fixture. No production database or backup was accessed.
- Deployment status: Not deployed.
- Risks/blockers: A full restore execution requires PostgreSQL client tools, an actual verified backup, and an isolated target database on the server.
- Exact next action: Obtain target-server inventory and backup destination details from the user.

### 2026-06-19 - Restore safeguards CI passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; follow-up commit `318679c`.
- Phase/work package: Phase 7 backup and recovery validation.
- Work completed: Closed the backup-freshness and isolated-restore safeguard clean-environment CI gate.
- Files or schema changed: Program memory only.
- Decisions made: None.
- Validation performed: GitHub Actions run 27830860822 passed PowerShell parsing, migrations, all application and PostgreSQL integration tests, syntax, HTML, documentation, and dependency audit against PostgreSQL 18.
- Deployment status: Not deployed.
- Risks/blockers: Further verification requires target-server access, PostgreSQL client tools, an approved backup destination, and an isolated restore database.
- Exact next action: User runs the read-only target-server inventory and identifies the approved off-machine backup location.

### 2026-06-19 - Windows operations tooling prepared

- Branch: `codex/windows-operations-tooling` stacked on draft PR #7.
- Commit or PR: Draft PR #8; implementation commit `e10bb4e`.
- Phase/work package: Phase 7 operations and recovery preparation.
- Work completed: Added Windows production prerequisite, verified PostgreSQL backup, and health smoke-test scripts; added PowerShell parser validation to local and CI checks; updated GitHub actions to Node 24-compatible major versions; documented intentionally manual production gates.
- Files or schema changed: PowerShell operations/check scripts, CI workflow, package commands, operations guide, playbook index, changelog, and program memory. No schema change.
- Decisions made: Backups never prune automatically until off-machine daily/weekly/monthly retention behavior is confirmed; database URLs are passed to `pg_dump` through the child environment rather than command-line arguments; production-changing install/deploy steps remain explicit manual gates.
- Validation performed: PowerShell parser check passed, 45 JavaScript files passed syntax checks, inline HTML and 33 documentation files passed, 62 tests ran with 59 passing and 3 expected local PostgreSQL skips, and the production dependency audit reported zero vulnerabilities.
- Deployment status: Not deployed; scripts were not run against a production server or database.
- Risks/blockers: Server-local prerequisite execution requires access to the target Windows server and the approved off-machine backup path. Restore-drill automation depends on PostgreSQL installation and an isolated restore target.
- Exact next action: Obtain the target-server prerequisite inventory and approved off-machine backup path through an interactive server session.

### 2026-06-19 - Windows operations CI passed

- Branch: `codex/windows-operations-tooling`.
- Commit or PR: Draft PR #8; implementation commit `e10bb4e`.
- Phase/work package: Phase 7 operations and recovery preparation.
- Work completed: Closed the Windows operations clean-environment validation gate and removed the prior GitHub Actions Node-runtime annotation by advancing the action majors.
- Files or schema changed: Program memory only.
- Decisions made: No additional local deployment automation will guess target-server identities, storage, network, certificate, or maintenance settings.
- Validation performed: GitHub Actions run 27830671911 passed PowerShell parsing on Linux PowerShell, all three PostgreSQL migrations, 62 application tests, PostgreSQL integration tests, syntax, HTML, documentation, and production dependency audit against PostgreSQL 18.
- Deployment status: Not deployed.
- Risks/blockers: Target Windows server facts and an approved off-machine backup destination are now required for meaningful progress.
- Exact next action: User opens an interactive session on the target server and runs the supplied read-only inventory commands, then returns the output without secret values.

### 2026-06-19 - PL destination contract audited read-only

- Branch: `codex/pl-validation-tooling` stacked on draft PR #6.
- Commit or PR: Draft PR #7; implementation commit `ef6c6a1`.
- Phase/work package: Phase 3 controlled validation preparation.
- Work completed: Added a reusable read-only PL destination contract module and command that combines static master-log requirements with configured defect titles, then detects missing columns, duplicate exact titles, writable formulas, and invalid Submission ID types without reading row contents.
- Files or schema changed: PL destination contract library, validation command, unit tests, package command, changelog, PL migration guide, and program memory. No database or Smartsheet schema changed.
- Decisions made: Destination schema changes remain additive and window-controlled; the audit fails closed and does not offer an implicit write mode.
- Validation performed: 62 local tests ran with 59 passing and 3 expected PostgreSQL skips. A read-only audit against the currently configured PL destination found 57 columns and exactly one missing required contract field: `Submission ID`.
- Deployment status: Not deployed; no external state changed.
- Risks/blockers: PL worker delivery cannot be enabled until an approved `Submission ID` text-compatible column is added to the intended destination and this audit returns READY.
- Exact next action: Continue safe deployment and operations preparation before requesting the controlled destination change.

### 2026-06-19 - PL destination audit CI passed

- Branch: `codex/pl-validation-tooling`.
- Commit or PR: Draft PR #7; implementation commit `ef6c6a1`.
- Phase/work package: Phase 3 controlled validation preparation.
- Work completed: Closed the destination-audit clean-environment CI gate.
- Files or schema changed: Program memory only.
- Decisions made: None.
- Validation performed: GitHub Actions run 27830472821 passed migrations, 62 application tests, PostgreSQL integration tests, syntax, HTML, documentation, and production dependency audit against PostgreSQL 18.
- Deployment status: Not deployed.
- Risks/blockers: The configured PL destination remains NOT READY until the approved `Submission ID` column is added.
- Exact next action: Prepare deployment, backup, monitoring, and rollback automation without enabling production.

### 2026-06-19 - Isolated PL page and durable workflow implemented

- Branch: `codex/pl-page-extraction` stacked on the validated server-workspaces branch.
- Commit or PR: Commit `5919c9c`; stacked draft PR #6.
- Phase/work package: Phase 3 PL page extraction and durable workflow binding.
- Work completed: Added the isolated `/pl/` module, authenticated feature/session startup, server autosave with stale-tab stop, durable job and event capture with permanent retry identity, database-versus-Smartsheet status, guarded sign-out/discard, and PL login routing. Removed hourly tracking, End Shift, browser-local workspace ownership, and local associate switching from the isolated module.
- Files or schema changed: PL HTML/CSS/model/app bundle; shared API client; safe feature-state route; login routing; model/API/browser support tests; changelog; and PL migration guide. No schema change.
- Decisions made: One authenticated associate owns one PL server workspace; one submitted PL form is one logical durable row; Smartsheet delivery status is never presented as a condition of database durability; the compatibility page remains the flag-controlled rollback path.
- Validation performed: 42 JavaScript files passed syntax checks, inline scripts parsed, 59 local tests passed with 3 expected PostgreSQL skips, 32 documentation files passed local-link checks, the production dependency audit reported zero vulnerabilities, authenticated reporting fields were proven server-canonical, and real-browser checks proved job/event autosave and capture, pending-to-synced status, form clearing, stale-tab blocking and recovery, and 768 by 1024 responsive layout without horizontal overflow.
- Deployment status: Not deployed; all rollout flags remain disabled by default.
- Risks/blockers: Controlled Smartsheet exact-ID delivery, parallel output comparison, PL floor UAT, and rollback rehearsal remain cutover gates requiring the approved environment and people.
- Exact next action: Prepare the controlled PL validation and deployment tooling without enabling production flags, then provide the exact physical cutover prerequisites when no further safe local work remains.

### 2026-06-19 - PL page PostgreSQL CI passed

- Branch: `codex/pl-page-extraction`.
- Commit or PR: Draft PR #6; head `5919c9c` before this evidence-only memory update.
- Phase/work package: Phase 3 PL clean-environment validation.
- Work completed: Closed the isolated PL page clean-database CI gate.
- Files or schema changed: Program memory only; no application or schema behavior changed.
- Decisions made: Keep all PL rollout flags disabled and continue only safe preparation until controlled Smartsheet comparison and floor acceptance are available.
- Validation performed: GitHub Actions run 27830248902 applied all three migrations and passed syntax, inline HTML, documentation, 59 application tests, PostgreSQL integration tests, and the production dependency audit against PostgreSQL 18.
- Deployment status: Not deployed.
- Risks/blockers: GitHub reports a non-failing future-runtime annotation for `actions/checkout@v4` and `actions/setup-node@v4`; current CI passed. PL external validation gates remain open.
- Exact next action: Commit the CI evidence, then prepare controlled PL validation and deployment tooling.

### 2026-06-19 - PL server sessions and workspaces implemented

- Branch: `codex/pl-server-workspaces` stacked on the validated outbox branch.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 3 PL server sessions and workspaces.
- Work completed: Added users, server sessions, durable kiosk locks, and optimistic-versioned workspace schema and services. Integrated compatibility login with department-gated HTTP-only sessions, protected submission identity with the authenticated session, added session/workspace APIs, blocked unsafe sign-out, and audited discard and supervisor lock release.
- Files or schema changed: Migration `003_sessions_and_workspaces.js`; identity/workspace repositories; session/workspace services and routes; server integration; runtime flags; tests; environment example; changelog; and session/workspace guide.
- Decisions made: PL sessions are independently gated so enabling the PL pilot cannot strand PTFE or PI users; the database stores token hashes only; active requests extend inactivity expiry; one open workspace is allowed per user/department.
- Validation performed: 36 JavaScript files passed syntax checks, 47 local tests passed with 3 expected PostgreSQL skips, and GitHub Actions run 27829232827 passed migration 003 and all 50 tests against clean PostgreSQL 18.
- Deployment status: Not deployed; all new flags default false.
- Risks/blockers: HTTPS remains required for production secure cookies. Existing PL frontend extraction and workspace binding are the next work package.
- Exact next action: Extract and bind the PL page to the session/workspace and durable-submission APIs.

### 2026-06-19 - Phase 2 durable submission slice implemented

- Branch: `codex/submission-outbox` stacked on the validated foundation branch.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 2 durable submissions and Smartsheet outbox.
- Work completed: Added the durable schema, atomic idempotent capture, payload conflict detection, worker leasing and restart recovery, attempt history, exact remote submission lookup, retry/backoff/terminal classification, audit events, integration health, supervisor APIs, and the submission status page. Added PM2 web/worker process definitions and kept the slice disabled by default.
- Files or schema changed: Migration `002_durable_submissions.js`; submission repository/services/routes; Smartsheet delivery adapter; worker process; supervisor page and admin links; tests; environment example; changelog; and durable-submission guide.
- Decisions made: One Job x Job row equals one logical submission; every destination requires a `Submission ID` column; durable capture requires an explicit feature flag; supervisors are restricted to their authenticated department.
- Validation performed: 28 JavaScript files passed syntax checking, inline scripts in 9 HTML pages parsed, 30 Markdown documents passed local-link checks, 32 unit/API tests passed with 2 expected PostgreSQL skips, the production dependency audit reported zero vulnerabilities, and the supervisor page passed real-browser authentication redirect, disabled-feature messaging, mocked status/action rendering, and 768x1024 responsive inspection. Clean PostgreSQL CI is still required before the slice is complete.
- Deployment status: Not deployed; feature disabled by default.
- Risks/blockers: Destination sheets do not yet have verified `Submission ID` columns. That is a cutover prerequisite, not a local implementation blocker.
- Exact next action: Complete local checks, inspect the supervisor page in a browser, commit, and validate migration/worker behavior in PostgreSQL 18 CI.

### 2026-06-19 - Phase 2 first CI correction

- Branch: `codex/submission-outbox`.
- Commit or PR: Draft PR #4; correction not committed yet.
- Phase/work package: Phase 2 PostgreSQL validation.
- Work completed: Added explicit UUID/text casts to the integration-test count assertion after PostgreSQL rejected one shared parameter inferred across UUID submission IDs and the text audit entity ID.
- Files or schema changed: Integration test and program memory only; no application or schema behavior changed.
- Decisions made: None.
- Validation performed: CI run 27828386297 applied both migrations and passed 33 tests; the sole failure was PostgreSQL error 42883 in the test assertion after the application transaction completed.
- Deployment status: Not deployed.
- Risks/blockers: Awaiting corrected CI evidence.
- Exact next action: Commit and push the focused test correction, then confirm the replacement PostgreSQL 18 run.

### 2026-06-19 - Phase 2 deterministic lease test correction

- Branch: `codex/submission-outbox`.
- Commit or PR: Draft PR #4; final correction commit `13074a7`.
- Phase/work package: Phase 2 worker restart validation.
- Work completed: Replaced a timing-sensitive 20 ms concurrent lease test with a normal 60-second concurrency assertion followed by an explicit database lease expiration and recovery claim.
- Files or schema changed: Integration test and program memory only.
- Decisions made: Restart recovery tests manipulate the lease timestamp explicitly so runner scheduling cannot turn legitimate lease expiry into a false concurrency failure.
- Validation performed: CI run 27828469533 applied both migrations and passed 33 tests; the sole failure showed two sequential claims because the intentionally tiny lease expired during runner scheduling. Follow-up run 27828573590 proved one concurrent claim and one recovered claim, then exposed a stale expected retry count of 1 even though recovery correctly increments the count to 2.
- Deployment status: Not deployed.
- Risks/blockers: Non-production Smartsheet exact-ID proof requires a destination with the approved `Submission ID` column before cutover.
- Exact next action: Implement PL server sessions/workspaces and isolated durable capture while the live-sheet gate remains disabled.

### 2026-06-19 - Phase 2 clean PostgreSQL validation passed

- Branch: `codex/submission-outbox`.
- Commit or PR: Draft PR #4; head `13074a7`.
- Phase/work package: Phase 2 validation.
- Work completed: Closed the durable submission implementation database gate.
- Files or schema changed: No additional schema or application change; this entry records validation evidence.
- Decisions made: Continue PL implementation with the feature disabled while preserving non-production Smartsheet proof as a cutover requirement.
- Validation performed: GitHub Actions run 27828636152 passed both migrations, 34 automated tests, syntax checks, inline HTML script parsing, documentation-link checks, and production dependency audit against PostgreSQL 18.
- Deployment status: Not deployed; feature disabled by default.
- Risks/blockers: Required `Submission ID` destination columns and controlled Smartsheet delivery remain external cutover prerequisites.
- Exact next action: Begin Phase 3 durable sessions, server workspaces, and isolated PL page.

### 2026-06-19 - Phase 1 engineering foundation implemented

- Branch: `codex/postgres-foundation` stacked on the approved Phase 0 commit.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 1 engineering foundation.
- Work completed: Added runtime environment validation, PostgreSQL pooling and transaction support, initial migration, structured redacted logs, request IDs, graceful shutdown, liveness/readiness endpoints, automated tests, CI, and database setup documentation. Updated vulnerable production dependencies to patched versions.
- Files or schema changed: Added `app_metadata` foundation migration, database/runtime/logging/health modules, CI workflow, tests, check scripts, `.env.example`, setup guide, and changelog entry; integrated the foundation into `server.js`.
- Decisions made: Database support remains disabled by default for compatibility until an environment is installed, migrated, and verified.
- Validation performed: JavaScript syntax (19 files at the time of the check), Markdown links (29 files), 13 passing automated tests, assembled-app health smoke tests, `git diff --check`, and zero production dependency vulnerabilities. PostgreSQL integration test is correctly skipped locally because no server is installed.
- Deployment status: Not deployed.
- Risks/blockers: Clean PostgreSQL migration evidence is pending CI; physical production-server prerequisites remain deferred until deployment preparation.
- Exact next action: Commit and push the foundation, confirm PostgreSQL 18 CI, then implement the Phase 2 durable submission schema and API.

### 2026-06-19 - Phase 1 first CI correction

- Branch: `codex/postgres-foundation`.
- Commit or PR: Draft PR #3; correction commit `0f03740`.
- Phase/work package: Phase 1 CI validation.
- Work completed: Made the existing three-department startup environment contract explicit and added safe fake CI/test values after the assembled-app smoke test exposed local `.env` coupling.
- Files or schema changed: Runtime validation, environment example, CI configuration, and tests. No schema change.
- Decisions made: All configuration names required by the currently assembled three-department server are validated at startup; secret values remain environment-only.
- Validation performed: The first clean PostgreSQL 18 CI run successfully applied the migration and passed the database transaction test before failing only on a missing PTFE Job Log test variable. Replacement run 27827283516 passed all checks after the correction.
- Deployment status: Not deployed.
- Risks/blockers: None for the engineering foundation; production installation remains a later infrastructure prerequisite.
- Exact next action: Implement Phase 2 durable submission storage and idempotent API.

### 2026-06-19 - Phase 0 current-state inventory

- Branch: `codex/production-readiness-phase0`.
- Commit or PR: None yet.
- Phase/work package: Phase 0 discovery and inventory.
- Work completed: Verified the local development host and documented the current application, API, browser state, submission behavior, Smartsheet integrations, configuration names, utilities, and confirmed baseline risks.
- Files or schema changed: Added `00-current-state-inventory.md`; updated the playbook index and program memory. No schema changes.
- Decisions made: None; core architecture and ownership approvals remain pending.
- Validation performed: Repository inspection, route and environment-reference search, runtime version checks, and local PostgreSQL/PM2 prerequisite checks. Secret values were not read into documentation.
- Deployment status: Not deployed; documentation-only work on an isolated branch.
- Risks/blockers: Production infrastructure, owners, backup destination, test sheets, windows, and baseline incident counts require external confirmation.
- Exact next action: Obtain Phase 0 approvals, then implement the database and test foundation on a bounded engineering branch.

### 2026-06-19 - Phase 0 architecture approved

- Branch: `codex/production-readiness-phase0`.
- Commit or PR: None yet.
- Phase/work package: Phase 0 approval.
- Work completed: Recorded the approved core architecture, interim ownership, and sensible defaults for database tooling, worker isolation, sessions, HTTPS, backups, retention, and synchronization alerts.
- Files or schema changed: Product requirements, risk and decision register, and program memory. No schema changes.
- Decisions made: D-001 through D-004 and D-007 through D-013 approved by Johnny Bercegeay.
- Validation performed: Confirmed PostgreSQL 18 is the current supported major release and verified the selected migration tooling supports the local Node runtime and PostgreSQL target.
- Deployment status: Not deployed.
- Risks/blockers: Physical backup storage, certificate issuer, alert transport, windows, and department UAT representatives remain deployment prerequisites, not Phase 1 design blockers.
- Exact next action: Commit Phase 0 and begin the Phase 1 engineering foundation.

### 2026-06-19 - Production-readiness playbook established

- Branch: `main` working tree; documentation not yet committed.
- Commit or PR: None yet.
- Phase/work package: Phase 0 planning.
- Work completed: Created the initial playbook documents and durable memory convention.
- Files or schema changed: Documentation only; no database or production schema changes.
- Decisions made: Use short-lived `codex/` branches, keep `main` deployable, and deploy only approved commits or release tags.
- Validation performed: Markdown link and diff formatting checks.
- Deployment status: Not deployed.
- Risks/blockers: Phase 0 ownership and infrastructure decisions remain open.
- Exact next action: Review and approve the Phase 0 requirements and decision list.
### 2026-08-13 - PTFE destination contract and guarded expansion

- Branch: `codex/ptfe-destination-tooling`.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 5 PTFE destination readiness.
- Work completed: Added read-only two-destination contract validation and a guarded, dry-run-by-default `Submission ID` expansion for the PTFE Master Log and Job x Job Log. Corrected the durable Job x Job payload to the live physical `OE Pct` and `Time Min` titles.
- Files or schema changed: Added PTFE destination-contract, migration-planning, validation, expansion, and focused test files; updated the PTFE model, package commands, migration work package, and tests. No production Smartsheet change was applied.
- Decisions made: The generic worker must send exact physical Smartsheet titles. `Submitted At` remains outside the writable Job x Job contract because Smartsheet manages it.
- Validation performed: Fourteen focused tests passed. Live read-only validation found only `Submission ID` missing from each production destination. The guarded dry run planned exactly one added text/number column per sheet and zero existing-row changes.
- Deployment status: Not deployed. PTFE routing remains disabled and production Smartsheets are unchanged.
- Risks/blockers: Production expansion requires an approved window. Dedicated non-production PTFE destinations, exact-ID delivery proof, isolated UAT, rollback rehearsal, and named approvals remain open.
- Exact next action: Commit the validator slice, then build dedicated PTFE integration-destination creation, proof, and cleanup tooling without touching production data.
### 2026-08-13 - PTFE isolated integration destinations proven

- Branch: `codex/ptfe-integration-destinations`.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 5 PTFE non-production delivery proof.
- Work completed: Added creation, empty-state/cleanup guard, controlled exact-ID delivery, and isolated PostgreSQL/outbox proof tooling for separate PTFE Master Log and Job x Job test sheets. Created both dedicated non-production sheets and completed the live controlled proof.
- Files or schema changed: Added PTFE integration-sheet definitions, scripts, package commands, and focused tests; updated the PTFE migration work package and program memory. No production schema or sheet was changed.
- Decisions made: PTFE integration uses two distinct process-scoped sheet IDs and refuses either production destination. Test sheets reproduce exact writable contracts and date types without copying production rows or formulas.
- Validation performed: Both live test sheets began empty; each accepted one representative row; exact-ID replay inserted no duplicate; 13 Master Log and 16 Job Log fields were verified; both synthetic rows were deleted; both sheets were reverified empty. Search indexing required 30 and 57 attempts respectively.
- Deployment status: Not deployed. PTFE routing remains disabled. The two empty non-production Smartsheet objects are retained for UAT.
- Risks/blockers: The database/outbox command requires an isolated migrated PostgreSQL database. Windows PTFE UAT and rollback orchestration, named approvals, and production `Submission ID` expansion remain open.
- Exact next action: Validate the two-destination outbox proof inside the isolated PTFE UAT database, then run browser parity and rollback rehearsals.
### 2026-08-13 - PTFE isolated Windows UAT orchestration implemented

- Branch: `codex/ptfe-uat-tooling`.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 5 PTFE target-server UAT and rollback tooling.
- Work completed: Added PTFE-specific Start, Rollback, and Stop orchestration using a separate server checkout, port 3103, isolated database, two integration sheets, PTFE-only feature chain, hidden web/worker processes, recoverable initialization state, automatic two-destination database/outbox proof, compatibility rollback, and complete cleanup.
- Files or schema changed: Added the Windows PTFE UAT script and focused static contract tests; updated PTFE migration instructions, playbook status, and program memory. No production configuration, database, or sheet changed.
- Decisions made: Production port 3002 is required and must retain its process ID; legacy port 3000 is optional because its PM2 process is intentionally stopped. Initialization writes state before the outbox proof so a failed rehearsal remains safely removable with Stop.
- Validation performed: PowerShell parsed successfully, repository PowerShell checks passed, and focused tests verify isolation, flags, both destination substitutions, outbox proof, rollback, cleanup, and live-process protection.
- Deployment status: Not deployed. PTFE routing remains disabled.
- Risks/blockers: Target-server execution requires physical password entry for PostgreSQL superuser, migration, and application roles. Named PTFE associate and supervisor approval are still required after browser UAT.
- Exact next action: Merge the UAT tooling, prepare the server worktree at the approved commit, then have Johnny enter the three database passwords while Start creates and validates the isolated port 3103 environment.
### 2026-08-13 - Automated local operations health monitor implemented

- Branch: `codex/operations-health-monitor`.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 7 monitoring and operations handoff.
- Work completed: Expanded integration health evidence and added a five-minute Windows monitor plus confirmation-gated Task Scheduler installer. The monitor covers PM2 web/worker state, PostgreSQL service, liveness/readiness, queue age and terminal work, backup task/result, verified backup freshness, and disk space; it atomically persists structured status and exits nonzero on failure.
- Files or schema changed: Submission health query/router, two Windows scripts, focused tests, corrected production preflight liveness expectation, operations/roadmap/risk/durable-submission documentation, and program memory. No database schema or external system changed.
- Decisions made: `pending` and `processing` are both active queue work for five-minute alerting. The local scheduled result is implemented independently of the still-unapproved company alert transport.
- Validation performed: Focused API and script-contract tests passed; JavaScript and PowerShell syntax and diff checks passed. Full validation and clean CI are pending before merge.
- Deployment status: Not deployed or scheduled on the target server.
- Risks/blockers: Task installation requires target-server execution. Routed email/Teams/enterprise alerts, TLS/DNS, and permanent service ownership remain external operations gates.
- Exact next action: Complete full validation and merge, then install and run the target scheduled monitor after the server pulls the approved commit.
### 2026-08-13 - Guarded backup retention tooling implemented

- Branch: `codex/backup-retention-tooling`.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 7 backup lifecycle hardening.
- Work completed: Added a deterministic 14-daily/8-weekly/12-monthly recovery-point planner and a dry-run-first retention command that SHA-256 verifies every managed archive, blocks on missing/mismatched sidecars, requires an exact apply confirmation, and removes only an eligible dump/sidecar pair.
- Files or schema changed: Backup retention library, command, package script, tests, operations/tooling/risk documentation, and program memory. No backup file or production system changed.
- Decisions made: Retention is the union of the newest recovery point in each selected day, ISO week, and calendar month. Creation and retention remain separate jobs. Apply/scheduling stays prohibited until the share snapshot/copy behavior is confirmed.
- Validation performed: Unit tests cover tier unions, newest-within-group selection, ISO year boundaries, hash sidecars, dry-run, confirmation refusal, and paired deletion in a disposable directory. A real-share dry run verified 28 archives, retained 17 points, and identified 11 eligible pairs totaling 313,231 bytes; no file changed.
- Deployment status: Tooling only; production backup task and share contents are unchanged.
- Risks/blockers: Company storage/retention approval and the share's snapshot/copy behavior are required before apply mode or scheduling.
- Exact next action: Merge the retention tooling, keep apply disabled, and obtain infrastructure confirmation before any deletion is authorized.
### 2026-08-13 - Compatibility administrative actions added to durable audit history

- Branch: `codex/admin-audit-events`.
- Commit or PR: Not committed yet.
- Phase/work package: Phase 7 auditability hardening.
- Work completed: Added a database audit repository and post-authorization completion middleware for configuration save/delete, password reset, and admin kiosk-lock release outcomes across PL, PTFE, and PI compatibility admin routes.
- Files or schema changed: Audit repository/service, server integration, focused tests, product/architecture documentation, and program memory. Existing `audit_events` schema is reused; no migration is required.
- Decisions made: Audit persistence runs after the HTTP outcome so it records success/failure without putting sensitive request bodies into the database. A post-mutation audit failure is structured-logged instead of returning a false mutation failure that could provoke an unsafe retry.
- Validation performed: Focused tests prove safe metadata, completed-outcome capture, disabled-database no-op, and exact structured database parameters. JavaScript syntax and diff checks passed; full suite and CI are pending.
- Deployment status: Not deployed. No Smartsheet or production database record changed.
- Risks/blockers: Compatibility audit persistence depends on database availability; structured error logs expose a missing audit record for operational follow-up. Legacy unauthenticated compatibility flows remain temporary until each department moves to v2 sessions.
- Exact next action: Complete full validation and clean CI, merge, then include the approved commit in the next staged server update.

### 2026-08-13 - Completion evidence reconciled after operations and PTFE tooling merges

- Branch: `codex/production-readiness-completion-audit` from merged `main` at `471f55e`.
- Commit or PR: Pending in this documentation work package; administrative-audit PR #17 merged as `471f55e` after GitHub Actions passed.
- Phase/work package: Cross-phase completion audit covering Phases 4 through 7.
- Work completed: Reconciled the program summary with the merged PTFE destination proof, PTFE target UAT orchestration, operations monitor, backup retention guard, and administrative auditing. Added a single evidence matrix that distinguishes completed implementation, controlled target execution, external decisions, and intentionally sequenced PI work; recorded the exact remaining execution order and stop conditions.
- Files or schema changed: Production-readiness index, roadmap, PTFE work package, completion audit, and program memory only. No application runtime, database schema, Smartsheet object, backup, PM2 process, feature flag, or production server changed.
- Decisions made: Treat PTFE source implementation and non-production exact-ID proof as complete, but do not treat PTFE as production-ready until target UAT/rollback, named approval, monitor installation, production destination expansion, and supervised reconciliation pass. Keep retention apply prohibited and PI sequenced after PTFE acceptance.
- Validation performed: The full local suite passed 122 tests with 119 passes and three expected database-only skips. JavaScript syntax checked 81 files, inline scripts parsed in nine HTML files, PowerShell syntax passed, local links passed across 37 Markdown files, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed.
- Deployment status: Documentation-only local branch. Production PTFE and PI routing remain disabled; PL remains on the proven durable workflow.
- Risks/blockers: Target PTFE UAT and local monitor installation require server execution and password entry. Routed alerts, TLS/DNS, storage-policy confirmation, permanent task ownership, quarterly restore ownership, and department handoff require external decisions or named owners.
- Exact next action: Validate and merge this reconciliation, then run the documented isolated PTFE Start action on the target server.

### 2026-08-13 - PL durable-workflow SOP and support handoff package updated

- Branch: `codex/pl-support-handoff` from merged completion audit `98e0534`.
- Commit or PR: Pending in this documentation work package.
- Phase/work package: Phase 4 PL stabilization and Phase 7 operations handoff.
- Work completed: Replaced obsolete multi-user kiosk, hour-by-hour tracker, timer, and End Shift instructions with current PL associate and supervisor/support procedures. Documented server-workspace versus database-delivery status, automatic Smartsheet synchronization, root-cause and Spool Check rules, tab conflict recovery, sign-out safety, submission retry/resolution, daily health review, incident response, and escalation evidence. Replaced both stale HTML training pages with current concise browser-readable versions linked to the complete SOPs.
- Files or schema changed: PL associate and supervisor SOP Markdown/HTML, PL readiness page, roadmap, index, completion audit, and program memory only. No application code, production configuration, database, Smartsheet object, PM2 process, backup, or feature flag changed.
- Decisions made: A database-saved pending item is safe and does not require associate polling or re-entry. Supervisors retry only after the cause is corrected/confirmed and resolve only after approved reconciliation; both require reasons and remain audited. The SOP source is complete, but formal named support-handoff acceptance remains a stabilization gate.
- Validation performed: The full local suite passed 122 tests with 119 passes and three expected database-only skips. Documentation links passed across 37 Markdown files, application inline HTML scripts parsed, the four replacement SOP files contained none of the retired action phrases, and `git diff --check` passed.
- Deployment status: Documentation-only local branch. Production PL behavior is unchanged.
- Risks/blockers: Final PL observation and named handoff acceptance remain; routed alerting and TLS/DNS are separate external gates.
- Exact next action: Validate and merge the SOP package, then obtain named support acceptance while PTFE isolated server UAT proceeds.

### 2026-08-13 - Runtime release identity added to operations evidence

- Branch: `codex/runtime-release-identity` from merged SOP state `ebd1935`.
- Commit or PR: Pending in this work package.
- Phase/work package: Phase 7 logging, deployment traceability, and local monitoring.
- Work completed: Added a safe deployed-commit resolver using explicit `APP_COMMIT`/`GIT_COMMIT` or checkout Git metadata, including normal and linked worktrees. Added the commit to web and worker logger base fields, structured startup events, all health endpoints, and the local operations monitor's liveness evidence.
- Files or schema changed: Release-identity/runtime/logger modules, web and worker startup, health router, Windows operations monitor, focused tests, operations/tooling/completion documentation, and program memory. No database schema, production configuration, Smartsheet object, PM2 process, backup, or feature flag changed.
- Decisions made: Expose only a validated hexadecimal commit identity. A deployment lacking explicit or Git metadata reports `unknown`; it never logs arbitrary environment content or invents a release identity.
- Validation performed: Twenty-two focused release/health/config/monitor tests passed. The full suite passed 125 tests with 122 passes and three expected database-only skips. JavaScript syntax checked 83 files, PowerShell syntax passed, inline application scripts parsed, local links passed across 37 Markdown files, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed.
- Deployment status: Local source only. The running target is unchanged until a controlled pull/restart.
- Risks/blockers: The target operations monitor remains uninstalled. Packaged deployments without `.git` must set `APP_COMMIT`. Log retention duration and rotation policy still require an approved period.
- Exact next action: Validate and merge the release-identity slice, then include it in the next target pull and compare health commit with the approved merge.

### 2026-08-13 - PTFE target UAT destination-safety mismatch corrected

- Branch: `codex/ptfe-uat-destination-safety-fix` from merged release-identity state `e9fc58d`.
- Commit or PR: Pending in this hotfix work package.
- Phase/work package: Phase 5 PTFE isolated target-server UAT.
- Work completed: Reviewed the first target Start output. Confirmed both dedicated test sheets were empty, production destinations were untouched, the isolated PostgreSQL database was created, and all three migrations passed. Diagnosed the proof failure: the orchestrator replaced `DEPT_PTFE_*` runtime destinations with test IDs before the proof reused those names to identify production IDs, causing its safety guard to reject the intended test sheets. Added protected dedicated production-ID variables, set them before runtime substitution, and updated the outbox proof to prefer them while preserving standalone fallback behavior.
- Files or schema changed: PTFE Windows UAT orchestration, PTFE outbox proof, focused static ordering/safety tests, PTFE work package, completion audit, and program memory. No production configuration, production database, production Smartsheet, PM2 process, or feature flag changed. The failed isolated database and state file remain intentionally recoverable on the target until guarded Stop runs.
- Decisions made: Never weaken the production-sheet refusal. Preserve original production IDs under separate process-scoped names before substituting either UAT destination. Cleanup must use the failed checkout's Stop action before replacing its worktree.
- Validation performed: Five focused PTFE destination/UAT safety tests passed. The full suite passed 125 tests with 122 passes and three expected database-only skips. JavaScript syntax checked 83 files, PowerShell syntax passed, inline application scripts parsed, local links passed across 37 Markdown files, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed.
- Deployment status: Fix is local only. The PTFE UAT portal never started; production remained unchanged. The target retains a disposable `metrics_portal_ptfe_uat` database and initializing state from the failed rehearsal.
- Risks/blockers: Johnny must enter the PostgreSQL superuser password once for guarded cleanup and three database passwords for the corrected Start. Named PTFE browser UAT approval still follows successful startup.
- Exact next action: Validate and merge the fix, run Stop from the retained `26529e8` checkout, remove that worktree through Git, recreate it at the fixed commit, and rerun Start.

### 2026-08-13 - Corrected PTFE target environment started and development audit cleared

- Branch: `codex/development-audit-fix` from corrected UAT merge `8239cbb`.
- Commit or PR: Pending in this maintenance work package.
- Phase/work package: Phase 5 PTFE target UAT and dependency maintenance.
- Work completed: Verified guarded cleanup removed the failed isolated database/state with both test sheets empty and live portals unchanged. Verified the corrected checkout at `8239cbb` recreated and migrated the disposable database, committed two proof captures, delivered Master Log and Job x Job rows in one attempt each, removed two synthetic Smartsheet rows and all proof database rows, and launched the isolated web/worker at port 3103 without changing production. Updated the development-only `brace-expansion` lockfile resolution from 5.0.6 to 5.0.9 to clear the install-time advisory.
- Files or schema changed: Package lock and current production-readiness evidence only. No production code path, database, Smartsheet, PM2 process, backup, or feature flag changed. The isolated UAT database/web/worker intentionally remain active for browser acceptance.
- Decisions made: The advisory was development-only and did not invalidate the running UAT or production dependencies. Clear it in source before the next checkout refresh; do not run an ad hoc server-side audit fix.
- Validation performed: Clean `npm ci` audited all 160 packages with zero vulnerabilities on Node 24.14.0. The full suite passed 125 tests with 122 passes and three expected database-only skips; JavaScript syntax, documentation links, full dependency audit, and `git diff --check` passed.
- Deployment status: PTFE UAT is active only at `http://127.0.0.1:3103`; live production remains unchanged. The lockfile maintenance is local until merge.
- Risks/blockers: Browser UAT, named PTFE approval, rollback rehearsal, and final Stop cleanup remain. The old UAT checkout still reports the already-understood advisory until it is later recreated from a commit containing this lockfile change.
- Exact next action: Merge the lockfile maintenance, then sign in to port 3103 as `test-ptfe` and execute the written browser acceptance sequence.

### 2026-08-13 - PTFE quantity entry zero replacement corrected

- Branch: `codex/ptfe-quantity-entry` from merged source `d32542f`.
- Commit or PR: Pending in this focused browser-usability work package.
- Phase/work package: Phase 5 PTFE isolated browser UAT.
- Work completed: Reviewed the first controlled PTFE job rehearsal. Confirmed the existing zero-replacement behavior was limited to Time worked, then applied it to Start quantity and End quantity. Hardened the shared behavior so both keyboard focus and mouse clicks preserve selection of the default zero before operator typing.
- Files or schema changed: Isolated PTFE page markup, PTFE browser event handling, focused page-contract test, and program memory only. No database schema, Smartsheet object, production configuration, feature flag, PM2 process, or live portal changed.
- Decisions made: Reuse one explicit `data-replace-zero` behavior for all operator-entered PTFE numeric fields that display a default zero. Preserve calculated Pull start quantities and all existing workspace autosave behavior.
- Validation performed: Six focused PTFE page-contract tests passed. The full suite passed 126 tests with 123 passes and three expected database-only skips. JavaScript syntax checked 83 files, inline scripts parsed in nine HTML files, PowerShell parsing and 37 Markdown link checks passed, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed.
- Deployment status: Source-only change. The running isolated UAT checkout remains at `8239cbb` until the fix is merged and deliberately refreshed; production PTFE remains unchanged.
- Risks/blockers: The browser regression cannot be confirmed on the target until the UAT checkout is refreshed. Remaining browser scenarios, named approval, rollback rehearsal, and final cleanup still follow.
- Exact next action: Complete local validation, merge the focused fix, refresh the isolated UAT checkout safely, and repeat Start/End quantity entry by both tab and mouse before continuing browser UAT.

### 2026-08-13 - PTFE Edge number-input replacement hardened

- Branch: `codex/ptfe-quantity-zero-clear` from merge `aae21a8`.
- Commit or PR: Pending in this focused browser-regression work package.
- Phase/work package: Phase 5 PTFE isolated browser UAT.
- Work completed: Reviewed target evidence showing Start quantity produced `010` after the first fix. Replaced number-input text selection with deterministic zero clearing on pointer or keyboard focus and blank-zero restoration on blur.
- Files or schema changed: PTFE browser event handling, focused page-contract coverage, and program memory only. No database schema, Smartsheet object, production configuration, feature flag, PM2 process, or live production portal changed.
- Decisions made: Do not depend on `HTMLInputElement.select()` for numeric inputs. Preserve zero as the stored default while presenting an empty field only during active operator entry.
- Validation performed: The focused PTFE field contract passed within the full suite. The full suite passed 126 tests with 123 passes and three expected database-only skips. JavaScript syntax checked 83 files, inline scripts parsed in nine HTML files, PowerShell parsing and 37 Markdown link checks passed, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed.
- Deployment status: Source-only follow-up. The isolated target remains available at port 3103 and production PTFE remains unchanged.
- Risks/blockers: The Edge behavior requires one more target browser confirmation after merge and checkout refresh. Remaining UAT scenarios, named approval, rollback rehearsal, and final cleanup still follow.
- Exact next action: Validate and merge the follow-up, refresh the active UAT checkout, hard-refresh Edge, and confirm both click-to-type and Tab-to-type yield exactly `10`.

### 2026-08-13 - PTFE zero values replaced with placeholders

- Branch: `codex/ptfe-blank-quantity-fields` from merge `ea4617b`.
- Commit or PR: Pending in this focused browser-regression work package.
- Phase/work package: Phase 5 PTFE isolated browser UAT.
- Work completed: Reviewed the second target failure and removed reliance on focus-time mutation. Time worked, Start quantity, and End quantity now render model zero as an empty input with a visual `0` placeholder, so typed input starts from an actually empty value. Removed the increment/decrement spinner arrows from all three controls.
- Files or schema changed: Isolated PTFE page markup, PTFE workspace rendering, PTFE styles, focused page-contract coverage, and program memory only. No database schema, Smartsheet object, production configuration, feature flag, PM2 process, or live production portal changed.
- Decisions made: Preserve numeric zero in the server workspace and calculations, but do not place zero in the editable DOM value. Use placeholders for zero-state presentation and keep the controls numeric for browser validation and mobile keyboard behavior.
- Validation performed: Six focused PTFE page-contract tests passed. The full suite passed 126 tests with 123 passes and three expected database-only skips. JavaScript syntax checked 83 files, inline scripts parsed in nine HTML files, PowerShell parsing and 37 Markdown link checks passed, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed. The launcher review confirmed the UAT web process serves static files directly from the configured repository worktree.
- Deployment status: Source-only follow-up. The isolated target remains available at port 3103 and production PTFE remains unchanged.
- Risks/blockers: One target browser refresh and confirmation remain before continuing UAT. Remaining UAT scenarios, named approval, rollback rehearsal, and final cleanup still follow.
- Exact next action: Validate and merge the placeholder solution, refresh the active UAT checkout, verify the served commit, then confirm exact `10` entry and absent spinner arrows in Edge.

### 2026-08-13 - PTFE UAT checkout path corrected and PL number behavior standardized

- Branch: `codex/ptfe-match-pl-number-entry` from merge `76d4fe5`.
- Commit or PR: Pending in this focused browser-regression work package.
- Phase/work package: Phase 5 PTFE isolated browser UAT.
- Work completed: Diagnosed why three served-file checks were empty: the refresh commands targeted `C:\serverdata\staging\metrics-portal-uat`, but the PTFE launcher runs port 3103 from `C:\serverdata\staging\metrics-portal-ptfe-uat`. Standardized PTFE Time worked, Start quantity, and End quantity on the exact PL Time worked markup, delayed zero selection, mouseup handling, and spinner-arrow CSS.
- Files or schema changed: Isolated PTFE page markup, browser event handling, PTFE styles, focused contract coverage, and program memory only. No database schema, Smartsheet object, production configuration, feature flag, PM2 process, or live production portal changed.
- Decisions made: Treat the old PL UAT and PTFE UAT folders as separate environments and always read the PTFE state file's `repository` before a refresh. Reuse the already user-proven PL operator-number implementation verbatim instead of maintaining a PTFE variant.
- Validation performed: Six focused PTFE page-contract tests passed, including exact PL behavior markers. The full suite passed 126 tests with 123 passes and three expected database-only skips. JavaScript syntax checked 83 files, inline scripts parsed in nine HTML files, PowerShell parsing and 37 Markdown link checks passed, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed.
- Deployment status: Source-only until merge. The live PTFE UAT process remains unchanged on port 3103, and production PTFE remains unchanged.
- Risks/blockers: The corrected PTFE checkout must be refreshed and its served HTML, JavaScript, and CSS must return positive matches before browser confirmation. Remaining UAT scenarios, named approval, rollback rehearsal, and final cleanup still follow.
- Exact next action: Validate and merge the standardized implementation, confirm the PTFE state repository, update that exact worktree, verify served assets, then repeat the Edge entry check.

### 2026-08-13 - PTFE numeric-entry target regression passed

- Branch: `codex/ptfe-quantity-uat-evidence` from merge `5d8d191`.
- Commit or PR: Pending documentation evidence commit.
- Phase/work package: Phase 5 PTFE isolated browser UAT.
- Work completed: Johnny updated the state-recorded PTFE UAT checkout rather than the old PL checkout and confirmed in Edge that Time worked, Start quantity, and End quantity now replace the default zero correctly. The spinner arrows were also removed as requested.
- Files or schema changed: Program memory only. No application code, database schema, Smartsheet object, production configuration, feature flag, PM2 process, or live production portal changed in this evidence update.
- Decisions made: Future PTFE UAT refreshes must resolve the repository from `metrics-portal-ptfe-uat-runtime\state.json` before checkout changes. The PL-compatible numeric-entry implementation is accepted for continued PTFE UAT.
- Validation performed: Target browser confirmation on isolated port 3103 using the PTFE UAT checkout at merge `5d8d191`; prior local and CI validation passed 126 tests with 123 passes and three expected database-only skips.
- Deployment status: Isolated PTFE UAT only. Production PTFE remains unchanged and disabled.
- Risks/blockers: Event capture, refresh persistence, duplicate-tab conflict, low-yield Pull behavior, End Shift/restart recovery, rollback, named approval, and final cleanup remain.
- Exact next action: Capture a controlled PTFE event, confirm pending-to-synced delivery and Events tracker persistence, then continue conflict and recovery scenarios.

### 2026-08-13 - PTFE event, refresh, and tab-conflict UAT passed

- Branch: `codex/ptfe-browser-uat-evidence` from merge `3e55545`.
- Commit or PR: Pending documentation evidence commit.
- Phase/work package: Phase 5 PTFE isolated browser UAT.
- Work completed: Captured a five-minute Break event with the controlled UAT comment, observed Database saved and Smartsheet synced, confirmed Events (1) and the row persisted after refresh, and completed a duplicate-tab conflict rehearsal. Tab B was blocked after Tab A saved, and Load server copy restored Tab A's authoritative lot value.
- Files or schema changed: Program memory only. No application code, database schema, production Smartsheet, production configuration, feature flag, PM2 process, or live production portal changed in this evidence update. The event exists only in the dedicated UAT destination and disposable database pending final cleanup.
- Decisions made: Treat event capture, refresh persistence, and stale-tab protection as passed. Keep the event row in the shift tracker until the controlled End Shift/recovery test so it can prove Job x Job capture.
- Validation performed: Target Edge browser evidence on isolated port 3103 showed Database saved / Smartsheet synced, Events (1), the retained Break row after refresh, and authoritative server-copy recovery from a stale tab.
- Deployment status: Isolated PTFE UAT only. Production PTFE remains unchanged and disabled.
- Risks/blockers: Low-yield Pull validation, End Shift/restart recovery, rollback, named approval, and final cleanup remain.
- Exact next action: Clear the temporary tab-conflict lot value, close the stale tab, then run a controlled low-yield Pull validation and capture before the End Shift recovery rehearsal.

### 2026-08-13 - PTFE low-yield Pull passed and numeric controls hardened

- Branch: `codex/ptfe-numeric-input-guards` from merge `b6fcc76`.
- Commit or PR: Pending in this focused browser-usability work package.
- Phase/work package: Phase 5 PTFE isolated browser UAT.
- Work completed: Johnny completed the 80% Pull rehearsal: omission of Pulling Pareto was blocked, and the corrected Pull captured and synchronized successfully. The rehearsal identified that Start quantity multiplier retained its default `1` during typing, wheel input could change focused number controls, and the pending banner required manual Refresh status. Added select-on-entry behavior to the multiplier, removed spinner arrows from every PTFE number input, prevented wheel events from mutating focused numeric values, and added quiet two-second automatic status polling that resumes after reload/tab return and stops on submitted or needs-review state.
- Files or schema changed: PTFE page markup, browser input handling, PTFE styles, focused page-contract tests, and program memory only. No database schema, production Smartsheet, production configuration, feature flag, PM2 process, or live production portal changed.
- Decisions made: Apply wheel protection and arrow suppression to every PTFE `number` input rather than fixing fields one at a time. Preserve the proven PL behavior for zero-valued operator fields and add full-value selection only for the nonzero multiplier default. Operators should never need to poll Smartsheet status manually; retain the Refresh status button only as an explicit fallback.
- Validation performed: Eight focused PTFE page-contract tests passed. The full suite passed 128 tests with 125 passes and three expected database-only skips. JavaScript syntax checked 83 files, inline scripts parsed in nine HTML files, PowerShell parsing and 37 Markdown link checks passed, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed.
- Deployment status: Source-only until merge and isolated target refresh. Production PTFE remains unchanged and disabled.
- Risks/blockers: The multiplier/scroll behavior needs target Edge confirmation. End Shift/restart recovery, rollback, named approval, and final cleanup remain.
- Exact next action: Validate and merge the numeric/status guards, refresh the state-recorded PTFE UAT checkout, verify multiplier replacement, wheel immunity, and automatic pending-to-synced status, then proceed to the End Shift recovery rehearsal.

### 2026-08-13 - PTFE End Shift reconciled and worker recovery controls added

- Branch: `codex/ptfe-worker-recovery-uat` from merge `836bd3f`.
- Commit or PR: Pending in this UAT recovery-tooling work package.
- Phase/work package: Phase 5 PTFE isolated browser and worker-recovery UAT.
- Work completed: Browser regression confirmed multiplier replacement, wheel protection, and automatic pending-to-synced status. End Shift captured every accumulated tracker row and returned to login. Read-only reconciliation confirmed four Master rows and three Job x Job rows across PostgreSQL/outboxes and the dedicated sheets, all submitted on attempt one with remote IDs. Added guarded PauseWorker and ResumeWorker actions that target only the state-recorded isolated worker and reconstruct its isolated environment for pending-delivery recovery proof.
- Files or schema changed: PTFE UAT Windows orchestration, focused orchestration test, PTFE work-package documentation, and program memory. No production application, database schema, production Smartsheet, feature flag, PM2 process, or live production portal changed.
- Decisions made: Worker restart UAT must stop only the recorded isolated PID, keep port 3103 and the disposable database online, create a genuinely pending database submission, then resume with a newly recorded isolated worker. Production process invariants remain mandatory before and after both actions.
- Validation performed: Three focused PTFE UAT orchestration tests passed. The full suite passed 129 tests with 126 passes and three expected database-only skips. JavaScript syntax checked 83 files, PowerShell parsing and 37 Markdown link checks passed, the production dependency audit reported zero vulnerabilities, and `git diff --check` passed. Target reconciliation evidence passed with seven submitted database/outbox rows and exact 4/3 test-sheet counts.
- Deployment status: Recovery controls are source-only until merge and isolated checkout refresh. Production PTFE remains unchanged and disabled.
- Risks/blockers: Worker restart execution, rollback, named approval, and final cleanup remain. The worker resume action requires Johnny to enter only the application-role password.
- Exact next action: Validate and merge the recovery controls, refresh the state-recorded PTFE checkout, pause the isolated worker, submit one controlled event and observe pending status, resume the worker, and confirm automatic convergence without manual refresh or duplicate delivery.

### 2026-08-13 - PTFE worker recovery passed and partial End Shift test added

- Branch: `codex/ptfe-partial-end-shift-uat` from merge `2c8b0c9`.
- Commit or PR: Pending in this UAT failure-scenario work package.
- Phase/work package: Phase 5 PTFE isolated failure and retry UAT.
- Work completed: Paused the state-recorded isolated worker, captured a controlled event into PostgreSQL, observed it remain pending without manual refresh, resumed a newly recorded worker, and confirmed the same submission automatically converged to Smartsheet synced. Added a loopback-port-3103-only partial End Shift injection that interrupts after one durable row so retry identity and no-duplicate behavior can be proven deterministically.
- Files or schema changed: Isolated PTFE browser UAT control, focused page-contract test, PTFE work-package documentation, and program memory. No database schema, production Smartsheet, production configuration, feature flag, PM2 process, or live production portal changed.
- Decisions made: A failure injection must require both exact loopback hostname and isolated port, remain inert on production, and occur only after authoritative server state confirms the first row. Retry must use the already persisted permanent row IDs.
- Validation performed: Target worker recovery passed with database-safe pending state and automatic post-resume convergence. The focused PTFE page contract passed 9 of 9 tests; the full suite passed 127 tests with the same 3 database-dependent skips and no failures. JavaScript syntax, all nine HTML files, documentation links, PowerShell syntax, diff hygiene, and the production-dependency audit also passed; the audit reported zero vulnerabilities.
- Deployment status: Source-only until merge and isolated checkout refresh. Production PTFE remains unchanged and disabled.
- Risks/blockers: Partial End Shift execution, rollback, named approval, and final cleanup remain.
- Exact next action: Validate and merge the isolated failure switch, refresh the PTFE UAT checkout, create two tracker rows, interrupt after one capture, retry without the switch, and reconcile no duplicate rows before rollback.
