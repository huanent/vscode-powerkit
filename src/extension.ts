import * as vscode from 'vscode';
import { FeatureTreeProvider } from './features/featureTreeProvider';
import { GeneratorsPanel } from './features/generators/generatorsPanel';
import { NetworkPanel } from './features/network/networkPanel';

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			FeatureTreeProvider.viewType,
			new FeatureTreeProvider(),
		),
		vscode.commands.registerCommand('vscode-powerkit.openNetwork', () => {
			NetworkPanel.show(context.extensionUri);
		}),
		vscode.commands.registerCommand('vscode-powerkit.openGenerators', () => {
			GeneratorsPanel.show(context.extensionUri);
		}),
	);
}

export function deactivate(): void { }
