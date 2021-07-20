import * as vscode from 'vscode';
import {load} from './../settings';
import {ScriptTreeItem } from './../script-treeview';
import { Container } from '../container';
import { trackJob } from '../job-tracker';
const path = require('path');
const os = require('os');
import * as fs from 'fs';

function normalizeDriveLetter(path: string): string {
	if (hasDriveLetter(path)) {
		return path.charAt(0).toUpperCase() + path.slice(1);
	}

	return path;
}

function hasDriveLetter(path: string): boolean {
	if (os.platform() == 'win32') {
		return isWindowsDriveLetter(path.charCodeAt(0)) && path.charCodeAt(1) === 58;
	}

	return false;
}

function isWindowsDriveLetter(char0: number): boolean {
	return char0 >= 65 && char0 <= 90 || char0 >= 97 && char0 <= 122;
}

export const registerScriptCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openScriptConfigFile', openScriptConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.invokeScript', invokeScriptCommand);
    vscode.commands.registerCommand('powershell-universal.manageScripts', manageScriptsCommand);
    vscode.commands.registerCommand('powershell-universal.editScript', editScriptCommand);
    vscode.workspace.onDidSaveTextDocument((file) => {
        if(file.fileName.includes('.universal.code.script')){
            const codePath = path.join(os.tmpdir(), '.universal.code.script');
            const normCodePath = normalizeDriveLetter(codePath);
            const normFileName = normalizeDriveLetter(file.fileName);
            const fileName = normFileName.replace(normCodePath, "").replace(/^\\*/, "").replace(/^\/*/, "");
            Container.universal.getScriptFilePath(fileName).then((script) => {
                script.content = file.getText();
                Container.universal.saveScript(script);
            });
            
        }
    });
}

export const openScriptConfigFileCommand = async () => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, '.universal', 'scripts.ps1');

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const editScriptCommand = async (item : ScriptTreeItem) => {
    var settings = load();
    if (settings.localEditing)
    {
        await editScriptLocal(item);
    }
    else 
    {
        await editScriptRemote(item);
    }
}

export const editScriptRemote = async (item : ScriptTreeItem) => {
    const filePath = path.join(os.tmpdir(), '.universal.code.script', item.script.fullPath);
    const codePath = path.join(os.tmpdir(), '.universal.code.script');
    const script = await Container.universal.getScript(item.script.id);
    if (!fs.existsSync(codePath)){
        fs.mkdirSync(codePath);
    }
    fs.mkdirSync(path.dirname(filePath), { "recursive": true });
    fs.writeFileSync(filePath, script.content);

    const textDocument = await vscode.workspace.openTextDocument(filePath);    

    vscode.window.showTextDocument(textDocument);
}

export const editScriptLocal = async (item : ScriptTreeItem) => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, item.script.fullPath);

    if (!fs.existsSync(filePath))
    {
        await vscode.window.showErrorMessage(`Failed to find file ${filePath}. If you have local editing on and are accessing a remote file, you may need to turn off local editing.`);
        return 
    }

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
            vscode.env.openExternal(vscode.Uri.parse(`${settings.url}/admin/script/${item.script.fullPath}`));
        }
    } else {
        const jobId = await Container.universal.runScript(item.script.id);
        const result = await vscode.window.showInformationMessage(`Job ${jobId} started.`, "View Job");
    
        if (result === "View Job")
        {
            vscode.env.openExternal(vscode.Uri.parse(`${settings.url}/admin/automation/jobs/${jobId}`));
        }
    
        trackJob(jobId);
    }


}

export const manageScriptsCommand = async () => {
    const settings = load();
    
    vscode.env.openExternal(vscode.Uri.parse(`${settings.url}/admin/scripts`));
}
