import * as vscode from 'vscode';
import { IConnection, load } from './settings';
import { LocalDevConfig } from './types';

export class ConnectionTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    private context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: vscode.TreeItem | undefined) {
        if (!element) {
            const settings = load();
            const connectionName = this.context.globalState.get("universal.connection");

            var items = settings.connections.map(m => new ConnectionTreeItem(m, m.name === connectionName));
            if (settings.appToken && settings.appToken !== '') {
                items.push(new ConnectionTreeItem({
                    name: "Default",
                    appToken: settings.appToken,
                    url: settings.url,
                    allowInvalidCertificate: false,
                    windowsAuth: false
                }, !connectionName || connectionName === 'Default'));
            }

            var localDevConfig = this.context.globalState.get<LocalDevConfig>("psu.dev.config");

            if (localDevConfig) {
                items.push(new ConnectionTreeItem({
                    name: "Local Development",
                    url: `http://localhost:${localDevConfig.browserPort || 5000}`,
                }, !connectionName || connectionName === 'Local Development'));
            }

            return items;
        }
    }

    refresh(node?: vscode.TreeItem): void {
        this._onDidChangeTreeData.fire(node);
    }
}

export class ConnectionTreeItem extends vscode.TreeItem {
    public connection: IConnection;
    public connected: boolean;

    constructor(connection: IConnection, connected: boolean) {
        super(connection.name, vscode.TreeItemCollapsibleState.None);

        this.connection = connection;
        this.connected = connected;
        const themeIcon = this.connected ? new vscode.ThemeIcon("check") : new vscode.ThemeIcon("close");
        this.iconPath = themeIcon;
        this.contextValue = this.connected ? "connection-connected" : "connection";
    }
}