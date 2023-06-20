import * as vscode from 'vscode';
import { load } from './../settings';
import { EndpointTreeItem } from './../api-treeview';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs';
import { tmpdir } from './utils';

let files: Array<any> = [];

export const registerEndpointCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openEndpointScriptBlock', openEndpointScriptBlockCommand);
    vscode.commands.registerCommand('powershell-universal.openEndpointConfigFile', openEndpointConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.insertRestMethod', (item) => insertInvokeRestMethodCommand(item, context));
    vscode.commands.registerCommand('powershell-universal.manageEndpoints', () => manageEndpointsCommand(context));

    vscode.workspace.onDidSaveTextDocument(async (file) => {
        if (file.fileName.includes('.universal.code.endpoints')) {
            const info = files.find(x => x.filePath.toLowerCase() === file.fileName.toLowerCase());
            Container.universal.getEndpoint(info).then((endpoint) => {
                endpoint.scriptBlock = file.getText();
                Container.universal.saveEndpoint(endpoint);
            });
        }
    });

    vscode.workspace.onDidCloseTextDocument((file) => {
        files = files.filter(x => x.filePath !== file.fileName);
    });
}

export const openEndpointScriptBlockCommand = async (node: EndpointTreeItem) => {
    var settings = load();
    if (settings.localEditing) {
        vscode.window.showErrorMessage('Local editing is not supported for this command');
    }
    else {
        const os = require('os');

        const filePath = path.join(tmpdir(), '.universal.code.endpoints', `${node.endpoint.id}.ps1`);
        const codePath = path.join(tmpdir(), '.universal.code.endpoints');
        const config = await Container.universal.getEndpoint(node.endpoint);
        if (!fs.existsSync(codePath)) {
            fs.mkdirSync(codePath);
        }
        fs.writeFileSync(filePath, config.scriptBlock);

        const textDocument = await vscode.workspace.openTextDocument(filePath);
        vscode.window.showTextDocument(textDocument);

        files.push({
            id: node.endpoint.id,
            filePath: filePath
        });
    }

}

export const openEndpointConfigFileCommand = async () => {
    var settings = load();
    if (settings.localEditing) {
        const psuSettings = await Container.universal.getSettings();
        const filePath = path.join(psuSettings.repositoryPath, '.universal', 'endpoints.ps1');
        const textDocument = await vscode.workspace.openTextDocument(filePath);
        vscode.window.showTextDocument(textDocument);
    }
    else {
        const os = require('os');

        const filePath = path.join(tmpdir(), '.universal.code.configuration', 'endpoints.ps1');
        const codePath = path.join(tmpdir(), '.universal.code.configuration');
        const config = await Container.universal.getConfiguration('endpoints.ps1');
        if (!fs.existsSync(codePath)) {
            fs.mkdirSync(codePath);
        }
        fs.writeFileSync(filePath, config);

        const textDocument = await vscode.workspace.openTextDocument(filePath);
        vscode.window.showTextDocument(textDocument);
    }

}

export const insertInvokeRestMethodCommand = async (endpoint: EndpointTreeItem, context: vscode.ExtensionContext) => {

    const settings = load();

    const connectionName = context.globalState.get("universal.connection");
    var url = settings.url;

    if (connectionName && connectionName !== 'Default') {
        const connection = settings.connections.find(m => m.name === connectionName);
        if (connection) {
            url = connection.url;
        }
    }

    var terminal = vscode.window.terminals.find(x => x.name === "PowerShell Extension");

    terminal?.sendText(`Invoke-RestMethod -Uri "${url}${endpoint.endpoint.url.replace(':', '$')}" -Method ${endpoint.endpoint.method}`, false);
}

export const manageEndpointsCommand = async (context: vscode.ExtensionContext) => {
    const settings = load();

    const connectionName = context.globalState.get("universal.connection");
    var url = settings.url;

    if (connectionName && connectionName !== 'Default') {
        const connection = settings.connections.find(m => m.name === connectionName);
        if (connection) {
            url = connection.url;
        }
    }

    vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/apis/endpoints`));
}