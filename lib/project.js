'use strict';

const SENSITIVE = /password|passwd|pwd|secret|token|access[_-]?token|api[_-]?key|authorization|bearer|credential|private[_-]?key|ssid/i;
const SENSITIVE_SEGMENT = /(?:^|[._\-\s])(?:pass|key)(?:$|[._\-\s])/i;
const MAX_SCREENS = 100;
const MAX_WIDGETS = 600;
const MAX_VARIABLES = 500;
const MAX_AUTOMATIONS = 200;

function safeText(value, field = '') {
  if (value === undefined || value === null) return undefined;
  if (SENSITIVE.test(field) || SENSITIVE_SEGMENT.test(field)) return '[redacted]';
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return undefined;

  let text = String(value);
  text = text
    .replace(/(https?:\/\/)[^/@\s:]+:[^/@\s]+@/gi, '$1[redacted]@')
    .replace(/([?&](?:key|api[_-]?key|appid|token|access_token|auth|password|secret|signature)=)[^&#\s]*/gi, '$1[redacted]')
    .replace(/\b(bearer\s+)[A-Za-z0-9._~+\/-]+=*/gi, '$1[redacted]')
    .replace(/\b(password|passwd|token|api[_-]?key|secret)\s*[:=]\s*[^\s,;&]+/gi, '$1=[redacted]');

  return text.length > 300 ? text.slice(0, 300) + '…' : text;
}

function safeName(value) {
  const text = safeText(value);
  if (text === undefined) return undefined;
  return SENSITIVE.test(text) || SENSITIVE_SEGMENT.test(text) ? '[redacted]' : text;
}

function safeFormula(value) {
  const text = safeText(value, 'formula');
  if (text === undefined) return undefined;
  if (SENSITIVE.test(text) || SENSITIVE_SEGMENT.test(text) || /["'`]/.test(text)) return '[redacted expression]';
  return text.replace(/[\r\n]+/g, ' ');
}

function isLcdWizardProject(project) {
  return Boolean(project && typeof project === 'object' && !Array.isArray(project) &&
    Array.isArray(project.screens) && project.hardware && typeof project.hardware === 'object');
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function field(record, keys) {
  for (const key of keys) {
    if (record && Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  return undefined;
}

function summarizeBinding(binding) {
  return {
    property: safeName(field(binding, ['property', 'drives', 'target'])),
    variable: safeName(field(binding, ['variable', 'source', 'from'])),
    direction: safeName(binding && binding.direction),
    hasFormula: Boolean(binding && binding.formula)
  };
}

function summarizeEvent(event) {
  const actions = list(event && event.actions).map((action) => safeName(field(action, ['action', 'type', 'name']))).filter(Boolean);
  return {
    trigger: safeName(field(event, ['event', 'trigger', 'type', 'name'])),
    actions
  };
}

function summarizeWidget(widget, budget, depth = 0) {
  if (!widget || typeof widget !== 'object' || budget.count >= MAX_WIDGETS || depth > 20) return null;
  budget.count += 1;

  return {
    name: safeName(widget.name),
    type: safeName(widget.type),
    bindings: list(widget.bindings).slice(0, 30).map(summarizeBinding),
    events: list(widget.events).slice(0, 30).map(summarizeEvent),
    children: list(widget.children).map((child) => summarizeWidget(child, budget, depth + 1)).filter(Boolean)
  };
}

function summarizeAutomation(automation) {
  return {
    name: safeName(automation && automation.name),
    enabled: Boolean(automation && automation.enabled),
    trigger: safeName(automation && automation.trigger && automation.trigger.kind),
    actions: list(automation && automation.actions).slice(0, 50)
      .map((action) => safeName(field(action, ['action', 'type', 'name'])))
      .filter(Boolean)
  };
}

function summarizeProject(project, label = 'LCD Wizard project') {
  if (!isLcdWizardProject(project)) {
    throw new TypeError('Expected an LCD Wizard project JSON with hardware and screens.');
  }

  const hardware = project.hardware;
  const display = hardware.display || {};
  const touch = hardware.touch || {};
  const screens = list(project.screens).slice(0, MAX_SCREENS);
  const widgetBudget = { count: 0 };
  const variables = list(project.variables).slice(0, MAX_VARIABLES).map((variable) => ({
    name: safeName(variable.name),
    type: safeName(variable.type),
    unit: safeName(variable.unit),
    source: {
      kind: safeName(variable.source && variable.source.kind),
      reference: safeName(variable.source && variable.source.ref),
      channel: safeName(variable.source && variable.source.channel)
    },
    formula: safeFormula(variable.formula),
    hasFormula: Boolean(variable.formula),
    savedToSettings: Boolean(variable.saveToConfig || variable.persist),
    hasInitialValue: Object.prototype.hasOwnProperty.call(variable, 'initial')
  }));

  const settings = list(project.config).slice(0, 200).map((setting) => {
    const key = safeName(field(setting, ['name', 'key', 'id']));
    const secret = Boolean(setting && (setting.secret || SENSITIVE.test(String(field(setting, ['name', 'key', 'id']) || ''))));
    return {
      key: secret ? '[redacted]' : key,
      label: safeName(setting && setting.label),
      type: safeName(setting && setting.type),
      secret,
      hasDefault: Object.prototype.hasOwnProperty.call(setting || {}, 'def') || Object.prototype.hasOwnProperty.call(setting || {}, 'default'),
      autoSave: Boolean(setting && setting.autoSave)
    };
  });

  return {
    label: safeName(label),
    project: {
      name: safeName(project.name),
      target: safeName(project.target),
      version: safeText(project.version),
      lvglVersion: safeName(project.lvglVersion)
    },
    hardware: {
      board: safeName(hardware.board),
      mcu: safeName(hardware.mcu),
      graphicsLibrary: safeName(hardware.gfxLib),
      display: {
        driver: safeName(display.driver),
        interface: safeName(display.interface),
        width: safeText(display.width),
        height: safeText(display.height),
        rotation: safeText(display.rotation)
      },
      touchDriver: safeName(touch.driver),
      buses: list(hardware.buses).slice(0, 50).map((bus) => ({
        name: safeName(bus && bus.name), kind: safeName(bus && bus.kind)
      })),
      peripherals: list(hardware.peripherals).slice(0, 100).map((device) => ({
        name: safeName(device && device.name), type: safeName(device && device.type), bus: safeName(device && device.busId)
      })),
      analogInputs: list(hardware.analogInputs).slice(0, 100).map((input) => ({
        name: safeName(input && input.name), pin: safeText(input && input.pin), unit: safeName(input && input.unit)
      })),
      digitalIO: list(hardware.digitalIO).slice(0, 100).map((io) => ({
        name: safeName(io && io.name), pin: safeText(io && io.pin), direction: safeName(io && io.dir)
      }))
    },
    screens: screens.map((screen) => ({
      name: safeName(screen && screen.name),
      type: safeName(screen && screen.type),
      width: safeText(screen && screen.width),
      height: safeText(screen && screen.height),
      bindings: list(screen && screen.bindings).slice(0, 50).map(summarizeBinding),
      events: list(screen && screen.events).slice(0, 50).map(summarizeEvent),
      children: list(screen && screen.children).map((widget) => summarizeWidget(widget, widgetBudget)).filter(Boolean)
    })),
    variables,
    settings,
    automations: list(project.automations).slice(0, MAX_AUTOMATIONS).map(summarizeAutomation),
    dataSources: {
      webSourceCount: list(project.webSources).length,
      bluetooth: {
        enabled: Boolean(project.bluetooth && project.bluetooth.enabled),
        role: safeName(project.bluetooth && project.bluetooth.role),
        name: safeName(project.bluetooth && project.bluetooth.name)
      }
    },
    assets: list(project.assets).length,
    fonts: list(project.fonts).length,
    widgetCount: widgetBudget.count,
    truncated: {
      screens: list(project.screens).length > MAX_SCREENS,
      variables: list(project.variables).length > MAX_VARIABLES,
      automations: list(project.automations).length > MAX_AUTOMATIONS,
      widgets: widgetBudget.count >= MAX_WIDGETS
    }
  };
}

function renderProjectReport(report) {
  const lines = [
    `# LCD Wizard project: ${report.project.name || report.label}`,
    `- Target: ${report.project.target || 'unknown'}; LVGL ${report.project.lvglVersion || 'unknown'}`,
    `- Hardware: ${report.hardware.board || 'unknown'} / ${report.hardware.mcu || 'unknown'}; display ${report.hardware.display.width || '?'}x${report.hardware.display.height || '?'}`,
    `- ${report.screens.length} screens, ${report.widgetCount} widgets, ${report.variables.length} variables, ${report.settings.length} settings, ${report.automations.length} automations`,
    '',
    '## Hardware',
    `- Display: ${report.hardware.display.driver || 'unknown'} over ${report.hardware.display.interface || 'unknown'}; touch: ${report.hardware.touchDriver || 'none reported'}`
  ];

  for (const bus of report.hardware.buses) lines.push(`- Bus: ${bus.name || 'unnamed'} (${bus.kind || 'unknown'})`);
  for (const device of report.hardware.peripherals) lines.push(`- Peripheral: ${device.name || 'unnamed'} (${device.type || 'unknown'}; bus ${device.bus || 'unspecified'})`);
  for (const input of report.hardware.analogInputs) lines.push(`- Analog input: ${input.name || 'unnamed'} on pin ${input.pin ?? '?'}`);
  for (const io of report.hardware.digitalIO) lines.push(`- Digital I/O: ${io.name || 'unnamed'} (${io.direction || 'unspecified'}) on pin ${io.pin ?? '?'}`);

  lines.push('', '## Screens, widgets, events, and bindings');
  const appendWidget = (widget, depth) => {
    const indent = '  '.repeat(depth);
    lines.push(`${indent}- ${widget.name || 'Unnamed'} (${widget.type || 'unknown'})`);
    for (const binding of widget.bindings) {
      lines.push(`${indent}  - Binding: ${binding.property || 'property'} <- ${binding.variable || 'source not recorded'}${binding.direction ? ' (' + binding.direction + ')' : ''}${binding.hasFormula ? '; formula configured' : ''}`);
    }
    for (const event of widget.events) {
      lines.push(`${indent}  - Event: ${event.trigger || 'unspecified'} -> ${event.actions.join(', ') || 'no recognized actions'}`);
    }
    for (const child of widget.children) appendWidget(child, depth + 1);
  };
  for (const screen of report.screens) {
    lines.push(`- Screen: ${screen.name || 'Unnamed'} (${screen.type || 'unknown'}, ${screen.width || '?'}x${screen.height || '?'})`);
    for (const binding of screen.bindings) {
      lines.push(`  - Screen binding: ${binding.property || 'property'} <- ${binding.variable || 'source not recorded'}`);
    }
    for (const event of screen.events) {
      lines.push(`  - Screen event: ${event.trigger || 'unspecified'} -> ${event.actions.join(', ') || 'no recognized actions'}`);
    }
    for (const widget of screen.children) appendWidget(widget, 1);
  }

  lines.push('', '## Variables');
  for (const variable of report.variables) {
    const formula = variable.formula ? `; formula: ${variable.formula}` : '';
    lines.push(`- ${variable.name || '[redacted]'} (${variable.type || 'unknown'}${variable.unit ? ', ' + variable.unit : ''}); source ${variable.source.kind || 'unknown'}${variable.source.reference ? ' / ' + variable.source.reference : ''}${variable.source.channel ? ' / ' + variable.source.channel : ''}${formula}${variable.savedToSettings ? '; saved to settings' : ''}`);
  }

  lines.push('', '## Settings');
  for (const setting of report.settings) {
    lines.push(`- ${setting.key || '[redacted]'} (${setting.type || 'unknown'}${setting.secret ? ', secret' : ''}${setting.autoSave ? ', autosaved' : ''}${setting.hasDefault ? ', default configured but value omitted' : ''})`);
  }

  lines.push('', '## Automations');
  for (const automation of report.automations) {
    lines.push(`- ${automation.name || 'Unnamed'}: ${automation.enabled ? 'enabled' : 'disabled'}, ${automation.trigger || 'unknown trigger'} -> ${automation.actions.join(', ') || 'no actions'}`);
  }

  lines.push('', '## Data sources');
  lines.push(`- Web data sources: ${report.dataSources.webSourceCount}`);
  lines.push(`- Bluetooth: ${report.dataSources.bluetooth.enabled ? report.dataSources.bluetooth.role || 'enabled' : 'off'}${report.dataSources.bluetooth.name ? ' (' + report.dataSources.bluetooth.name + ')' : ''}`);
  lines.push('- See the official Web data, Network data, and MQTT references for transport-specific fields and limits.');
  lines.push('', '- Secret values and setting defaults are not included.');
  if (Object.values(report.truncated).some(Boolean)) lines.push('- Some project collections were truncated to keep the report bounded.');
  return lines.join('\n');
}

module.exports = { isLcdWizardProject, safeText, summarizeProject, renderProjectReport };