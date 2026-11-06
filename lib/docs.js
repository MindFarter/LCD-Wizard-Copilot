'use strict';

const TOPICS = [
  {
    id: 'project',
    title: 'Project structure and core concepts',
    url: 'https://lcdwizard.com/docs/concepts',
    summary: 'The project is one JSON document covering the design, hardware, data, assets, and export settings.'
  },
  {
    id: 'screens',
    title: 'Screens and widgets',
    url: 'https://lcdwizard.com/docs/widgets',
    summary: 'Screens contain named widgets; widget names and types carry into generated UI code.'
  },
  {
    id: 'hardware',
    title: 'Boards and hardware',
    url: 'https://lcdwizard.com/docs/boards',
    summary: 'Board, display, touch, buses, peripherals, inputs, and pins determine the generated hardware layer.'
  },
  {
    id: 'data',
    title: 'Data layer overview',
    url: 'https://lcdwizard.com/docs/data',
    summary: 'Variables hold readings or state, settings persist selected values, and bindings connect data to widget properties.',
    aliases: ['settings', 'variables', 'bindings']
  },
  {
    id: 'automations',
    title: 'Automations and events',
    url: 'https://lcdwizard.com/docs/automations',
    summary: 'Automations pair a trigger with actions and are evaluated by generated firmware.'
  },
  {
    id: 'web-data',
    title: 'Web data and HTTP',
    url: 'https://lcdwizard.com/docs/data#web-data',
    summary: 'A Web data source configures an HTTP request, request body, response paths, and refresh behavior.'
  },
  {
    id: 'network-data',
    title: 'Network data transports',
    url: 'https://lcdwizard.com/docs/data#network-data',
    summary: 'Network data supports documented transports and message schemas; check target and transport limitations.'
  },
  {
    id: 'bluetooth',
    title: 'Bluetooth roles and HMI links',
    url: 'https://lcdwizard.com/docs/bluetooth',
    summary: 'Bluetooth behavior depends on the selected role, board radio, and generated target.'
  },
  {
    id: 'export',
    title: 'Exported files and regeneration',
    url: 'https://lcdwizard.com/docs/export',
    summary: 'Exports regenerate generated files; custom code should live in files the exporter does not overwrite.'
  },
  {
    id: 'own-code',
    title: 'Integrating user code',
    url: 'https://lcdwizard.com/docs/own-code',
    summary: 'User-owned files, hooks, generated accessors, and callbacks are the supported bridge to custom code.'
  },
  {
    id: 'preview',
    title: 'Preview and simulation limits',
    url: 'https://lcdwizard.com/docs/preview',
    summary: 'Preview exercises design logic with simulated inputs; it is not a substitute for hardware testing.'
  },
  {
    id: 'interface',
    title: 'Designer interface and project settings',
    url: 'https://lcdwizard.com/docs/interface',
    summary: 'Find the designer panels, project-level settings, and where each part of a design is configured.',
    aliases: ['settings', 'menus', 'panels']
  },
  {
    id: 'variables',
    title: 'Variables and formulas',
    url: 'https://lcdwizard.com/docs/data#variables',
    summary: 'Variables hold sensor or user values; sources and formulas determine how values enter the design.',
    aliases: ['data', 'source', 'formula', 'sensor']
  },
  {
    id: 'bindings',
    title: 'Widget data bindings',
    url: 'https://lcdwizard.com/docs/data#bindings',
    summary: 'Bindings connect variables and widget properties, including one-way and two-way control bindings.',
    aliases: ['data binding', 'widget property', 'two-way']
  },
  {
    id: 'settings',
    title: 'Persistent settings and secrets',
    url: 'https://lcdwizard.com/docs/data#settings',
    summary: 'Settings persist values across restarts; secrets have special storage and export restrictions.',
    aliases: ['nvs', 'persist', 'password', 'secret']
  },
  {
    id: 'events',
    title: 'Widget events and actions',
    url: 'https://lcdwizard.com/docs/events',
    summary: 'Events and actions describe what a widget or screen does in response to interaction.',
    aliases: ['button', 'callback', 'action']
  },
  {
    id: 'peripherals',
    title: 'Peripherals and I/O',
    url: 'https://lcdwizard.com/docs/peripherals',
    summary: 'Configure buses, sensors, expanders, analog inputs, and digital I/O for supported boards.',
    aliases: ['sensor', 'i2c', 'spi', 'gpio', 'hardware']
  },
  {
    id: 'wifi',
    title: 'Wi-Fi setup and network behavior',
    url: 'https://lcdwizard.com/docs/network',
    summary: 'Review Wi-Fi setup, network values, supported board targets, and documented limitations.',
    aliases: ['wifi', 'network', 'ssid']
  },
  {
    id: 'mqtt',
    title: 'MQTT data sources and actions',
    url: 'https://lcdwizard.com/docs/data#mqtt',
    summary: 'Read the documented MQTT roles, topics, publish actions, and target limitations.',
    aliases: ['broker', 'topic', 'publish']
  },
  {
    id: 'assets',
    title: 'Images, fonts, and assets',
    url: 'https://lcdwizard.com/docs/images',
    summary: 'Add visual assets and understand how they are packaged for the board filesystem or firmware.',
    aliases: ['image', 'font', 'icon', 'filesystem']
  },
  {
    id: 'charts',
    title: 'Charts and data series',
    url: 'https://lcdwizard.com/docs/charts',
    summary: 'Configure chart series, axes, and data bindings.',
    aliases: ['graph', 'series', 'plot']
  },
  {
    id: 'components',
    title: 'Reusable components',
    url: 'https://lcdwizard.com/docs/components',
    summary: 'Create reusable design components and understand how their instances relate to the source component.'
  },
  {
    id: 'esp-idf',
    title: 'ESP-IDF export',
    url: 'https://lcdwizard.com/docs/espidf',
    summary: 'Review ESP-IDF target-specific export structure and build requirements.',
    aliases: ['idf', 'c']
  },
  {
    id: 'micropython',
    title: 'MicroPython export',
    url: 'https://lcdwizard.com/docs/micropython',
    summary: 'Review MicroPython export behavior and target limitations.'
  },
  {
    id: 'esphome',
    title: 'ESPHome export',
    url: 'https://lcdwizard.com/docs/esphome',
    summary: 'Review ESPHome export behavior and target limitations.'
  },
  {
    id: 'flashing',
    title: 'Build, flash, and configure a board',
    url: 'https://lcdwizard.com/docs/flashing',
    summary: 'Follow the documented build and flashing steps for generated firmware.',
    aliases: ['upload', 'compile', 'platformio', 'arduino ide']
  },
  {
    id: 'troubleshooting',
    title: 'Hardware troubleshooting',
    url: 'https://lcdwizard.com/docs/troubleshooting',
    summary: 'Use documented symptoms and checks to diagnose displays, touch, and board behavior.'
  }
];

function findTopics(query = 'all') {
  const term = String(query || 'all').trim().toLowerCase();
  if (!term || term === 'all') return TOPICS;
  const exact = TOPICS.find((topic) => topic.id === term);
  if (exact) return [exact];
  const found = TOPICS.filter((topic) => `${topic.id} ${topic.title} ${topic.summary} ${(topic.aliases || []).join(' ')}`.toLowerCase().includes(term));
  return found;
}

function renderDocs(query = 'all') {
  const topics = findTopics(query);
  if (!topics.length) return 'No matching documentation topic. Available topics: ' + TOPICS.map((topic) => topic.id).join(', ');
  return topics.map((topic) => `## ${topic.title}\n${topic.summary}\nOfficial documentation: ${topic.url}`).join('\n\n');
}

module.exports = { TOPICS, findTopics, renderDocs };