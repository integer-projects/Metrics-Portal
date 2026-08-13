const path = require('path');
const express = require('express');
const { ptfeSubmissionTransition } = require('../../repositories/workspace-repository');

const app = express();
app.use(express.json());

let workspace = null;
const submissions = new Map();

app.get('/api/v2/features', (req, res) => res.json({ success: true, features: {
    durableSubmissions: true, serverSessions: true, serverWorkspaces: true,
    plDatabaseSubmissions: true, ptfeDatabaseSubmissions: true,
    sessionDepartments: { PL: true, PTFE: true, PI: false }
} }));
app.get('/api/v2/sessions/current', (req, res) => res.json({ success: true, session: {
    name: 'PTFE Browser Test', role: 'Supervisor', department: 'PTFE', kioskId: 'browser-test'
} }));
app.delete('/api/v2/sessions/current', (req, res) => res.json({ success: true }));
app.get('/api/config', (req, res) => res.json({ success: true, data: {
    associates: [{ name: 'PTFE Browser Test', Rate: 1 }],
    sequences: [{ name: 'Pull' }, { name: 'Inspection' }, { name: 'First Cut' }, { name: 'Packaging' }],
    events: [{ name: 'Break' }, { name: 'Toolbox' }, { name: 'Shift End' }],
    inspectionParetos: [{ name: 'Surface' }, { name: 'Dimension' }],
    pullingParetos: [{ name: 'Material Breaking' }, { name: 'Wrong Footage' }],
    pullingMethods: [{ name: 'Manual' }, { name: 'Machine' }],
    standards: [
        { item: '311318', sequence: 'Pull', goodPphStd: 100 },
        { item: '311318', sequence: 'Inspection', goodPphStd: 120 }
    ]
} }));
app.get('/api/v2/workspaces/current', (req, res) => res.json({ success: true, workspace }));
app.put('/api/v2/workspaces/current', (req, res) => {
    if (workspace && req.body.version !== workspace.version) {
        return res.status(409).json({ success: false, error: 'Workspace was updated by another tab.', workspace });
    }
    workspace = { ...req.body, id: workspace?.id || 'ptfe-preview-workspace', version: (workspace?.version || 0) + 1 };
    res.json({ success: true, workspace });
});
app.post('/api/v2/submissions', (req, res) => {
    const duplicate = submissions.has(req.body.id);
    const submission = submissions.get(req.body.id) || {
        id: req.body.id, department: 'PTFE', entryType: req.body.entryType,
        workDate: req.body.workDate, lifecycleStatus: 'committed', syncStatus: 'pending'
    };
    submissions.set(req.body.id, submission);
    if (workspace) {
        const formData = ptfeSubmissionTransition(workspace.formData, submission);
        workspace = {
            ...workspace,
            formData,
            hasUnsavedWork: submission.entryType === 'jxj'
                ? Object.values(formData.shift.tabs).some((rows) => rows.some((row) => row.captureStatus !== 'captured'))
                : true,
            version: workspace.version + 1
        };
    }
    res.status(duplicate ? 200 : 201).json({ success: true, duplicate, submission });
});
app.get('/api/v2/submissions/:id', (req, res) => {
    const submission = submissions.get(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });
    submission.syncStatus = 'submitted';
    res.json({ success: true, submission });
});

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

const port = Number(process.env.PORT || 3103);
app.listen(port, '127.0.0.1', () => console.log(`PTFE browser preview listening on http://127.0.0.1:${port}/ptfe/`));
