import * as path from 'node:path';
import * as vscode from 'vscode';
import { getTypeScriptRuntimeArgs } from './nodeRuntime';
import { getRunnableFileUri, isNodeScriptUri, isTypeScriptDocument, resolveNodeDocument } from './scriptDocument';

const terminalName = 'PowerKit Script';

export async function runScript(
	context: vscode.ExtensionContext,
	scriptUri: vscode.Uri | undefined,
	selectedUris: readonly vscode.Uri[] | undefined,
): Promise<void> {
	try {
		await runResolvedScript(context, scriptUri, selectedUris);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		void vscode.window.showErrorMessage(message);
	}
}

async function runResolvedScript(
	context: vscode.ExtensionContext,
	scriptUri: vscode.Uri | undefined,
	selectedUris: readonly vscode.Uri[] | undefined,
): Promise<void> {
	const contextualUri = scriptUri && isSupportedScript(scriptUri)
		? scriptUri
		: selectedUris?.find(isSupportedScript);
	const nodeDocument = await resolveNodeDocument(contextualUri);
	if (nodeDocument) {
		await runNodeDocument(context, nodeDocument);
		return;
	}

	const localScriptUri = await resolveShellScriptUri(contextualUri);
	if (!localScriptUri) {
		return;
	}
	if (isNodeScriptUri(localScriptUri)) {
		await runNodeDocument(context, await vscode.workspace.openTextDocument(localScriptUri));
		return;
	}

	const extension = path.extname(localScriptUri.fsPath).toLowerCase();
	let command: string;

	if (process.platform === 'win32' && extension === '.bat') {
		command = `cmd.exe /d /c call "${localScriptUri.fsPath}"`;
	} else if (process.platform !== 'win32' && extension === '.sh') {
		command = `/bin/bash ${quoteShellArgument(localScriptUri.fsPath)}`;
	} else {
		void vscode.window.showErrorMessage('This script type is not supported on the current platform.');
		return;
	}

	runInTerminal(localScriptUri, command);
}

async function runNodeDocument(context: vscode.ExtensionContext, document: vscode.TextDocument): Promise<void> {
	const runnableUri = await getRunnableFileUri(context, document);
	const runtimeArgs = isTypeScriptDocument(document) ? getTypeScriptRuntimeArgs() : [];
	runInTerminal(runnableUri, ['node', ...runtimeArgs, quoteShellArgument(runnableUri.fsPath)].join(' '));
}

function runInTerminal(scriptUri: vscode.Uri, command: string): void {
	vscode.window.terminals.find(terminal => terminal.name === terminalName)?.dispose();

	const terminal = vscode.window.createTerminal({ name: terminalName, cwd: path.dirname(scriptUri.fsPath) });
	terminal.show();
	terminal.sendText(command);
}

function quoteShellArgument(value: string): string {
	if (process.platform === 'win32') {
		return `"${value.replaceAll('"', '\\"')}"`;
	}
	return `'${value.replaceAll("'", `'\\''`)}'`;
}

async function resolveShellScriptUri(contextualUri: vscode.Uri | undefined): Promise<vscode.Uri | undefined> {
	if (contextualUri && isShellScriptUri(contextualUri)) {
		return contextualUri;
	}

	const activeUri = vscode.window.activeTextEditor?.document.uri;
	if (activeUri && isShellScriptUri(activeUri)) {
		return activeUri;
	}

	const extensions = process.platform === 'win32'
		? ['bat', 'js', 'mjs', 'cjs', 'ts', 'mts', 'cts']
		: ['sh', 'js', 'mjs', 'cjs', 'ts', 'mts', 'cts'];
	const pickedUris = await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		openLabel: 'Run Script',
		filters: { Scripts: extensions },
	});
	return pickedUris?.[0];
}

function isSupportedScript(uri: vscode.Uri | undefined): uri is vscode.Uri {
	return Boolean(uri && (isNodeScriptUri(uri) || isShellScriptUri(uri)));
}

function isShellScriptUri(uri: vscode.Uri): boolean {
	if (uri.scheme !== 'file' && uri.scheme !== 'vscode-remote') {
		return false;
	}

	const extension = path.extname(uri.fsPath).toLowerCase();
	return process.platform === 'win32' ? extension === '.bat' : extension === '.sh';
}