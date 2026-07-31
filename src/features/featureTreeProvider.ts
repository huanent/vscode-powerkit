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

		const generatorsItem = new vscode.TreeItem('Generators', vscode.TreeItemCollapsibleState.None);
		generatorsItem.description = 'Timestamp, UUID, password';
		generatorsItem.iconPath = new vscode.ThemeIcon('symbol-misc');
		generatorsItem.command = {
			command: 'vscode-powerkit.openGenerators',
			title: 'Open Generators',
		};

		return [networkItem, generatorsItem];
	}
}