# LCD Wizard Copilot

A community-built, MIT-licensed VS Code extension that gives Copilot project-aware context for LCD Wizard designs and helps reason about generated boards connecting to host applications and servers.

This is an independent project intended for review and possible adoption by the LCD Wizard team. It is not an official LCD Wizard product unless they choose to adopt it. The extension has no paid features or service keys; Copilot chat features require a Copilot model available in VS Code.

## Features

- Summarizes an LCD Wizard `.slw.json`: target, hardware, screens/widgets, variables and formulas, bindings, settings, automations, and documented data sources.
- Reports configured transports and inventories likely generated firmware and server entry-point files in the workspace.
- Finds official LCD Wizard documentation for project settings, variables, bindings, automations, hardware, transports, and export targets.
- Adds the `@lcdwizard` chat participant, slash commands, and three language-model tools.

The extension does not edit project files, execute firmware, contact a device, or make background network requests. Its documentation command opens the selected official page in your browser. It links to the official documentation rather than bundling its text. Project reports omit settings defaults and redact likely secrets. When a report is used in Copilot chat, that report is sent through the model provider selected in VS Code.

## Local Development

Open `LCD-Wizard-Copilot.code-workspace` from the parent `extensions 4VS` folder. Select **Run LCD Wizard Copilot** in Run and Debug and press F5. This opens an Extension Development Host; it does not install or publish the extension.

In the Extension Development Host, open Copilot Chat and use `@lcdwizard` with `/project`, `/integration`, `/server`, or `/docs`. The Command Palette also has:

- `LCD Wizard: Show project report`
- `LCD Wizard: Show connectivity context`
- `LCD Wizard: Open documentation topic`
- `LCD Wizard: Select project JSON`

The extension has no runtime npm dependencies. Node.js is needed to run the included unit tests with `npm test`. The extension requires VS Code 1.95 or newer and GitHub Copilot Chat for its chat participant and language-model tools. Before Marketplace publication, set the `publisher` in `package.json` to the publishing account’s verified VS Code Marketplace publisher ID.

## Limits

The connectivity report is a workspace inventory and documentation guide, not a live network, BLE, firmware, or hardware test. File presence does not verify behavior. The extension does not generate server or firmware code. LCD Wizard project fields can evolve, so project-specific advice should be checked against the selected project's own export and current official documentation.

## License

MIT. See [LICENSE](LICENSE).