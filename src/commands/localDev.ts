import * as vscode from 'vscode';
import { LocalDevConfig } from '../types';
import { Container } from '../container';
const os = require('os');
const https = require('https');
const fs = require('fs');
const temp = require('temp');
var AdmZip = require('adm-zip');
const path = require('path');

export const registerLocalDevCommands = (context: vscode.ExtensionContext) => {
    context.subscriptions.push(vscode.commands.registerCommand('powershell-universal.downloadUniversal', downloadUniversal));
    context.subscriptions.push(vscode.commands.registerCommand('powershell-universal.startUniversal', () => startPowerShellUniversal(context)));
    context.subscriptions.push(vscode.commands.registerCommand('powershell-universal.clearLocalDatabase', clearLocalDatabase));
    context.subscriptions.push(vscode.commands.registerCommand('powershell-universal.connectLocalDevModule', () => connectModule(context)));
};

const startPowerShellUniversal = async (context: vscode.ExtensionContext) => {
    const config = getPsuDevConfig();
    if (!config) {
        return;
    }

    const psuPath = path.join(process.env.USERPROFILE, ".psu");
    if (!fs.existsSync(psuPath)) {
        await downloadUniversal();
    }

    let exe = 'Universal.Server.exe';
    if (os.platform() === 'win32') {
        exe = 'Universal.Server.exe';
    } else {
        exe = 'Universal.Server';
    }

    const universalPath = path.join(psuPath, config.version, exe);

    if (vscode.workspace.workspaceFolders === undefined) {
        vscode.window.showErrorMessage("No workspace folder is open. Please open a workspace folder and define a psu.dev.config to download Universal.");
        return;
    }

    config.databaseType = config.databaseType || "SQLite";
    let connectionString = config.databaseConnectionString || null;
    if (connectionString === null) {
        const databasePath = path.join(process.env.USERPROFILE, ".psu", "databases", vscode.workspace.name, "psu.db");
        connectionString = `Data Source=${databasePath}`;
    }

    vscode.window.createTerminal({
        name: `PowerShell Universal ${config.version}`,
        shellPath: universalPath,
        shellArgs: ["Mode", "Dev"],
        env: {
            "Data__RepositoryPath": vscode.workspace.workspaceFolders[0].uri.fsPath,
            "Data__ConnectionString": connectionString,
            "Plugin__0": config.databaseType,
            "PSUDefaultAdminPassword": "admin",
            "PSUDefaultAdminName": "admin",
            ...config.env,
        }
    }).show();

    if (config.browserPort) {
        vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${config.browserPort || 5000}`));
    }

    context.globalState.update("psu.dev.config", config);

    context.globalState.update("universal.connection", "Local Development");
    vscode.commands.executeCommand('powershell-universal.refreshAllTreeViews');
};

const clearLocalDatabase = () => {
    const dbPath = path.join(process.env.USERPROFILE, ".psu", "databases", vscode.workspace.name, "psu.db");
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);

        vscode.window.showInformationMessage(`Local development database cleared at.${dbPath}`);
    }
};

const downloadUniversal = async () => {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Downloading Universal"
    }, async (progress) => {
        temp.track();

        let platform = '';
        switch (os.platform()) {
            case 'darwin':
                platform = 'osx';
                break;
            case 'linux':
                platform = 'linux';
                break;
            case 'win32':
                platform = 'win';
                break;
            default:
                vscode.window.showErrorMessage("Unsupported platform");
                return;
        }

        const config = getPsuDevConfig();
        if (!config) {
            return;
        }

        progress.report({ increment: 75, message: `Extracting PowerShell Universal ${config.version}` });

        var tempPath = path.join(temp.dir, `Universal.${platform}-x64.${config.version}.zip`);
        await downloadFile(`https://imsreleases.blob.core.windows.net/universal/production/${config.version}/Universal.${platform}-x64.${config.version}.zip`, tempPath);

        const universalPath = path.join(process.env.USERPROFILE, ".psu", config.version);

        var zip = new AdmZip(tempPath);
        zip.extractAllTo(universalPath, true);

        progress.report({ increment: 100, message: `PowerShell Universal ${config.version} downloaded and extracted to ${universalPath}` });
    });
};

const downloadFile = (url: string, dest: string) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWrite(dest);
        file.on('finish', () => {
            file.close(resolve);
        });

        file.on('error', (err: any) => {
            fs.unlink(dest, () => reject(err));
        });

        https.get(url, (response: any) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download file: ${response.statusCode}`));
            }
            response.pipe(file);
        }).on('error', (err: any) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

const getPsuDevConfig = (): LocalDevConfig | null => {
    if (vscode.workspace.workspaceFolders === undefined) {
        vscode.window.showErrorMessage("No workspace folder is open. Please open a workspace folder and define a psu.dev.config to download Universal.");
        return null;
    }

    const devDevPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "psu.dev.json");
    if (!fs.existsSync(devDevPath)) {
        vscode.window.showErrorMessage("No psu.dev.json file found in the workspace. Please create one to start PowerShell Universal.");
        return null;
    }

    const devJson = fs.readFileSync(devDevPath, 'utf8');
    return JSON.parse(devJson);
};

const connectModule = async (context: vscode.ExtensionContext) => {

    const config = getPsuDevConfig();

    if (!config) {
        vscode.window.showErrorMessage("No psu.dev.json file found in the workspace. Please create one to connect to PowerShell Universal.");
        return;
    }

    Container.universal.sendTerminalCommand(`Import-Module (Join-Path '${__dirname}' 'Universal.VSCode.psm1')`);
    Container.universal.sendTerminalCommand(`Import-LocalDevelopmentModule -Version '${config.version}' -Port '${config.browserPort || 5000}'`);
}