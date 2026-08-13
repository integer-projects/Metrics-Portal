function isoWeekKey(date) {
    const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = value.getUTCDay() || 7;
    value.setUTCDate(value.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((value - yearStart) / 86400000) + 1) / 7);
    return `${value.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function dateKey(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
        .map((value, index) => index === 0 ? String(value) : String(value).padStart(2, '0'))
        .join('-');
}

function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function retainNewestGroups(records, key, limit, retained, reason) {
    const groups = new Map();
    for (const record of records) {
        const group = key(record.createdAt);
        if (!groups.has(group)) groups.set(group, record);
    }
    [...groups.entries()].slice(0, limit).forEach(([, record]) => {
        retained.add(record.file);
        record.reasons.add(reason);
    });
}

function planBackupRetention(input, options = {}) {
    const records = input
        .map((record) => ({ ...record, createdAt: new Date(record.createdAt), reasons: new Set() }))
        .sort((left, right) => right.createdAt - left.createdAt);
    if (records.some((record) => Number.isNaN(record.createdAt.getTime()))) {
        throw new Error('Every backup record requires a valid creation timestamp.');
    }
    const retained = new Set();
    retainNewestGroups(records, dateKey, options.daily ?? 14, retained, 'daily');
    retainNewestGroups(records, isoWeekKey, options.weekly ?? 8, retained, 'weekly');
    retainNewestGroups(records, monthKey, options.monthly ?? 12, retained, 'monthly');
    return records.map((record) => ({
        file: record.file,
        createdAt: record.createdAt,
        keep: retained.has(record.file),
        reasons: [...record.reasons]
    }));
}

module.exports = { dateKey, isoWeekKey, monthKey, planBackupRetention };
