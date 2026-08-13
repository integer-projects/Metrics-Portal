function createAuditRepository(database) {
    return {
        async record(event) {
            if (!database.enabled) return false;
            await database.query(`
                INSERT INTO audit_events (
                    actor_name, actor_role, department, workstation, action,
                    entity_type, entity_id, details
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
            `, [
                event.actorName,
                event.actorRole,
                event.department,
                event.workstation || null,
                event.action,
                event.entityType,
                event.entityId,
                JSON.stringify(event.details || {})
            ]);
            return true;
        }
    };
}

module.exports = { createAuditRepository };
