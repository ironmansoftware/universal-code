import * as vscode from 'vscode';
import {load} from './../settings';
import {ScriptTreeItem } from './../script-treeview';
import { Container } from '../container';
import { trackJob } from '../job-tracker';
const path = require('path');

export const registerScriptCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openScriptConfigFile', openScriptConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.invokeScript', invokeScriptCommand);
    vscode.commands.registerCommand('powershell-universal.manageScripts', manageScriptsCommand);
    vscode.commands.registerCommand('powershell-universal.editScript', editScriptCommand);
}

export const openScriptConfigFileCommand = async () => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, '.universal', 'scripts.ps1');

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const editScriptCommand = async (item : ScriptTreeItem) => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, item.script.fullPath);

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const invokeScriptCommand = async (item : ScriptTreeItem) => {
    const settings = load();

    const parameters = await Container.universal.getScriptParameters(item.script.id);
    if (parameters && parameters.length > 0) {
        const result = await vscode.window.showWarningMessage(`Script has parameters and cannot be run from VS Code.`, "View Script");
    
        if (result === "View Script")
        {
            vscode.env.openExternal(vscode.Uri.parse(`http://${settings.computerName}:${settings.port}/admin/script/${item.script.id}`));
        }
    } else {
        const jobId = await Container.universal.runScript(item.script.id);
        const result = await vscode.window.showInformationMessage(`Job ${jobId} started.`, "View Job");
    
        if (result === "View Job")
        {
            vscode.env.openExternal(vscode.Uri.parse(`http://${settings.computerName}:${settings.port}/admin/job/${jobId}`));
        }
    
        trackJob(jobId);
    }


}

export const manageScriptsCommand = async () => {
    const settings = load();
    
    vscode.env.openExternal(vscode.Uri.parse(`http://${settings.computerName}:${settings.port}/admin/scripts`));
}