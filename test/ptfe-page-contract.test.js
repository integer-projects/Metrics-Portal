const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'ptfe', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'ptfe', 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'ptfe', 'styles.css'), 'utf8');
const repository = fs.readFileSync(path.join(__dirname, '..', 'repositories', 'workspace-repository.js'), 'utf8');

test('isolated PTFE page requires its complete feature and session boundary', () => {
    assert.match(html, /<title>PTFE Production Portal<\/title>/);
    assert.match(app, /features\.ptfeDatabaseSubmissions/);
    assert.match(app, /features\.serverWorkspaces/);
    assert.match(app, /session\.department !== 'PTFE'/);
    assert.match(app, /api\.getPtfeConfig\(\)/);
});

test('PTFE browser persists conflict-safe server workspaces and permanent retry IDs', () => {
    assert.match(html, /This workspace changed in another tab/);
    assert.match(app, /error\.status === 409/);
    assert.match(app, /form\.pendingSubmission\?\.entryType/);
    assert.match(app, /record\.row\.submissionId = record\.row\.submissionId \|\| createId\(\)/);
    assert.match(app, /Already captured rows will not be duplicated when you retry/);
});

test('PTFE End Shift captures each row separately and clears only after all captures', () => {
    assert.match(app, /find\(\(candidate\) => candidate\.row\.captureStatus !== 'captured'\)/);
    assert.match(app, /entryType: 'jxj'/);
    assert.match(app, /workspace = normalizeWorkspace\(\(await api\.getWorkspace\(\)\)\.workspace\)/);
    assert.match(repository, /row\.captureStatus = 'captured'/);
    assert.match(app, /workspace\.formData = \{ form: model\.emptyForm\(\), shift: model\.emptyShift/);
    assert.doesNotMatch(app, /submit-ptfe-jxj/);
});

test('PTFE durable capture does not let the generic hook erase shift state', () => {
    assert.match(repository, /if \(session\.department === 'PTFE'\)/);
    assert.match(repository, /SELECT \* FROM workspaces/);
    assert.match(repository, /workspace\.submission_captured/);
});

test('PTFE page exposes compatibility themes, centered alerts, shift status, and event times', () => {
    ['precision', 'light', 'dark', 'high-contrast'].forEach((theme) => assert.match(html, new RegExp(`value="${theme}"`)));
    assert.match(html, /role="alertdialog"/);
    assert.match(html, /id="eventStart" type="time"/);
    assert.match(html, /id="eventEnd" type="time"/);
    assert.match(html, /id="shiftTable"/);
    assert.match(app, /Database saved · Smartsheet synced/);
});

test('PTFE operator quantity fields match the proven PL zero replacement and hidden-arrow behavior', () => {
    ['timeWorked', 'startQuantity', 'endQuantity'].forEach((id) => {
        assert.match(html, new RegExp(`id="${id}"[^>]*class="operator-number"[^>]*data-replace-zero`));
    });
    assert.match(app, /function selectZeroValue\(input\)/);
    assert.match(app, /input\.addEventListener\('focus', \(\) => selectZeroValue\(input\)\)/);
    assert.match(app, /input\.addEventListener\('mouseup'/);
    assert.match(styles, /input\[type="number"\]::\-webkit-outer-spin-button,input\[type="number"\]::\-webkit-inner-spin-button/);
    assert.match(styles, /input\[type="number"\] \{ appearance:textfield; -moz-appearance:textfield; \}/);
});

test('PTFE multiplier replaces its current value and mouse wheel cannot change focused numbers', () => {
    assert.match(html, /id="startMultiplier"[^>]*data-select-on-entry/);
    assert.match(app, /function selectCurrentValue\(input\)/);
    assert.match(app, /input\.addEventListener\('focus', \(\) => selectCurrentValue\(input\)\)/);
    assert.match(app, /document\.querySelectorAll\('input\[type="number"\]'\)/);
    assert.match(app, /input\.addEventListener\('wheel'/);
    assert.match(app, /event\.preventDefault\(\);\s+input\.blur\(\)/);
    assert.match(app, /\{ passive: false \}/);
});

test('PTFE submission status updates automatically while Smartsheet delivery is pending', () => {
    assert.match(app, /let submissionPollTimer = null/);
    assert.match(app, /function submissionNeedsPolling\(submission\)/);
    assert.match(app, /!\['submitted', 'needs_review'\]\.includes\(submission\.syncStatus\)/);
    assert.match(app, /setTimeout\(\(\) => refreshSubmission\(\{ silent: true \}\), 2000\)/);
    assert.match(app, /renderSubmission\(workspace\.formData\.lastSubmission\);\s+scheduleSubmissionRefresh\(\)/);
    assert.match(app, /document\.addEventListener\('visibilitychange'/);
    assert.match(app, /if \(!silent\) showAlert\('Status refresh failed'/);
});
