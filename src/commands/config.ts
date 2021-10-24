import * as vscode from 'vscode';
import { ConfigTreeItem } from './../configuration-treeview';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs'; // In NodeJS: 'const fs = require('fs')'
import { SampleFile } from '../types';
import { load } from '../settings';


export const registerConfigCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openConfigFile', openConfigCommand);
    vscode.commands.registerCommand('powershell-universal.reloadConfig', refreshConfig);
    vscode.workspace.onDidSaveTextDocument((file) => {
        if (file.fileName.includes('.universal.code.configuration')) {
            const fileName = path.basename(file.fileName);
            Container.universal.saveConfiguration(fileName, file.getText());
        }
    });
}

export const openConfigCommand = async (item: ConfigTreeItem | SampleFile) => {
    var settings = load();
    if (settings.localEditing) {
        await openConfigLocal(item);
    }
    else {
        await openConfigRemote(item);
    }
}

export const openConfigRemote = async (item: ConfigTreeItem | SampleFile) => {
    const os = require('os');

    const filePath = path.join(os.tmpdir(), '.universal.code.configuration', item.fileName);
    const codePath = path.join(os.tmpdir(), '.universal.code.configuration');
    const config = await Container.universal.getConfiguration(item.fileName);
    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }
    fs.writeFileSync(filePath, config);

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);

    return textDocument;
}

export const openConfigLocal = async (item: ConfigTreeItem | SampleFile) => {
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

