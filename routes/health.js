const express = require('express');

function createHealthRouter(options) {
    const router = express.Router();
    const startedAt = options.startedAt || Date.now();

    router.get('/health', (req, res) => {
        res.json({
            status: 'alive',
            version: options.version,
            uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
            requestId: req.requestId
        });
    });

    router.get('/health/ready', async (req, res) => {
        const database = await options.database.checkReadiness();
        const ready = database.ok;
        res.status(ready ? 200 : 503).json({
            status: ready ? 'ready' : 'not_ready',
            version: options.version,
            checks: { database },
            requestId: req.requestId
        });
    });

    router.get('/health/integrations', async (req, res) => {
        if (!options.integrationHealth) {
            return res.json({
                status: 'disabled',
                version: options.version,
                requestId: req.requestId
            });
        }
        try {
            const queue = await options.integrationHealth();
            const oldestActiveAt = queue.oldest_active_at;
            const oldestActiveAgeSeconds = oldestActiveAt
                ? Math.max(0, Math.floor((Date.now() - new Date(oldestActiveAt).getTime()) / 1000))
                : 0;
            const degraded = Number(queue.failed_count) > 0 || Number(queue.needs_review_count) > 0 || oldestActiveAgeSeconds >= 300;
            res.json({
                status: degraded ? 'degraded' : 'ok',
                version: options.version,
                queue: {
                    activeCount: Number(queue.active_count || 0),
                    pendingCount: Number(queue.pending_count || 0),
                    processingCount: Number(queue.processing_count || 0),
                    failedCount: Number(queue.failed_count || 0),
                    needsReviewCount: Number(queue.needs_review_count || 0),
                    oldestActiveAt,
                    oldestActiveAgeSeconds,
                    lastDeliveryAt: queue.last_delivery_at,
                    recentErrorCount: Number(queue.recent_error_count || 0)
                },
                requestId: req.requestId
            });
        } catch (error) {
            req.log?.error({ err: error }, 'integration health check failed');
            res.status(503).json({ status: 'unavailable', version: options.version, requestId: req.requestId });
        }
    });

    return router;
}

module.exports = {
    createHealthRouter
};
