import * as vscode from 'vscode';
import { Container } from './container';
import { Dashboard, DashboardEndpoint, DashboardPage, DashboardSession, DashboardStatus } from './types';
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

export class DashboardTreeItem extends ParentTreeItem {
    async getChildren(): Promise<vscode.TreeItem[]> {
        try {
            return [
                new DashboardPagesTreeItem(this.dashboard),
                new DashboardSessionsTreeItem(this.dashboard),
            ];
        }
        catch (err) {
            Container.universal.showConnectionError("Failed to query apps pages. " + err);
            return [];
        }
    }

    public dashboard: Dashboard;
    private logIndex: number;

    constructor(dashboard: Dashboard) {
        super(dashboard.name, vscode.TreeItemCollapsibleState.Collapsed);
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

export class DashboardPagesTreeItem extends ParentTreeItem {

    private dashboard: Dashboard;

    constructor(dashboard: Dashboard) {
        super("Pages", vscode.TreeItemCollapsibleState.Collapsed);

        this.dashboard = dashboard;
        this.iconPath = new vscode.ThemeIcon('files');
    }
    async getChildren(): Promise<vscode.TreeItem[]> {
        try {
            const pages = await Container.universal.getDashboardPages(this.dashboard.id);
            return pages.map(y => new DashboardPageTreeItem(y));
        }
        catch (err) {
            Container.universal.showConnectionError("Failed to query apps. " + err);
            return [];
        }
    }

    contextValue = "dashboardPages";
}

export class DashboardPageTreeItem extends vscode.TreeItem {
    public page: DashboardPage;

    constructor(page: DashboardPage) {
        super(page.name, vscode.TreeItemCollapsibleState.None);
        this.page = page;
        const themeIcon = new vscode.ThemeIcon('file');
        this.iconPath = themeIcon;
    }

    contextValue = "dashboardPage";
}

export class DashboardSessionsTreeItem extends ParentTreeItem {

    private dashboard: Dashboard;

    constructor(dashboard: Dashboard) {
        super("Sessions", vscode.TreeItemCollapsibleState.Collapsed);

        this.dashboard = dashboard;
        this.iconPath = new vscode.ThemeIcon('debug-disconnect');
    }
    async getChildren(): Promise<vscode.TreeItem[]> {
        try {
            const diagnostics = await Container.universal.getDashboardDiagnostics(this.dashboard.id);
            return diagnostics.sessions.map(y => new DashboardSessionTreeItem(this.dashboard.id, y));
        }
        catch (err) {
            Container.universal.showConnectionError("Failed to query apps. " + err);
            return [];
        }
    }

    contextValue = "dashboardPages";
}

export class DashboardSessionTreeItem extends ParentTreeItem {
    async getChildren(): Promise<vscode.TreeItem[]> {
        return [
            new DashboardSessionPagesTreeItem(this.dashboardId, this.session)
        ]
    }
    public session: DashboardSession;
    private dashboardId: number;


    constructor(dashboardId: number, session: DashboardSession) {
        super(`${session.userName} (${session.id})`, vscode.TreeItemCollapsibleState.Collapsed);
        this.session = session;
        this.dashboardId = dashboardId;
        const themeIcon = new vscode.ThemeIcon('file');
        this.iconPath = themeIcon;
        this.tooltip = session.lastTouched;
    }

    contextValue = "dashboardSession";
}

export class DashboardSessionPagesTreeItem extends ParentTreeItem {

    private session: DashboardSession;
    private dashboardId: number;

    constructor(dashboardId: number, session: DashboardSession) {
        super("Tabs", vscode.TreeItemCollapsibleState.Collapsed);

        this.session = session;
        this.iconPath = new vscode.ThemeIcon('browser');
        this.dashboardId = dashboardId;
    }
    async getChildren(): Promise<vscode.TreeItem[]> {
        try {
            return this.session.pages.map(y => new DashboardSessionPageTreeItem(y, this.session.id, this.dashboardId));
        }
        catch (err) {
            Container.universal.showConnectionError("Failed to query session pages. " + err);
            return [];
        }
    }

    contextValue = "dashboardPages";
}

export class DashboardSessionPageTreeItem extends vscode.TreeItem {
    public pageId: string;
    public sessionId: string;
    public dashboardId: number;

    constructor(pageId: string, sessionId: string, dashboardId: number) {
        super(pageId, vscode.TreeItemCollapsibleState.None);
        const themeIcon = new vscode.ThemeIcon('browser');
        this.iconPath = themeIcon;

        this.pageId = pageId;
        this.sessionId = sessionId;
        this.dashboardId = dashboardId;
    }

    contextValue = "dashboardSessionPage";
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
    iconPath = '$(code)';

}