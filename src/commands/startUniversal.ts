import * as vscode from 'vscode';
const os = require('os'); 
const path = require('path');
import { load } from './../settings';

export const startUniversal = () => {
    let server = '';
    switch(os.platform())
    {
        case 'darwin':
            server = 'Universal.Server';
            break;
        case 'linux':
            server = 'Universal.Server';
            break;
        case 'win32':
            server = 'Universal.Server.exe';
            break;
        default:
            vscode.window.showErrorMessage("Unsupported platform");
            return;
    }

    const settings = load();

    if (settings.serverPath === "")
    {
        vscode.window.showErrorMessage("Unable to locate the PowerShell Universal Server binary. Did you set the Server Path setting?");
        return;
    }

    const universalPath = path.join(settings.serverPath, server);

    vscode.window.createTerminal("PowerShell Universal", universalPath);
}

export const startUniversalCommand = () => {
    return vscode.commands.registerCommand('powershell-universal.startUniversal', startUniversal);
}