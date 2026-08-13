const assert = require('node:assert/strict');
const test = require('node:test');
const PtfeModel = require('../public/ptfe/ptfe-model');

function validPull() {
    return {
        ...PtfeModel.emptyForm(), item: '311318', lot: '10155074-04', sequence: 'Pull',
        timeWorked: 60, footage: 100, processingLength: 12, partUnit: 'in',
        startQuantity: 100, endQuantity: 90, pullingWraps: '3', pullingMethods: ['Manual']
    };
}

test('PTFE calculations preserve spool, scrap, PPH, target, and OE behavior', () => {
    const result = PtfeModel.calculations(validPull(), { goodPphStd: 100 }, 0.5);
    assert.equal(result.totalInches, 1200);
    assert.equal(result.partsFromSpool, 100);
    assert.equal(result.scrapParts, 10);
    assert.equal(result.yieldPercent, 90);
    assert.equal(result.scrapPercent, 10);
    assert.equal(result.pph, 90);
    assert.equal(result.adjustedStandard, 200);
    assert.equal(result.targetQuantity, 200);
    assert.equal(result.sequenceOe, 45);
});

test('PTFE calculations convert centimeter and millimeter part lengths', () => {
    assert.equal(PtfeModel.calculations({ ...validPull(), processingLength: 2.54, partUnit: 'cm' }).lengthInches, 1);
    assert.equal(PtfeModel.calculations({ ...validPull(), processingLength: 25.4, partUnit: 'mm' }).lengthInches, 1);
});

test('PTFE validation preserves pull and low-yield Pareto rules', () => {
    const pull = validPull();
    assert.deepEqual(PtfeModel.validateJob(pull), {});
    assert.match(PtfeModel.validateJob({ ...pull, pullingWraps: '' }).pullingWraps, /required/);
    assert.match(PtfeModel.validateJob({ ...pull, pullingMethods: [] }).pullingMethods, /required/);
    assert.match(PtfeModel.validateJob({ ...pull, endQuantity: 80 }).pullingParetos, /Pulling Pareto/);
    assert.deepEqual(PtfeModel.validateJob({ ...pull, endQuantity: 80, pullingParetos: ['Tear'] }), {});

    const inspection = { ...pull, sequence: 'Inspection', pullingWraps: '', pullingMethods: [], endQuantity: 70 };
    assert.match(PtfeModel.validateJob(inspection).inspectionParetos, /Inspection Pareto/);
    assert.deepEqual(PtfeModel.validateJob({ ...inspection, inspectionParetos: ['Surface'] }), {});
});

test('PTFE master-log payload preserves exact destination titles', () => {
    const form = { ...validPull(), recuts: 2, pullingParetos: ['Tear'], comments: 'Checked' };
    const payload = PtfeModel.buildJobPayload(form, PtfeModel.calculations(form), '2026-08-13');
    assert.deepEqual(Object.keys(payload), [
        'Date', 'Entry Type', 'Time Worked', 'Item', 'Lot #', 'Start Quantity', 'End Quantity', 'Sequence',
        'Footage', 'Processing Length', 'Scrap Parts', 'Scrap Rate %', 'Re-Cuts', 'Inspection Pareto',
        'Pulling Pareto', 'Pulling Wraps', 'Pulling Method', 'Comments'
    ]);
    assert.equal(payload['Scrap Parts'], 10);
    assert.equal(payload['Pulling Pareto'], 'Tear');
});

test('PTFE event validation and payload preserve calculated duration', () => {
    const form = { ...PtfeModel.emptyForm(), event: 'Break', eventStart: '10:00', eventEnd: '10:15', comments: 'Normal' };
    assert.deepEqual(PtfeModel.validateEvent(form), {});
    assert.deepEqual(PtfeModel.buildEventPayload(form, '2026-08-13'), {
        'Date': '2026-08-13', 'Entry Type': 'Event', 'Time Worked': 15, 'Event': 'Break', 'Comments': 'Normal'
    });
    assert.match(PtfeModel.validateEvent({ ...form, eventEnd: '09:59' }).eventTime, /after start/);
});

test('PTFE Job x Job mapping preserves cell, slot, and one-row payloads', () => {
    const form = validPull();
    let shift = PtfeModel.appendJobToShift(PtfeModel.emptyShift('2026-08-13'), form, PtfeModel.calculations(form), '08:00 AM');
    shift = PtfeModel.appendEventToShift(shift, { ...PtfeModel.emptyForm(), event: 'Break', eventStart: '10:00', eventEnd: '10:15' }, '10:15 AM');
    const rows = PtfeModel.jobLogRows(shift, 'Test Associate', 'Adjusted setup');
    assert.equal(rows.length, 2);
    assert.equal(rows[0].payload['Cell'], 'Pull');
    assert.equal(rows[0].payload['Job Slot'], 'Job 1');
    assert.equal(rows[0].payload['Row ID'], 'Test Associate-Pull-2026-08-13-Job 1');
    assert.equal(rows[0].payload.Countermeasures, 'Adjusted setup');
    assert.equal(rows[1].payload['Row Type'], 'Event');
    assert.equal(rows[1].payload.Event, 'Break');
    assert.equal(rows[1].payload['Time Min'], 15);
});

test('PTFE shift remains dirty until every Job x Job row is captured', () => {
    const shift = PtfeModel.appendJobToShift(PtfeModel.emptyShift(), validPull(), PtfeModel.calculations(validPull()));
    assert.equal(PtfeModel.shiftHasUncapturedRows(shift), true);
    assert.equal(PtfeModel.hasUnsavedWork(PtfeModel.emptyForm(), shift), true);
    shift.tabs.Pull[0].captureStatus = 'captured';
    assert.equal(PtfeModel.shiftHasUncapturedRows(shift), false);
});

test('PTFE warnings preserve long-time, zero-output, and repeated low-OE checks', () => {
    const form = { ...validPull(), timeWorked: 721, endQuantity: 0 };
    const result = PtfeModel.calculations(form, { goodPphStd: 100 }, 1);
    const warnings = PtfeModel.qualityWarnings(form, result, PtfeModel.emptyShift());
    assert.equal(warnings.length, 2);

    const low = { ...validPull(), endQuantity: 50 };
    const lowResult = PtfeModel.calculations(low, { goodPphStd: 100 }, 1);
    const shift = PtfeModel.appendJobToShift(PtfeModel.emptyShift(), low, lowResult);
    assert.match(PtfeModel.qualityWarnings(low, lowResult, shift).join(' '), /low-OE/);
});
