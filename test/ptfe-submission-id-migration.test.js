const assert = require('node:assert/strict');
const test = require('node:test');
const { PTFE_JOB_LOG_COLUMNS, PTFE_MASTER_LOG_COLUMNS } = require('../lib/ptfe-destination-contract');
const { planPtfeSubmissionIdExpansion } = require('../lib/ptfe-submission-id-migration');

function columns(titles) {
    return titles.map((title) => ({ title, type: 'TEXT_NUMBER' }));
}

test('PTFE expansion is ready when Submission ID already satisfies each contract', () => {
    assert.equal(planPtfeSubmissionIdExpansion(columns(PTFE_MASTER_LOG_COLUMNS), PTFE_MASTER_LOG_COLUMNS).action, 'ready');
    assert.equal(planPtfeSubmissionIdExpansion(columns(PTFE_JOB_LOG_COLUMNS), PTFE_JOB_LOG_COLUMNS).action, 'ready');
});

test('PTFE expansion adds only a missing Submission ID column', () => {
    const withoutId = columns(PTFE_MASTER_LOG_COLUMNS.filter((title) => title !== 'Submission ID'));
    assert.equal(planPtfeSubmissionIdExpansion(withoutId, PTFE_MASTER_LOG_COLUMNS).action, 'add');
});

test('PTFE expansion blocks unrelated drift before either production sheet changes', () => {
    const missingOther = columns(PTFE_JOB_LOG_COLUMNS.filter((title) => title !== 'Loss Reason'));
    assert.equal(planPtfeSubmissionIdExpansion(missingOther, PTFE_JOB_LOG_COLUMNS).action, 'blocked');
    const invalidId = columns(PTFE_MASTER_LOG_COLUMNS);
    invalidId.find((column) => column.title === 'Submission ID').type = 'CHECKBOX';
    assert.equal(planPtfeSubmissionIdExpansion(invalidId, PTFE_MASTER_LOG_COLUMNS).action, 'blocked');
});
