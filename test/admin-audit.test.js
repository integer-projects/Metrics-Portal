const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const test = require('node:test');
const { createAuditRepository } = require('../repositories/audit-repository');
const { createAdminAuditMiddleware, eventFor } = require('../services/audit/admin-audit');

test('admin audit event contains safe metadata without configuration values', () => {
    const event = eventFor({
        path: '/config/save',
        body: { type: 'associates', items: [{ name: 'Sensitive Name', password: 'secret' }] },
        adminSession: { name: 'Supervisor', deptKey: 'PTFE' },
        get: () => 'kiosk-1'
    }, 200);
    assert.equal(event.action, 'admin.config.save');
    assert.equal(event.department, 'PTFE');
    assert.equal(event.details.itemCount, 1);
    assert.equal(JSON.stringify(event).includes('Sensitive Name'), false);
    assert.equal(JSON.stringify(event).includes('secret'), false);
});

test('admin audit middleware records completed HTTP outcome', async () => {
    let recorded;
    let resolveRecord;
    const recordedPromise = new Promise((resolve) => { resolveRecord = resolve; });
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        req.adminSession = { name: 'Supervisor', deptKey: 'PL' };
        req.log = { error() {} };
        next();
    });
    app.use('/api/admin', createAdminAuditMiddleware({
        repository: { async record(event) { recorded = event; resolveRecord(); } }
    }));
    app.post('/api/admin/reset-password', (req, res) => res.status(204).end());
    await request(app).post('/api/admin/reset-password').send({ rowId: 'row-1', password: 'never-log-this' }).expect(204);
    await recordedPromise;
    assert.equal(recorded.action, 'admin.password.reset');
    assert.equal(recorded.entityId, 'row-1');
    assert.equal(recorded.details.success, true);
    assert.equal(JSON.stringify(recorded).includes('never-log-this'), false);
});

test('audit repository no-ops while database compatibility mode is disabled', async () => {
    let queried = false;
    const repository = createAuditRepository({ enabled: false, async query() { queried = true; } });
    assert.equal(await repository.record({}), false);
    assert.equal(queried, false);
});

test('audit repository stores actor, target, action, and outcome as structured data', async () => {
    let query;
    const repository = createAuditRepository({
        enabled: true,
        async query(sql, values) { query = { sql, values }; }
    });
    await repository.record({
        actorName: 'Supervisor', actorRole: 'Supervisor', department: 'PL', workstation: 'kiosk-1',
        action: 'admin.config.delete', entityType: 'configuration', entityId: 'row-1', details: { success: true }
    });
    assert.match(query.sql, /INSERT INTO audit_events/);
    assert.deepEqual(query.values.slice(0, 7), ['Supervisor', 'Supervisor', 'PL', 'kiosk-1', 'admin.config.delete', 'configuration', 'row-1']);
    assert.deepEqual(JSON.parse(query.values[7]), { success: true });
});
