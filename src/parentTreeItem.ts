import * as vscode from 'vscode';

export default abstract class ParentTreeItem extends vscode.TreeItem {
	constructor(label : string , state : vscode.TreeItemCollapsibleState ) {
		super(label, state)
	}

	abstract getChildren(): Thenable<vscode.TreeItem[]>
}