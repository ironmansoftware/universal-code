import vscode = require("vscode");
export let PowerShellLanguageId = "powerShellUniversal";

export interface ISettings {
    port: number;
    computerName: string;
    appToken: string;
    serverPath : string;
    startServer: boolean;
}

export function load() : ISettings {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);

    return {
        port: configuration.get<number>("port", 10000),
        computerName: configuration.get<string>("computerName", "localhost"),
        appToken: configuration.get<string>("appToken", ""),
        serverPath: configuration.get<string>("serverPath", ""),
        startServer: configuration.get<boolean>("startServer", false),
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