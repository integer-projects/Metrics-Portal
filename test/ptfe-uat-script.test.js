const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(
    path.join(__dirname, '..', 'scripts', 'windows', 'Manage-PtfeUatEnvironment.ps1'),
    'utf8'
);
const outboxScript = fs.readFileSync(
    path.join(__dirname, '..', 'scripts', 'validate-ptfe-outbox-integration.js'),
    'utf8'
);

test('PTFE UAT orchestration isolates port, database, flags, and both destinations', () => {
    assert.match(script, /Port = 3103/);
    assert.match(script, /metrics_portal_ptfe_uat/);
    assert.match(script, /MasterIntegrationSheetId/);
    assert.match(script, /JobIntegrationSheetId/);
    assert.match(script, /DEPT_PTFE_MASTER_LOG_SHEET_ID=\$MasterIntegrationSheetId/);
    assert.match(script, /DEPT_PTFE_JOB_LOG_SHEET_ID=\$JobIntegrationSheetId/);
    assert.match(script, /PTFE_SERVER_SESSIONS_ENABLED='true'/);
    assert.match(script, /PTFE_DATABASE_SUBMISSIONS_ENABLED='true'/);
    assert.match(script, /PL_DATABASE_SUBMISSIONS_ENABLED='false'/);
    assert.match(script, /validate:ptfe-outbox-integration/);
    assert.match(script, /PTFE_PRODUCTION_MASTER_LOG_SHEET_ID = \$productionMasterId/);
    assert.match(script, /PTFE_PRODUCTION_JOB_LOG_SHEET_ID = \$productionJobId/);
    assert.match(outboxScript, /PTFE_PRODUCTION_MASTER_LOG_SHEET_ID \|\| getRequiredEnv\('DEPT_PTFE_MASTER_LOG_SHEET_ID'\)/);
    assert.match(outboxScript, /PTFE_PRODUCTION_JOB_LOG_SHEET_ID \|\| getRequiredEnv\('DEPT_PTFE_JOB_LOG_SHEET_ID'\)/);
    assert.ok(
        script.indexOf('$env:PTFE_PRODUCTION_MASTER_LOG_SHEET_ID = $productionMasterId') <
        script.indexOf('$env:DEPT_PTFE_MASTER_LOG_SHEET_ID=$MasterIntegrationSheetId'),
        'production destination identity must be retained before the runtime destination is replaced'
    );
});

test('PTFE UAT orchestration preserves rollback and guarded cleanup', () => {
    assert.match(script, /ValidateSet\('Start','Rollback','Stop'\)/);
    assert.match(script, /features\.ptfeDatabaseSubmissions/);
    assert.match(script, /cleanup:ptfe-uat-sheets/);
    assert.match(script, /CLEAR PTFE UAT TEST SHEETS/);
    assert.match(script, /DROP DATABASE IF EXISTS \$DatabaseName WITH \(FORCE\)/);
    assert.match(script, /Required Metrics Portal listener 3002 is missing/);
});
