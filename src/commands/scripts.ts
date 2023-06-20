import * as vscode from 'vscode';
import { load } from './../settings';
import { JobTreeItem, ScriptTreeItem } from '../automation-treeview';
import { Container } from '../container';
import { trackJob } from '../job-tracker';
const path = require('path');
const os = require('os');
import * as fs from 'fs';
import { tmpdir } from './utils';

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

export const registerScriptCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openScriptConfigFile', openScriptConfigFileCommand);
    vscode.commands.registerCommand('powershell-universal.invokeScript', item => invokeScriptCommand(item, context));
    vscode.commands.registerCommand('powershell-universal.manageScripts', () => manageScriptsCommand(context));
    vscode.commands.registerCommand('powershell-universal.editScript', editScriptCommand);
    vscode.commands.registerCommand('powershell-universal.viewJobLog', viewJobLogCommand);
    vscode.commands.registerCommand('powershell-universal.viewJob', (item) => viewJobCommand(item, context));
    vscode.commands.registerCommand('powershell-universal.getJobPipelineOutput', getJobPipelineOutputCommand);


    vscode.workspace.onDidSaveTextDocument(async (file) => {
        if (file.fileName.includes('.universal.code.script')) {
            const codePath = path.join(tmpdir(), '.universal.code.script');
            const normCodePath = normalizeDriveLetter(codePath);
            const normFileName = normalizeDriveLetter(file.fileName);
            const fileName = normFileName.replace(normCodePath, "").replace(/^\\*/, "").replace(/^\/*/, "");
            try {
                var script = await Container.universal.getScriptFilePath(fileName);
                script.content = file.getText();
                script = await Container.universal.saveScript(script);
                if (script.content && script.content !== file.getText()) {
                    throw "Failed to save script!";
                }
            }
            catch (e: any) {
                vscode.window.showErrorMessage(e);
            }
        }
    });
}

export const openScriptConfigFileCommand = async () => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, '.universal', 'scripts.ps1');

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const editScriptCommand = async (item: ScriptTreeItem) => {
    var settings = load();
    if (settings.localEditing) {
        await editScriptLocal(item);
    }
    else {
        await editScriptRemote(item);
    }
}

export const editScriptRemote = async (item: ScriptTreeItem) => {
    //https://stackoverflow.com/a/56620552

    const filePath = path.join(tmpdir(), '.universal.code.script', item.script.fullPath);
    const codePath = path.join(tmpdir(), '.universal.code.script');
    const script = await Container.universal.getScript(item.script.id);
    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }
    fs.mkdirSync(path.dirname(filePath), { "recursive": true });
    fs.writeFileSync(filePath, script.content);

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const editScriptLocal = async (item: ScriptTreeItem) => {
    const settings = await Container.universal.getSettings();
    const filePath = path.join(settings.repositoryPath, item.script.fullPath);

    if (!fs.existsSync(filePath)) {
        await vscode.window.showErrorMessage(`Failed to find file ${filePath}. If you have local editing on and are accessing a remote file, you may need to turn off local editing.`);
        return
    }

    const textDocument = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(textDocument);
}

export const invokeScriptCommand = async (item: ScriptTreeItem, context: vscode.ExtensionContext) => {
    const settings = load();

    const connectionName = context.globalState.get("universal.connection");
    var url = settings.url;

    if (connectionName && connectionName !== 'Default') {
        const connection = settings.connections.find(m => m.name === connectionName);
        if (connection) {
            url = connection.url;
        }
    }

    const parameters = await Container.universal.getScriptParameters(item.script.id);
    if (parameters && parameters.length > 0) {
        const result = await vscode.window.showWarningMessage(`Script has parameters and cannot be run from VS Code.`, "View Script");

        if (result === "View Script") {
            vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/automation/scripts/${item.script.fullPath}`));
        }
    } else {
        const jobId = await Container.universal.runScript(item.script.id);
        const result = await vscode.window.showInformationMessage(`Job ${jobId} started.`, "View Job");

        if (result === "View Job") {
            vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/automation/jobs/${jobId}`));
        }

        trackJob(jobId);
    }


}

export const manageScriptsCommand = async (context: vscode.ExtensionContext) => {
    const settings = load();

    const connectionName = context.globalState.get("universal.connection");
    var url = settings.url;

    if (connectionName && connectionName !== 'Default') {
        const connection = settings.connections.find(m => m.name === connectionName);
        if (connection) {
            url = connection.url;
        }
    }

    vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/automation/scripts`));
}

let jobLogChannel = vscode.window.createOutputChannel("PowerShell Universal - Job");

export const viewJobLogCommand = async (jobItem: JobTreeItem) => {

    jobLogChannel.clear();
    jobLogChannel.show();
    jobLogChannel.append(`Loading log for job ${jobItem.job.id}...`);

    Container.universal.getJobLog(jobItem.job.id).then((log) => {
        jobLogChannel.clear();
        jobLogChannel.appendLine(log.log);
    });
}

export const viewJobCommand = async (jobItem: JobTreeItem, context: vscode.ExtensionContext) => {
    const settings = load();

    const connectionName = context.globalState.get("universal.connection");
    var url = settings.url;

    if (connectionName && connectionName !== 'Default') {
        const connection = settings.connections.find(m => m.name === connectionName);
        if (connection) {
            url = connection.url;
        }
    }

    vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/automation/jobs/${jobItem.job.id}`));
}

export const getJobPipelineOutputCommand = async (jobItem: JobTreeItem) => {
    Container.universal.sendTerminalCommand(`Get-PSUJobPipelineOutput -JobId ${jobItem.job.id}`);
};