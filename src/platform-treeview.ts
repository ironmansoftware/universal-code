import * as vscode from 'vscode';
import { IConnection, load } from './settings';
import ParentTreeItem from './parentTreeItem';
import { Container } from './container';
import { Module } from './types';

export class PlatformTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: vscode.TreeItem | undefined) {
        if (element == null) {
            return [
                new ModulesTreeItem()
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

export class ModulesTreeItem extends ParentTreeItem {
    async getChildren(): Promise<vscode.TreeItem[]> {
        return [
            new CustomModules(),
            new PowerShellUniversalModules(),
            new RepositoriesTreeViewItem()
        ]
    }
    constructor() {
        super("Modules", vscode.TreeItemCollapsibleState.Collapsed);

        const themeIcon = new vscode.ThemeIcon("package");
        this.iconPath = themeIcon;
    }

    contextValue = 'modules';
}

export class PowerShellUniversalModules extends ParentTreeItem {
    async getChildren(): Promise<vscode.TreeItem[]> {
        try {
            const modules = await Container.universal.getModules();
            return modules.filter(m => m.extension).map(x => new PowerShellUniversalModule(x));
        }
        catch (err) {
            Container.universal.showConnectionError("Failed to query modules. " + err);
            return [];
        }
    }

    constructor() {
        super("Extensions", vscode.TreeItemCollapsibleState.Collapsed);

        const themeIcon = new vscode.ThemeIcon("terminal");
        this.iconPath = themeIcon;
    }
}

export class CustomModules extends ParentTreeItem {
    async getChildren(): Promise<vscode.TreeItem[]> {
        try {
            const modules = await Container.universal.getModules();
            return modules.filter(m => !m.readOnly).map(x => new CustomModule(x));
        }
        catch (err) {
            Container.universal.showConnectionError("Failed to query modules. " + err);
            return [];
        }
    }

    constructor() {
        super("Custom", vscode.TreeItemCollapsibleState.Collapsed);

        const themeIcon = new vscode.ThemeIcon("folder");
        this.iconPath = themeIcon;
    }

    contextValue = 'customModules';
}

export class RepositoriesTreeViewItem extends ParentTreeItem {
    async getChildren(): Promise<vscode.TreeItem[]> {
        try {
            const repos = await Container.universal.getRepositories();
            return repos.map(x => {
                const ti = new vscode.TreeItem(x, vscode.TreeItemCollapsibleState.None);
                const themeIcon = new vscode.ThemeIcon("repo");
                ti.iconPath = themeIcon;
                return ti;
            });
        }
        catch (err) {
            Container.universal.showConnectionError("Failed to query repositories. " + err);
            return [];
        }
    }

    constructor() {
        super("Repositories", vscode.TreeItemCollapsibleState.Collapsed);

        const themeIcon = new vscode.ThemeIcon("repo-forked");
        this.iconPath = themeIcon;
    }
}

export class PowerShellUniversalModule extends vscode.TreeItem {
    constructor(module: Module) {
        super(module.name, vscode.TreeItemCollapsibleState.None);

        const themeIcon = new vscode.ThemeIcon("archive");
        this.iconPath = themeIcon;

        this.tooltip = `${module.version}`;
    }
}

export class CustomModule extends vscode.TreeItem {
    public module: Module;
    constructor(module: Module) {
        super(module.name, vscode.TreeItemCollapsibleState.None);

        const themeIcon = new vscode.ThemeIcon("archive");
        this.iconPath = themeIcon;

        this.tooltip = `${module.version}`;
        this.module = module;
    }

    contextValue = 'customModule';
}