// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Universal } from './universal';
import { Container } from './container';
import { DashboardTreeViewProvider } from './dashboard-treeview';
import { InfoTreeViewProvider } from './info-treeview';
import help from './commands/helpCommand';
import { downloadUniversalCommand, downloadUniversal } from './commands/downloadUniversal';
import { startUniversal, startUniversalCommand } from './commands/startUniversal';
import { load } from './settings';
import { registerDashboardCommands } from './commands/dashboards';

export async function activate(context: vscode.ExtensionContext) {

	const universal = new Universal(context);
	Container.initialize(context, universal);

	const settings = load();
	var firstTime = false;
	if (settings.serverPath === "") {
		firstTime = true;
		const result = await vscode.window.showInformationMessage("PowerShell Universal not found. Would you like to download and start the server?", "Download");

		if (result === "Download") {

			var disposable = vscode.window.setStatusBarMessage("Downloading PowerShell Universal...")
			await downloadUniversal();
			disposable.dispose();
		}
	}

	disposable = vscode.window.setStatusBarMessage("Starting up PowerShell Universal...")
	await startUniversal();
	await universal.waitForAlive();
	disposable.dispose();

	if (settings.appToken === "")
	{	
		await universal.grantAppToken();
	}

	if (firstTime)
	{
		const result = await vscode.window.showInformationMessage("You're ready to rock! PowerShell Universal is up and running.", "Go to Admin Console");
		if (result === "Go to Admin Console")
		{
			vscode.env.openExternal(vscode.Uri.parse("http://localhost:5000"))
		}
	}

	const moduleProvider = new DashboardTreeViewProvider();
	const infoProvider = new InfoTreeViewProvider();
	vscode.window.createTreeView<vscode.TreeItem>('universalDashboardProviderView', { treeDataProvider: moduleProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalInfoProviderView', { treeDataProvider: infoProvider });
	vscode.commands.registerCommand('powershell-universal.refreshTreeView', () => moduleProvider.refresh());

	downloadUniversalCommand();
	startUniversalCommand();
	help();
	registerDashboardCommands(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
