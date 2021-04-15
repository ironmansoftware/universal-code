import * as vscode from 'vscode';
import {load} from './../settings';
import {EndpointTreeItem } from './../api-treeview';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs';

export const registerEndpointCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openEndpointConfigFile', openEndpointConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.insertRestMethod', insertInvokeRestMethodCommand);
    vscode.commands.registerCommand('powershell-universal.manageEndpoints', manageEndpointsCommand);
}

export const openEndpointConfigFileCommand = async () => {
    var settings = load();
    if (settings.localEditing)
    {
        const psuSettings = await Container.universal.getSettings();
        const filePath = path.join(psuSettings.repositoryPath, '.universal', 'endpoints.ps1');
        const textDocument = await vscode.workspace.openTextDocument(filePath);
        vscode.window.showTextDocument(textDocument);
    }
    else 
    {
        const os = require('os');

        const filePath = path.join(os.tmpdir(), '.universal.code.configuration', 'endpoints.ps1');
        const codePath = path.join(os.tmpdir(), '.universal.code.configuration');
        const config = await Container.universal.getConfiguration('endpoints.ps1');
        if (!fs.existsSync(codePath)){
            fs.mkdirSync(codePath);
        }
        fs.writeFileSync(filePath, config);
        
        const textDocument = await vscode.workspace.openTextDocument(filePath);    
        vscode.window.showTextDocument(textDocument);
    }

}

export const insertInvokeRestMethodCommand = async (endpoint : EndpointTreeItem) => {

    const settings = load();

    var terminal = vscode.window.terminals.find(x => x.name === "PowerShell Integrated Console");

    terminal?.sendText(`Invoke-RestMethod -Uri "${settings.url}${endpoint.endpoint.url.replace(':', '$')}" -Method ${endpoint.endpoint.method}`, false);
}

export const manageEndpointsCommand = async () => {
    const settings = load();
    
    vscode.env.openExternal(vscode.Uri.parse(`${settings.url}/admin/api`));
}