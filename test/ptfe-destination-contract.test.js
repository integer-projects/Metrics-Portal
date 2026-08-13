const assert = require('node:assert/strict');
const test = require('node:test');
const {
    PTFE_JOB_LOG_COLUMNS,
    PTFE_MASTER_LOG_COLUMNS,
    auditPtfeDestination,
    auditPtfeDestinations
} = require('../lib/ptfe-destination-contract');

function columns(titles) {
    return titles.map((title) => ({ title, type: 'TEXT_NUMBER' }));
}

test('PTFE contract requires exact Master Log and Job x Job writable titles', () => {
    const audit = auditPtfeDestinations(columns(PTFE_MASTER_LOG_COLUMNS), columns(PTFE_JOB_LOG_COLUMNS));
    assert.equal(audit.ok, true);
    assert.equal(audit.masterLog.expectedCount, 21);
    assert.equal(audit.jobLog.expectedCount, 18);
});

test('PTFE contract reports sheet-specific missing, duplicate, formula, and ID-type drift', () => {
    const master = columns(PTFE_MASTER_LOG_COLUMNS.filter((title) => title !== 'Comments'));
    master.push({ title: 'Item', type: 'TEXT_NUMBER' });
    master.find((column) => column.title === 'Sequence').formula = '=1';
    const jobs = columns(PTFE_JOB_LOG_COLUMNS);
    jobs.find((column) => column.title === 'Submission ID').type = 'DATE';
    const audit = auditPtfeDestinations(master, jobs);
    assert.equal(audit.ok, false);
    assert.deepEqual(audit.masterLog.missing, ['Comments']);
    assert.deepEqual(audit.masterLog.duplicates, ['Item']);
    assert.deepEqual(audit.masterLog.formulaColumns, ['Sequence']);
    assert.equal(audit.jobLog.submissionIdTypeValid, false);
});

test('PTFE destination audit permits unrelated read-only reporting columns', () => {
    const supplied = [...columns(PTFE_MASTER_LOG_COLUMNS), { title: 'Reporting Formula', type: 'TEXT_NUMBER', formula: '=1' }];
    assert.equal(auditPtfeDestination(supplied, PTFE_MASTER_LOG_COLUMNS).ok, true);
});
