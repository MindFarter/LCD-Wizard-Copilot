# LCD Wizard Copilot web tools

These are local, self-contained webview tools. They do not call a server, load remote scripts, or write project files.

- `lcd-wizard-formula-builder.html` is based on the user-provided LCD Wizard Formula Builder. Formula test values are evaluated by the allow-listed `formula-evaluator.js`; do not reintroduce `eval` or `new Function`.
- `project-assistant.html` is based on the user-provided LCD Wizard Project Assistant. Keep user input escaped anywhere HTML is rendered.

The extension root MIT license applies to the bundled tools. Review all source and license notices before public release.