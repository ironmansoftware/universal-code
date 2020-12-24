import * as vscode from 'vscode';
import {ConfigTreeItem  } from './../configuration-treeview';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs'; // In NodeJS: 'const fs = require('fs')'


export const registerConfigCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openConfigFile', openConfigCommand);
    vscode.commands.registerCommand('powershell-universal.reloadConfig', refreshConfig);
    vscode.workspace.onDidSaveTextDocument((file) => {
        if(file.fileName.includes('.universal.code.configuration')){
            const fileName = path.basename(file.fileName);
            Container.universal.saveConfiguration(fileName, file.getText());
        }
    });
}

export const openConfigCommand = async (item : ConfigTreeItem) => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, '.universal.code.configuration', item.fileName);
    const codePath = path.join(settings.repositoryPath, '.universal.code.configuration');
    const config = await Container.universal.getConfiguration(item.fileName);
    if (!fs.existsSync(codePath)){
        fs.mkdirSync(codePath);
    }
    fs.writeFileSync(filePath, config);
    

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

