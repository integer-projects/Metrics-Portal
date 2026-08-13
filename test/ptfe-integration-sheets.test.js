const assert = require('node:assert/strict');
const test = require('node:test');
const { PTFE_JOB_LOG_COLUMNS, PTFE_MASTER_LOG_COLUMNS, auditPtfeDestinations } = require('../lib/ptfe-destination-contract');
const {
    DEFAULT_JOB_NAME,
    DEFAULT_MASTER_NAME,
    buildPtfeIntegrationSheets
} = require('../lib/ptfe-integration-sheets');

test('PTFE integration sheets are empty, independent, and contract-compatible', () => {
    const sheets = buildPtfeIntegrationSheets();
    assert.equal(sheets.masterLog.name, DEFAULT_MASTER_NAME);
    assert.equal(sheets.jobLog.name, DEFAULT_JOB_NAME);
    assert.deepEqual(sheets.masterLog.columns.map((column) => column.title), PTFE_MASTER_LOG_COLUMNS);
    assert.deepEqual(sheets.jobLog.columns.map((column) => column.title), PTFE_JOB_LOG_COLUMNS);
    assert.equal(sheets.masterLog.columns.filter((column) => column.primary).length, 1);
    assert.equal(sheets.jobLog.columns.filter((column) => column.primary).length, 1);
    assert.equal(sheets.masterLog.columns[0].title, 'Submission ID');
    assert.equal(sheets.jobLog.columns[0].title, 'Submission ID');
    assert.equal(auditPtfeDestinations(sheets.masterLog.columns, sheets.jobLog.columns).ok, true);
});

test('PTFE integration sheets accept controlled names', () => {
    const sheets = buildPtfeIntegrationSheets({ masterLog: 'PTFE Master UAT', jobLog: 'PTFE Job UAT' });
    assert.equal(sheets.masterLog.name, 'PTFE Master UAT');
    assert.equal(sheets.jobLog.name, 'PTFE Job UAT');
});
