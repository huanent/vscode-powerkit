import * as vscode from 'vscode';
import { FeatureTreeProvider } from './features/featureTreeProvider';
import { JwtPanel } from './features/jwt/jwtPanel';
import { NotebookService } from './features/notebook/notebookService';

export function activate(context: vscode.ExtensionContext): void {
	const notebook = new NotebookService(context);
	const featureTree = new FeatureTreeProvider(notebook);

	context.subscriptions.push(
		notebook,
		featureTree,
		vscode.window.registerTreeDataProvider(
			FeatureTreeProvider.viewType,
			featureTree,
		),
		vscode.commands.registerCommand('vscode-powerkit.openJwt', () => JwtPanel.show(context.extensionUri)),
		vscode.commands.registerCommand('vscode-powerkit.openNotebook', () => notebook.open()),
		vscode.commands.registerCommand('vscode-powerkit.newNote', () => notebook.create()),
		vscode.commands.registerCommand('vscode-powerkit.selectNote', () => notebook.selectNote()),
		vscode.commands.registerCommand('vscode-powerkit.manageNotes', () => notebook.manage()),
	);
}

export function deactivate(): void { }
