'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const tools = path.join(__dirname, '..', 'media', 'tools');
const formula = fs.readFileSync(path.join(tools, 'lcd-wizard-formula-builder.html'), 'utf8');
const assistant = fs.readFileSync(path.join(tools, 'lcd_wizard_project_assistant.html'), 'utf8');

test('Formula Builder loads the shared local evaluator and avoids dynamic code execution', () => {
  assert.match(formula, /src="formula-evaluator\.js"/);
  assert.equal(fs.existsSync(path.join(tools, 'formula-evaluator.js')), true);
  assert.doesNotMatch(formula, /new Function|\beval\s*\(/);
});

test('Project Assistant avoids inline handlers and escapes user form values', () => {
  assert.doesNotMatch(assistant, /\bonclick\s*=/i);
  assert.match(assistant, /function esc\(value\)/);
  assert.match(assistant, /value="\$\{esc\(answers\[key\]/);
});