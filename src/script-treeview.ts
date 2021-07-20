import * as vscode from 'vscode';
import { Container } from './container';
import { Script } from './types';
import ParentTreeItem from './parentTreeItem';

export class ScriptTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

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
                return await Container.universal.getScripts().then(x => x.sort((a, b) => (a.name > b.name) ? 1 : -1).map(y => new ScriptTreeItem(y)));
            }
            catch (err)
            {
                Container.universal.showConnectionError("Failed to query scripts. " + err);
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

export class ScriptTreeItem extends vscode.TreeItem {
    public script : Script;

    constructor(script : Script) 
    {
        super(script.name, vscode.TreeItemCollapsibleState.None);

        this.script = script;
        const themeIcon = new vscode.ThemeIcon('file-code');
        this.iconPath = themeIcon;
    }

    contextValue = "script";
}