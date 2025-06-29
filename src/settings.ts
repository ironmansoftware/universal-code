import vscode = require("vscode");
export let PowerShellLanguageId = "powerShellUniversal";

export interface ISettings {
    appToken: string;
    url: string;
    localEditing: boolean;
    checkModules: boolean;
    connections: IConnection[];
}

export interface IConnection {
    name: string;
    appToken?: string | null;
    url: string;
    allowInvalidCertificate?: boolean;
    windowsAuth?: boolean;
}

export function load(): ISettings {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);

    return {
        appToken: configuration.get<string>("appToken", ""),
        url: configuration.get<string>("url", "http://localhost:5000"),
        localEditing: configuration.get<boolean>("localEditing", false),
        checkModules: configuration.get<boolean>("checkModules", false),
        connections: configuration.get<IConnection[]>("connections", []),
    };
}

export async function SetAppToken(value: string) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("appToken", value, vscode.ConfigurationTarget.Global);
}

export async function SetServerPath(value: string) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("serverPath", value, vscode.ConfigurationTarget.Global);
}

export async function SetUrl(value: string) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("url", value, vscode.ConfigurationTarget.Global);
}

export async function SetPort(value: number) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("port", value, vscode.ConfigurationTarget.Global);
}

export async function SetCheckModules(value: boolean) {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(PowerShellLanguageId);
    await configuration.update("checkModules", value, vscode.ConfigurationTarget.Global);
}