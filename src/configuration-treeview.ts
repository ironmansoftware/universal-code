import * as vscode from 'vscode';
import { Container } from './container';

export class ConfigTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: ConfigTreeItem | undefined) {
        if (element == null) {
            try {
                var version = await Container.universal.getVersion();
                if (version.startsWith("3") || version.startsWith("4")) {
                    const configs = await Container.universal.getFiles("");
                    var configTree: ConfigTreeItem[] = [];
                    configs.forEach(c => configTree.push(new ConfigTreeItem(c.name, c.fullName, c.isLeaf, c.content)));
                    return configTree;
                } else {
                    const configs = await Container.universal.getConfigurations();
                    var configTree: ConfigTreeItem[] = [];
                    configs.forEach(c => configTree.push(new ConfigTreeItem(c, c, false, "")));
                    return configTree;
                }

            }
            catch (err) {
                Container.universal.showConnectionError("Failed to query configuration files. " + err);
                return [];
            }
        } else {
            const configs = await Container.universal.getFiles(element.fileName);
            var configTree: ConfigTreeItem[] = [];
            configs.forEach(c => configTree.push(new ConfigTreeItem(c.name, c.fullName, c.isLeaf, c.content)));
            return configTree;
        }
    }

    refresh(node?: vscode.TreeItem): void {
        this._onDidChangeTreeData.fire(node);
    }
}

export class ConfigTreeItem extends vscode.TreeItem {
    public fileName: string;
    public leaf: boolean;
    public content: string;

    constructor(name: string, fileName: string, leaf: boolean, content: string) {
        super(name, leaf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);

        this.description = fileName;

        this.fileName = fileName;
        const themeIcon = leaf ? new vscode.ThemeIcon('file-code') : new vscode.ThemeIcon('folder');
        this.iconPath = themeIcon;
        this.leaf = leaf;
        this.content = content;
        this.contextValue = leaf ? "configFile" : "configFolder";
    }
}