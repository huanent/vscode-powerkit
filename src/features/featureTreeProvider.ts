import * as vscode from 'vscode';
import { NotebookService } from './notebook/notebookService';

export class FeatureTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
	static readonly viewType = 'vscode-powerkit.features';
	private readonly changeEmitter = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this.changeEmitter.event;
	private readonly notesSubscription: vscode.Disposable;

	constructor(private readonly notebook: NotebookService) {
		this.notesSubscription = notebook.onDidChangeNotes(() => this.changeEmitter.fire());
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(): Promise<vscode.TreeItem[]> {
		const notebookItem = new vscode.TreeItem('Notebook', vscode.TreeItemCollapsibleState.None);
		notebookItem.description = await this.notebook.getRecentNoteTitle();
		notebookItem.iconPath = new vscode.ThemeIcon('notebook');
		notebookItem.command = {
			command: 'vscode-powerkit.openNotebook',
			title: 'Open Notebook',
		};

		const jwtItem = new vscode.TreeItem('JWT Token', vscode.TreeItemCollapsibleState.None);
		jwtItem.description = 'Generate and decode';
		jwtItem.iconPath = new vscode.ThemeIcon('key');
		jwtItem.command = {
			command: 'vscode-powerkit.openJwt',
			title: 'Open JWT Token',
		};
		return [notebookItem, jwtItem];
	}

	dispose(): void {
		this.notesSubscription.dispose();
		this.changeEmitter.dispose();
	}
}