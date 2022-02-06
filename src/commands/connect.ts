import * as vscode from 'vscode';
import { SetAppToken, SetUrl } from './../settings';
import { Container } from '../container';
import { ConnectionTreeItem } from '../connection-treeview';

export const registerConnectCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.addConnection', AddConnection);
    vscode.commands.registerCommand('powershell-universal.connection', x => Connection(x, context));
}

export const AddConnection = async (context: vscode.ExtensionContext) => {
    vscode.commands.executeCommand('workbench.action.openSettings', "PowerShell Universal");
}

export const Connection = async (treeItem: ConnectionTreeItem, context: vscode.ExtensionContext) => {
    const name = treeItem.connection.name;
    context.globalState.update("universal.connection", name);

    vscode.commands.executeCommand('powershell-universal.refreshTreeView');
    vscode.commands.executeCommand('powershell-universal.refreshEndpointTreeView');
    vscode.commands.executeCommand('powershell-universal.refreshScriptTreeView');
    vscode.commands.executeCommand('powershell-universal.refreshConfigurationTreeView');
    vscode.commands.executeCommand('powershell-universal.refreshConnectionTreeView');
}