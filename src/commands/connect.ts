import * as vscode from 'vscode';
import { ConnectionTreeItem } from '../connection-treeview';
import { Container } from '../container';
import { load } from '../settings';

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
    vscode.commands.executeCommand('powershell-universal.refreshAllTreeViews');

    await Container.universal.installAndLoadModule();
}