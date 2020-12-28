import * as vscode from 'vscode';
import {load} from './../settings';
import {DashboardTreeItem } from './../dashboard-treeview';
import { Container } from '../container';
import { DashboardLogItem, DashboardLog } from '../types';
const path = require('path');
import * as fs from 'fs';

export const registerDashboardCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.manageDashboards', manageDashboardsCommand);
    vscode.commands.registerCommand('powershell-universal.viewDashboard', viewDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.stopDashboard', stopDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.startDashboard', startDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.restartDashboard', restartDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.importModules', importModulesCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardFile', openFileCommand);
    vscode.commands.registerCommand('powershell-universal.openDashboardConfigFile', openDashboardConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.connectToDashboard', connectToDashboardCommand);
    vscode.commands.registerCommand('powershell-universal.viewDashboardLog', viewDashboardLogCommand);
    vscode.workspace.onDidSaveTextDocument((file) => {
        if(file.fileName.includes('.universal.code.dashboard')){
            //Get the id of the dashboard from the path
            const id = path.basename(path.dirname(file.fileName));
            Container.universal.getDashboard(id).then((dashboard) => {
                dashboard.content = file.getText();
                Container.universal.saveDashboard(id, dashboard);
            });
            
        }
    });
}

export const manageDashboardsCommand = async () => {
    const settings = load();
    
    vscode.env.openExternal(vscode.Uri.parse(`${settings.url}/admin/dashboards`));
}

export const viewDashboardCommand = async (dashboard : DashboardTreeItem) => {
    const settings = load();
    
    vscode.env.openExternal(vscode.Uri.parse(`${settings.url}${dashboard.dashboard.baseUrl}`));
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
            const path = x.path.endsWith(".psd1") ? x.path : x.path + "\\*.psd1";

            terminal?.sendText(`Import-Module '${path}' -Force`);
        });
    }
}

export const openFileCommand = async (dashboard : DashboardTreeItem) => {
    const settings = await Container.universal.getSettings();    
    const codePath = path.join(settings.repositoryPath, '.universal.code.dashboard');
    //Use the id in the path so that we can save the dashboard
    const codePathId = path.join(codePath, dashboard.dashboard.id.toString());
    const filePath = path.join(codePathId, dashboard.dashboard.filePath);
    const dashboardFile = await Container.universal.getDashboard(dashboard.dashboard.id);
    if (!fs.existsSync(codePath)){
        fs.mkdirSync(codePath);
    }
    if (!fs.existsSync(codePathId)){
        fs.mkdirSync(codePathId);
    }
    fs.writeFileSync(filePath, dashboardFile.content);   

    const textDocument = await vscode.workspace.openTextDocument(filePath);    

    vscode.window.showTextDocument(textDocument);

    importModulesCommand(dashboard);
}

export const openDashboardConfigFileCommand = async () => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, '.universal', 'dashboards.ps1');

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const connectToDashboardCommand = async (item : DashboardTreeItem) => {
    var terminal = vscode.window.terminals.find(x => x.name === "PowerShell Integrated Console");

    terminal?.sendText(`Enter-PSHostProcess -Id ${item.dashboard.processId}`);
}

export const viewDashboardLogCommand = async (item : DashboardTreeItem) => {

    const log = await Container.universal.getDashboardLog(item.dashboard.id);

    const json : Array<DashboardLogItem> = JSON.parse(log.log);

    var logFile = '';
    json.forEach(item => {
        logFile += `[${item.Timestamp}] ${item.Data} \r\n` 
    });

    const textDocument = await vscode.workspace.openTextDocument({        
        content: logFile
    });

    vscode.window.showTextDocument(textDocument);
}