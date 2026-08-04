import * as vscode from 'vscode';
import { FeatureTreeProvider } from './features/featureTreeProvider';
import { JwtPanel } from './features/jwt/jwtPanel';

export function activate(context: vscode.ExtensionContext): void {
	const featureTree = new FeatureTreeProvider();

	context.subscriptions.push(
		featureTree,
		vscode.window.registerTreeDataProvider(
			FeatureTreeProvider.viewType,
			featureTree,
		),
		vscode.commands.registerCommand('vscode-powerkit.openJwt', () => JwtPanel.show(context.extensionUri)),
	);
}

export function deactivate(): void { }
