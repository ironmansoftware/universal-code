import * as vscode from 'vscode';
import { Container } from '../container';
const path = require('path');
import * as fs from 'fs';
import { tmpdir } from './utils';
import { CustomModule } from '../platform-treeview';

let files: Array<any> = [];

export const registerModuleCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.editModule', editModuleCommand);
    vscode.commands.registerCommand('powershell-universal.newModule', addModuleCommand);

    vscode.workspace.onDidSaveTextDocument(async (file) => {
        if (file.fileName.includes('.universal.code.modules')) {
            const info = files.find(x => x.filePath.toLowerCase() === file.fileName.toLowerCase());
            Container.universal.getModule(info.id).then((module) => {
                module.content = file.getText();
                Container.universal.updateModule(module);
            });
        }
    });
};

export const addModuleCommand = async () => {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter the name of the module to add.'
    });

    if (!name) { return; }

    await Container.universal.newModule(name);

    vscode.commands.executeCommand('powershell-universal.refreshPlatformTreeView');
};

export const editModuleCommand = async (node: CustomModule) => {
    const filePath = path.join(tmpdir(), '.universal.code.modules', `${node.module.id}.ps1`);
    const codePath = path.join(tmpdir(), '.universal.code.modules');
    const config = await Container.universal.getModule(node.module.id);
    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }
    fs.writeFileSync(filePath, config.content);

    const textDocument = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(textDocument);

    files.push({
        id: node.module.id,
        filePath: filePath
    });
};
