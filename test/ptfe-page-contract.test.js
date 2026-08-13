const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'ptfe', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'ptfe', 'app.js'), 'utf8');
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

test('PTFE operator quantity fields replace their default zero on focus or click', () => {
    ['timeWorked', 'startQuantity', 'endQuantity'].forEach((id) => {
        assert.match(html, new RegExp(`id="${id}"[^>]*data-replace-zero`));
    });
    assert.match(app, /function clearZeroForEntry\(input\)/);
    assert.match(app, /if \(input\.value === '0'\) input\.value = ''/);
    assert.match(app, /input\.addEventListener\('pointerdown', \(\) => clearZeroForEntry\(input\)\)/);
    assert.match(app, /input\.addEventListener\('focus', \(\) => clearZeroForEntry\(input\)\)/);
    assert.match(app, /input\.addEventListener\('blur', \(\) => restoreEmptyZero\(input\)\)/);
});
