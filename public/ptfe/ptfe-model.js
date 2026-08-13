(function attachPtfeModel(root, factory) {
    const model = factory();
    if (typeof module === 'object' && module.exports) module.exports = model;
    else root.PtfeModel = model;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPtfeModel() {
    const JXJ_TABS = ['Pull', 'Cut to Length', 'Inspection', 'Roll Cut', 'Packaging', 'Events'];
    const JXJ_CELL_MAP = {
        'Pull': { cell: 'Pull', prefix: 'Job' },
        '10X': { cell: 'Inspection', prefix: 'Job' },
        'First Cut': { cell: 'Roll Cut', prefix: 'HR' },
        'Roll Cut (Both Ends)': { cell: 'Roll Cut', prefix: 'HR' },
        'CTL': { cell: 'Cut to Length', prefix: 'Job' },
        'Inspection': { cell: 'Inspection', prefix: 'Job' },
        'EV3 Inspection': { cell: 'Inspection', prefix: 'Job' },
        '2nd Inspection': { cell: 'Inspection', prefix: 'Job' },
        'Length Check': { cell: 'Roll Cut', prefix: 'HR' },
        'Overall Length': { cell: 'Roll Cut', prefix: 'HR' },
        'Ring Gauge': { cell: 'Inspection', prefix: 'Job' },
        'Pressure Test': { cell: 'Inspection', prefix: 'Job' },
        'Check Flush': { cell: 'Inspection', prefix: 'Job' },
        'Packaging': { cell: 'Packaging', prefix: 'Job' },
        'Package (Ring Gauge Done)': { cell: 'Packaging', prefix: 'Job' },
        'Shipping Mandrel': { cell: 'Packaging', prefix: 'Job' }
    };

    function today() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function emptyForm() {
        return {
            item: '', lot: '', sequence: '', timeWorked: 0,
            footage: 0, processingLength: 0, partUnit: 'in', startQuantity: 0, endQuantity: 0,
            recuts: 0, inspectionParetos: [], pullingParetos: [], pullingWraps: '', pullingMethods: [],
            comments: '', event: '', eventStart: '', eventEnd: '', pendingSubmission: null, lastSubmission: null
        };
    }

    function emptyShift(workDate = today()) {
        return {
            workDate,
            activeTab: 'Pull',
            tabs: Object.fromEntries(JXJ_TABS.map((name) => [name, []]))
        };
    }

    function number(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function array(value) {
        return Array.isArray(value) ? value.filter((item) => String(item || '').trim()) : [];
    }

    function calculations(form, standard = {}, associateRate = 0) {
        const footage = Math.max(0, number(form.footage));
        const partLength = Math.max(0, number(form.processingLength));
        const unit = form.partUnit || 'in';
        const lengthInches = unit === 'cm' ? partLength / 2.54 : unit === 'mm' ? partLength / 25.4 : partLength;
        const totalInches = footage * 12;
        const partsFromSpool = totalInches > 0 && lengthInches > 0 ? Math.floor(totalInches / lengthInches) : 0;
        const startQuantity = Math.max(0, number(form.startQuantity));
        const endQuantity = Math.max(0, number(form.endQuantity));
        const timeMins = Math.max(0, number(form.timeWorked));
        const timeHours = timeMins / 60;
        const scrapParts = Math.max(0, startQuantity - endQuantity);
        const yieldPercent = startQuantity > 0 ? (endQuantity / startQuantity) * 100 : 0;
        const scrapPercent = startQuantity > 0 ? Math.max(0, (scrapParts / startQuantity) * 100) : 0;
        const pph = timeHours > 0 ? endQuantity / timeHours : 0;
        const baseStandard = Math.max(0, number(standard.goodPphStd));
        const rate = Math.max(0, number(associateRate));
        const adjustedStandard = baseStandard > 0 && rate > 0 ? baseStandard / rate : 0;
        const sequenceOe = adjustedStandard > 0 ? (pph / adjustedStandard) * 100 : 0;
        const targetQuantity = adjustedStandard > 0 ? Math.floor(timeHours * adjustedStandard) : 0;

        return {
            totalInches, lengthInches, partsFromSpool, scrapParts, scrapPercent, yieldPercent,
            pph, baseStandard, adjustedStandard, targetQuantity, sequenceOe,
            startQuantity, endQuantity, timeMins
        };
    }

    function validateJob(form, result = calculations(form)) {
        const errors = {};
        if (!/^\d{6}$/.test(String(form.item || ''))) errors.item = 'Item number must be six digits.';
        if (!String(form.lot || '').trim()) errors.lot = 'Lot number is required.';
        if (!form.sequence) errors.sequence = 'Sequence is required.';
        if (number(form.timeWorked) <= 0) errors.timeWorked = 'Time worked must be greater than zero.';
        if (number(form.startQuantity) < 0) errors.startQuantity = 'Start quantity cannot be negative.';
        if (number(form.endQuantity) < 0) errors.endQuantity = 'End quantity cannot be negative.';
        if (form.sequence === 'Pull' && !String(form.pullingWraps || '').trim()) errors.pullingWraps = 'Pulling Wraps is required.';
        if (form.sequence === 'Pull' && array(form.pullingMethods).length === 0) errors.pullingMethods = 'At least one Pulling Method is required.';
        if (['Inspection', 'EV3 Inspection'].includes(form.sequence) && result.yieldPercent > 0 && result.yieldPercent < 75 && array(form.inspectionParetos).length === 0) {
            errors.inspectionParetos = 'At least one Inspection Pareto is required for low-yield inspection jobs.';
        }
        if (form.sequence === 'Pull' && result.yieldPercent > 0 && result.yieldPercent <= 85 && array(form.pullingParetos).length === 0) {
            errors.pullingParetos = 'At least one Pulling Pareto is required for low-yield pull jobs.';
        }
        return errors;
    }

    function buildJobPayload(form, result = calculations(form), workDate = today()) {
        return {
            'Date': workDate,
            'Entry Type': 'Job',
            'Time Worked': Math.max(0, number(form.timeWorked)),
            'Item': String(form.item || '').trim(),
            'Lot #': String(form.lot || '').trim(),
            'Start Quantity': Math.max(0, number(form.startQuantity)),
            'End Quantity': Math.max(0, number(form.endQuantity)),
            'Sequence': form.sequence || '',
            'Footage': number(form.footage) || '',
            'Processing Length': number(form.processingLength) || '',
            'Scrap Parts': result.scrapParts,
            'Scrap Rate %': Number(result.scrapPercent.toFixed(1)),
            'Re-Cuts': Math.max(0, number(form.recuts)),
            'Inspection Pareto': array(form.inspectionParetos).join(', '),
            'Pulling Pareto': array(form.pullingParetos).join(', '),
            'Pulling Wraps': String(form.pullingWraps || ''),
            'Pulling Method': array(form.pullingMethods).join(', '),
            'Comments': String(form.comments || '').trim()
        };
    }

    function eventMinutes(start, end) {
        if (!/^\d{2}:\d{2}$/.test(start || '') || !/^\d{2}:\d{2}$/.test(end || '')) return 0;
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        return Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute));
    }

    function validateEvent(form) {
        const errors = {};
        if (!form.event) errors.event = 'Event is required.';
        if (eventMinutes(form.eventStart, form.eventEnd) <= 0) errors.eventTime = 'End time must be after start time.';
        return errors;
    }

    function buildEventPayload(form, workDate = today()) {
        return {
            'Date': workDate,
            'Entry Type': 'Event',
            'Time Worked': eventMinutes(form.eventStart, form.eventEnd),
            'Event': form.event || '',
            'Comments': String(form.comments || '').trim()
        };
    }

    function appendJobToShift(shift, form, result = calculations(form), submittedAt = '') {
        const mapping = JXJ_CELL_MAP[form.sequence];
        if (!mapping) return shift;
        const next = JSON.parse(JSON.stringify(shift || emptyShift()));
        if (!next.tabs[mapping.cell]) next.tabs[mapping.cell] = [];
        const slot = `${mapping.prefix} ${next.tabs[mapping.cell].length + 1}`;
        next.tabs[mapping.cell].push({
            rowType: 'Job', slot, item: String(form.item || ''), lot: String(form.lot || ''),
            stdPph: result.adjustedStandard || 0, actualPph: result.pph || 0, oe: result.sequenceOe || 0,
            timeMins: result.timeMins || 0, startQty: result.startQuantity || 0, endQty: result.endQuantity || 0,
            lossReason: '', submittedAt, submissionId: null, captureStatus: 'draft'
        });
        next.activeTab = mapping.cell;
        return next;
    }

    function appendEventToShift(shift, form, submittedAt = '') {
        const next = JSON.parse(JSON.stringify(shift || emptyShift()));
        const rows = next.tabs.Events || (next.tabs.Events = []);
        rows.push({
            rowType: 'Event', slot: `Event ${rows.length + 1}`, item: form.event || '', lot: '',
            stdPph: '', actualPph: '', oe: '', timeMins: eventMinutes(form.eventStart, form.eventEnd),
            startQty: '', endQty: '', lossReason: String(form.comments || '').trim(), submittedAt,
            submissionId: null, captureStatus: 'draft'
        });
        next.activeTab = 'Events';
        return next;
    }

    function jobLogRows(shift, associateName, countermeasures = '') {
        const workDate = shift?.workDate || today();
        const rows = [];
        JXJ_TABS.forEach((cell) => {
            (shift?.tabs?.[cell] || []).forEach((row) => {
                const event = row.rowType === 'Event' || cell === 'Events';
                rows.push({
                    submissionId: row.submissionId || null,
                    captureStatus: row.captureStatus || 'draft',
                    payload: {
                        'Row ID': `${associateName}-${cell}-${workDate}-${row.slot}`,
                        'Work Date': workDate,
                        'Associate Name': associateName,
                        'Cell': cell,
                        'Job Slot': row.slot,
                        'Row Type': event ? 'Event' : 'Job',
                        'Event': event ? (row.item || '') : '',
                        'Item Number': event ? '' : (row.item || ''),
                        'Lot Number': event ? '' : (row.lot || ''),
                        'Std PPH': event ? '' : (row.stdPph || ''),
                        'Actual PPH': event ? '' : (row.actualPph || ''),
                        'OE %': event ? '' : (row.oe || ''),
                        'Time (Min)': row.timeMins || '',
                        'Start Qty': event ? '' : (row.startQty ?? ''),
                        'End Qty': event ? '' : (row.endQty ?? ''),
                        'Loss Reason': row.lossReason || '',
                        'Countermeasures': String(countermeasures || '').trim()
                    }
                });
            });
        });
        return rows;
    }

    function shiftHasUncapturedRows(shift) {
        return JXJ_TABS.some((cell) => (shift?.tabs?.[cell] || []).some((row) => row.captureStatus !== 'captured'));
    }

    function hasUnsavedWork(form, shift, mode = 'job') {
        if (form?.pendingSubmission || shiftHasUncapturedRows(shift)) return true;
        if (mode === 'event') return Boolean(form?.event || form?.eventStart || form?.eventEnd || String(form?.comments || '').trim());
        return Boolean(form?.item || form?.lot || form?.sequence || number(form?.timeWorked) || number(form?.startQuantity) || number(form?.endQuantity) || String(form?.comments || '').trim());
    }

    return {
        JXJ_CELL_MAP, JXJ_TABS, appendEventToShift, appendJobToShift, buildEventPayload, buildJobPayload,
        calculations, emptyForm, emptyShift, eventMinutes, hasUnsavedWork, jobLogRows,
        shiftHasUncapturedRows, today, validateEvent, validateJob
    };
}));
