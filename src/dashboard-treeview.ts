import * as vscode from 'vscode';
import { Container } from './container';
import { Dashboard, DashboardFramework, DashboardEndpoint, DashboardStatus } from './types';
import ParentTreeItem from './parentTreeItem';
export class DashboardTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: vscode.TreeItem | undefined) {
        if (element == null)
        {
            try 
            {
                return await Container.universal.getDashboards().then(x => x.map(y => new DashboardTreeItem(y)));
            }
            catch 
            {
                return [];
            }
        }

        if (element instanceof ParentTreeItem) 
		{
            var parentTreeItem = element as ParentTreeItem; 
            return parentTreeItem.getChildren();
        }   
    }

    refresh(node? : vscode.TreeItem): void {
		this._onDidChangeTreeData.fire(node);
	}
}

export class DashboardTreeItem extends vscode.TreeItem {
    public dashboard : Dashboard;

    constructor(dashboard : Dashboard) 
    {
        super(dashboard.name, vscode.TreeItemCollapsibleState.None);

        this.description = `${dashboard.dashboardFramework.name} (${dashboard.dashboardFramework.version})`;
        this.dashboard = dashboard;
        const icon = dashboard.status == DashboardStatus.Started ? "debug-start" : "debug-stop";
        const themeIcon = new vscode.ThemeIcon(icon);
        this.iconPath = themeIcon;
    }

    contextValue = "dashboard";
}

export class DashboardEndpointsTreeItem extends ParentTreeItem {
    public endpoints : Array<DashboardEndpoint>;

    constructor(endpoints : Array<DashboardEndpoint>) {
        super("Endpoints", vscode.TreeItemCollapsibleState.Collapsed);

        this.endpoints = endpoints;
    }

    getChildren(): Promise<vscode.TreeItem[]> {
        if (!this.endpoints) 
        {
            return new Promise((resolve) => resolve([]));
        }
        

        return new Promise((resolve) => resolve(this.endpoints.map(x => new DashboardEndpointTreeItem(x))));
    }
}

export class DashboardEndpointTreeItem extends vscode.TreeItem {

    public endpoint : DashboardEndpoint;

    constructor(endpoint : DashboardEndpoint) {
        super(endpoint.id);

        this.endpoint = endpoint;
    }

    contextValue = 'endpoint';
    iconPath = '$(code)'
    
}