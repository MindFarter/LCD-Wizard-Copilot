'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { findTopics, renderDocs } = require('../lib/docs');

test('finds focused official documentation topics by ID and alias', () => {
  assert.equal(findTopics('settings')[0].url, 'https://lcdwizard.com/docs/data#settings');
  assert.equal(findTopics('data binding')[0].id, 'bindings');
  assert.equal(findTopics('automation')[0].id, 'automations');
});

test('returns official links rather than copied documentation pages', () => {
  const result = renderDocs('all');
  assert.match(result, /https:\/\/lcdwizard\.com\/docs\//);
  assert.match(result, /ESPHome export/);
  assert.match(result, /Variables and formulas/);
});
