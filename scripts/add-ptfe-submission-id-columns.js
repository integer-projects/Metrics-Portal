require('dotenv').config({ quiet: true });

const {
    PTFE_JOB_LOG_COLUMNS,
    PTFE_MASTER_LOG_COLUMNS,
    SUBMISSION_ID_COLUMN
} = require('../lib/ptfe-destination-contract');
const { planPtfeSubmissionIdExpansion } = require('../lib/ptfe-submission-id-migration');
const { getClientForDept, getRequiredEnv } = require('../lib/smartsheet');

const CONFIRMATION = 'ADD PTFE PRODUCTION SUBMISSION IDS';

function getArgument(name) {
    const prefix = `${name}=`;
    const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
    return argument ? argument.slice(prefix.length) : null;
}

async function listColumns(client, sheetId) {
    const response = await client.get(`sheets/${sheetId}/columns?includeAll=true`);
    return response.data.data || response.data.columns || response.data || [];
}

async function main() {
    const apply = process.argv.includes('--apply');
    if (apply && getArgument('--confirmation') !== CONFIRMATION) {
        throw new Error(`Production expansion requires --confirmation="${CONFIRMATION}".`);
    }

    const client = getClientForDept('PTFE');
    const destinations = [
        { label: 'Master Log', sheetId: getRequiredEnv('DEPT_PTFE_MASTER_LOG_SHEET_ID'), expected: PTFE_MASTER_LOG_COLUMNS },
        { label: 'Job x Job Log', sheetId: getRequiredEnv('DEPT_PTFE_JOB_LOG_SHEET_ID'), expected: PTFE_JOB_LOG_COLUMNS }
    ];
    for (const destination of destinations) {
        destination.columns = await listColumns(client, destination.sheetId);
        destination.plan = planPtfeSubmissionIdExpansion(destination.columns, destination.expected);
    }

    console.log('PTFE production Submission ID expansion');
    console.log(`  Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
    destinations.forEach((destination) => {
        console.log(`  ${destination.label}: ${destination.plan.action.toUpperCase()} (${destination.columns.length} columns)`);
        console.log('    Existing rows changed: 0');
    });

    const blocked = destinations.filter((destination) => destination.plan.action === 'blocked');
    if (blocked.length) {
        throw new Error(blocked.map((destination) => `${destination.label}: ${destination.plan.blockers.join(' ')}`).join(' '));
    }
    const additions = destinations.filter((destination) => destination.plan.action === 'add');
    if (!additions.length) {
        console.log('  Result: READY; no change required.');
        return;
    }
    if (!apply) {
        console.log(`  Result: READY TO APPLY to ${additions.map((destination) => destination.label).join(' and ')}; no Smartsheet change made.`);
        return;
    }

    for (const destination of additions) {
        await client.post(`sheets/${destination.sheetId}/columns`, [{
            title: SUBMISSION_ID_COLUMN,
            type: 'TEXT_NUMBER',
            index: destination.columns.length
        }]);
    }
    for (const destination of destinations) {
        const verifiedColumns = await listColumns(client, destination.sheetId);
        const verified = planPtfeSubmissionIdExpansion(verifiedColumns, destination.expected);
        if (verified.action !== 'ready') {
            throw new Error(`${destination.label} post-change verification failed: ${verified.blockers.join(' ') || verified.action}.`);
        }
        console.log(`  ${destination.label} verified columns: ${verifiedColumns.length}`);
    }
    console.log('  Existing rows changed: 0');
    console.log('  Result: READY');
}

main().catch((error) => {
    console.error(`PTFE production expansion failed: ${error.response?.data?.message || error.message}`);
    process.exitCode = 1;
});
