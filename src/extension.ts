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
import { load, SetUrl } from './settings';
import { registerDashboardCommands } from './commands/dashboards';
import { ApiTreeViewProvider } from './api-treeview';
import { registerEndpointCommands } from './commands/endpoints';
import { ScriptTreeViewProvider } from './script-treeview';
import { registerScriptCommands } from './commands/scripts';
import { registerConfigCommands } from './commands/config';
import { ConfigTreeViewProvider } from './configuration-treeview';
import { registerConnectCommands } from './commands/connect';
import { registerSampleCommands, SampleService } from './samples';
import { SampleTreeViewProvider } from './sample-treeview';
var compareVersions = require('compare-versions');

export async function activate(context: vscode.ExtensionContext) {
	registerConnectCommands(context);

	const universal = new Universal(context);
	Container.initialize(context, universal);

	let settings = load();
	if (settings.appToken === "") {
		const result = await vscode.window.showInformationMessage("You need to configure the PowerShell Universal extension. If you haven't installed PowerShell Universal, you should download it. If you have PowerShell Universal running, you can connect.", "Download", "Connect");

		if (result === "Download") {
			vscode.env.openExternal(vscode.Uri.parse("https://ironmansoftware.com/downloads"));
		}
		await vscode.commands.executeCommand("powershell-universal.connect");
	} else if (settings.url == "") {
		let address = settings.computerName;
        if (!address.toLocaleLowerCase().startsWith('http'))
        {
            address = `http://${address}`;
        }

		let url = `${address}:${settings.port}`
		
		await SetUrl(url);
	}

	settings = load();

	if (settings.startServer)
	{
		var disposable = vscode.window.setStatusBarMessage("Starting up PowerShell Universal...")
		await startUniversal();
		disposable.dispose();

		disposable = vscode.window.setStatusBarMessage(`Connecting to PowerShell Universal at ${settings.url}...`)
		if (!await universal.waitForAlive())
		{
			return;
		}
		disposable.dispose();
	}

	const releasedVersion = await universal.getReleasedVersion();
	const version = await universal.getVersion();

	if(releasedVersion != version){
		const result = await vscode.window.showInformationMessage(`There's an update available for PowerShell Universal. Would you like to download PowerShell Universal ${releasedVersion}?`, "Download");
		if (result === "Download") {
			vscode.env.openExternal(vscode.Uri.parse("https://ironmansoftware.com/downloads"));
		}
	}

	if (compareVersions(version, "1.5.0") == -1) {
		await vscode.window.showErrorMessage("This extension requires PowerShell Universal 1.5.0 or newer.");
	}
	
	vscode.window.registerUriHandler({
		handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
			if (uri.path.startsWith('/debug')) {
				const querystring = require('querystring');
				const query = querystring.parse(uri.query);

				Container.universal.sendTerminalCommand(`if ($PID -ne ${query.PID}) {Enter-PSHostProcess -ID ${query.PID} }`);
				Container.universal.sendTerminalCommand(`Debug-Runspace -ID ${query.RS}`);
			}

		}
	});

	const moduleProvider = new DashboardTreeViewProvider();
	const infoProvider = new InfoTreeViewProvider();
	const endpointProvider = new ApiTreeViewProvider();
	const scriptProvider = new ScriptTreeViewProvider();
	const configProvider = new ConfigTreeViewProvider();
	const samplesProvider = new SampleTreeViewProvider();

	vscode.window.createTreeView<vscode.TreeItem>('universalDashboardProviderView', { treeDataProvider: moduleProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalEndpointProviderView', { treeDataProvider: endpointProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalScriptProviderView', { treeDataProvider: scriptProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalConfigProviderView', { treeDataProvider: configProvider });
	vscode.window.createTreeView<vscode.TreeItem>('sampleProviderView', { treeDataProvider: samplesProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalInfoProviderView', { treeDataProvider: infoProvider });
	
	vscode.commands.registerCommand('powershell-universal.refreshTreeView', () => moduleProvider.refresh());
	vscode.commands.registerCommand('powershell-universal.refreshEndpointTreeView', () => endpointProvider.refresh());
	vscode.commands.registerCommand('powershell-universal.refreshScriptTreeView', () => scriptProvider.refresh());
	
	downloadUniversalCommand();
	startUniversalCommand();
	help();
	registerDashboardCommands(context);
	registerEndpointCommands(context);
	registerScriptCommands(context);
	registerConfigCommands(context);
	registerSampleCommands(context);

	await vscode.commands.executeCommand("powershell-universal.syncSamples");
}

// this method is called when your extension is deactivated
export function deactivate() {}
