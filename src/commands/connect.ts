import * as vscode from 'vscode';
import {load, SetAppToken, SetPort, SetServerPath, SetUrl} from './../settings';
import { Container } from '../container';

export const registerConnectCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.connect', connectToUniversal);
}

export const connectToUniversal = async () => {
    let result = await vscode.window.showInformationMessage("To connect to your PowerShell Universal server, you will need to specify the URL (including port) and AppToken to access the server. Ensure that PowerShell Universal is up and running before connecting.", "Connect");
    if (result === "Connect")
    {
        let url = await vscode.window.showInputBox({
            prompt: "The URL of the PowerShell Universal server (including port)",
            value: "http://localhost:5000"
        });

        if (url) {
            await SetUrl(url);

            let result = await vscode.window.showInformationMessage("We need an App Token to connect to the server. We can grant one automatically if you haven't configured security yet. If you'd like to create one yourself, you can do so in the admin console.", "Grant App Token", "Enter App Token", "View Admin Console");
            if (result === "Grant App Token") {
                if (!await Container.universal.waitForAlive())
                {
                    return;
                }

                if (!await Container.universal.grantAppToken())
                {
                    return;
                }

                vscode.window.showInformationMessage("You are now connected to PowerShell Universal. Use the PowerShell Universal activity pane to manage resources.");
            }

            if (result === "View Admin Console") {
                vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/settings/security`))
            }

            if (result !== "Grant App Token") {
                let appToken = await vscode.window.showInputBox({
                    prompt: "Enter your App Token"
                });

                if (appToken) {
                    await SetAppToken(appToken);
                    vscode.window.showInformationMessage("You are now connected to PowerShell Universal. Use the PowerShell Universal activity pane to manage resources.");
                }
            }
        }
    }
}

export const tryAutoConnect = async () => {
    const defaultUrl = "http://localhost:5000";
    if (await Container.universal.isAlive(defaultUrl))
    {
        await SetUrl(defaultUrl);
        if (await Container.universal.grantAppToken())
        {
            return true;
        }
        await SetUrl("");
    }
    return false;
}