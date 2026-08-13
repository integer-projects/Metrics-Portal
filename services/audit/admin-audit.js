const ACTIONS = {
    '/config/save': { action: 'admin.config.save', entityType: 'configuration' },
    '/config/delete': { action: 'admin.config.delete', entityType: 'configuration' },
    '/reset-password': { action: 'admin.password.reset', entityType: 'user' },
    '/kiosk-locks/release': { action: 'admin.kiosk_lock.release', entityType: 'kiosk_lock' }
};

function text(value, maximum = 120) {
    return String(value || '').trim().slice(0, maximum);
}

function eventFor(req, statusCode) {
    const route = Object.keys(ACTIONS).find((candidate) => req.path === candidate || req.path.endsWith(candidate));
    const definition = ACTIONS[route];
    if (!definition) return null;
    const type = text(req.body?.type, 40);
    const rowId = text(req.body?.rowId, 80);
    const targetName = text(req.body?.username, 80);
    const entityId = rowId || targetName || type || route;
    return {
        actorName: text(req.adminSession?.name, 80) || 'unknown supervisor',
        actorRole: 'Supervisor',
        department: text(req.adminSession?.deptKey, 8) || null,
        workstation: text(req.get('x-kiosk-id'), 120),
        action: definition.action,
        entityType: definition.entityType,
        entityId,
        details: {
            success: statusCode >= 200 && statusCode < 400,
            statusCode,
            resourceType: type || undefined,
            itemCount: Array.isArray(req.body?.items) ? req.body.items.length : undefined
        }
    };
}

function createAdminAuditMiddleware(options) {
    return (req, res, next) => {
        res.on('finish', () => {
            const event = eventFor(req, res.statusCode);
            if (!event) return;
            options.repository.record(event).catch((error) => {
                req.log?.error({ err: error, action: event.action }, 'admin audit event could not be persisted');
            });
        });
        next();
    };
}

module.exports = { ACTIONS, createAdminAuditMiddleware, eventFor };
