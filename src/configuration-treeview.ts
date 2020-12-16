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
            const configs = await Container.universal.getConfigurations();
            var configTree: ConfigTreeItem[] = [];
            configs.forEach(c => configTree.push(new ConfigTreeItem(c,c)));
            return configTree;
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