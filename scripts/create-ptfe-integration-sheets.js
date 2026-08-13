require('dotenv').config({ quiet: true });

const { auditPtfeDestination, PTFE_JOB_LOG_COLUMNS, PTFE_MASTER_LOG_COLUMNS } = require('../lib/ptfe-destination-contract');
const { buildPtfeIntegrationSheets } = require('../lib/ptfe-integration-sheets');
const { getClientForDept } = require('../lib/smartsheet');

const CONFIRMATION = 'CREATE EMPTY PTFE INTEGRATION SHEETS';

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
        throw new Error(`Creation requires --confirmation="${CONFIRMATION}".`);
    }
    const definitions = buildPtfeIntegrationSheets({
        masterLog: getArgument('--master-name'),
        jobLog: getArgument('--job-name')
    });
    const destinations = [
        { key: 'masterLog', label: 'Master Log', expected: PTFE_MASTER_LOG_COLUMNS },
        { key: 'jobLog', label: 'Job x Job Log', expected: PTFE_JOB_LOG_COLUMNS }
    ];

    console.log('PTFE integration-sheet creation');
    console.log(`  Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
    destinations.forEach((destination) => {
        const definition = definitions[destination.key];
        console.log(`  ${destination.label}: ${definition.name} (${definition.columns.length} empty columns)`);
    });
    console.log('  Production rows copied: 0');
    if (!apply) {
        console.log('  Result: dry run passed; no Smartsheet object created.');
        return;
    }

    const client = getClientForDept('PTFE');
    const created = [];
    try {
        for (const destination of destinations) {
            const response = await client.post('sheets', definitions[destination.key], {
                headers: { 'smartsheet-integration-source': 'SCRIPT,Internal,Metrics-Portal-Readiness' }
            });
            const sheet = response.data.result || response.data;
            if (!sheet.id) throw new Error(`${destination.label} creation did not return a sheet ID.`);
            created.push({ ...destination, ...sheet });
            const columns = await listColumns(client, sheet.id);
            const audit = auditPtfeDestination(columns, destination.expected);
            if (!audit.ok) throw new Error(`${destination.label} failed its post-creation contract audit.`);
        }
    } catch (error) {
        for (const sheet of created) {
            await client.delete(`sheets/${sheet.id}`).catch(() => {});
        }
        throw error;
    }

    created.forEach((sheet) => {
        console.log(`  ${sheet.label} sheet ID: ${sheet.id}`);
        console.log(`  ${sheet.label} permalink: ${sheet.permalink}`);
    });
    console.log('  Result: READY');
}

main().catch((error) => {
    console.error(`PTFE integration-sheet creation failed: ${error.response?.data?.message || error.message}`);
    process.exitCode = 1;
});
