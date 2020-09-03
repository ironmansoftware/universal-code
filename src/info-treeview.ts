import * as vscode from 'vscode';

class Node extends vscode.TreeItem {
    constructor(label: string, icon : string) {
        super(label);

        this.iconPath = new vscode.ThemeIcon(icon);
        this.contextValue = 'help';
        this.command =  {
            command: 'powershell-universal.help',
            arguments: [this],
            title: 'Help'
        }
    }
}

export class InfoTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
        if (element == null)
        {
            return [
                new Node('Documentation', 'book'),
                new Node('Forums', 'account'),
                new Node('Issues', 'github'),
                new Node('Pricing', 'key')
            ]
        }

        return null;
    }

    refresh(node? : vscode.TreeItem): void {
		this._onDidChangeTreeData.fire(node);
	}
}