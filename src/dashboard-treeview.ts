import * as vscode from 'vscode';
import { Container } from './container';
import { Dashboard, DashboardFramework, DashboardEndpoint, DashboardStatus, DashboardLogItem, DashboardComponent } from './types';
import ParentTreeItem from './parentTreeItem';
export class DashboardTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: vscode.TreeItem | undefined) {
        if (element == null) {
            return [
                new DashboardsTreeItem()
            ]
        }

        if (element instanceof ParentTreeItem) {
            var parentTreeItem = element as ParentTreeItem;
            return parentTreeItem.getChildren();
        }
    }

    refresh(node?: vscode.TreeItem): void {
        this._onDidChangeTreeData.fire(node);
    }
}

export class DashboardsTreeItem extends ParentTreeItem {
    constructor() {
        super("Apps", vscode.TreeItemCollapsibleState.Collapsed);

        this.iconPath = new vscode.ThemeIcon('dashboard');
    }
    async getChildren(): Promise<vscode.TreeItem[]> {
        try {
            const dashboards = await Container.universal.getDashboards();
            return dashboards.map(y => new DashboardTreeItem(y));
        }
        catch (err) {
            Container.universal.showConnectionError("Failed to query apps. " + err);
            return [];
        }
    }
}

export class DashboardTreeItem extends vscode.TreeItem {
    public dashboard: Dashboard;
    private logIndex: number;

    constructor(dashboard: Dashboard) {
        super(dashboard.name, vscode.TreeItemCollapsibleState.None);
        this.dashboard = dashboard;
        const icon = dashboard.status === DashboardStatus.Started ? "debug-start" : "debug-stop";
        const themeIcon = new vscode.ThemeIcon(icon);
        this.iconPath = themeIcon;
        this.logIndex = 0;
    }

    async reloadLog() {
        const log = await Container.universal.getDashboardLog(this.dashboard.name);
        const logChannel = Container.getPanel(`App (${this.dashboard.name})`);
        logChannel.clear();
        logChannel.appendLine(log);
    }

    async clearLog() {
        const logChannel = Container.getPanel(`App (${this.dashboard.name})`);
        logChannel.clear();
        this.logIndex = 0;
    }

    async showLog() {
        const logChannel = Container.getPanel(`App (${this.dashboard.name})`);
        await this.reloadLog();
        logChannel.show();
    }

    contextValue = "dashboard";
}

export class DashboardEndpointsTreeItem extends ParentTreeItem {
    public endpoints: Array<DashboardEndpoint>;

    constructor(endpoints: Array<DashboardEndpoint>) {
        super("Endpoints", vscode.TreeItemCollapsibleState.Collapsed);

        this.endpoints = endpoints;
    }

    getChildren(): Promise<vscode.TreeItem[]> {
        if (!this.endpoints) {
            return new Promise((resolve) => resolve([]));
        }


        return new Promise((resolve) => resolve(this.endpoints.map(x => new DashboardEndpointTreeItem(x))));
    }
}

export class DashboardEndpointTreeItem extends vscode.TreeItem {

    public endpoint: DashboardEndpoint;

    constructor(endpoint: DashboardEndpoint) {
        super(endpoint.id);

        this.endpoint = endpoint;
    }

    contextValue = 'endpoint';
    iconPath = '$(code)'

}