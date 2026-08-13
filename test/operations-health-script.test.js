const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const monitor = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'windows', 'Test-MetricsPortalOperations.ps1'), 'utf8');
const installer = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'windows', 'Install-MetricsPortalHealthMonitor.ps1'), 'utf8');

test('operations monitor covers every local production dependency and writes atomic evidence', () => {
    for (const expected of ['metrics-portal-worker', 'PostgreSQL service', '/health/ready', '/health/integrations', 'Backup scheduled task', 'Test-BackupFreshness.ps1', 'Application disk space']) {
        assert.match(monitor, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(monitor, /oldestActiveAgeSeconds/);
    assert.match(monitor, /needsReviewCount/);
    assert.match(monitor, /Move-Item[^\n]+-Force/);
    assert.match(monitor, /if \(-not \$healthy\) \{ exit 1 \}/);
});

test('operations monitor installer is confirmation-gated and scheduled every five minutes by default', () => {
    assert.match(installer, /INSTALL METRICS PORTAL HEALTH MONITOR/);
    assert.match(installer, /\[int\]\$Minutes = 5/);
    assert.match(installer, /Register-ScheduledTask/);
    assert.match(installer, /MultipleInstances IgnoreNew/);
});
