import * as vscode from 'vscode';
import { Container } from './container';
import { Endpoint } from './types';
import ParentTreeItem from './parentTreeItem';

export class ApiTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

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
                return await Container.universal.getEndpoints().then(x => x.map(y => new EndpointTreeItem(y)));
            }
            catch (ex)
            {
                Container.universal.showConnectionError("Failed to query API endpoints. " + ex);
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

export class EndpointTreeItem extends vscode.TreeItem {
    public endpoint : Endpoint;

    constructor(endpoint : Endpoint) 
    {
        super(`(${endpoint.method.toUpperCase()}) ${endpoint.url}`, vscode.TreeItemCollapsibleState.None);

        this.endpoint = endpoint;
        const icon = endpoint.authentication ? "lock" : "unlock";
        const themeIcon = new vscode.ThemeIcon(icon);
        this.iconPath = themeIcon;
    }

    contextValue = "endpoint";
}