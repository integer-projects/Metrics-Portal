const SUBMISSION_ID_COLUMN = 'Submission ID';

const PTFE_MASTER_LOG_COLUMNS = [
    SUBMISSION_ID_COLUMN, 'Entry Type', 'Associate Name', 'Date', 'Time Worked',
    'Item', 'Lot #', 'Start Quantity', 'End Quantity', 'Sequence', 'Footage',
    'Processing Length', 'Scrap Parts', 'Scrap Rate %', 'Re-Cuts',
    'Inspection Pareto', 'Pulling Pareto', 'Pulling Wraps', 'Pulling Method',
    'Event', 'Comments'
];

const PTFE_JOB_LOG_COLUMNS = [
    SUBMISSION_ID_COLUMN, 'Row ID', 'Work Date', 'Associate Name', 'Cell',
    'Job Slot', 'Row Type', 'Event', 'Item Number', 'Lot Number', 'Std PPH',
    'Actual PPH', 'OE Pct', 'Time Min', 'Start Qty', 'End Qty', 'Loss Reason',
    'Countermeasures'
];

function auditPtfeDestination(columns = [], expectedTitles = []) {
    const byTitle = columns.reduce((map, column) => {
        if (!map.has(column.title)) map.set(column.title, []);
        map.get(column.title).push(column);
        return map;
    }, new Map());
    const missing = expectedTitles.filter((title) => !byTitle.has(title));
    const duplicates = expectedTitles.filter((title) => (byTitle.get(title) || []).length > 1);
    const formulaColumns = expectedTitles.filter((title) => (byTitle.get(title) || []).some((column) => Boolean(column.formula)));
    const submissionIdColumns = byTitle.get(SUBMISSION_ID_COLUMN) || [];
    const submissionIdType = submissionIdColumns[0]?.type || null;
    const submissionIdTypeValid = ['TEXT_NUMBER', 'PICKLIST'].includes(submissionIdType);
    return {
        ok: missing.length === 0 && duplicates.length === 0 && formulaColumns.length === 0 && submissionIdTypeValid,
        expectedCount: expectedTitles.length,
        actualCount: columns.length,
        missing,
        duplicates,
        formulaColumns,
        submissionIdType,
        submissionIdTypeValid
    };
}

function auditPtfeDestinations(masterColumns = [], jobColumns = []) {
    const masterLog = auditPtfeDestination(masterColumns, PTFE_MASTER_LOG_COLUMNS);
    const jobLog = auditPtfeDestination(jobColumns, PTFE_JOB_LOG_COLUMNS);
    return { ok: masterLog.ok && jobLog.ok, masterLog, jobLog };
}

module.exports = {
    PTFE_JOB_LOG_COLUMNS,
    PTFE_MASTER_LOG_COLUMNS,
    SUBMISSION_ID_COLUMN,
    auditPtfeDestination,
    auditPtfeDestinations
};
