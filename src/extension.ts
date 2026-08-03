import * as vscode from 'vscode';
import { FeatureTreeProvider } from './features/featureTreeProvider';
import { CryptoPanel } from './features/crypto/cryptoPanel';
import { GeneratorsPanel } from './features/generators/generatorsPanel';
import { NetworkPanel } from './features/network/networkPanel';
import { NotebookService } from './features/notebook/notebookService';

export function activate(context: vscode.ExtensionContext): void {
	const notebook = new NotebookService(context);

	context.subscriptions.push(
		notebook,
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
		vscode.commands.registerCommand('vscode-powerkit.openCrypto', () => {
			CryptoPanel.show(context.extensionUri);
		}),
		vscode.commands.registerCommand('vscode-powerkit.openNotebook', () => notebook.open()),
		vscode.commands.registerCommand('vscode-powerkit.newNote', () => notebook.create()),
	);
}

export function deactivate(): void { }
