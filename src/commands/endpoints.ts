import * as vscode from 'vscode';
import {load} from './../settings';
import {EndpointTreeItem } from './../api-treeview';
import { Container } from '../container';
const path = require('path');

export const registerEndpointCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openEndpointConfigFile', openEndpointConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.insertRestMethod', insertInvokeRestMethodCommand);
    vscode.commands.registerCommand('powershell-universal.manageEndpoints', manageEndpointsCommand);
}

export const openEndpointConfigFileCommand = async () => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, '.universal', 'endpoints.ps1');

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const insertInvokeRestMethodCommand = async (endpoint : EndpointTreeItem) => {

    const settings = load();

    var terminal = vscode.window.terminals.find(x => x.name === "PowerShell Integrated Console");

    terminal?.sendText(`Invoke-RestMethod -Uri "http://${settings.computerName}:${settings.port}${endpoint.endpoint.url.replace(':', '$')}" -Method ${endpoint.endpoint.method}`, false);
}

export const manageEndpointsCommand = async () => {
    const settings = load();
    
    vscode.env.openExternal(vscode.Uri.parse(`http://${settings.computerName}:${settings.port}/admin/api`));
}