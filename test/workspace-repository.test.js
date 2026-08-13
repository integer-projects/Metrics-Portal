const assert = require('node:assert/strict');
const test = require('node:test');
const { createWorkspaceRepository, ptfeSubmissionTransition } = require('../repositories/workspace-repository');
const PtfeModel = require('../public/ptfe/ptfe-model');

function submission(overrides = {}) {
    return {
        id: '11111111-1111-4111-8111-111111111111', department: 'PTFE', entryType: 'job',
        workDate: '2026-08-13', lifecycleStatus: 'committed', syncStatus: 'pending', ...overrides
    };
}

function pendingJobFormData() {
    const form = {
        ...PtfeModel.emptyForm(), item: '311318', lot: 'UAT-1', sequence: 'Pull', timeWorked: 60,
        startQuantity: 100, endQuantity: 90, pullingWraps: '3', pullingMethods: ['Manual'],
        submittedAt: '08:00 AM', jxjSnapshot: {
            adjustedStandard: 100, pph: 90, sequenceOe: 90, timeMins: 60,
            startQuantity: 100, endQuantity: 90
        }
    };
    return { form, shift: PtfeModel.emptyShift('2026-08-13'), countermeasures: '', lastSubmission: null };
}

test('PTFE master capture appends exactly one server-owned shift row and clears the form', () => {
    const first = ptfeSubmissionTransition(pendingJobFormData(), submission());
    assert.equal(first.shift.tabs.Pull.length, 1);
    assert.equal(first.shift.tabs.Pull[0].sourceSubmissionId, submission().id);
    assert.equal(first.shift.tabs.Pull[0].item, '311318');
    assert.equal(first.form.item, '');
    assert.equal(first.lastSubmission.id, submission().id);

    const replay = ptfeSubmissionTransition(first, submission());
    assert.equal(replay.shift.tabs.Pull.length, 1);
});

test('PTFE Job x Job capture marks only its permanent row as captured', () => {
    const data = ptfeSubmissionTransition(pendingJobFormData(), submission());
    data.shift.tabs.Pull[0].submissionId = '22222222-2222-4222-8222-222222222222';
    const transitioned = ptfeSubmissionTransition(data, submission({
        id: data.shift.tabs.Pull[0].submissionId, entryType: 'jxj'
    }));
    assert.equal(transitioned.shift.tabs.Pull[0].captureStatus, 'captured');
});

test('PTFE repository transition preserves and versions the shift workspace', async () => {
    const statements = [];
    let row = {
        id: 'workspace-1', user_id: 'user-1', department: 'PTFE', work_date: '2026-08-13',
        mode: 'job', form_data: pendingJobFormData(), has_unsaved_work: true, version: 4, status: 'open'
    };
    const client = {
        async query(sql, params = []) {
            statements.push(sql);
            if (/SELECT \* FROM workspaces/.test(sql)) return { rowCount: 1, rows: [row] };
            if (/UPDATE workspaces/.test(sql)) {
                row = { ...row, form_data: JSON.parse(params[3]), has_unsaved_work: params[4], version: row.version + 1 };
                return { rowCount: 1, rows: [row] };
            }
            return { rowCount: 1, rows: [] };
        }
    };
    const repository = createWorkspaceRepository({ withTransaction: (callback) => callback(client) });
    const workspace = await repository.markSubmitted({
        userId: 'user-1', department: 'PTFE', name: 'Associate', role: 'Associate', kioskId: 'kiosk-1'
    }, submission());

    assert.equal(workspace.formData.shift.tabs.Pull.length, 1);
    assert.equal(workspace.version, 5);
    assert.equal(workspace.hasUnsavedWork, true);
    assert.equal(statements.some((sql) => /FOR UPDATE/.test(sql)), true);
    assert.equal(statements.some((sql) => /workspace\.submission_captured/.test(sql)), true);
});
