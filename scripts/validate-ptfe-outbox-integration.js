require('dotenv').config({ quiet: true });

const crypto = require('crypto');
const { createDatabase } = require('../db');
const { getClientForDept, getRequiredEnv } = require('../lib/smartsheet');
const { createSubmissionRepository } = require('../repositories/submission-repository');
const { createSmartsheetDeliveryAdapter } = require('../services/smartsheet/delivery-adapter');
const { createOutboxWorker } = require('../services/submissions/outbox-worker');
const { createSubmissionService } = require('../services/submissions/submission-service');

const CONFIRMATION = 'VALIDATE PTFE DATABASE OUTBOX';

function getArgument(name) {
    const prefix = `${name}=`;
    const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
    return argument ? argument.slice(prefix.length) : null;
}

function quietLogger() {
    const write = () => {};
    return { debug: write, info: write, warn: write, error: write, fatal: write };
}

async function main() {
    if (getArgument('--confirmation') !== CONFIRMATION) {
        throw new Error(`Validation requires --confirmation="${CONFIRMATION}".`);
    }
    const databaseUrl = process.env.DATABASE_URL;
    const masterId = getRequiredEnv('PTFE_INTEGRATION_MASTER_LOG_SHEET_ID');
    const jobId = getRequiredEnv('PTFE_INTEGRATION_JOB_LOG_SHEET_ID');
    const productionIds = [
        process.env.PTFE_PRODUCTION_MASTER_LOG_SHEET_ID || getRequiredEnv('DEPT_PTFE_MASTER_LOG_SHEET_ID'),
        process.env.PTFE_PRODUCTION_JOB_LOG_SHEET_ID || getRequiredEnv('DEPT_PTFE_JOB_LOG_SHEET_ID')
    ];
    if (!databaseUrl) throw new Error('DATABASE_URL is required.');
    if (masterId === jobId || productionIds.includes(masterId) || productionIds.includes(jobId)) {
        throw new Error('Outbox validation requires two dedicated non-production PTFE destinations.');
    }

    const logger = quietLogger();
    const database = createDatabase({
        enabled: true, required: true, url: databaseUrl, poolMax: 2,
        connectionTimeoutMs: 5000, statementTimeoutMs: 15000, ssl: false
    }, logger);
    const client = getClientForDept('PTFE');
    const repository = createSubmissionRepository(database);
    const service = createSubmissionService(repository);
    const adapter = createSmartsheetDeliveryAdapter({
        getClientForDept: () => client,
        getRequiredEnv: (name) => ({
            DEPT_PTFE_MASTER_LOG_SHEET_ID: masterId,
            DEPT_PTFE_JOB_LOG_SHEET_ID: jobId
        }[name] || getRequiredEnv(name))
    });
    const worker = createOutboxWorker({
        repository,
        deliveryAdapter: adapter,
        logger,
        workerId: `integration:${crypto.randomUUID()}`,
        leaseMs: 60000,
        maxAttempts: 1,
        baseBackoffMs: 100,
        maximumBackoffMs: 1000,
        random: () => 0.5
    });
    const today = new Date().toISOString().slice(0, 10);
    const submissions = [
        {
            id: crypto.randomUUID(), department: 'PTFE', entryType: 'job',
            associateName: 'METRICS PORTAL INTEGRATION TEST', workDate: today, kioskId: 'INTEGRATION-TEST',
            payload: {
                Date: today, 'Time Worked': 1, Item: '000000', 'Lot #': 'INTEGRATION',
                'Start Quantity': 1, 'End Quantity': 1, Sequence: 'INTEGRATION TEST',
                'Scrap Parts': 0, 'Scrap Rate %': 0, Comments: 'Synthetic database/outbox validation'
            }, sheetId: masterId
        },
        {
            id: crypto.randomUUID(), department: 'PTFE', entryType: 'jxj',
            associateName: 'METRICS PORTAL INTEGRATION TEST', workDate: today, kioskId: 'INTEGRATION-TEST',
            payload: {
                'Row ID': `INTEGRATION-${crypto.randomUUID()}`, Cell: 'Pull', 'Job Slot': 'Job 1',
                'Row Type': 'Job', 'Item Number': '000000', 'Lot Number': 'INTEGRATION',
                'Std PPH': 1, 'Actual PPH': 1, 'OE Pct': 100, 'Time Min': 1,
                'Start Qty': 1, 'End Qty': 1, Countermeasures: 'Synthetic database/outbox validation'
            }, sheetId: jobId
        }
    ];
    const remoteRows = [];
    const databaseIds = [];

    try {
        const existing = await database.query("SELECT count(*)::integer AS count FROM submission_outbox WHERE state IN ('pending', 'processing')");
        if (existing.rows[0].count !== 0) throw new Error('Outbox is not empty; refusing a non-isolated worker validation.');

        for (const submission of submissions) {
            await service.create(submission, {
                name: submission.associateName,
                role: 'Technical validation',
                workstation: submission.kioskId
            });
            databaseIds.push(submission.id);
            const result = await worker.processOnce();
            if (!result.processed || !result.success || !result.result?.remoteRowId) {
                throw new Error(`${submission.entryType} outbox delivery did not complete.`);
            }
            remoteRows.push({ sheetId: submission.sheetId, rowId: result.result.remoteRowId });
        }

        const evidence = await database.query(`
            SELECT s.id, s.sync_status, s.remote_row_id, o.state AS outbox_state,
                   o.attempt_count, d.result AS delivery_result
            FROM submissions s
            JOIN submission_outbox o ON o.submission_id = s.id
            JOIN submission_deliveries d ON d.submission_id = s.id
            WHERE s.id = ANY($1::uuid[])
            ORDER BY s.entry_type
        `, [databaseIds]);
        if (evidence.rows.length !== 2 || evidence.rows.some((row) =>
            row.sync_status !== 'submitted' || row.outbox_state !== 'submitted' ||
            row.delivery_result !== 'submitted' || Number(row.attempt_count) !== 1 || !row.remote_row_id
        )) throw new Error('PTFE database, outbox, and delivery evidence did not converge to submitted.');
        const idle = await worker.processOnce();
        if (idle.processed) throw new Error('Worker processed unexpected additional outbox work.');

        console.log('PTFE database/outbox integration validation');
        console.log('  Database captures committed: 2');
        console.log('  Master Log delivery: submitted');
        console.log('  Job x Job delivery: submitted');
        console.log('  Outbox attempts per row: 1');
        console.log('  Unexpected pending work: no');
        console.log('  Result: READY');
    } finally {
        const cleanupErrors = [];
        for (const row of remoteRows) {
            try {
                await client.delete(`sheets/${row.sheetId}/rows`, {
                    params: { ids: row.rowId, ignoreRowsNotFound: true }
                });
            } catch (error) {
                cleanupErrors.push(`Smartsheet row cleanup: ${error.response?.data?.message || error.message}`);
            }
        }
        if (remoteRows.length) console.log(`  Test Smartsheet rows removed: ${remoteRows.length}`);
        if (databaseIds.length) {
            try {
                await database.withTransaction(async (transaction) => {
                    await transaction.query("DELETE FROM audit_events WHERE entity_type = 'submission' AND entity_id = ANY($1::text[])", [databaseIds]);
                    await transaction.query('DELETE FROM submission_deliveries WHERE submission_id = ANY($1::uuid[])', [databaseIds]);
                    await transaction.query('DELETE FROM submission_outbox WHERE submission_id = ANY($1::uuid[])', [databaseIds]);
                    await transaction.query('DELETE FROM submissions WHERE id = ANY($1::uuid[])', [databaseIds]);
                });
                console.log('  Test database rows removed: yes');
            } catch (error) {
                cleanupErrors.push(`database cleanup: ${error.message}`);
            }
        }
        try { await database.close(); } catch (error) { cleanupErrors.push(`database close: ${error.message}`); }
        if (cleanupErrors.length) throw new Error(`Validation cleanup failed; ${cleanupErrors.join('; ')}`);
    }
}

main().catch((error) => {
    console.error(`PTFE outbox integration failed: ${error.response?.data?.message || error.message}`);
    process.exitCode = 1;
});
