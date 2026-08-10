import * as path from 'node:path';
import * as vscode from 'vscode';

export async function runScript(
	scriptUri: vscode.Uri | undefined,
	selectedUris: readonly vscode.Uri[] | undefined,
): Promise<void> {
	const localScriptUri = await resolveScriptUri(scriptUri, selectedUris);
	if (!localScriptUri) {
		return;
	}

	const extension = path.extname(localScriptUri.fsPath).toLowerCase();
	const cwd = path.dirname(localScriptUri.fsPath);
	let terminal: vscode.Terminal;

	if (process.platform === 'win32' && extension === '.bat') {
		terminal = vscode.window.createTerminal({
			name: `Run ${path.basename(localScriptUri.fsPath)}`,
			cwd,
			shellPath: process.env.ComSpec || 'cmd.exe',
			shellArgs: ['/d', '/c', localScriptUri.fsPath],
		});
	} else if (process.platform !== 'win32' && extension === '.sh') {
		terminal = vscode.window.createTerminal({
			name: `Run ${path.basename(localScriptUri.fsPath)}`,
			cwd,
			shellPath: '/bin/bash',
			shellArgs: [localScriptUri.fsPath],
		});
	} else {
		void vscode.window.showErrorMessage('This script type is not supported on the current platform.');
		return;
	}

	terminal.show();
}

async function resolveScriptUri(
	scriptUri: vscode.Uri | undefined,
	selectedUris: readonly vscode.Uri[] | undefined,
): Promise<vscode.Uri | undefined> {
	const contextualUri = isSupportedScript(scriptUri)
		? scriptUri
		: selectedUris?.find(isSupportedScript);
	if (contextualUri) {
		return contextualUri;
	}

	const activeUri = vscode.window.activeTextEditor?.document.uri;
	if (isSupportedScript(activeUri)) {
		return activeUri;
	}

	const extensions = process.platform === 'win32' ? ['bat'] : ['sh'];
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
	if (uri?.scheme !== 'file') {
		return false;
	}

	const extension = path.extname(uri.fsPath).toLowerCase();
	return process.platform === 'win32' ? extension === '.bat' : extension === '.sh';
}