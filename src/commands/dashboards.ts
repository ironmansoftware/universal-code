import * as vscode from 'vscode';
import { load } from './../settings';
import { DashboardModuleTreeItem, DashboardPageTreeItem, DashboardSessionPageTreeItem, DashboardTreeItem } from './../dashboard-treeview';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs';
import { tmpdir } from './utils';

let files: Array<any> = [];

export const registerDashboardCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.manageDashboards', () => manageDashboardsCommand(context));
    vscode.commands.registerCommand('powershell-universal.viewDashboard', (item) => viewDashboardCommand(item, context));
    vscode.commands.registerCommand('powershell-universal.stopDashboard', stopDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.addDashboardPage', addDashboardPageCommand);
    vscode.commands.registerCommand('powershell-universal.deleteDashboardPage', deleteDashboardPageCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardTerminal', openDashboardTerminalCommand);
    vscode.commands.registerCommand('powershell-universal.startDashboard', startDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.restartDashboard', restartDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardFile', openFileCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardPageFile', openPageFile);
    vscode.commands.registerCommand('powershell-universal.openDashboardConfigFile', openDashboardConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardModuleFile', openDashboardModuleFileCommand);
    vscode.commands.registerCommand('powershell-universal.viewDashboardLog', viewDashboardLogCommand);

    vscode.workspace.onDidSaveTextDocument(async (file) => {
        if (file.fileName.includes('.universal.code.dashboardPage')) {
            const info = files.find(x => x.filePath.toLowerCase() === file.fileName.toLowerCase());

            if (!info) {
                vscode.window.showErrorMessage(`File from a previous session. Re-open file from the Activity Bar.`);
                return;
            }

            const dashboards = await Container.universal.getDashboards();
            const dashboard = dashboards.find(x => x.name === info.dashboardName);
            if (!dashboard) {
                vscode.window.showErrorMessage(`Dashboard ${info.dashboardName} not found.`);
                return;
            }

            const pages = await Container.universal.getDashboardPages(dashboard.id);
            const page = pages.find(x => x.name === info.name);

            if (!page) {
                vscode.window.showErrorMessage(`Page ${info.name} not found.`);
                return;
            } else {
                page.content = file.getText();
                Container.universal.saveDashboardPage(page.modelId, dashboard.id, page);
            }
        }
        else if (file.fileName.includes('.universal.code.dashboard')) {
            const info = files.find(x => x.filePath.toLowerCase() === file.fileName.toLowerCase());

            if (!info) {
                vscode.window.showErrorMessage(`File from a previous session. Re-open file from the Activity Bar.`);
                return;
            }

            const dashboards = await Container.universal.getDashboards();
            const dashboard = dashboards.find(x => x.name === info.name);

            if (dashboard) {
                dashboard.content = file.getText();
                Container.universal.saveDashboard(dashboard.id, dashboard);
            } else {
                vscode.window.showErrorMessage(`Dashboard ${info.name} not found.`);
            }
        }
        else if (file.fileName.includes('.universal.code.dashboardModule')) {
            const info = files.find(x => x.filePath.toLowerCase() === file.fileName.toLowerCase());

            if (!info) {
                vscode.window.showErrorMessage(`File from a previous session. Re-open file from the Activity Bar.`);
                return;
            }

            const dashboards = await Container.universal.getDashboards();
            const dashboard = dashboards.find(x => x.name === info.name);

            if (dashboard) {
                dashboard.moduleContent = file.getText();
                Container.universal.saveDashboard(dashboard.id, dashboard);
            } else {
                vscode.window.showErrorMessage(`Dashboard ${info.name} not found.`);
            }
        }
    });

    vscode.workspace.onDidCloseTextDocument((file) => {
        files = files.filter(x => x.filePath !== file.fileName);
    });
}

export const manageDashboardsCommand = async (context: vscode.ExtensionContext) => {
    const settings = load();

    const connectionName = context.globalState.get("universal.connection");
    var url = settings.url;

    if (connectionName && connectionName !== 'Default') {
        const connection = settings.connections.find(m => m.name === connectionName);
        if (connection) {
            url = connection.url;
        }
    }

    vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/apps`));
}

export const openDashboardTerminalCommand = async (pageInfo: DashboardSessionPageTreeItem, context: vscode.ExtensionContext) => {
    const writeEmitter = new vscode.EventEmitter<string>();

    var str = '';
    const pty: vscode.Pseudoterminal = {
        onDidWrite: writeEmitter.event,
        open: async () => {
            var output = await Container.universal.executeDashboardTerminal(pageInfo.dashboardId, pageInfo.sessionId, pageInfo.pageId, 'prompt');
            writeEmitter.fire(output.replace(/\r\n$/, ''));
        },
        close: () => { },
        handleInput: async data => {

            if (data.charCodeAt(0) === 127) {
                str = str.slice(0, -1);
                writeEmitter.fire('\b \b');
                return;
            }
            else {
                writeEmitter.fire(data);
                str += data;
            }

            if (data === '\r') {
                writeEmitter.fire('\r\n');
                var output = await Container.universal.executeDashboardTerminal(pageInfo.dashboardId, pageInfo.sessionId, pageInfo.pageId, str);
                writeEmitter.fire(output.replace("\r", '\r\n'));
                var output = await Container.universal.executeDashboardTerminal(pageInfo.dashboardId, pageInfo.sessionId, pageInfo.pageId, 'prompt');
                writeEmitter.fire(output.replace(/\r\n$/, ''));
                str = '';
            }
        }
    };
    const terminal = vscode.window.createTerminal({ name: `App Terminal (${pageInfo.sessionId} \\ ${pageInfo.pageId})`, pty });
    terminal.show();
};

export const viewDashboardCommand = async (dashboard: DashboardTreeItem, context: vscode.ExtensionContext) => {
    const settings = load();

    const connectionName = context.globalState.get("universal.connection");
    var url = settings.url;

    if (connectionName && connectionName !== 'Default') {
        const connection = settings.connections.find(m => m.name === connectionName);
        if (connection) {
            url = connection.url;
        }
    }

    vscode.env.openExternal(vscode.Uri.parse(`${url}${dashboard.dashboard.baseUrl}`));
}

export const addDashboardPageCommand = async (dashboard: DashboardTreeItem) => {
    var name = await vscode.window.showInputBox({
        prompt: "Enter the name of the page",
    });

    if (name) {
        await Container.universal.addDashboardPage(dashboard.dashboard.id, {
            name,
            modelId: 0,
            dashboardId: dashboard.dashboard.id,
            content: ""
        });
        vscode.commands.executeCommand('powershell-universal.refreshTreeView');
    }
}

export const deleteDashboardPageCommand = async (page: DashboardPageTreeItem) => {
    var result = await vscode.window.showQuickPick(["Yes", "No"], {
        placeHolder: `Are you sure you want to delete ${page.page.name}?`
    });

    if (result === "Yes") {
        await Container.universal.deleteDashboardPage(page.page.dashboardId, page.page.modelId);
        vscode.commands.executeCommand('powershell-universal.refreshTreeView');
    }
}

export const stopDashboardCommand = async (dashboard: DashboardTreeItem) => {
    await Container.universal.stopDashboard(dashboard.dashboard.id);
}

export const startDashboardCommand = async (dashboard: DashboardTreeItem) => {
    await Container.universal.startDashboard(dashboard.dashboard.id);
}

export const restartDashboardCommand = async (dashboard: DashboardTreeItem) => {
    await Container.universal.stopDashboard(dashboard.dashboard.id);
    await Container.universal.startDashboard(dashboard.dashboard.id);

    const d = await Container.universal.getDashboard(dashboard.dashboard.id);

    vscode.commands.executeCommand('powershell-universal.refreshTreeView');

    vscode.window.showInformationMessage(`Dashboard restarted. Process ID: ${d.processId}`);

    await dashboard.clearLog();
}

export const openFileCommand = async (dashboard: DashboardTreeItem) => {
    await openFileRemote(dashboard);
}

export const openFileRemote = async (dashboard: DashboardTreeItem) => {
    const os = require('os');
    const codePath = path.join(tmpdir(), '.universal.code.dashboard');
    //Use the id in the path so that we can save the dashboard
    const codePathId = path.join(codePath, dashboard.dashboard.id.toString());
    const filePath = path.join(codePathId, dashboard.dashboard.name + ".ps1");

    const dashboardFile = await Container.universal.getDashboard(dashboard.dashboard.id);
    var dirName = path.dirname(filePath);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    fs.writeFileSync(filePath, dashboardFile.content);

    files.push({
        id: dashboard.dashboard.id,
        name: dashboard.dashboard.name,
        filePath: filePath
    });

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const openPageFile = async (page: DashboardPageTreeItem) => {
    const os = require('os');
    const codePath = path.join(tmpdir(), '.universal.code.dashboardPage');
    //Use the id in the path so that we can save the dashboard
    const codePathId = path.join(codePath, page.page.modelId.toString());
    const filePath = path.join(codePathId, page.page.name + ".ps1");

    const dashboardFile = await Container.universal.getDashboardPage(page.page.dashboardId, page.page.modelId);
    const dashboard = await Container.universal.getDashboard(page.page.dashboardId);
    var dirName = path.dirname(filePath);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    fs.writeFileSync(filePath, dashboardFile.content);

    files.push({
        id: page.page.modelId,
        name: page.page.name,
        dashboardName: dashboard.name,
        dashboardId: page.page.dashboardId,
        filePath: filePath
    });

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const openDashboardModuleFileCommand = async (item: DashboardModuleTreeItem) => {
    const os = require('os');
    const codePath = path.join(tmpdir(), '.universal.code.dashboardModule');

    const codePathId = path.join(codePath, item.dashboard.name);
    const filePath = path.join(codePathId, item.dashboard.name + ".psm1");

    const dashboard = await Container.universal.getDashboard(item.dashboard.id);
    var dirName = path.dirname(filePath);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    fs.writeFileSync(filePath, dashboard.moduleContent);

    files.push({
        name: dashboard.name,
        dashboardName: dashboard.name,
        dashboardId: dashboard.id,
        filePath: filePath
    });

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const openDashboardConfigFileCommand = async () => {
    const os = require('os');

    const filePath = path.join(tmpdir(), '.universal.code.configuration', 'dashboards.ps1');
    const codePath = path.join(tmpdir(), '.universal.code.configuration');
    const config = await Container.universal.getConfiguration('dashboards.ps1');
    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }
    fs.writeFileSync(filePath, config);

    const textDocument = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(textDocument);
}

export const viewDashboardLogCommand = async (item: DashboardTreeItem) => {
    await item.showLog();
}