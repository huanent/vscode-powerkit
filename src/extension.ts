import * as vscode from 'vscode';
import { FeatureTreeProvider } from './features/featureTreeProvider';
import { generateGitignore } from './features/gitignore/gitignoreService';
import { LaunchdPanel } from './features/launchd/launchdPanel';
import { PerfTipsProvider } from './features/perftips/perftips';
import { registerNpmScriptWatcher, runNpmScript } from './features/scripts/npmScripts';
import { runScript } from './features/scripts/runScript';
import { registerScriptRuntimeWatcher } from './features/scripts/scriptRuntime';
import { registerXmlFormatter } from './features/xml/xmlFormatter';

export function activate(context: vscode.ExtensionContext): void {
	const featureTree = new FeatureTreeProvider();

	context.subscriptions.push(
		featureTree,
		vscode.window.registerTreeDataProvider(
			FeatureTreeProvider.viewType,
			featureTree,
		),
		vscode.commands.registerCommand('vscode-powerkit.openLaunchd', () => LaunchdPanel.show(context.extensionUri)),
		vscode.commands.registerCommand('vscode-powerkit.generateGitignore', () => generateGitignore(context.extensionUri)),
		...['runDotnetScript', 'runShScript', 'runBatScript', 'runNodeScript', 'runBunScript'].map(command =>
			vscode.commands.registerCommand(`vscode-powerkit.${command}`, (uri, selectedUris) => runScript(context, uri, selectedUris)),
		),
		vscode.commands.registerCommand('vscode-powerkit.runNpmScript', runNpmScript),
		vscode.commands.registerCommand('vscode-powerkit.runBunPackageScript', runNpmScript),
		registerXmlFormatter(),
	);
	registerNpmScriptWatcher(context);
	registerScriptRuntimeWatcher(context);

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
