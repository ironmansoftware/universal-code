// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Universal } from './universal';
import { Container } from './container';
import { DashboardTreeViewProvider } from './dashboard-treeview';
import { InfoTreeViewProvider } from './info-treeview';
import help from './commands/helpCommand';
import { downloadUniversalCommand, downloadUniversal } from './commands/downloadUniversal';
import { load, SetUrl } from './settings';
import { registerDashboardCommands } from './commands/dashboards';
import { ApiTreeViewProvider } from './api-treeview';
import { registerEndpointCommands } from './commands/endpoints';
import { AutomationTreeViewProvider } from './automation-treeview';
import { registerScriptCommands } from './commands/scripts';
import { registerConfigCommands } from './commands/config';
import { ConfigTreeViewProvider } from './configuration-treeview';
import { registerConnectCommands } from './commands/connect';
import { registerSampleCommands } from './samples';
import { SampleTreeViewProvider } from './sample-treeview';
import { ConnectionTreeViewProvider } from './connection-treeview';
import { registerWelcomeCommands } from './commands/welcomeCommand';
import { registerWalkthroughCommands } from './commands/walkthrough';
import { registerTerminalCommands } from './commands/terminals';
import { PlatformTreeViewProvider } from './platform-treeview';

export async function activate(context: vscode.ExtensionContext) {

	var extension = vscode.extensions.getExtension("ms-vscode.PowerShell");
	if (!extension) {
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
	if (settings.appToken === "" && settings.connections.length === 0) {
		vscode.commands.executeCommand('powershell-universal.welcome')

		vscode.window.showInformationMessage("You need to configure the PowerShell Universal extension. If you haven't installed PowerShell Universal, you should download it. If you have PowerShell Universal running, you can connect.", "Download", "Settings").then(result => {
			if (result === "Download") {
				vscode.env.openExternal(vscode.Uri.parse("https://ironmansoftware.com/downloads"));
			}

			if (result === "Settings") {
				vscode.commands.executeCommand('workbench.action.openSettings', "PowerShell Universal");
			}
		});
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

				vscode.commands.executeCommand('powershell-universal.refreshAllTreeViews');
			}
		}
	});

	const connectionProvider = new ConnectionTreeViewProvider(context);
	const moduleProvider = new DashboardTreeViewProvider();
	const infoProvider = new InfoTreeViewProvider();
	const endpointProvider = new ApiTreeViewProvider();
	const scriptProvider = new AutomationTreeViewProvider();
	const configProvider = new ConfigTreeViewProvider();
	const samplesProvider = new SampleTreeViewProvider();
	const platformProvider = new PlatformTreeViewProvider();

	vscode.window.createTreeView<vscode.TreeItem>('universalConnectionProviderView', { treeDataProvider: connectionProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalDashboardProviderView', { treeDataProvider: moduleProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalEndpointProviderView', { treeDataProvider: endpointProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalScriptProviderView', { treeDataProvider: scriptProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalConfigProviderView', { treeDataProvider: configProvider });
	vscode.window.createTreeView<vscode.TreeItem>('sampleProviderView', { treeDataProvider: samplesProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalInfoProviderView', { treeDataProvider: infoProvider });
	vscode.window.createTreeView<vscode.TreeItem>('universalPlatformProviderView', { treeDataProvider: platformProvider });

	Container.ConfigFileTreeView = configProvider;

	vscode.commands.registerCommand('powershell-universal.refreshTreeView', () => moduleProvider.refresh());
	vscode.commands.registerCommand('powershell-universal.refreshEndpointTreeView', () => endpointProvider.refresh());
	vscode.commands.registerCommand('powershell-universal.refreshScriptTreeView', () => scriptProvider.refresh());
	vscode.commands.registerCommand('powershell-universal.refreshConfigurationTreeView', () => configProvider.refresh());
	vscode.commands.registerCommand('powershell-universal.refreshConnectionTreeView', () => connectionProvider.refresh());
	vscode.commands.registerCommand('powershell-universal.refreshPlatformTreeView', () => platformProvider.refresh());

	vscode.commands.registerCommand('powershell-universal.refreshAllTreeViews', () => {
		vscode.commands.executeCommand('powershell-universal.refreshTreeView');
		vscode.commands.executeCommand('powershell-universal.refreshEndpointTreeView');
		vscode.commands.executeCommand('powershell-universal.refreshScriptTreeView');
		vscode.commands.executeCommand('powershell-universal.refreshConfigurationTreeView');
		vscode.commands.executeCommand('powershell-universal.refreshConnectionTreeView');
	});

	downloadUniversalCommand();
	help();
	registerDashboardCommands(context);
	registerEndpointCommands(context);
	registerScriptCommands(context);
	registerConfigCommands(context);
	registerSampleCommands(context);
	registerWelcomeCommands(context);
	registerWalkthroughCommands(context);
	registerTerminalCommands(context);

	await vscode.commands.executeCommand("powershell-universal.syncSamples");

	if (Container.universal.hasConnection()) {
		if (await Container.universal.waitForAlive()) {
			await Container.universal.installAndLoadModule();
		}
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
