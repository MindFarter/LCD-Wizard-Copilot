'use strict';

const { safeText } = require('./project');

const TRANSPORT_DOCS = [
  ['Web data and HTTP', 'https://lcdwizard.com/docs/data#web-data'],
  ['Network data', 'https://lcdwizard.com/docs/data#network-data'],
  ['MQTT', 'https://lcdwizard.com/docs/data#mqtt'],
  ['Bluetooth and HMI links', 'https://lcdwizard.com/docs/bluetooth'],
  ['Exported files and regeneration', 'https://lcdwizard.com/docs/export'],
  ['Your own code', 'https://lcdwizard.com/docs/own-code']
];

function safePath(value) {
  return String(value || '').replace(/[\r\n]/g, '').slice(0, 240);
}

function summarizeConnectivity({ project, firmwareFiles = [], serverFiles = [] } = {}) {
  if (!project || typeof project !== 'object') throw new TypeError('An LCD Wizard project is required.');
  const bluetooth = project.bluetooth && typeof project.bluetooth === 'object' ? project.bluetooth : {};
  const webSourceCount = Array.isArray(project.webSources) ? project.webSources.length : 0;
  const target = safeText(project.target) || 'not specified';
  const mcu = safeText(project.hardware && project.hardware.mcu) || 'not specified';
  const role = bluetooth.enabled ? safeText(bluetooth.role) || 'unspecified' : 'off';
  const name = bluetooth.enabled ? safeText(bluetooth.name) || 'not specified' : '';
  const firmware = [...new Set(firmwareFiles.map(safePath).filter(Boolean))].sort();
  const server = [...new Set(serverFiles.map(safePath).filter(Boolean))].sort();
  const findings = [];

  if (bluetooth.enabled && bluetooth.role === 'hid') {
    findings.push('Bluetooth is configured as HID (a keyboard role). For structured data exchange with a host, review LCD Wizard’s HMI link role; HID configuration alone is not a general BLE data API.');
  }
  if (bluetooth.enabled && bluetooth.role === 'hmi') {
    findings.push('Bluetooth is configured as an HMI link. Confirm the generated service, characteristics, line framing, and variable permissions in the exported firmware before writing a host client.');
  }
  if (!firmware.length) findings.push('No generated firmware files were found in the workspace, so the actual transport contract cannot yet be checked against the export.');
  if (!server.length) findings.push('No common server entry-point files were identified. Add or select the server workspace folder to plan a concrete interface.');
  if (!webSourceCount) findings.push('The recognized LCD Wizard project has no Web data sources. If the board should call a server over HTTP, configure a Web data source and check the target’s documented limits.');

  return { target, mcu, bluetooth: { role, name }, webSourceCount, firmwareFiles: firmware, serverFiles: server, findings, docs: TRANSPORT_DOCS };
}

function renderConnectivityReport(report) {
  return [
    '# LCD Wizard board/server integration context',
    `- Export target: ${report.target}; MCU: ${report.mcu}`,
    `- Web data sources: ${report.webSourceCount}`,
    `- Bluetooth: ${report.bluetooth.role}${report.bluetooth.name ? ' (' + report.bluetooth.name + ')' : ''}`,
    '',
    '## Generated firmware found',
    ...(report.firmwareFiles.length ? report.firmwareFiles.map((file) => `- ${file}`) : ['- None recognized']),
    '',
    '## Server entry points found',
    ...(report.serverFiles.length ? report.serverFiles.map((file) => `- ${file}`) : ['- None recognized']),
    '',
    '## Findings',
    ...(report.findings.length ? report.findings.map((finding) => `- ${finding}`) : ['- No immediate configuration warning detected.']),
    '',
    '## Official LCD Wizard references',
    ...report.docs.map(([title, url]) => `- [${title}](${url})`),
    '',
    'This is a workspace inventory and documentation guide, not a live network, BLE, firmware, or hardware test. A source file being present does not prove its behavior.'
  ].join('\n');
}

module.exports = { summarizeConnectivity, renderConnectivityReport };