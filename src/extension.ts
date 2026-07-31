import * as vscode from 'vscode';
import { FeatureTreeProvider } from './features/featureTreeProvider';
import { NetworkPanel } from './features/network/networkPanel';

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			FeatureTreeProvider.viewType,
			new FeatureTreeProvider(),
		),
		vscode.commands.registerCommand('vscode-utilities.openNetwork', () => {
			NetworkPanel.show(context.extensionUri);
		}),
	);
}

export function deactivate(): void { }
