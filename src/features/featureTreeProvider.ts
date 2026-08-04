import * as vscode from 'vscode';

export class FeatureTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
        static readonly viewType = 'vscode-powerkit.features';
        private readonly changeEmitter = new vscode.EventEmitter<void>();
        readonly onDidChangeTreeData = this.changeEmitter.event;

        getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
                return element;
        }

        async getChildren(): Promise<vscode.TreeItem[]> {
                const jwtItem = new vscode.TreeItem('JWT Token', vscode.TreeItemCollapsibleState.None);
                jwtItem.description = 'Generate and decode';
                jwtItem.iconPath = new vscode.ThemeIcon('key');
                jwtItem.command = {
                        command: 'vscode-powerkit.openJwt',
                        title: 'Open JWT Token',
                };
                return [jwtItem];
        }

        dispose(): void {
                this.changeEmitter.dispose();
        }
}
