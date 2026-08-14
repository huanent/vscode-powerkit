import * as vscode from 'vscode';

export class FeatureTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
        static readonly viewType = 'vscode-powerkit.features';
        private readonly changeEmitter = new vscode.EventEmitter<void>();
        readonly onDidChangeTreeData = this.changeEmitter.event;

        getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
                return element;
        }

        async getChildren(): Promise<vscode.TreeItem[]> {
                const items: vscode.TreeItem[] = [];
                if (process.platform === 'darwin') {
                        const launchdItem = new vscode.TreeItem('LaunchAgents', vscode.TreeItemCollapsibleState.None);
                        launchdItem.description = 'Manage startup items';
                        launchdItem.iconPath = new vscode.ThemeIcon('server-process');
                        launchdItem.command = {
                                command: 'vscode-powerkit.openLaunchd',
                                title: 'Open LaunchAgents',
                        };
                        items.push(launchdItem);
                }
                return items;
        }

        dispose(): void {
                this.changeEmitter.dispose();
        }
}
