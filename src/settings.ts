import vscode = require("vscode");
export let PowerShellLanguageId = "powerShellUniversal";

export interface ISettings {
    port: number;
    computerName: string;
    appToken: string;
    serverPath : string;
    startServer: boolean;
    url: string;
    samplesDirectory: string;
    syncSamples: boolean;
}

export function load() : ISettings {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);

    return {
        port: configuration.get<number>("port", 5000),
        computerName: configuration.get<string>("computerName", "localhost"),
        appToken: configuration.get<string>("appToken", ""),
        serverPath: configuration.get<string>("serverPath", ""),
        startServer: configuration.get<boolean>("startServer", false),
        url: configuration.get<string>("url", "http://localhost:5000"),
        samplesDirectory: configuration.get<string>("samplesDirectory", ""),
        syncSamples: configuration.get<boolean>("syncSamples", true)
    }
}

export async function SetAppToken(value : string) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("appToken", value, vscode.ConfigurationTarget.Global);
}

export async function SetServerPath(value : string) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("serverPath", value, vscode.ConfigurationTarget.Global);
}

export async function SetSamplesDirectory(value : string) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("samplesDirectory", value, vscode.ConfigurationTarget.Global);
}

export async function SetUrl(value : string) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("url", value, vscode.ConfigurationTarget.Global);
}

export async function SetPort(value : number) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("port", value, vscode.ConfigurationTarget.Global);
}