import * as vscode from 'vscode';
import {ConfigTreeItem  } from './../configuration-treeview';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs'; // In NodeJS: 'const fs = require('fs')'


export const registerConfigCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openConfigFile', openConfigCommand);
    vscode.commands.registerCommand('powershell-universal.reloadConfig', refreshConfig);
}

export const openConfigCommand = async (item : ConfigTreeItem) => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, '.universal', item.fileName);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
    }

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}


export const refreshConfig = async () => {
    try {
        await Container.universal.refreshConfig();
    } catch (error) {
        vscode.window.showErrorMessage(error);
        return;
    }
    
    vscode.window.showInformationMessage("Configuration reloaded.");
}

