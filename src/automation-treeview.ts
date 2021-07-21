import * as vscode from 'vscode';
import { Container } from './container';
import { Job, JobStatus, Script } from './types';
import ParentTreeItem from './parentTreeItem';

export class AutomationTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: vscode.TreeItem | undefined) {
        if (element == null)
        {
            return [
                new ScriptsTreeItem(),
                new JobsTreeItem()
            ]
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

export class ScriptsTreeItem extends ParentTreeItem {
    constructor() {
        super("Scripts", vscode.TreeItemCollapsibleState.Collapsed);

        this.iconPath = new vscode.ThemeIcon('files');
    }

    async getChildren(): Promise<vscode.TreeItem[]> {
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

export class JobsTreeItem extends ParentTreeItem {
    constructor() {
        super("Jobs", vscode.TreeItemCollapsibleState.Collapsed);

        this.iconPath = new vscode.ThemeIcon('checklist');
    }

    async getChildren(): Promise<vscode.TreeItem[]> {
        try 
        {
            return await Container.universal.getJobs().then(x => x.page.map(y => new JobTreeItem(y)));
        }
        catch (err)
        {
            Container.universal.showConnectionError("Failed to query jobs. " + err);
            return [];
        }
    }
}

export class JobTreeItem extends vscode.TreeItem {
    public job : Job;

    constructor(job : Job) 
    {
        super(job.scriptFullPath, vscode.TreeItemCollapsibleState.None);

        this.job = job;

        if (job.status == JobStatus.Completed)
        {
            this.iconPath = new vscode.ThemeIcon('check');
            this.tooltip = 'Completed successfully';
        }
        if (job.status == JobStatus.Running)
        {
            this.iconPath = new vscode.ThemeIcon('play');
            this.tooltip = 'Running';
        }
        if (job.status == JobStatus.Failed)
        {
            this.iconPath = new vscode.ThemeIcon('error');
            this.tooltip = 'Failed';
        }
        if (job.status == JobStatus.WaitingOnFeedback)
        {
            this.iconPath = new vscode.ThemeIcon('question');
            this.tooltip = 'Waiting on feedback';
        }

        this.description = job.id.toString();
    }

    contextValue = "job";
}