import * as vscode from 'vscode';
import { load } from './../settings';
import { DashboardComponentTreeItem, DashboardFrameworkTreeItem, DashboardTreeItem } from './../dashboard-treeview';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs';

let files: Array<any> = [];

export const registerDashboardCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.manageDashboards', manageDashboardsCommand);
    vscode.commands.registerCommand('powershell-universal.viewDashboard', viewDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.stopDashboard', stopDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.startDashboard', startDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.restartDashboard', restartDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardFile', openFileCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardConfigFile', openDashboardConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.connectToDashboard', connectToDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.viewDashboardLog', viewDashboardLogCommand);
    vscode.commands.registerCommand('powershell-universal.installDashboardModule', installModuleCommand);
    vscode.commands.registerCommand('powershell-universal.installDashboardFrameworkModule', installModuleCommand);

    vscode.workspace.onDidSaveTextDocument((file) => {
        if (file.fileName.includes('.universal.code.dashboard')) {
            const info = files.find(x => x.filePath.toLowerCase() === file.fileName.toLowerCase());
            Container.universal.getDashboard(info.id).then((dashboard) => {
                dashboard.content = file.getText();
                Container.universal.saveDashboard(info.id, dashboard);
            });
        }
    });

    vscode.workspace.onDidCloseTextDocument((file) => {
        files = files.filter(x => x.filePath !== file.fileName);
    });
}

export const manageDashboardsCommand = async () => {
    const settings = load();

    vscode.env.openExternal(vscode.Uri.parse(`${settings.url}/admin/dashboards`));
}

export const viewDashboardCommand = async (dashboard: DashboardTreeItem) => {
    const settings = load();

    vscode.env.openExternal(vscode.Uri.parse(`${settings.url}${dashboard.dashboard.baseUrl}`));
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
    var settings = load();
    if (settings.localEditing) {
        await openFileLocal(dashboard);
    }
    else {
        await openFileRemote(dashboard);
    }
}

export const openFileRemote = async (dashboard: DashboardTreeItem) => {
    const os = require('os');
    const codePath = path.join(os.tmpdir(), '.universal.code.dashboard');
    //Use the id in the path so that we can save the dashboard
    const codePathId = path.join(codePath, dashboard.dashboard.id.toString());
    const filePath = path.join(codePathId, dashboard.dashboard.filePath);

    const dashboardFile = await Container.universal.getDashboard(dashboard.dashboard.id);
    var dirName = path.dirname(filePath);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    fs.writeFileSync(filePath, dashboardFile.content);

    files.push({
        id: dashboard.dashboard.id,
        filePath: filePath
    });

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const openFileLocal = async (dashboard: DashboardTreeItem) => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, dashboard.dashboard.filePath);

    if (!fs.existsSync(filePath)) {
        await vscode.window.showErrorMessage(`Failed to find file ${filePath}. If you have local editing on and are accessing a remote file, you may need to turn off local editing.`);
        return
    }

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const openDashboardConfigFileCommand = async () => {
    var settings = load();
    if (settings.localEditing) {
        const psuSettings = await Container.universal.getSettings();
        const filePath = path.join(psuSettings.repositoryPath, '.universal', 'dashboards.ps1');
        const textDocument = await vscode.workspace.openTextDocument(filePath);
        vscode.window.showTextDocument(textDocument);
    }
    else {
        const os = require('os');

        const filePath = path.join(os.tmpdir(), '.universal.code.configuration', 'dashboards.ps1');
        const codePath = path.join(os.tmpdir(), '.universal.code.configuration');
        const config = await Container.universal.getConfiguration('dashboards.ps1');
        if (!fs.existsSync(codePath)) {
            fs.mkdirSync(codePath);
        }
        fs.writeFileSync(filePath, config);

        const textDocument = await vscode.workspace.openTextDocument(filePath);
        vscode.window.showTextDocument(textDocument);
    }
}

export const connectToDashboardCommand = async (item: DashboardTreeItem) => {
    var terminal = vscode.window.terminals.find(x => x.name === "PowerShell Integrated Console");

    terminal?.sendText(`Enter-PSHostProcess -Id ${item.dashboard.processId}`);
}

export const viewDashboardLogCommand = async (item: DashboardTreeItem) => {
    await item.showLog();
}

export const installModuleCommand = async (item: DashboardComponentTreeItem | DashboardFrameworkTreeItem) => {
    Container.universal.sendTerminalCommand(`Install-Module -Name '${item.dashboardComponent.name}' -RequiredVersion '${item.dashboardComponent.version}'`);
}