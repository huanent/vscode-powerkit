import * as vscode from 'vscode';
import { FeatureTreeProvider } from './features/featureTreeProvider';
import { generateGitignore } from './features/gitignore/gitignoreService';
import { JwtPanel } from './features/jwt/jwtPanel';
import { LaunchdPanel } from './features/launchd/launchdPanel';
import { PerfTipsProvider } from './features/perftips/perftips';
import { runScript } from './features/scripts/runScript';

export function activate(context: vscode.ExtensionContext): void {
	const featureTree = new FeatureTreeProvider();

	context.subscriptions.push(
		featureTree,
		vscode.window.registerTreeDataProvider(
			FeatureTreeProvider.viewType,
			featureTree,
		),
		vscode.commands.registerCommand('vscode-powerkit.openJwt', () => JwtPanel.show(context.extensionUri)),
		vscode.commands.registerCommand('vscode-powerkit.openLaunchd', () => LaunchdPanel.show(context.extensionUri)),
		vscode.commands.registerCommand('vscode-powerkit.generateGitignore', () => generateGitignore(context.extensionUri)),
		vscode.commands.registerCommand('vscode-powerkit.runScript', runScript),
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
