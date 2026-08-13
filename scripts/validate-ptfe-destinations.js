require('dotenv').config({ quiet: true });

const { auditPtfeDestinations } = require('../lib/ptfe-destination-contract');
const { getClientForDept, getRequiredEnv } = require('../lib/smartsheet');

async function listColumns(client, sheetId) {
    const response = await client.get(`sheets/${sheetId}/columns?includeAll=true`);
    return response.data.data || response.data.columns || response.data || [];
}

function printAudit(label, audit) {
    console.log(`  ${label}:`);
    console.log(`    Expected writable columns: ${audit.expectedCount}`);
    console.log(`    Destination columns present: ${audit.actualCount}`);
    console.log(`    Submission ID type: ${audit.submissionIdType || 'missing'}`);
    if (audit.missing.length) console.log(`    Missing: ${audit.missing.join(', ')}`);
    if (audit.duplicates.length) console.log(`    Duplicate exact titles: ${audit.duplicates.join(', ')}`);
    if (audit.formulaColumns.length) console.log(`    Writable columns with formulas: ${audit.formulaColumns.join(', ')}`);
    console.log(`    Result: ${audit.ok ? 'READY' : 'NOT READY'}`);
}

async function main() {
    const client = getClientForDept('PTFE');
    const masterId = getRequiredEnv('DEPT_PTFE_MASTER_LOG_SHEET_ID');
    const jobId = getRequiredEnv('DEPT_PTFE_JOB_LOG_SHEET_ID');
    const [masterColumns, jobColumns] = await Promise.all([
        listColumns(client, masterId),
        listColumns(client, jobId)
    ]);
    const audit = auditPtfeDestinations(masterColumns, jobColumns);
    console.log('PTFE two-destination contract (read-only)');
    printAudit('Master Log', audit.masterLog);
    printAudit('Job x Job Log', audit.jobLog);
    console.log(`  Overall result: ${audit.ok ? 'READY' : 'NOT READY'}`);
    if (!audit.ok) process.exitCode = 1;
}

main().catch((error) => {
    console.error(`PTFE destination audit failed: ${error.response?.data?.message || error.message}`);
    process.exitCode = 1;
});
