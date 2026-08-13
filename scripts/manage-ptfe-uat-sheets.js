require('dotenv').config({ quiet: true });

const { auditPtfeDestinations } = require('../lib/ptfe-destination-contract');
const { getClientForDept, getRequiredEnv } = require('../lib/smartsheet');

const CLEAR_CONFIRMATION = 'CLEAR PTFE UAT TEST SHEETS';

function getArgument(name) {
    const prefix = `${name}=`;
    const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
    return argument ? argument.slice(prefix.length) : null;
}

function chunk(values, size) {
    const chunks = [];
    for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
    return chunks;
}

async function getSheet(client, sheetId) {
    const response = await client.get(`sheets/${sheetId}?include=columns`);
    return response.data;
}

async function main() {
    const clear = process.argv.includes('--clear');
    if (clear && getArgument('--confirmation') !== CLEAR_CONFIRMATION) {
        throw new Error(`Cleanup requires --confirmation="${CLEAR_CONFIRMATION}".`);
    }
    const masterId = getRequiredEnv('PTFE_INTEGRATION_MASTER_LOG_SHEET_ID');
    const jobId = getRequiredEnv('PTFE_INTEGRATION_JOB_LOG_SHEET_ID');
    const productionIds = new Set([
        getRequiredEnv('DEPT_PTFE_MASTER_LOG_SHEET_ID'),
        getRequiredEnv('DEPT_PTFE_JOB_LOG_SHEET_ID')
    ]);
    if (masterId === jobId) throw new Error('PTFE UAT destinations must be two different sheets.');
    if (productionIds.has(masterId) || productionIds.has(jobId)) {
        throw new Error('PTFE UAT cleanup refuses either production destination.');
    }

    const client = getClientForDept('PTFE');
    const [master, job] = await Promise.all([getSheet(client, masterId), getSheet(client, jobId)]);
    const audit = auditPtfeDestinations(master.columns || [], job.columns || []);
    if (!audit.ok) throw new Error('One or both PTFE UAT destination contracts are not ready.');

    const destinations = [
        { label: 'Master Log', id: masterId, rows: master.rows || [] },
        { label: 'Job x Job Log', id: jobId, rows: job.rows || [] }
    ];
    console.log('PTFE UAT-sheet guard');
    console.log(`  Mode: ${clear ? 'CLEAR' : 'CHECK EMPTY'}`);
    for (const destination of destinations) {
        console.log(`  ${destination.label} rows before: ${destination.rows.length}`);
        if (!clear && destination.rows.length > 0) {
            throw new Error(`${destination.label} is not empty. Run guarded cleanup before a new rehearsal.`);
        }
        if (clear) {
            for (const ids of chunk(destination.rows.map((row) => row.id), 100)) {
                await client.delete(`sheets/${destination.id}/rows`, {
                    params: { ids: ids.join(','), ignoreRowsNotFound: true }
                });
            }
        }
        console.log(`  ${destination.label} rows removed: ${clear ? destination.rows.length : 0}`);
    }
    console.log('  Production destinations touched: no');
    console.log('  Result: READY');
}

main().catch((error) => {
    console.error(`PTFE UAT-sheet guard failed: ${error.response?.data?.message || error.message}`);
    process.exitCode = 1;
});
