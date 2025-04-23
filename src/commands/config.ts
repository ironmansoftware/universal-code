import * as vscode from 'vscode';
import { ConfigTreeItem } from './../configuration-treeview';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs'; // In NodeJS: 'const fs = require('fs')'
import { load } from '../settings';
import { tmpdir } from './utils';


export const registerConfigCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openConfigFile', openConfigCommand);
    vscode.commands.registerCommand('powershell-universal.newConfigFile', newConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.newConfigFolder', newConfigFolderCommand);
    vscode.commands.registerCommand('powershell-universal.reloadConfig', refreshConfig);
    vscode.workspace.onDidSaveTextDocument(async (file) => {
        if (file.fileName.includes('.universal.code.configuration')) {
            const codePath = path.join(tmpdir(), '.universal.code.configuration');
            const fileName = file.fileName.toLocaleLowerCase().replace(codePath.toLocaleLowerCase(), "").substring(1);
            await Container.universal.saveFileContent(fileName, file.getText());
        });
}

export const newConfigFileCommand = async (item: ConfigTreeItem) => {
    const fileName = await vscode.window.showInputBox({
        prompt: "Enter a file name"
    });

    await Container.universal.newFile(item.fileName + "/" + fileName);
    Container.ConfigFileTreeView.refresh();
}

export const newConfigFolderCommand = async (item: ConfigTreeItem) => {
    const fileName = await vscode.window.showInputBox({
        prompt: "Enter a folder name"
    });

    await Container.universal.newFolder(item.fileName + "/" + fileName);
    Container.ConfigFileTreeView.refresh();
}

export const openConfigCommand = async (item: ConfigTreeItem) => {
    var settings = load();
    if (settings.localEditing) {
        await openConfigLocal(item);
    }
    else {
        await openConfigRemote(item);
    }
}

export const openConfigRemote = async (item: ConfigTreeItem) => {
    const filePath = path.join(tmpdir(), '.universal.code.configuration', item.fileName);
    const codePath = path.join(tmpdir(), '.universal.code.configuration');
    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }

    const config = await Container.universal.getFileContent(item.fileName);

    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(filePath, config.content);

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);

    return textDocument;
}

export const openConfigLocal = async (item: ConfigTreeItem) => {
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
        vscode.window.showErrorMessage(error as string);
        return;
    }

    vscode.window.showInformationMessage("Configuration reloaded.");
}

