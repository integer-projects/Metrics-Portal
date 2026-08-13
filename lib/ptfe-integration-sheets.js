const {
    PTFE_JOB_LOG_COLUMNS,
    PTFE_MASTER_LOG_COLUMNS,
    auditPtfeDestinations
} = require('./ptfe-destination-contract');

const DEFAULT_MASTER_NAME = 'Metrics Portal - PTFE Master Log Integration Test';
const DEFAULT_JOB_NAME = 'Metrics Portal - PTFE Job Log Integration Test';

function buildColumns(titles) {
    return titles.map((title, index) => ({
        title,
        type: title === 'Date' || title === 'Work Date' ? 'DATE' : 'TEXT_NUMBER',
        primary: index === 0,
        width: title === 'Submission ID' ? 220 : 150
    }));
}

function buildPtfeIntegrationSheets(names = {}) {
    const masterLog = {
        name: names.masterLog || DEFAULT_MASTER_NAME,
        columns: buildColumns(PTFE_MASTER_LOG_COLUMNS)
    };
    const jobLog = {
        name: names.jobLog || DEFAULT_JOB_NAME,
        columns: buildColumns(PTFE_JOB_LOG_COLUMNS)
    };
    const audit = auditPtfeDestinations(masterLog.columns, jobLog.columns);
    if (!audit.ok) throw new Error('Generated PTFE integration contracts are invalid.');
    return { masterLog, jobLog };
}

module.exports = {
    DEFAULT_JOB_NAME,
    DEFAULT_MASTER_NAME,
    buildPtfeIntegrationSheets
};
