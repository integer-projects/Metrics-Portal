require('dotenv').config({ quiet: true });

const crypto = require('crypto');
const { getClientForDept, getRequiredEnv } = require('../lib/smartsheet');
const { createSmartsheetDeliveryAdapter } = require('../services/smartsheet/delivery-adapter');

const CONFIRMATION = 'WRITE AND DELETE PTFE INTEGRATION ROWS';

function getArgument(name) {
    const prefix = `${name}=`;
    const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
    return argument ? argument.slice(prefix.length) : null;
}

function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForExactSearch(client, sheetId, submissionId, expectedRowId, attempts = 120) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const response = await client.get(`search/sheets/${sheetId}`, {
            params: { query: `"${submissionId}"`, scopes: 'cellData' }
        });
        const found = (response.data.results || []).some((result) =>
            result.objectType === 'row' && String(result.objectId) === String(expectedRowId)
        );
        if (found) return attempt;
        if (attempt < attempts) await sleep(5000);
    }
    throw new Error('Test row did not become searchable within 10 minutes.');
}

async function verifyDestination({ adapter, client, destination, sheetId, payload }) {
    const submissionId = crypto.randomUUID();
    const claim = { destination, submission_id: submissionId, payload };
    const createdRowIds = [];
    try {
        const first = await adapter.deliver(claim);
        if (first.alreadyExists || !first.remoteRowId) throw new Error(`${destination} did not create one identifiable row.`);
        createdRowIds.push(first.remoteRowId);
        const searchAttempts = await waitForExactSearch(client, sheetId, submissionId, first.remoteRowId);
        const replay = await adapter.deliver(claim);
        if (!replay.alreadyExists || replay.remoteRowId !== first.remoteRowId) {
            if (replay.remoteRowId && replay.remoteRowId !== first.remoteRowId) createdRowIds.push(replay.remoteRowId);
            throw new Error(`${destination} replay did not resolve to the original row.`);
        }
        const columnsResponse = await client.get(`sheets/${sheetId}/columns?includeAll=true`);
        const columns = columnsResponse.data.data || columnsResponse.data.columns || columnsResponse.data || [];
        const rowResponse = await client.get(`sheets/${sheetId}/rows/${first.remoteRowId}`);
        const titleById = new Map(columns.map((column) => [String(column.id), column.title]));
        const values = new Map((rowResponse.data.cells || []).map((cell) => [titleById.get(String(cell.columnId)), cell.value]));
        for (const [title, expected] of Object.entries({ 'Submission ID': submissionId, ...payload })) {
            if (expected !== '' && String(values.get(title) ?? '') !== String(expected)) {
                throw new Error(`${destination} mapped value mismatch for ${title}.`);
            }
        }
        return { searchAttempts, mappedFields: Object.keys(payload).filter((title) => payload[title] !== '').length + 1 };
    } finally {
        if (createdRowIds.length) {
            await client.delete(`sheets/${sheetId}/rows`, {
                params: { ids: [...new Set(createdRowIds)].join(','), ignoreRowsNotFound: true }
            });
        }
    }
}

async function main() {
    if (getArgument('--confirmation') !== CONFIRMATION) {
        throw new Error(`Validation requires --confirmation="${CONFIRMATION}".`);
    }
    const masterId = getRequiredEnv('PTFE_INTEGRATION_MASTER_LOG_SHEET_ID');
    const jobId = getRequiredEnv('PTFE_INTEGRATION_JOB_LOG_SHEET_ID');
    const productionMasterId = getRequiredEnv('DEPT_PTFE_MASTER_LOG_SHEET_ID');
    const productionJobId = getRequiredEnv('DEPT_PTFE_JOB_LOG_SHEET_ID');
    if (masterId === jobId || [productionMasterId, productionJobId].includes(masterId) || [productionMasterId, productionJobId].includes(jobId)) {
        throw new Error('Integration validation requires two dedicated non-production PTFE destinations.');
    }

    const client = getClientForDept('PTFE');
    const adapter = createSmartsheetDeliveryAdapter({
        getClientForDept: () => client,
        getRequiredEnv: (name) => ({
            DEPT_PTFE_MASTER_LOG_SHEET_ID: masterId,
            DEPT_PTFE_JOB_LOG_SHEET_ID: jobId
        }[name] || getRequiredEnv(name))
    });
    const today = new Date().toISOString().slice(0, 10);
    const checks = [
        {
            label: 'Master Log', destination: 'smartsheet:PTFE:master_log', sheetId: masterId,
            payload: {
                'Entry Type': 'Job', 'Associate Name': 'METRICS PORTAL INTEGRATION TEST', Date: today,
                'Time Worked': 1, Item: '000000', 'Lot #': 'INTEGRATION', 'Start Quantity': 1,
                'End Quantity': 1, Sequence: 'INTEGRATION TEST', 'Scrap Parts': 0,
                'Scrap Rate %': 0, Comments: 'Automated non-production delivery validation'
            }
        },
        {
            label: 'Job x Job Log', destination: 'smartsheet:PTFE:job_log', sheetId: jobId,
            payload: {
                'Row ID': `INTEGRATION-${crypto.randomUUID()}`, 'Work Date': today,
                'Associate Name': 'METRICS PORTAL INTEGRATION TEST', Cell: 'Pull', 'Job Slot': 'Job 1',
                'Row Type': 'Job', 'Item Number': '000000', 'Lot Number': 'INTEGRATION',
                'Std PPH': 1, 'Actual PPH': 1, 'OE Pct': 100, 'Time Min': 1,
                'Start Qty': 1, 'End Qty': 1, 'Loss Reason': '', Countermeasures: 'Automated validation'
            }
        }
    ];

    console.log('PTFE controlled integration delivery');
    for (const check of checks) {
        const result = await verifyDestination({ adapter, client, ...check });
        console.log(`  ${check.label}: READY`);
        console.log(`    Exact-ID search attempts: ${result.searchAttempts}`);
        console.log('    Replay inserted another row: no');
        console.log(`    Mapped fields verified: ${result.mappedFields}`);
        console.log('    Test rows removed: 1');
    }
    console.log('  Production destinations touched: no');
    console.log('  Result: READY');
}

main().catch((error) => {
    console.error(`PTFE integration delivery failed: ${error.response?.data?.message || error.message}`);
    process.exitCode = 1;
});
