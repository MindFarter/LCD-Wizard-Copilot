'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, tokenize, variablesIn } = require('../media/tools/formula-evaluator');

test('evaluates LCD Wizard arithmetic, comparisons, and conditional formulas', () => {
  assert.equal(evaluate('map(raw, 0, 100, 0, 10)', { raw: 50 }), 5);
  assert.equal(evaluate('temperature > 30 && battery <= 50', { temperature: 31, battery: 49 }), true);
  assert.equal(evaluate('battery < 15 ? 0xFF0000 : 0x00C000', { battery: 10 }), 0xFF0000);
});

test('evaluates safe functions and previous-value helpers', () => {
  assert.equal(evaluate('constrain(max(a, b) * 2, 0, 100)', { a: 12, b: 15 }), 30);
  assert.equal(evaluate('delta(pressure) * 60', { pressure: 101 }, { pressure: 100 }), 60);
  assert.equal(evaluate('prev(pressure)', {}, { pressure: 99 }), 99);
});

test('extracts current and previous sample names for the test form', () => {
  assert.deepEqual(variablesIn('delta(s12.temp) + prev(battery)'), {
    variables: ['s12.temp'],
    previous: ['s12.temp', 'battery']
  });
});

test('rejects executable JavaScript and unsupported identifiers', () => {
  assert.throws(() => evaluate('raw; globalThis.pwned = true', { raw: 1 }), /Unsupported character/);
  assert.throws(() => evaluate('constructor(1)', {}), /not supported/);
  assert.throws(() => evaluate('missing + 1', {}), /sample value/);
});