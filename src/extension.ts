import * as vscode from 'vscode';
import { FeatureTreeProvider } from './features/featureTreeProvider';
import { JwtPanel } from './features/jwt/jwtPanel';
import { PerfTipsProvider } from './features/perftips/perftips';

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

	const perfTipsProvider = new PerfTipsProvider();
	context.subscriptions.push(
		vscode.debug.registerDebugAdapterTrackerFactory('*', {
			createDebugAdapterTracker(_session: vscode.DebugSession) {
				return perfTipsProvider;
			}
		})
	);
}

export function deactivate(): void { }
