const { SUBMISSION_ID_COLUMN, auditPtfeDestination } = require('./ptfe-destination-contract');

function planPtfeSubmissionIdExpansion(columns, expectedTitles) {
    const audit = auditPtfeDestination(columns, expectedTitles);
    const submissionColumns = columns.filter((column) => column.title === SUBMISSION_ID_COLUMN);
    const otherMissing = audit.missing.filter((title) => title !== SUBMISSION_ID_COLUMN);
    const blockers = [];

    if (submissionColumns.length > 1) blockers.push(`${SUBMISSION_ID_COLUMN} exists more than once.`);
    if (otherMissing.length > 0) blockers.push(`Other required columns are missing: ${otherMissing.join(', ')}.`);
    if (audit.duplicates.length > 0) blockers.push(`Duplicate writable columns exist: ${audit.duplicates.join(', ')}.`);
    if (audit.formulaColumns.length > 0) blockers.push(`Writable formula columns exist: ${audit.formulaColumns.join(', ')}.`);
    if (submissionColumns.length === 1 && !audit.submissionIdTypeValid) {
        blockers.push(`${SUBMISSION_ID_COLUMN} has unsupported type ${audit.submissionIdType || 'unknown'}.`);
    }

    if (blockers.length > 0) return { action: 'blocked', audit, blockers };
    if (submissionColumns.length === 1) return { action: 'ready', audit, blockers: [] };
    return { action: 'add', audit, blockers: [] };
}

module.exports = { planPtfeSubmissionIdExpansion };
