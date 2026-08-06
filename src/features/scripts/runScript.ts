import * as path from 'node:path';
import * as vscode from 'vscode';

export function runScript(scriptUri: vscode.Uri | undefined): void {
	if (!scriptUri || scriptUri.scheme !== 'file') {
		void vscode.window.showErrorMessage('Select a local script file to run.');
		return;
	}

	const extension = path.extname(scriptUri.fsPath).toLowerCase();
	const cwd = path.dirname(scriptUri.fsPath);
	let terminal: vscode.Terminal;

	if (process.platform === 'win32' && extension === '.bat') {
		terminal = vscode.window.createTerminal({
			name: `Run ${path.basename(scriptUri.fsPath)}`,
			cwd,
			shellPath: process.env.ComSpec || 'cmd.exe',
			shellArgs: ['/d', '/c', scriptUri.fsPath],
		});
	} else if (process.platform !== 'win32' && extension === '.sh') {
		terminal = vscode.window.createTerminal({
			name: `Run ${path.basename(scriptUri.fsPath)}`,
			cwd,
			shellPath: '/bin/bash',
			shellArgs: [scriptUri.fsPath],
		});
	} else {
		void vscode.window.showErrorMessage('This script type is not supported on the current platform.');
		return;
	}

	terminal.show();
}