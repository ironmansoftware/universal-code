import * as vscode from 'vscode';
import WelcomePanel from '../webviews/welcome';

export const registerWelcomeCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.welcome', Welcome);
}

export const Welcome = async (context: vscode.ExtensionContext) => {
    var extension = vscode.extensions.getExtension('ironmansoftware.powershell-universal');
    if (extension) {
        WelcomePanel.createOrShow(extension.extensionUri)
    }
}