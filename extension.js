'use strict';

const vscode = require('vscode');
const path = require('path');
const { isLcdWizardProject, summarizeProject, renderProjectReport } = require('./lib/project');
const { summarizeConnectivity, renderConnectivityReport } = require('./lib/connectivity');
const { TOPICS, renderDocs } = require('./lib/docs');

const EXCLUDE = '**/{node_modules,.git,.venv,venv,__pycache__,build,dist,.pio}/**';
const FIRMWARE_GLOB = '**/{*.ino,app_logic.cpp,app_logic.h,hardware.cpp,lw_web.cpp,lw_net.cpp,lw_mqtt.cpp,platformio.ini}';
const SERVER_GLOB = '**/{app,server,main,index}.{py,js,ts,go,php,rb,java,cs}';
const MAX_PROJECT_BYTES = 8 * 1024 * 1024;
let state;

async function readProject(uri) {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    if (bytes.length > MAX_PROJECT_BYTES) return null;
    const project = JSON.parse(Buffer.from(bytes).toString('utf8'));
    return isLcdWizardProject(project) ? project : null;
  } catch {
    return null;
  }
}

async function projectFromSetting(value) {
  if (!value) return null;
  if (/^file:\/\//i.test(value)) {
    const uri = vscode.Uri.parse(value);
    const project = await readProject(uri);
    return project ? { uri, project } : null;
  }

  if (path.isAbsolute(value)) {
    const uri = vscode.Uri.file(value);
    const project = await readProject(uri);
    return project ? { uri, project } : null;
  }

  for (const folder of vscode.workspace.workspaceFolders || []) {
    const uri = vscode.Uri.joinPath(folder.uri, value);
    const project = await readProject(uri);
    if (project) return { uri, project };
  }
  return null;
}

async function findProject(explicitFile) {
  const configured = explicitFile || vscode.workspace.getConfiguration('lcdWizardCopilot').get('projectFile');
  const pinned = await projectFromSetting(configured) || await projectFromSetting(state.get('projectUri'));
  if (pinned) return pinned;

  const files = await vscode.workspace.findFiles('**/*.slw.json', EXCLUDE, 200);
  const found = [];
  for (const uri of files) {
    const project = await readProject(uri);
    if (project) found.push({ uri, project });
  }
  if (!found.length) return null;

  found.sort((a, b) => a.uri.fsPath.localeCompare(b.uri.fsPath));
  if (found.length > 1) return null;
  await state.update('projectUri', found[0].uri.toString());
  return found[0];
}

async function projectReportText(explicitFile) {
  const found = await findProject(explicitFile);
  if (!found) {
    return 'No LCD Wizard project is selected. Open one .slw.json in the workspace, use “LCD Wizard: Select project JSON”, or set lcdWizardCopilot.projectFile if multiple projects are open.';
  }
  const label = vscode.workspace.asRelativePath(found.uri, false);
  return renderProjectReport(summarizeProject(found.project, label));
}

async function integrationReportText() {
  const found = await findProject();
  if (!found) return 'Select one LCD Wizard project first. If multiple projects are open, run “LCD Wizard: Select project JSON”.';
  const [firmwareUris, serverUris] = await Promise.all([
    vscode.workspace.findFiles(FIRMWARE_GLOB, EXCLUDE, 200),
    vscode.workspace.findFiles(SERVER_GLOB, EXCLUDE, 200)
  ]);
  const firmwareFiles = firmwareUris.map((uri) => vscode.workspace.asRelativePath(uri, false));
  const serverFiles = serverUris.map((uri) => vscode.workspace.asRelativePath(uri, false));
  return renderConnectivityReport(summarizeConnectivity({ project: found.project, firmwareFiles, serverFiles }));
}

async function showMarkdown(text) {
  const document = await vscode.workspace.openTextDocument({ language: 'markdown', content: text });
  await vscode.window.showTextDocument(document, { preview: true });
}

async function showProjectReport() {
  await showMarkdown(await projectReportText());
}

async function checkIntegration() {
  await showMarkdown(await integrationReportText());
}

async function selectProject() {
  const files = await vscode.workspace.findFiles('**/*.slw.json', EXCLUDE, 200);
  const choices = [];
  for (const uri of files) {
    if (await readProject(uri)) choices.push({ label: vscode.workspace.asRelativePath(uri, false), uri });
  }
  if (!choices.length) {
    vscode.window.showInformationMessage('No valid LCD Wizard .slw.json files were found in the open workspace.');
    return;
  }
  const selected = await vscode.window.showQuickPick(choices, { placeHolder: 'Choose the LCD Wizard project JSON' });
  if (!selected) return;
  await state.update('projectUri', selected.uri.toString());
  vscode.window.showInformationMessage(`LCD Wizard project selected: ${selected.label}`);
}

async function openDocs() {
  const selected = await vscode.window.showQuickPick(
    TOPICS.map((topic) => ({ label: topic.title, description: topic.id, url: topic.url })),
    { placeHolder: 'Choose an official LCD Wizard documentation topic' }
  );
  if (selected) await vscode.env.openExternal(vscode.Uri.parse(selected.url));
}

function toolResult(text) {
  return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(text)]);
}

function registerTools(context) {
  if (!vscode.lm || typeof vscode.lm.registerTool !== 'function') return;
  context.subscriptions.push(
    vscode.lm.registerTool('lcdwizard_project_report', {
      async invoke(options) {
        return toolResult(await projectReportText(options.input && options.input.file));
      },
      prepareInvocation() {
        return { invocationMessage: 'Reading the LCD Wizard project with sensitive values omitted' };
      }
    }),
    vscode.lm.registerTool('lcdwizard_connectivity_context', {
      async invoke() {
        return toolResult(await integrationReportText());
      },
      prepareInvocation() {
        return { invocationMessage: 'Reviewing LCD Wizard transport and server integration context' };
      }
    }),
    vscode.lm.registerTool('lcdwizard_docs', {
      async invoke(options) {
        return toolResult(renderDocs(options.input && options.input.topic));
      },
      prepareInvocation(options) {
        return { invocationMessage: `Finding LCD Wizard documentation: ${options.input && options.input.topic || 'all'}` };
      }
    })
  );
}

function registerChatParticipant(context) {
  if (!vscode.chat || typeof vscode.chat.createChatParticipant !== 'function') return;

  const handler = async (request, _chatContext, stream, token) => {
    try {
      if (request.command === 'project') {
        stream.markdown(await projectReportText());
        return;
      }
      if (request.command === 'integration') {
        stream.markdown(await integrationReportText());
        return;
      }
      if (request.command === 'docs') {
        stream.markdown(renderDocs(request.prompt || 'all'));
        return;
      }

      const [project, integration] = await Promise.all([projectReportText(), integrationReportText()]);
      const instructions = [
          'You are LCD Wizard Copilot, a general assistant for designing LCD Wizard projects and integrating generated boards with host applications or servers.',
          'Use the project report, connectivity context, and official documentation links below. Do not guess undocumented LCD Wizard JSON fields, firmware behavior, API paths, or transport protocol details.',
        'The reports omit setting defaults and likely secrets. Never ask the user to paste passwords, API keys, or device tokens into chat.',
        'Distinguish verified documentation from project-specific inference and recommend hardware testing for unverified device behavior.',
        '',
        '## LCD Wizard project report', project,
        '',
        '## Board/server connectivity context', integration,
        '',
        '## Official documentation topics', renderDocs('all')
      ].join('\n');

      if (!request.model || typeof request.model.sendRequest !== 'function') {
        stream.markdown(instructions);
        return;
      }
      const messages = [
        vscode.LanguageModelChatMessage.User(instructions),
        vscode.LanguageModelChatMessage.User(request.command === 'server'
          ? 'Help plan a board-to-server integration using this project’s configured transport. Identify what is known, what must be confirmed in generated firmware and server code, and the next safe test. Do not assume a framework or generate code before the contract is clear. ' + request.prompt
          : request.prompt)
      ];
      const response = await request.model.sendRequest(messages, {}, token);
      for await (const fragment of response.text) stream.markdown(fragment);
    } catch (error) {
      stream.markdown(`LCD Wizard assistant could not complete this request: ${error.message}`);
    }
  };

  context.subscriptions.push(vscode.chat.createChatParticipant('lcdwizard.copilot', handler));
}

function activate(context) {
  state = context.workspaceState;
  context.subscriptions.push(
      vscode.commands.registerCommand('lcdWizardCopilot.showProjectReport', showProjectReport),
      vscode.commands.registerCommand('lcdWizardCopilot.checkIntegration', checkIntegration),
      vscode.commands.registerCommand('lcdWizardCopilot.openDocs', openDocs),
      vscode.commands.registerCommand('lcdWizardCopilot.selectProject', selectProject)
  );
  registerTools(context);
  registerChatParticipant(context);
}

function deactivate() {}

module.exports = { activate, deactivate };