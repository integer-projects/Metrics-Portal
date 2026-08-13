# Precision Liner Metrics Portal - Associate SOP

**Document version:** 3.0<br>
**Effective date:** August 13, 2026<br>
**Applies to:** Production Precision Liner page at `/pl/`

## Purpose

Use this procedure to record Precision Liner jobs and events. The portal first saves accepted entries to the Metrics Portal database. A background worker then sends them to the Precision Liner Smartsheet. Associates do not need to wait for Smartsheet before starting the next entry.

## 1. Sign In

1. Open the Metrics Portal login page.
2. Select **Precision Liner**.
3. Select your own name, enter your password, and choose **Login**.
4. Confirm that the page heading says **Precision Liner** and that your name appears under it.

Each browser workstation has its own identity. Do not share a signed-in workspace. If the portal says you are already signed in at another workstation, sign out there or contact a supervisor for a stale-lock release.

## 2. Understand the Header Status

The small header status describes the form workspace, not Smartsheet delivery:

- **Saving...** - the current form is being saved to the server.
- **Saved to server** - the current form can survive a refresh and is safe to continue editing.
- **Unsaved changes** or **Save failed** - pause and let the save finish or report the error before leaving the page.
- **Tab conflict** - another tab changed the same workspace. Stop editing and choose **Load server copy**.

After an entry is accepted, a larger banner describes delivery:

- **Database saved - Smartsheet pending** - the entry is safely stored. Continue working normally; the worker will keep synchronizing it. You do not need to repeatedly choose **Refresh status**.
- **Database saved - Smartsheet synced** - the worker confirmed the Smartsheet row.
- A failed or review message - do not re-enter the same work. Record the message and contact a supervisor.

## 3. Enter a Job

1. Choose **Job entry**.
2. Verify the **Work date**.
3. Select the **Sequence**.
4. Enter the lot number.
5. Enter the six-digit item number.
6. Enter **Time worked (minutes)**. Typing into the default zero replaces it.
7. Use **+1 good**, **+5 good**, or enter the correct good-parts quantity directly.
8. Add every defect using its red **+1** control. Correct a count directly if needed.
9. Review Start quantity, End quantity, Total defects, and Quality yield.

The portal displays a centered correction message if required data is missing or invalid. Correct every listed field before trying again.

### Notes and root cause

- Notes are required when quality yield is below 75%.
- At 50% yield or lower, expand **Root-cause details** and complete at least one root-cause field.
- Operator fields use the approved operator roster from the PL configuration sheet.

### Spool Check

When **Spool Check** is selected:

1. Choose the required **Spool Check Seq** button.
2. Choose the required **Check #** button.
3. Enter the failure explanation in **Reason for Fail** when applicable.

The Reason for Fail is stored separately from ordinary Notes.

## 4. Save a Job

1. Recheck the sequence, lot, item, time, quantities, defects, and required quality details.
2. Choose **Save job to database** once.
3. Wait for the form to clear and for the database-saved banner.
4. Begin the next entry. Smartsheet synchronization continues automatically.

If the browser loses the response, use the existing page and retry only when directed by the portal. The permanent submission identity prevents the same request from creating another database or Smartsheet record.

## 5. Enter an Event

1. Choose **Event entry**.
2. Select the event.
3. Enter the total **Duration (minutes)**.
4. Choose **Save event to database** once.
5. Wait for the database-saved banner, then continue working.

The production event page uses duration only; it does not require start and stop times.

## 6. Refresh and Multiple Tabs

- A normal refresh reloads your server-owned workspace.
- Do not use two tabs to edit the same workspace.
- If **This workspace changed in another tab** appears, choose **Load server copy** before entering more data. The stale tab must not overwrite the newer server copy.

## 7. Sign Out

1. Confirm the header says **Saved to server** and no unfinished job or event remains.
2. Choose **Sign out**.
3. If the portal warns that unsent work exists, choose Cancel and save or clear the work.
4. Discard only when the work should intentionally be abandoned; the portal requires a reason and records the action.

A database-saved entry remains safe even if Smartsheet still says pending.

## 8. What to Report

Contact a supervisor when:

- a database save fails;
- a submission becomes failed or needs review;
- a pending banner remains for more than five minutes;
- you cannot sign in because of a stale workstation lock;
- the configuration lists are missing or incorrect; or
- a calculated value or Smartsheet row is wrong.

Provide your name, workstation, work date, approximate time, job or event type, and the exact banner or error wording. Include a screenshot when possible. Never send your password.

## Quick Rules

- Use only your own signed-in workspace.
- **Saved to server** protects the form; **Database saved** confirms the production entry.
- **Smartsheet pending** does not stop work and does not require repeated refreshes.
- Do not re-enter a database-saved submission to force Smartsheet synchronization.
- Resolve tab conflicts by loading the server copy.
- Sign out only after unfinished work is saved or intentionally discarded.
