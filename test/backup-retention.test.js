const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { isoWeekKey, planBackupRetention } = require('../lib/backup-retention');

function record(day) {
    return { file: `backup-${day}.dump`, createdAt: `${day}T01:00:00` };
}

test('backup retention keeps the union of daily, weekly, and monthly recovery points', () => {
    const records = [];
    for (let index = 0; index < 90; index += 1) {
        const date = new Date(2026, 7, 31 - index, 1, 0, 0);
        const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
            .map((value, position) => position === 0 ? value : String(value).padStart(2, '0')).join('-');
        records.push(record(day));
    }
    const plan = planBackupRetention(records, { daily: 14, weekly: 8, monthly: 3 });
    const kept = plan.filter((item) => item.keep);
    assert.equal(kept.some((item) => item.reasons.includes('daily')), true);
    assert.equal(kept.some((item) => item.reasons.includes('weekly')), true);
    assert.equal(kept.some((item) => item.reasons.includes('monthly')), true);
    assert.equal(plan.filter((item) => !item.keep).length > 0, true);
    assert.equal(plan[0].keep, true);
});

test('backup retention keeps only the newest backup within a tier group', () => {
    const plan = planBackupRetention([
        { file: 'new.dump', createdAt: '2026-08-13T02:00:00' },
        { file: 'old.dump', createdAt: '2026-08-13T01:00:00' }
    ], { daily: 1, weekly: 1, monthly: 1 });
    assert.equal(plan.find((item) => item.file === 'new.dump').keep, true);
    assert.equal(plan.find((item) => item.file === 'old.dump').keep, false);
});

test('ISO week keys handle year boundaries', () => {
    assert.equal(isoWeekKey(new Date(2027, 0, 1)), '2026-W53');
    assert.equal(isoWeekKey(new Date(2027, 0, 4)), '2027-W01');
});

test('backup retention command verifies sidecars and requires confirmation before deletion', (context) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'metrics-retention-'));
    context.after(() => fs.rmSync(root, { recursive: true, force: true }));
    for (const [stamp, content] of [['20260813-020000', 'new'], ['20260813-010000', 'old']]) {
        const file = path.join(root, `metrics-portal-${stamp}.dump`);
        fs.writeFileSync(file, content);
        fs.writeFileSync(`${file}.json`, JSON.stringify({
            Sha256: crypto.createHash('sha256').update(content).digest('hex').toUpperCase()
        }));
    }
    const script = path.join(__dirname, '..', 'scripts', 'manage-backup-retention.js');
    const dryRun = spawnSync(process.execPath, [script, `--backup-root=${root}`, '--daily=1', '--weekly=1', '--monthly=1'], { encoding: 'utf8' });
    assert.equal(dryRun.status, 0);
    assert.match(dryRun.stdout, /Backups eligible for removal: 1/);
    assert.equal(fs.readdirSync(root).filter((file) => file.endsWith('.dump')).length, 2);

    const refused = spawnSync(process.execPath, [script, `--backup-root=${root}`, '--daily=1', '--weekly=1', '--monthly=1', '--apply'], { encoding: 'utf8' });
    assert.equal(refused.status, 1);
    assert.equal(fs.readdirSync(root).filter((file) => file.endsWith('.dump')).length, 2);

    const applied = spawnSync(process.execPath, [script, `--backup-root=${root}`, '--daily=1', '--weekly=1', '--monthly=1', '--apply', '--confirmation=APPLY METRICS PORTAL BACKUP RETENTION'], { encoding: 'utf8' });
    assert.equal(applied.status, 0);
    assert.equal(fs.readdirSync(root).filter((file) => file.endsWith('.dump')).length, 1);
    assert.equal(fs.existsSync(path.join(root, 'metrics-portal-20260813-020000.dump')), true);
});
