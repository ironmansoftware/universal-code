import * as vscode from 'vscode';
import { Container } from '../container';
import { DashboardEndpointTreeItem } from '../dashboard-treeview';

const debugEndpoint = () => {
    return vscode.commands.registerCommand('powershell-universal.debugEndpoint', async (item : DashboardEndpointTreeItem) => {
        Container.universal.debugDashboardEndpoint(item.endpoint.id);
	});
}

export default debugEndpoint;