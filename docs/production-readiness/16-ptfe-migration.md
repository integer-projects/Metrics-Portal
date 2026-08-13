# PTFE Migration Work Package

## Purpose

PTFE is the second department migration. It must preserve the current production calculations, entry rules, master-log mapping, and End Shift Job x Job behavior while moving authoritative identity, active work, durable capture, and synchronization status to the common server platform proven by PL.

PL production behavior is not changed by this work package. PTFE remains on the compatibility page and direct-Smartsheet endpoints until the PTFE feature chain, destination contracts, isolated UAT, rollback rehearsal, and supervised cutover are separately approved.

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
OE %
Time (Min)
Start Qty
End Qty
Loss Reason
Countermeasures
```

The current tracker groups rows under Pull, Cut to Length, Inspection, Roll Cut, Packaging, and Events. Sequence-to-cell mapping and Job/HR slot prefixes must remain unchanged unless PTFE approves a business-rule change.

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
- Prove exact-ID lookup, uncertain-delivery replay, mapped values, and synthetic cleanup against dedicated non-production PTFE destinations.
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
3. Run isolated-browser refresh, duplicate-tab, retry, sign-out, partial End Shift, and worker-restart scenarios.
4. Confirm both test destinations contain the expected rows and permanent IDs, then clean all synthetic rows.
5. Rehearse flag rollback to the compatibility PTFE page without deleting captured database rows.
6. Add `Submission ID` to both production destinations during an approved window and revalidate.
7. Take and verify a fresh off-server database backup.
8. Deploy with PTFE flags disabled, then enable only in the supervised cutover window.
9. Verify one normal job, one Pull or low-yield rule, one event, and one End Shift in PostgreSQL, both outbox destinations, and both production Smartsheets.
10. Observe the same reliability measures used for PL before beginning PI cutover.

## Stop Conditions

Do not enable PTFE production database routing if either destination contract is not READY, any Critical/High defect is open, exact-ID replay is unproven, End Shift can clear uncaptured rows, the backup/worker is unhealthy, or named PTFE UAT approval is missing.

