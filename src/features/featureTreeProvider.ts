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
                const gitignoreItem = new vscode.TreeItem('.gitignore Generator', vscode.TreeItemCollapsibleState.None);
                gitignoreItem.description = 'Create or update';
                gitignoreItem.iconPath = new vscode.ThemeIcon('git-branch');
                gitignoreItem.command = {
                        command: 'vscode-powerkit.generateGitignore',
                        title: 'Generate .gitignore File',
                };
                const items = [jwtItem, gitignoreItem];
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
