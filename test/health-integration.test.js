const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const test = require('node:test');
const { createHealthRouter } = require('../routes/health');

function appWithQueue(queue) {
    const app = express();
    app.use('/api/v2', createHealthRouter({
        database: { checkReadiness: async () => ({ ok: true }) },
        version: 'test',
        commit: 'abcdef1',
        integrationHealth: async () => queue,
        startedAt: Date.now()
    }));
    return app;
}

test('integration health reports complete healthy queue evidence', async () => {
    const response = await request(appWithQueue({
        active_count: 0,
        pending_count: 0,
        processing_count: 0,
        failed_count: 0,
        needs_review_count: 0,
        oldest_active_at: null,
        last_delivery_at: '2026-08-13T12:00:00Z',
        recent_error_count: 0
    })).get('/api/v2/health/integrations').expect(200);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.commit, 'abcdef1');
    assert.deepEqual(response.body.queue, {
        activeCount: 0,
        pendingCount: 0,
        processingCount: 0,
        failedCount: 0,
        needsReviewCount: 0,
        oldestActiveAt: null,
        oldestActiveAgeSeconds: 0,
        lastDeliveryAt: '2026-08-13T12:00:00Z',
        recentErrorCount: 0
    });
});

test('integration health degrades for terminal or five-minute active work', async () => {
    const old = new Date(Date.now() - 301000).toISOString();
    const response = await request(appWithQueue({
        active_count: 1,
        pending_count: 1,
        processing_count: 0,
        failed_count: 0,
        needs_review_count: 1,
        oldest_active_at: old,
        recent_error_count: 1
    })).get('/api/v2/health/integrations').expect(200);
    assert.equal(response.body.status, 'degraded');
    assert.equal(response.body.queue.oldestActiveAgeSeconds >= 300, true);
    assert.equal(response.body.queue.needsReviewCount, 1);
});
