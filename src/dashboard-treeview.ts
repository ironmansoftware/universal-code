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
        if (element == null)
        {
            return [
                new DashboardsTreeItem(),
                new DashboardComponentsTreeItem(),
                new DashboardFrameworksTreeItem()
            ]
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

export class DashboardFrameworksTreeItem extends ParentTreeItem {
    constructor() 
    {
        super("Frameworks", vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = new vscode.ThemeIcon('library');
    }
    async getChildren(): Promise<vscode.TreeItem[]> {
        try 
        {
            const components = await Container.universal.getDashboardFrameworks();
            return components.map(y => new DashboardFrameworkTreeItem(y));
        }
        catch (err)
        {
            vscode.window.showErrorMessage("Failed to query dashboard frameworks. " + err);
            return [];
        }
    }
}

export class DashboardComponentsTreeItem extends ParentTreeItem {
    constructor() 
    {
        super("Components", vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = new vscode.ThemeIcon('versions');
    }
    async getChildren(): Promise<vscode.TreeItem[]> {
        try 
        {
            const components = await Container.universal.getDashboardComponents();
            return components.map(y => new DashboardComponentTreeItem(y));
        }
        catch (err)
        {
            vscode.window.showErrorMessage("Failed to query dashboards. " + err);
            return [];
        }
    }
}

export class DashboardsTreeItem extends ParentTreeItem {
    constructor() 
    {
        super("Dashboards", vscode.TreeItemCollapsibleState.Collapsed);

        this.iconPath = new vscode.ThemeIcon('dashboard');
    }
    async getChildren(): Promise<vscode.TreeItem[]> {
        try 
        {
            const dashboards = await Container.universal.getDashboards();
            return dashboards.map(y => new DashboardTreeItem(y));
        }
        catch (err)
        {
            vscode.window.showErrorMessage("Failed to query dashboards. " + err);
            return [];
        }
    }
}

export class DashboardTreeItem extends vscode.TreeItem {
    public dashboard : Dashboard;
    private logIndex : number;

    constructor(dashboard : Dashboard) 
    {
        super(dashboard.name, vscode.TreeItemCollapsibleState.None);

        this.description = `${dashboard.dashboardFramework.name} (${dashboard.dashboardFramework.version})`;
        this.dashboard = dashboard;
        const icon = dashboard.status == DashboardStatus.Started ? "debug-start" : "debug-stop";
        const themeIcon = new vscode.ThemeIcon(icon);
        this.iconPath = themeIcon;
        this.logIndex = 0;

        setInterval(async () => await this.reloadLog(), 5000);
    }

    async reloadLog() {
        const log = await Container.universal.getDashboardLog(this.dashboard.id);

        const json : Array<DashboardLogItem> = JSON.parse(log.log);
        const newLog = json.slice(this.logIndex);
    
        const logChannel = Container.getPanel(`Dashboard (${this.dashboard.name})`);
        newLog.forEach(item => {
            logChannel.appendLine( `[${item.Timestamp}] ${item.Data}`);
        });

        this.logIndex = json.length;
    }

    async clearLog() {
        const logChannel = Container.getPanel(`Dashboard (${this.dashboard.name})`);
        logChannel.clear();
        this.logIndex = 0;
    }

    async showLog() {
        const logChannel = Container.getPanel(`Dashboard (${this.dashboard.name})`);
        await this.reloadLog();
        logChannel.show();
    }

    contextValue = "dashboard";
}

export class DashboardComponentTreeItem extends vscode.TreeItem {
    public dashboardComponent : DashboardComponent;

    constructor(dashboardComponent : DashboardComponent) 
    {
        super(dashboardComponent.name, vscode.TreeItemCollapsibleState.None);

        this.description = `${dashboardComponent.version}`;
        this.dashboardComponent = dashboardComponent;
        const themeIcon = new vscode.ThemeIcon('primitive-square');
        this.iconPath = themeIcon;
    }

    contextValue = "dashboardComponent";
}

export class DashboardFrameworkTreeItem extends vscode.TreeItem {
    public dashboardComponent : DashboardFramework;

    constructor(dashboardComponent : DashboardFramework) 
    {
        super(dashboardComponent.name, vscode.TreeItemCollapsibleState.None);

        this.description = `${dashboardComponent.version}`;
        this.dashboardComponent = dashboardComponent;
        const themeIcon = new vscode.ThemeIcon('combine');
        this.iconPath = themeIcon;
    }

    contextValue = "dashboardFramework";
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