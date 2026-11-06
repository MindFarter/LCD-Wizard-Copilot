'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeConnectivity, renderConnectivityReport } = require('../lib/connectivity');

test('summarizes LCD Wizard transport and workspace source files generically', () => {
  const report = summarizeConnectivity({
    project: {
      target: 'arduino',
      hardware: { mcu: 'esp32c6' },
      webSources: [],
      bluetooth: { enabled: true, role: 'hmi', name: 'Panel' }
    },
    firmwareFiles: ['firmware/app_logic.cpp'],
    serverFiles: ['server/main.py']
  });
  const text = renderConnectivityReport(report);
  assert.match(text, /Export target: arduino/);
  assert.match(text, /Bluetooth: hmi \(Panel\)/);
  assert.match(text, /firmware\/app_logic\.cpp/);
  assert.match(text, /server\/main\.py/);
});

test('warns that HID is not a general BLE data API', () => {
  const report = summarizeConnectivity({
    project: { target: 'arduino', bluetooth: { enabled: true, role: 'hid', name: 'Panel' } }
  });
  assert.match(report.findings.join('\n'), /HID configuration alone is not a general BLE data API/);
});

test('reports missing exports and server files without claiming live failures', () => {
  const report = summarizeConnectivity({ project: { target: 'esp-idf' } });
  const text = renderConnectivityReport(report);
  assert.match(text, /No generated firmware files were found/);
  assert.match(text, /No common server entry-point files were identified/);
  assert.match(text, /not a live network, BLE, firmware, or hardware test/);
});