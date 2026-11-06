'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isLcdWizardProject, summarizeProject, renderProjectReport } = require('../lib/project');

function fixture() {
  return {
    name: 'Sample LCD Wizard project',
    target: 'arduino',
    lvglVersion: '9',
    hardware: {
      board: 'Waveshare ESP32-C6',
      mcu: 'esp32c6',
      gfxLib: 'arduino_gfx',
      display: { driver: 'jd9853', width: 172, height: 320 },
      touch: { driver: 'cst816' },
      buses: [{ name: 'I2C', kind: 'i2c' }],
      peripherals: [{ name: 'Sensor', type: 'bme280', busId: 'i2c-1' }],
      analogInputs: [],
      digitalIO: []
    },
    screens: [{
      name: 'Overview',
      type: 'screen',
      width: 172,
      height: 320,
      children: [{
        name: 'Soil tension',
        type: 'label',
        bindings: [{ property: 'text', variable: 'soil_tension', direction: 'variable-to-widget' }],
        events: []
      }],
      bindings: [],
      events: []
    }],
    variables: [{
      name: 'soil_tension',
      type: 'Float',
      unit: 'kPa',
      source: { kind: 'peripheral', ref: 'sensor-1', channel: 'tension' },
      formula: 'raw * 10',
      initial: 5,
      saveToConfig: true
    }],
    config: [
      { key: 'display.brightness', label: 'Brightness', type: 'Integer', def: '70', secret: false },
      { key: 'wifi.pass', label: 'Wi-Fi password', type: 'Text', def: 'never-output-this', secret: true }
    ],
    automations: [{
      name: 'Warn when dry',
      enabled: true,
      trigger: { kind: 'Variable changes', params: { variable: 'soil_tension' } },
      actions: [{ action: 'Set variable', params: { variable: 'alert' } }]
    }],
    webSources: [{
      name: 'Weather',
      method: 'GET',
      address: 'https://user:password@example.test/api/token/private-value?token=private-value',
      values: []
    }],
    bluetooth: { enabled: true, role: 'hmi', name: 'Demo panel' },
    assets: [],
    fonts: []
  };
}

test('recognizes an LCD Wizard project by its hardware and screen structure', () => {
  assert.equal(isLcdWizardProject(fixture()), true);
  assert.equal(isLcdWizardProject({ screens: [], hardware: null }), false);
});

test('summarizes the project domains needed for device/server work', () => {
  const report = summarizeProject(fixture(), 'tensiometer/Eco2UI.slw.json');
  assert.equal(report.screens.length, 1);
  assert.equal(report.widgetCount, 1);
  assert.equal(report.variables[0].name, 'soil_tension');
  assert.equal(report.screens[0].children[0].bindings[0].variable, 'soil_tension');
  assert.equal(report.automations[0].trigger, 'Variable changes');
  assert.equal(report.settings.length, 2);
  assert.equal(report.dataSources.bluetooth.role, 'hmi');
  const text = renderProjectReport(report);
  assert.match(text, /Binding: text <- soil_tension/);
  assert.match(text, /formula: raw \* 10/);
});

test('never includes setting defaults or URL credentials in the report', () => {
  const project = fixture();
  project.variables.push({ name: 'credential', type: 'Text', formula: '"token=hidden-literal"', source: {} });
  const report = JSON.stringify(summarizeProject(project));
  assert.doesNotMatch(report, /never-output-this|private-value|user:password|hidden-literal/);
  assert.match(report, /\[redacted\]/);
});