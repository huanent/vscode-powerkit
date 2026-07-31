import * as vscode from 'vscode';

export class FeatureTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	static readonly viewType = 'vscode-powerkit.features';

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(): vscode.TreeItem[] {
		const networkItem = new vscode.TreeItem('Network', vscode.TreeItemCollapsibleState.None);
		networkItem.description = 'Public IP';
		networkItem.iconPath = new vscode.ThemeIcon('globe');
		networkItem.command = {
			command: 'vscode-powerkit.openNetwork',
			title: 'Open Network',
		};
		return [networkItem];
	}
}