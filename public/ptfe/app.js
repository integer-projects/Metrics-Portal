(function startPtfePortal() {
    const api = window.PortalApi;
    const model = window.PtfeModel;
    const elements = {};
    const themes = ['precision', 'light', 'dark', 'high-contrast'];
    const controlledEndShiftFailureAfter = window.location.hostname === '127.0.0.1' && window.location.port === '3103'
        ? Math.max(0, Number(new URLSearchParams(window.location.search).get('uatFailEndShiftAfter')) || 0)
        : 0;
    let session = null;
    let workspace = null;
    let config = {};
    let standards = {};
    let associateRate = 0;
    let saveTimer = null;
    let savePromise = Promise.resolve();
    let submissionPollTimer = null;
    let conflicted = false;
    let submitting = false;
    let alertReturnFocus = null;

    const byId = (id) => document.getElementById(id);
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

    function cacheElements() {
        ['identity', 'saveState', 'themeSelect', 'adminLink', 'signOutButton', 'conflictPanel',
            'reloadWorkspaceButton', 'submissionPanel', 'submissionTitle', 'submissionDetail',
            'refreshSubmissionButton', 'warningPanel', 'warningMessages', 'associateName', 'workDate',
            'jobForm', 'eventForm', 'item', 'lot', 'sequence', 'timeWorked', 'pullSpoolFields',
            'footage', 'processingLength', 'partUnit', 'startMultiplier', 'applyMultiplier',
            'resetAutoStart', 'partsFromSpool', 'startQuantity', 'endQuantity', 'scrapParts',
            'yieldPercent', 'scrapPercent', 'actualPph', 'targetQuantity', 'sequenceOe',
            'baseStandard', 'adjustedStandard', 'standardNote', 'recutsField', 'recuts',
            'inspectionParetoSection', 'inspectionParetos', 'pullingParetoSection', 'pullingParetos',
            'pullDetails', 'pullingWraps', 'pullingMethods', 'comments', 'jobErrors', 'submitJobButton',
            'event', 'eventStart', 'eventEnd', 'eventDuration', 'eventComments', 'eventErrors',
            'submitEventButton', 'shiftTabs', 'shiftTable', 'countermeasures', 'endShiftButton',
            'alertOverlay', 'alertTitle', 'alertMessages', 'alertCloseButton', 'toast']
            .forEach((id) => { elements[id] = byId(id); });
    }

    function setTheme(theme) {
        const safe = themes.includes(theme) ? theme : 'precision';
        document.body.classList.remove(...themes.map((name) => `theme-${name}`));
        document.body.classList.add(`theme-${safe}`);
        elements.themeSelect.value = safe;
        localStorage.setItem('portalTheme', safe);
    }

    function setSaveState(text, type) {
        elements.saveState.textContent = text;
        elements.saveState.className = `status ${type}`;
    }

    function showToast(message) {
        elements.toast.textContent = message;
        elements.toast.hidden = false;
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 4500);
    }

    function showAlert(title, messages) {
        alertReturnFocus = document.activeElement;
        elements.alertTitle.textContent = title;
        const list = document.createElement('ul');
        (Array.isArray(messages) ? messages : [messages]).filter(Boolean).forEach((message) => {
            const item = document.createElement('li');
            item.textContent = message;
            list.appendChild(item);
        });
        elements.alertMessages.replaceChildren(list);
        elements.alertOverlay.hidden = false;
        elements.alertCloseButton.focus();
    }

    function closeAlert() {
        elements.alertOverlay.hidden = true;
        alertReturnFocus?.focus?.();
        alertReturnFocus = null;
    }

    function normalizeWorkspace(source) {
        const fresh = model.emptyWorkspace();
        if (!source) return fresh;
        const sourceData = source.formData || {};
        const sourceForm = sourceData.form || sourceData;
        const form = { ...model.emptyForm(), ...sourceForm };
        const shift = sourceData.shift?.tabs ? sourceData.shift : model.emptyShift(source.workDate || fresh.workDate);
        return {
            ...fresh,
            ...source,
            formData: {
                form,
                shift: { ...model.emptyShift(source.workDate || fresh.workDate), ...shift },
                countermeasures: sourceData.countermeasures || '',
                lastSubmission: sourceData.lastSubmission || form.lastSubmission || null
            }
        };
    }

    function populateSelect(select, values, placeholder) {
        select.replaceChildren(new Option(placeholder, ''));
        Array.from(new Set(values.filter(Boolean))).forEach((value) => select.add(new Option(value, value)));
    }

    function populateChoices(container, name, values) {
        container.replaceChildren();
        values.filter(Boolean).forEach((value, index) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = name;
            input.value = value;
            input.id = `${name}-${index}`;
            input.addEventListener('change', captureAndQueueSave);
            label.append(input, document.createTextNode(value));
            container.append(label);
        });
    }

    function selected(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
    }

    function setSelected(name, values) {
        const wanted = new Set(values || []);
        document.querySelectorAll(`input[name="${name}"]`).forEach((input) => { input.checked = wanted.has(input.value); });
    }

    function standardFor(form) {
        return standards[`${form.item}::${form.sequence}`] || {};
    }

    function resultsFor(form = workspace.formData.form) {
        return model.calculations(form, standardFor(form), associateRate);
    }

    function captureForm() {
        const form = workspace.formData.form;
        workspace.workDate = elements.workDate.value || model.today();
        form.item = elements.item.value.replace(/\D/g, '').slice(0, 6);
        elements.item.value = form.item;
        form.lot = elements.lot.value.trim();
        form.sequence = elements.sequence.value;
        form.timeWorked = Math.max(0, number(elements.timeWorked.value));
        form.footage = Math.max(0, number(elements.footage.value));
        form.processingLength = Math.max(0, number(elements.processingLength.value));
        form.partUnit = elements.partUnit.value || 'in';
        form.startMultiplier = Math.max(0, number(elements.startMultiplier.value) || 1);
        form.startQuantity = Math.max(0, number(elements.startQuantity.value));
        form.endQuantity = Math.max(0, number(elements.endQuantity.value));
        form.recuts = Math.max(0, number(elements.recuts.value));
        form.inspectionParetos = selected('inspectionPareto');
        form.pullingParetos = selected('pullingPareto');
        form.pullingWraps = elements.pullingWraps.value.trim();
        form.pullingMethods = selected('pullingMethod');
        form.event = elements.event.value;
        form.eventStart = elements.eventStart.value;
        form.eventEnd = elements.eventEnd.value;
        form.comments = workspace.mode === 'event' ? elements.eventComments.value : elements.comments.value;
        workspace.formData.countermeasures = elements.countermeasures.value;
        workspace.formData.shift.workDate = workspace.workDate;
        workspace.hasUnsavedWork = model.hasUnsavedWork(form, workspace.formData.shift, workspace.mode);
        renderCalculations();
    }

    function renderWorkspace() {
        const form = workspace.formData.form;
        elements.workDate.value = workspace.workDate;
        elements.item.value = form.item;
        elements.lot.value = form.lot;
        elements.sequence.value = form.sequence;
        elements.timeWorked.value = form.timeWorked;
        elements.footage.value = form.footage;
        elements.processingLength.value = form.processingLength;
        elements.partUnit.value = form.partUnit;
        elements.startMultiplier.value = form.startMultiplier || 1;
        elements.startQuantity.value = form.startQuantity;
        elements.endQuantity.value = form.endQuantity;
        elements.recuts.value = form.recuts;
        elements.pullingWraps.value = form.pullingWraps;
        elements.comments.value = workspace.mode === 'job' ? form.comments : '';
        elements.event.value = form.event;
        elements.eventStart.value = form.eventStart;
        elements.eventEnd.value = form.eventEnd;
        elements.eventComments.value = workspace.mode === 'event' ? form.comments : '';
        elements.countermeasures.value = workspace.formData.countermeasures || '';
        setSelected('inspectionPareto', form.inspectionParetos);
        setSelected('pullingPareto', form.pullingParetos);
        setSelected('pullingMethod', form.pullingMethods);
        document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === workspace.mode));
        elements.jobForm.hidden = workspace.mode !== 'job';
        elements.eventForm.hidden = workspace.mode !== 'event';
        renderCalculations();
        renderShift();
        renderSubmission(workspace.formData.lastSubmission);
        scheduleSubmissionRefresh();
    }

    function renderCalculations() {
        const form = workspace.formData.form;
        let result = resultsFor(form);
        const pull = form.sequence === 'Pull';
        if (pull && !form.startQuantityManual && result.partsFromSpool > 0) {
            form.startQuantity = Math.floor(result.partsFromSpool * (form.startMultiplier || 1));
            elements.startQuantity.value = form.startQuantity;
            result = resultsFor(form);
        }
        const inspection = ['Inspection', 'EV3 Inspection'].includes(form.sequence);
        const recuts = ['First Cut', 'Overall Length', 'Roll Cut (Both Ends)'].includes(form.sequence);
        elements.pullSpoolFields.hidden = !pull;
        elements.pullDetails.hidden = !pull;
        elements.recutsField.hidden = !recuts;
        elements.inspectionParetoSection.hidden = !(inspection && result.yieldPercent > 0 && result.yieldPercent < 75);
        elements.pullingParetoSection.hidden = !(pull && result.yieldPercent > 0 && result.yieldPercent <= 85);
        elements.partsFromSpool.textContent = result.partsFromSpool || '—';
        elements.scrapParts.textContent = result.scrapParts;
        elements.yieldPercent.textContent = result.startQuantity ? `${result.yieldPercent.toFixed(1)}%` : '—';
        elements.scrapPercent.textContent = result.startQuantity ? `${result.scrapPercent.toFixed(1)}%` : '—';
        elements.actualPph.textContent = result.pph ? result.pph.toFixed(1) : '—';
        elements.targetQuantity.textContent = result.adjustedStandard ? result.targetQuantity : '—';
        elements.sequenceOe.textContent = result.sequenceOe ? `${result.sequenceOe.toFixed(1)}%` : '—';
        elements.baseStandard.textContent = result.baseStandard || '—';
        elements.adjustedStandard.textContent = result.adjustedStandard ? result.adjustedStandard.toFixed(1) : '—';
        elements.standardNote.textContent = result.baseStandard ? 'Exact item and sequence standard loaded.' : 'No exact item and sequence standard found.';
        elements.eventDuration.textContent = `${model.eventMinutes(form.eventStart, form.eventEnd)} minutes`;
        const warnings = model.qualityWarnings(form, result, workspace.formData.shift);
        elements.warningPanel.hidden = warnings.length === 0;
        elements.warningMessages.replaceChildren(...warnings.map((warning) => {
            const line = document.createElement('div'); line.textContent = warning; return line;
        }));
    }

    function escapeHtml(value) {
        const element = document.createElement('div'); element.textContent = value ?? ''; return element.innerHTML;
    }

    function renderShift() {
        const shift = workspace.formData.shift;
        elements.shiftTabs.replaceChildren();
        model.JXJ_TABS.forEach((cell) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `shift-tab${shift.activeTab === cell ? ' active' : ''}`;
            button.textContent = `${cell === 'Cut to Length' ? 'CTL' : cell} (${(shift.tabs[cell] || []).length})`;
            button.addEventListener('click', () => { shift.activeTab = cell; renderShift(); queueSave(); });
            elements.shiftTabs.append(button);
        });
        const rows = shift.tabs[shift.activeTab] || [];
        if (!rows.length) {
            elements.shiftTable.innerHTML = `<p class="muted">No entries logged for ${escapeHtml(shift.activeTab)} yet.</p>`;
            return;
        }
        elements.shiftTable.innerHTML = `<div class="shift-table-wrap"><table class="shift-table"><thead><tr><th>Slot</th><th>${shift.activeTab === 'Events' ? 'Event' : 'Item'}</th><th>Lot</th><th>Std PPH</th><th>Actual PPH</th><th>OE</th><th>Time</th><th>Loss reason</th><th>Capture</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td>${escapeHtml(row.slot)}</td><td>${escapeHtml(row.item)}</td><td>${escapeHtml(row.lot)}</td><td>${escapeHtml(row.stdPph)}</td><td>${escapeHtml(row.actualPph)}</td><td>${number(row.oe) ? `${number(row.oe).toFixed(1)}%` : '—'}</td><td>${escapeHtml(row.timeMins)}m</td><td><input data-loss-index="${index}" value="${escapeHtml(row.lossReason)}" aria-label="Loss reason for ${escapeHtml(row.slot)}"></td><td class="capture-${row.captureStatus}">${row.captureStatus === 'captured' ? 'Database saved' : 'Waiting for End Shift'}</td></tr>`).join('')}</tbody></table></div>`;
        elements.shiftTable.querySelectorAll('[data-loss-index]').forEach((input) => input.addEventListener('input', () => {
            rows[Number(input.dataset.lossIndex)].lossReason = input.value;
            workspace.hasUnsavedWork = true;
            queueSave();
        }));
    }

    function queueSave() {
        if (conflicted || submitting) return;
        clearTimeout(saveTimer);
        setSaveState('Unsaved changes', 'dirty');
        saveTimer = setTimeout(saveWorkspace, 550);
    }

    function captureAndQueueSave() { captureForm(); queueSave(); }

    function selectZeroValue(input) {
        if (input.value === '0') setTimeout(() => input.select(), 0);
    }

    function selectCurrentValue(input) {
        setTimeout(() => input.select(), 0);
    }

    function saveWorkspace() {
        clearTimeout(saveTimer);
        if (conflicted) return Promise.resolve(false);
        setSaveState('Saving…', 'neutral');
        savePromise = savePromise.then(async () => {
            try {
                const result = await api.saveWorkspace(clone(workspace));
                workspace.id = result.workspace.id;
                workspace.version = result.workspace.version;
                setSaveState('Saved to server', 'saved');
                return true;
            } catch (error) {
                if (error.status === 409) {
                    conflicted = true;
                    elements.conflictPanel.hidden = false;
                    setSaveState('Tab conflict', 'error');
                } else {
                    setSaveState('Save failed', 'error');
                    showAlert('Save failed', error.message);
                }
                return false;
            }
        });
        return savePromise;
    }

    function createId() {
        if (window.crypto?.randomUUID) return window.crypto.randomUUID();
        const bytes = new Uint8Array(16);
        if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
        else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
        bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    function renderErrors(container, errors) {
        const messages = Object.values(errors);
        container.hidden = messages.length === 0;
        container.replaceChildren();
        if (messages.length) {
            const list = document.createElement('ul');
            messages.forEach((message) => { const item = document.createElement('li'); item.textContent = message; list.append(item); });
            container.append(list);
        }
    }

    function pendingRequest(entryType, payload) {
        const form = workspace.formData.form;
        const signature = JSON.stringify(payload);
        if (form.pendingSubmission?.entryType === entryType && form.pendingSubmission.signature === signature) return form.pendingSubmission;
        return { id: createId(), entryType, signature, payload };
    }

    async function submit(entryType) {
        captureForm();
        const form = workspace.formData.form;
        const result = resultsFor(form);
        const errors = entryType === 'job' ? model.validateJob(form, result) : model.validateEvent(form);
        const errorContainer = entryType === 'job' ? elements.jobErrors : elements.eventErrors;
        renderErrors(errorContainer, errors);
        if (Object.keys(errors).length) return showAlert('Action required', Object.values(errors));
        const payload = entryType === 'job'
            ? model.buildJobPayload(form, result, workspace.workDate)
            : model.buildEventPayload(form, workspace.workDate);
        form.jxjSnapshot = entryType === 'job' ? result : null;
        form.submittedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const pending = pendingRequest(entryType, payload);
        form.pendingSubmission = pending;
        workspace.hasUnsavedWork = true;
        const button = entryType === 'job' ? elements.submitJobButton : elements.submitEventButton;
        submitting = true; button.disabled = true; button.textContent = 'Saving to database…';
        try {
            submitting = false;
            if (!await saveWorkspace()) throw new Error('The server workspace must be saved first.');
            submitting = true;
            const response = await api.createSubmission({ id: pending.id, entryType, workDate: workspace.workDate, payload });
            workspace = normalizeWorkspace((await api.getWorkspace()).workspace);
            workspace.formData.lastSubmission = response.submission;
            submitting = false;
            renderWorkspace();
            showToast(response.duplicate ? 'Original database record confirmed.' : 'Saved to database. Smartsheet sync continues in the background.');
        } catch (error) {
            showAlert('Submission not completed', `${error.message} A retry keeps the same submission ID.`);
            setSaveState('Submission needs retry', 'error');
        } finally {
            submitting = false; button.disabled = false;
            button.textContent = entryType === 'job' ? 'Save job to database' : 'Save event to database';
        }
    }

    function renderSubmission(submission) {
        elements.submissionPanel.hidden = !submission;
        if (!submission) return;
        const synced = submission.syncStatus === 'submitted';
        elements.submissionTitle.textContent = synced ? 'Database saved · Smartsheet synced' : 'Database saved · Smartsheet pending';
        elements.submissionDetail.textContent = synced ? 'The background worker confirmed the destination row.' : `Current sync status: ${submission.syncStatus || 'pending'}. The entry is safely stored.`;
    }

    function submissionNeedsPolling(submission) {
        return Boolean(submission?.id) && !['submitted', 'needs_review'].includes(submission.syncStatus);
    }

    function scheduleSubmissionRefresh() {
        clearTimeout(submissionPollTimer);
        submissionPollTimer = null;
        if (conflicted || document.visibilityState === 'hidden' || !submissionNeedsPolling(workspace?.formData?.lastSubmission)) return;
        submissionPollTimer = setTimeout(() => refreshSubmission({ silent: true }), 2000);
    }

    async function refreshSubmission({ silent = false } = {}) {
        const id = workspace.formData.lastSubmission?.id;
        if (!id) return;
        try {
            workspace.formData.lastSubmission = (await api.getSubmission(id)).submission;
            renderSubmission(workspace.formData.lastSubmission);
            await saveWorkspace();
        } catch (error) {
            if (!silent) showAlert('Status refresh failed', error.message);
        } finally {
            scheduleSubmissionRefresh();
        }
    }

    function formHasOpenEntry() {
        return model.hasUnsavedWork(workspace.formData.form, model.emptyShift(workspace.workDate), workspace.mode);
    }

    async function endShift() {
        captureForm();
        if (formHasOpenEntry()) return showAlert('End Shift blocked', 'Save the current job/event or clear it before ending the shift.');
        const rows = model.JXJ_TABS.flatMap((cell) => (workspace.formData.shift.tabs[cell] || []).map((row) => ({ cell, row })));
        if (!window.confirm(`Capture ${rows.length} Job x Job row(s) in the database and end this shift?`)) return;
        elements.endShiftButton.disabled = true;
        let capturedThisAttempt = 0;
        try {
            while (model.shiftHasUncapturedRows(workspace.formData.shift)) {
                const record = model.JXJ_TABS.flatMap((cell) => (workspace.formData.shift.tabs[cell] || []).map((row) => ({ cell, row })))
                    .find((candidate) => candidate.row.captureStatus !== 'captured');
                if (!record) break;
                record.row.submissionId = record.row.submissionId || createId();
                workspace.hasUnsavedWork = true;
                if (!await saveWorkspace()) throw new Error('Could not persist the permanent Job x Job submission ID.');
                const generated = model.jobLogRows(workspace.formData.shift, session.name, workspace.formData.countermeasures)
                    .find((candidate) => candidate.submissionId === record.row.submissionId);
                if (!generated) throw new Error(`Could not build ${record.row.slot}.`);
                await api.createSubmission({ id: record.row.submissionId, entryType: 'jxj', workDate: workspace.workDate, payload: generated.payload });
                workspace = normalizeWorkspace((await api.getWorkspace()).workspace);
                renderShift();
                capturedThisAttempt += 1;
                if (controlledEndShiftFailureAfter && capturedThisAttempt >= controlledEndShiftFailureAfter) {
                    throw new Error('Controlled UAT partial End Shift interruption. Remove the UAT query parameter and retry.');
                }
            }
            workspace.formData = { form: model.emptyForm(), shift: model.emptyShift(workspace.workDate), countermeasures: '', lastSubmission: workspace.formData.lastSubmission };
            workspace.hasUnsavedWork = false;
            if (!await saveWorkspace()) throw new Error('All rows were captured, but the shift could not be closed.');
            await api.signOut(false, '');
            localStorage.removeItem('currentUser');
            window.location.href = '/login.html';
        } catch (error) {
            showAlert('End Shift not completed', `${error.message} Already captured rows will not be duplicated when you retry.`);
        } finally { elements.endShiftButton.disabled = false; }
    }

    async function signOut() {
        captureForm();
        await saveWorkspace();
        let discard = false; let reason = '';
        if (workspace.hasUnsavedWork) {
            if (!window.confirm('This workspace contains uncaptured work. Discard it and sign out?')) return;
            reason = window.prompt('Enter the reason this work is being discarded:')?.trim() || '';
            if (!reason) return showAlert('Sign-out blocked', 'A discard reason is required.');
            discard = true;
        }
        try {
            await api.signOut(discard, reason);
            localStorage.removeItem('currentUser');
            window.location.href = '/login.html';
        } catch (error) { showAlert('Sign-out failed', error.message); }
    }

    function bindEvents() {
        document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
            captureForm(); workspace.mode = button.dataset.mode; renderWorkspace(); queueSave();
        }));
        [elements.workDate, elements.item, elements.lot, elements.sequence, elements.timeWorked, elements.footage,
            elements.processingLength, elements.partUnit, elements.startMultiplier, elements.endQuantity, elements.recuts,
            elements.pullingWraps, elements.comments, elements.event, elements.eventStart, elements.eventEnd,
            elements.eventComments, elements.countermeasures]
            .forEach((input) => input.addEventListener('input', captureAndQueueSave));
        elements.startQuantity.addEventListener('input', () => { workspace.formData.form.startQuantityManual = true; captureAndQueueSave(); });
        elements.applyMultiplier.addEventListener('click', () => { workspace.formData.form.startQuantityManual = false; captureAndQueueSave(); });
        elements.resetAutoStart.addEventListener('click', () => {
            workspace.formData.form.startMultiplier = 1; workspace.formData.form.startQuantityManual = false;
            elements.startMultiplier.value = '1'; captureAndQueueSave();
        });
        document.querySelectorAll('[data-replace-zero]').forEach((input) => {
            input.addEventListener('focus', () => selectZeroValue(input));
            input.addEventListener('mouseup', (event) => {
                if (input.value !== '0') return;
                event.preventDefault();
                selectZeroValue(input);
            });
        });
        document.querySelectorAll('[data-select-on-entry]').forEach((input) => {
            input.addEventListener('focus', () => selectCurrentValue(input));
            input.addEventListener('mouseup', (event) => {
                event.preventDefault();
                selectCurrentValue(input);
            });
        });
        document.querySelectorAll('input[type="number"]').forEach((input) => {
            input.addEventListener('wheel', (event) => {
                if (document.activeElement !== input) return;
                event.preventDefault();
                input.blur();
            }, { passive: false });
        });
        elements.jobForm.addEventListener('submit', (event) => { event.preventDefault(); submit('job'); });
        elements.eventForm.addEventListener('submit', (event) => { event.preventDefault(); submit('event'); });
        elements.endShiftButton.addEventListener('click', endShift);
        elements.signOutButton.addEventListener('click', signOut);
        elements.refreshSubmissionButton.addEventListener('click', () => refreshSubmission());
        elements.themeSelect.addEventListener('change', () => setTheme(elements.themeSelect.value));
        elements.alertCloseButton.addEventListener('click', closeAlert);
        elements.reloadWorkspaceButton.addEventListener('click', async () => {
            workspace = normalizeWorkspace((await api.getWorkspace()).workspace);
            conflicted = false; elements.conflictPanel.hidden = true; renderWorkspace(); setSaveState('Server copy loaded', 'saved');
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') scheduleSubmissionRefresh();
            else clearTimeout(submissionPollTimer);
        });
        window.addEventListener('beforeunload', (event) => { if (workspace?.hasUnsavedWork && elements.saveState.textContent !== 'Saved to server') event.preventDefault(); });
    }

    async function initialize() {
        cacheElements(); setTheme(localStorage.getItem('portalTheme') || 'precision');
        try {
            const [featureResult, sessionResult, configResult] = await Promise.all([api.getFeatures(), api.getSession(), api.getPtfeConfig()]);
            session = sessionResult.session;
            if (!featureResult.features.ptfeDatabaseSubmissions || !featureResult.features.serverWorkspaces || session.department !== 'PTFE') {
                throw new Error('The PTFE database workflow is not enabled for this session.');
            }
            config = configResult.data || {};
            standards = Object.fromEntries((config.standards || []).filter((item) => item.item && item.sequence).map((item) => [`${item.item}::${item.sequence}`, item]));
            associateRate = number((config.associates || []).find((associate) => associate.name === session.name)?.Rate);
            populateSelect(elements.sequence, (config.sequences || []).map((item) => item.name), 'Select sequence…');
            populateSelect(elements.event, (config.events || []).map((item) => item.name).filter((name) => name.toLowerCase() !== 'shift end'), 'Select event…');
            populateChoices(elements.inspectionParetos, 'inspectionPareto', (config.inspectionParetos || []).map((item) => item.name));
            populateChoices(elements.pullingParetos, 'pullingPareto', (config.pullingParetos || []).map((item) => item.name));
            populateChoices(elements.pullingMethods, 'pullingMethod', (config.pullingMethods || []).map((item) => item.name));
            workspace = normalizeWorkspace((await api.getWorkspace()).workspace);
            elements.identity.textContent = `${session.name} · ${session.role} · workstation ${session.kioskId}`;
            elements.associateName.textContent = session.name;
            elements.adminLink.hidden = session.role !== 'Supervisor';
            bindEvents(); renderWorkspace(); document.querySelector('main').hidden = false;
            if (!workspace.id) await saveWorkspace(); else setSaveState('Saved to server', 'saved');
        } catch (error) {
            setSaveState('Unavailable', 'error'); showToast(error.message);
            setTimeout(() => { window.location.href = '/login.html'; }, 2500);
        }
    }

    initialize();
}());
