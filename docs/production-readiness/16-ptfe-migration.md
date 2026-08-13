# PTFE Migration Work Package

## Purpose

PTFE is the second department migration. It must preserve the current production calculations, entry rules, master-log mapping, and End Shift Job x Job behavior while moving authoritative identity, active work, durable capture, and synchronization status to the common server platform proven by PL.

PL production behavior is not changed by this work package. PTFE remains on the compatibility page and direct-Smartsheet endpoints until the PTFE feature chain, destination contracts, isolated UAT, rollback rehearsal, and supervised cutover are separately approved.

## Implementation Status

The repository implementation slices and non-production destination proof are complete on merged `main`:

- `PTFE_DATABASE_SUBMISSIONS_ENABLED` is an independent, disabled-by-default runtime flag.
- Runtime validation prevents PTFE database routing unless durable submissions, server workspaces, and PTFE server sessions are all enabled.
- The feature endpoint reports PTFE database-routing state without exposing configuration secrets.
- The browser-compatible PTFE model implements the preserved calculations, validation thresholds, exact Master Log and Job x Job payload titles, sequence-to-cell mapping, event timing, dirty-state detection, and one-row Job x Job generation.
- PTFE Master Log job and event payloads explicitly map the workspace work date to the destination's `Date` column.
- Focused automated tests cover the model and feature dependency chain.
- Login routing enters `/ptfe/` only when a PTFE server session and the independent PTFE database feature are both active.
- The isolated page uses the shared themes, centered validation feedback, server autosave/conflict handling, durable status banner, configured sequences/events/paretos/methods/standards, compatibility calculations, and Job x Job tracker.
- After a durable Master Log capture, the server atomically and idempotently appends the job/event to the versioned PTFE shift workspace and clears the entry form; a lost browser response cannot omit or duplicate the shift row.
- End Shift assigns and persists one permanent ID per Job x Job row, captures rows individually, reloads authoritative state after each acceptance, skips already captured rows on retry, and clears the shift only after every row is database-accepted.
- The submission API blocks PTFE capture while the PTFE database feature is disabled, even if another department's durable workflow is enabled.
- Focused browser rehearsal passed for rendered job calculations, database capture, server-owned shift append, refresh persistence, and event capture with no console errors.
- Read-only two-destination validation now verifies exact writable titles, duplicate titles, formulas, and `Submission ID` type for both PTFE production sheets.
- The guarded production expansion utility preflights both sheets before changing either one, defaults to dry-run, requires an exact confirmation phrase to apply, and adds only a missing text/number `Submission ID` column.
- The live read-only audit confirmed both production destinations match their preserved writable contracts and are missing only `Submission ID`; the dry run planned one addition per sheet and zero existing-row changes.

These slices do not route any production PTFE traffic. Target-server database/outbox and browser UAT, rollback rehearsal, named approvals, applying the guarded `Submission ID` expansion in an approved window, and the cutover gates below remain required.

## Dedicated Integration Destinations

Two empty, clearly named non-production sheets now isolate PTFE delivery testing from both production logs:

- `Metrics Portal - PTFE Master Log Integration Test`
- `Metrics Portal - PTFE Job Log Integration Test`

Their IDs are supplied only as process-scoped `PTFE_INTEGRATION_MASTER_LOG_SHEET_ID` and `PTFE_INTEGRATION_JOB_LOG_SHEET_ID` values; they are not substituted for production IDs in `.env`. The creation command defaults to a no-change dry run and requires `CREATE EMPTY PTFE INTEGRATION SHEETS` to create both sheets. The sheet guard refuses either production ID, requires two distinct sheets, verifies both exact contracts, and either requires them to be empty or clears only their rows with `CLEAR PTFE UAT TEST SHEETS`.

The controlled delivery proof passed on both sheets: it inserted one representative row, waited for exact-ID search indexing, replayed the same permanent ID without a second insert, verified mapped values, deleted the synthetic row, and confirmed both sheets empty afterward. The companion database/outbox proof runs automatically while the Windows PTFE UAT environment is initializing. It verifies separate Master Log and Job x Job captures through PostgreSQL and the outbox, then cleans its two synthetic Smartsheet rows and database records before browser UAT begins.

```powershell
npm run create:ptfe-integration-sheets
npm run create:ptfe-integration-sheets -- --apply --confirmation="CREATE EMPTY PTFE INTEGRATION SHEETS"

$env:PTFE_INTEGRATION_MASTER_LOG_SHEET_ID = '<dedicated-master-test-sheet-id>'
$env:PTFE_INTEGRATION_JOB_LOG_SHEET_ID = '<dedicated-job-test-sheet-id>'
npm run validate:ptfe-uat-sheets
npm run validate:ptfe-integration-delivery -- --confirmation="WRITE AND DELETE PTFE INTEGRATION ROWS"
npm run validate:ptfe-outbox-integration -- --confirmation="VALIDATE PTFE DATABASE OUTBOX"
npm run cleanup:ptfe-uat-sheets -- --confirmation="CLEAR PTFE UAT TEST SHEETS"
```

## Windows UAT And Rollback

`scripts/windows/Manage-PtfeUatEnvironment.ps1` manages the complete isolated PTFE rehearsal on the target server. It uses a separate checkout, port `3103`, database `metrics_portal_ptfe_uat`, cookie name, state directory, web process, worker process, and both dedicated test destinations. It requires the live Metrics Portal on port `3002` and verifies its process remains unchanged. The stopped legacy port `3000` is optional.

The Start action:

1. Refuses either production sheet ID and requires two distinct, empty, contract-ready test sheets.
2. Creates and migrates the isolated database with separate migration/runtime credentials.
3. Grants runtime access, records recoverable initialization state, and proves both database/outbox destinations with automatic synthetic cleanup.
4. Enables only the PTFE database/session chain, starts the isolated web and worker processes, and waits for readiness.
5. Leaves production PL/PTFE/PI processes, flags, databases, and Smartsheets unchanged.

The database/outbox proof retains the original production destination IDs in dedicated safety variables before replacing the runtime PTFE destinations with the two test sheets. This lets the proof continue refusing either production sheet while delivering only to the isolated sheets. If initialization fails after the state file is written, do not delete the worktree or database manually; run the guarded Stop action from that same checkout first.

Rollback stops the isolated full-mode processes and relaunches port `3103` with database/session/workspace flags disabled so new `test-ptfe` logins use the compatibility page. Stop clears both test sheets, drops only the isolated database, removes the UAT state, and rechecks the live portal process.

```powershell
$uatRepo = 'C:\serverdata\staging\metrics-portal-ptfe-uat'

& "$uatRepo\scripts\windows\Manage-PtfeUatEnvironment.ps1" `
    -Action Start `
    -MasterIntegrationSheetId '5442683404242820' `
    -JobIntegrationSheetId '8326444705861508' `
    -Confirmation 'MANAGE ISOLATED PTFE UAT'

& "$uatRepo\scripts\windows\Manage-PtfeUatEnvironment.ps1" `
    -Action Rollback `
    -MasterIntegrationSheetId '5442683404242820' `
    -JobIntegrationSheetId '8326444705861508' `
    -Confirmation 'MANAGE ISOLATED PTFE UAT'

& "$uatRepo\scripts\windows\Manage-PtfeUatEnvironment.ps1" `
    -Action Stop `
    -MasterIntegrationSheetId '5442683404242820' `
    -JobIntegrationSheetId '8326444705861508' `
    -Confirmation 'MANAGE ISOLATED PTFE UAT'
```

## Verified Compatibility Baseline

### Current entry modes

- Job entry records date, associate, six-digit item, lot, sequence, quantities, time, sequence-specific details, calculations, paretos, and comments.
- Event entry records date, associate, event, calculated duration from start/end time, and comments.
- Successful jobs and events are also appended to the browser-local Job x Job shift tracker.
- End Shift submits accumulated Job x Job rows to the PTFE Job Log and signs out only after success.

### Current master-log destination titles

The compatibility server writes these exact PTFE master-log titles:

```text
Entry Type
Associate Name
Date
Time Worked
Item
Lot #
Start Quantity
End Quantity
Sequence
Footage
Processing Length
Scrap Parts
Scrap Rate %
Re-Cuts
Inspection Pareto
Pulling Pareto
Pulling Wraps
Pulling Method
Event
Comments
```

### Current Job x Job destination titles

```text
Row ID
Work Date
Associate Name
Cell
Job Slot
Row Type
Event
Item Number
Lot Number
Std PPH
Actual PPH
OE Pct
Time Min
Start Qty
End Qty
Loss Reason
Countermeasures
```

The current tracker groups rows under Pull, Cut to Length, Inspection, Roll Cut, Packaging, and Events. Sequence-to-cell mapping and Job/HR slot prefixes must remain unchanged unless PTFE approves a business-rule change.

The physical Job x Job sheet titles are `OE Pct` and `Time Min`. The legacy compatibility endpoint accepts `OE %` and `Time (Min)` aliases, but durable background delivery uses the exact physical titles above. `Submitted At` is system-managed and is intentionally not included in the writable contract.

## Calculations And Validation To Preserve

- Item number is exactly six digits.
- Pull converts spool footage to inches, converts part length from inches/centimeters/millimeters, calculates parts per spool, and may auto-fill Start Quantity.
- Scrap Parts is `max(0, Start Quantity - End Quantity)`.
- Yield is `End Quantity / Start Quantity * 100` when Start Quantity is positive.
- Scrap Rate is the nonnegative quantity loss divided by Start Quantity.
- Actual PPH is `End Quantity / Time Hours`.
- Base standard is selected by exact Item and Sequence.
- Adjusted standard uses the configured associate rate.
- Target Quantity is elapsed hours times adjusted standard.
- Sequence OE is Actual PPH divided by adjusted standard.
- Pull requires Pulling Wraps and at least one Pulling Method.
- Inspection/EV3 Inspection below 75% yield requires an Inspection Pareto.
- Pull at or below 85% yield requires a Pulling Pareto.
- First Cut, Overall Length, and Roll Cut (Both Ends) expose Re-Cuts.
- Time above 12 hours and zero output with positive start quantity produce visible warnings.
- Repeated low-OE Job x Job entries for the same item produce the existing quality warning.

## Durable Design

### Feature gates

Add an independent PTFE database flag and preserve the existing dependency order:

```text
DATABASE_ENABLED=true
SERVER_SESSIONS_ENABLED=true
PTFE_SERVER_SESSIONS_ENABLED=true
SERVER_WORKSPACES_ENABLED=true
DURABLE_SUBMISSIONS_ENABLED=true
PTFE_DATABASE_SUBMISSIONS_ENABLED=true
```

PL flags remain independent and enabled in production. PI flags remain disabled.

### Isolated page and model

- Serve PTFE from `/ptfe/` only after login creates a PTFE server session and the PTFE database flag is enabled.
- Move PTFE calculation, validation, payload, shift-tracker, dirty-state, and reset behavior into a testable PTFE model plus a page-specific browser controller.
- Use the shared theme, API client, dialogs, session, workspace, and submission-status patterns already proven by PL.
- Do not delete the compatibility PTFE code until the observation and rollback window closes.

### Server workspace

The PTFE workspace owns:

- Current job/event form and mode.
- Work date and optimistic version.
- Job x Job rows grouped by cell.
- Active Job x Job tab.
- Loss reasons and optional shift countermeasures.
- Permanent submission IDs and pending payloads for both master-log and Job x Job rows.

A refresh or second tab must load or conflict against this server state. End Shift is blocked while an entry is unsaved or while any Job x Job row has not been durably accepted.

### Two-destination submission contract

Each destination row remains one logical durable submission:

1. A job or event is captured immediately for `smartsheet:PTFE:master_log`.
2. The accepted job/event is appended to the server-owned Job x Job shift tracker.
3. At End Shift, each Job x Job row receives its own permanent ID and is captured for `smartsheet:PTFE:job_log`.
4. The browser may send several one-row capture requests, but it clears the shift only after every row is acknowledged by PostgreSQL.
5. Smartsheet synchronization is asynchronous. End Shift depends on durable database acceptance, not immediate Smartsheet delivery.

The existing one-submission/one-destination API contract remains intact; a batch payload is not introduced merely for convenience.

## Destination Prerequisites

Before PTFE database routing can be enabled:

- Add a writable text/number `Submission ID` column to the PTFE master log.
- Add a writable text/number `Submission ID` column to the PTFE Job Log.
- Validate all exact writable titles, duplicate titles, formula restrictions, and column types on both destinations.
- Preserve the completed exact-ID lookup, uncertain-delivery replay, mapped-value, and synthetic-cleanup evidence against the dedicated non-production PTFE destinations.
- Do not use the production destinations for ordinary automated or browser tests.

## Required Automated Coverage

- Calculation and unit-conversion parity.
- Exact master-log and Job x Job payload titles.
- All sequence-specific requirements and Pareto thresholds.
- Sequence-to-cell and slot-prefix mapping.
- Job/event append to server shift state.
- End Shift row generation and per-row permanent identities.
- Refresh persistence, stale-tab rejection, retry identity, dirty state, and sign-out/End Shift blocking.
- Partial End Shift capture retry without duplicating already accepted rows.
- Department routing and feature dependency behavior.
- Both destination-contract validators and delivery adapters.

## UAT And Cutover Gates

1. Name a PTFE associate representative and supervisor/lead.
2. Run the compatibility parity script across every active PTFE sequence plus an event and End Shift.
3. Run the port `3103` isolated-browser refresh, duplicate-tab, retry, sign-out, partial End Shift, and worker-restart scenarios.
4. Confirm both test destinations contain the expected rows and permanent IDs, then clean all synthetic rows.
5. Rehearse flag rollback to the compatibility PTFE page without deleting captured database rows.
6. Add `Submission ID` to both production destinations during an approved window and revalidate.
7. Take and verify a fresh off-server database backup.
8. Deploy with PTFE flags disabled, then enable only in the supervised cutover window.
9. Verify one normal job, one Pull or low-yield rule, one event, and one End Shift in PostgreSQL, both outbox destinations, and both production Smartsheets.
10. Observe the same reliability measures used for PL before beginning PI cutover.

## Stop Conditions

Do not enable PTFE production database routing if either destination contract is not READY, any Critical/High defect is open, exact-ID replay is unproven, End Shift can clear uncaptured rows, the backup/worker is unhealthy, or named PTFE UAT approval is missing.

