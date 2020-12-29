import * as vscode from 'vscode';
import { Sample, SampleFolder } from './types';
import { SampleService } from './samples';

export class SampleTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    private service : SampleService = new SampleService();

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: vscode.TreeItem | undefined) {
        if (element == null)
        {
            return (await this.service.getRootSamples()).map(folder => new SampleFolderTreeItem(folder));
        }

        if (element instanceof SampleFolderTreeItem) 
		{
            var parentTreeItem = element as SampleFolderTreeItem; 
            
            return (await this.service.getFolderChildren(parentTreeItem.folder)).map(item => {
                if (item instanceof Sample) {
                    const sample = item as Sample;
                    return new SampleTreeItem(sample)
                }

                if (item instanceof SampleFolder) {
                    const sample = item as SampleFolder;
                    return new SampleFolderTreeItem(sample)
                }

                return new vscode.TreeItem("Unknown");
            });

        }   
    }

    refresh(node? : vscode.TreeItem): void {
		this._onDidChangeTreeData.fire(node);
	}
}

export class SampleFolderTreeItem extends vscode.TreeItem {
    public folder : SampleFolder;

    constructor(folder : SampleFolder) 
    {
        super(folder.name, vscode.TreeItemCollapsibleState.Collapsed);

        this.folder = folder;
        const themeIcon = new vscode.ThemeIcon("folder");
        this.iconPath = themeIcon;
    }

    contextValue = "sample-folder";
}

export class SampleTreeItem extends vscode.TreeItem {
    public sample : Sample;

    constructor(sample : Sample) 
    {
        super(sample.title, vscode.TreeItemCollapsibleState.None);

        this.sample = sample;
        this.tooltip = sample.description;
        const themeIcon = new vscode.ThemeIcon("notebook");
        this.iconPath = themeIcon;
    }

    contextValue = "sample";
}