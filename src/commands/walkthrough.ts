import * as vscode from 'vscode';

export const registerWalkthroughCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.walkthrough', Welcome);
}

export const Welcome = async (context: vscode.ExtensionContext) => {
    vscode.commands.executeCommand('workbench.action.openWalkthrough', {
        category: 'ironmansoftware.powershell-universal#universal.welcome'
    })
}