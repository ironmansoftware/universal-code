import * as vscode from 'vscode';
import { Container } from './container';
import { Endpoint } from './types';
import ParentTreeItem from './parentTreeItem';

export class ConfigTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: vscode.TreeItem | undefined) {
        if (element == null)
        {
            return [
                new ConfigTreeItem('Authentication', 'authentication.ps1'),
                new ConfigTreeItem('Dashboards', 'dashboards.ps1'),
                new ConfigTreeItem('Dashboard Components', 'dashboard.components.ps1'),
                new ConfigTreeItem('Dashboard Frameworks', 'dashboard.frameworks.ps1'),
                new ConfigTreeItem('Endpoints', 'endpoints.ps1'),
                new ConfigTreeItem('Environments', 'environments.ps1'), 
                new ConfigTreeItem('Licenses', 'licenses.ps1'),   
                new ConfigTreeItem('Published Folders', 'publishedFolders.ps1'), 
                new ConfigTreeItem('Schedules', 'schedules.ps1'), 
                new ConfigTreeItem('Scripts', 'scripts.ps1'), 
                new ConfigTreeItem('Settings', 'settings.ps1'), 
                new ConfigTreeItem('Roles', 'roles.ps1'), 
                new ConfigTreeItem('Variables', 'variables.ps1'), 
            ]
        }
    }

    refresh(node? : vscode.TreeItem): void {
		this._onDidChangeTreeData.fire(node);
	}
}

export class ConfigTreeItem extends vscode.TreeItem {
    public fileName : string;

    constructor(name : string, fileName : string) 
    {
        super(name, vscode.TreeItemCollapsibleState.None);

        this.description = fileName;

        this.fileName = fileName;
        const themeIcon = new vscode.ThemeIcon('file-code');
        this.iconPath = themeIcon;
    }

    contextValue = "configfile";
}