import * as vscode from 'vscode';
import {load} from './../settings';
import {DashboardTreeItem } from './../dashboard-treeview';
import { Container } from '../container';
const path = require('path');

export const registerDashboardCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.manageDashboards', manageDashboardsCommand);
    vscode.commands.registerCommand('powershell-universal.viewDashboard', viewDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.stopDashboard', stopDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.startDashboard', startDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.restartDashboard', restartDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.importModules', importModulesCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardFile', openFileCommand);
}

export const manageDashboardsCommand = async () => {
    const settings = load();
    
    vscode.env.openExternal(vscode.Uri.parse(`http://${settings.computerName}:${settings.port}/admin/dashboards`));
}

export const viewDashboardCommand = async (dashboard : DashboardTreeItem) => {
    const settings = load();
    
    vscode.env.openExternal(vscode.Uri.parse(`http://${settings.computerName}:${settings.port}${dashboard.dashboard.baseUrl}`));
}

export const stopDashboardCommand = async (dashboard : DashboardTreeItem) => {
    await Container.universal.stopDashboard(dashboard.dashboard.id);
}

export const startDashboardCommand = async (dashboard : DashboardTreeItem) => {
    await Container.universal.startDashboard(dashboard.dashboard.id);
}

export const restartDashboardCommand = async (dashboard : DashboardTreeItem) => {
    await Container.universal.stopDashboard(dashboard.dashboard.id);
    await Container.universal.startDashboard(dashboard.dashboard.id);

    const d = await Container.universal.getDashboard(dashboard.dashboard.id);

    vscode.commands.executeCommand('powershell-universal.refreshTreeView');

    vscode.window.showInformationMessage(`Dashboard restarted. Process ID: ${d.processId}`);
}

export const importModulesCommand = async (dashboard : DashboardTreeItem) => {
    var settings = load();    

    var terminal = vscode.window.terminals.find(x => x.name === "PowerShell Integrated Console");

    terminal?.sendText(`Import-Module '${path.join(settings.serverPath, 'Cmdlets', 'Universal.psd1')}' -Force`);
    terminal?.sendText(`Import-Module '${dashboard.dashboard.dashboardFramework.path}\\*.psd1' -Force`);

    if (dashboard.dashboard.dashboardComponents)
    {
        dashboard.dashboard.dashboardComponents.forEach(x => {
            terminal?.sendText(`Import-Module '${x.path}\\*.psd1' -Force`);
        });
    }
}

export const openFileCommand = async (dashboard : DashboardTreeItem) => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, dashboard.dashboard.filePath);

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);

    importModulesCommand(dashboard);
}