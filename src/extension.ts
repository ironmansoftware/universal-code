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
import { AutomationTreeViewProvider } from './automation-treeview';
import { registerScriptCommands } from './commands/scripts';
import { registerConfigCommands } from './commands/config';
import { ConfigTreeViewProvider } from './configuration-treeview';
import { registerConnectCommands, tryAutoConnect } from './commands/connect';
import { registerSampleCommands, SampleService } from './samples';
import { SampleTreeViewProvider } from './sample-treeview';
var compareVersions = require('compare-versions');

export async function activate(context: vscode.ExtensionContext) {

    var extension = vscode.extensions.getExtension("ms-vscode.PowerShell");
    if (!extension)
    {
        extension = vscode.extensions.getExtension("ms-vscode.PowerShell-Preview");
    }

    if (!extension) {
        vscode.window.showErrorMessage("PowerShell Universal requires the Microsoft PowerShell or PowerShell Preview extension.");
        return;
    }

    if (!extension.isActive)
        await extension.activate();

	registerConnectCommands(context);

	const universal = new Universal(context);
	Container.initialize(context, universal);

	let settings = load();
	if (settings.appToken === "") {
		if (await tryAutoConnect())
		{
			vscode.window.showInformationMessage("You're connected to PowerShell Universal.");
		}
		else 
		{
			vscode.window.showInformationMessage("You need to configure the PowerShell Universal extension. If you haven't installed PowerShell Universal, you should download it. If you have PowerShell Universal running, you can connect.", "Download", "Connect").then(result => {
				if (result === "Download") {
					vscode.env.openExternal(vscode.Uri.parse("https://ironmansoftware.com/downloads"));
				}
				vscode.commands.executeCommand("powershell-universal.connect");
			});
		}
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

	if (settings.appToken !== "")
	{
		var semver = require('semver');
		const version = await universal.getVersion();
		if (version === 'failed')
		{
			var result = await vscode.window.showErrorMessage("Failed to connect to PowerShell Universal. Universal may not be running or you need to update your settings.", "Download", "Settings");
			if (result === "Download")
			{
				vscode.env.openExternal(vscode.Uri.parse("https://ironmansoftware.com/downloads"));
			}
	
			if (result === "Settings")
			{
				vscode.commands.executeCommand('workbench.action.openSettings2', "PowerShell Universal");
			}
		}
		else if (semver.lt(version, "2.0.0") == -1) {
			await vscode.window.showErrorMessage("This extension requires PowerShell Universal 2.0.0 or newer.");
			return;
		} else {
			try 
			{
				const releasedVersion = await universal.getReleasedVersion();
				
				if(semver.gt(releasedVersion, version)){
					vscode.window.showInformationMessage(`There's an update available for PowerShell Universal. Would you like to download PowerShell Universal ${releasedVersion}?`, "Download").then(x => {
						if (result === "Download") {
							vscode.env.openExternal(vscode.Uri.parse("https://ironmansoftware.com/downloads"));
						}
					});
				}
			} 
			catch 
			{
				console.log("Failed to check for updates.");
			}	
		}
	}

	vscode.window.registerUriHandler({
		handleUri: (uri: vscode.Uri): vscode.ProviderResult<void> => {
			if (uri.path.startsWith('/debug')) {
				const querystring = require('querystring');
				const query = querystring.parse(uri.query);

				Container.universal.sendTerminalCommand(`if ($PID -ne ${query.PID}) {Enter-PSHostProcess -ID ${query.PID} }`);
				Container.universal.sendTerminalCommand(`Debug-Runspace -ID ${query.RS}`);
			}

			if (uri.path.startsWith('/connect')) {
				var atob = require('atob');
				const querystring = require('querystring');
				const query = querystring.parse(uri.query);
				const url = atob(query.CB);

				Container.universal.connectUniversal(url);

				vscode.commands.executeCommand('powershell-universal.refreshTreeView');
				vscode.commands.executeCommand('powershell-universal.refreshEndpointTreeView');
				vscode.commands.executeCommand('powershell-universal.refreshScriptTreeView');
				vscode.commands.executeCommand('powershell-universal.refreshConfigurationTreeView');
			}
		}
	});

	const moduleProvider = new DashboardTreeViewProvider();
	const infoProvider = new InfoTreeViewProvider();
	const endpointProvider = new ApiTreeViewProvider();
	const scriptProvider = new AutomationTreeViewProvider();
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
	vscode.commands.registerCommand('powershell-universal.refreshConfigurationTreeView', () => configProvider.refresh());
	
	downloadUniversalCommand();
	startUniversalCommand();
	help();
	registerDashboardCommands(context);
	registerEndpointCommands(context);
	registerScriptCommands(context);
	registerConfigCommands(context);
	registerSampleCommands(context);

	await vscode.commands.executeCommand("powershell-universal.syncSamples");

	const lastModuleCheck : number = context.globalState.get('psu.lastmodulecheck') || 0;
	const now = Date.now();

	if (settings.checkModules && (now - lastModuleCheck) > 1000 * 60 * 60 * 24)
	{
		vscode.window.showInformationMessage("Checking PowerShell Universal module state. Updated modules will be installed. You can disable this check by disabling the Check Modules setting.");
		Container.universal.sendTerminalCommand(`Import-Module (Join-Path '${__dirname}' 'Universal.VSCode.psm1')`);
		context.globalState.update('psu.lastmodulecheck', now);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
