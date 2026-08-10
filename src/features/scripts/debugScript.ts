import * as path from 'node:path';
import * as vscode from 'vscode';
import { getTypeScriptRuntimeArgs } from './nodeRuntime';
import { getRunnableFileUri, isTypeScriptDocument, resolveNodeDocument } from './scriptDocument';

export async function debugScript(
	context: vscode.ExtensionContext,
	scriptUri: vscode.Uri | undefined,
): Promise<void> {
	try {
		const document = await resolveNodeDocument(scriptUri);
		if (!document) {
			return;
		}

		const runnableUri = await getRunnableFileUri(context, document);
		const runtimeArgs = isTypeScriptDocument(document) ? getTypeScriptRuntimeArgs() : [];
		const configuration: vscode.DebugConfiguration = {
			type: 'node',
			request: 'launch',
			name: 'Debug Script',
			program: runnableUri.fsPath,
			cwd: path.dirname(runnableUri.fsPath),
			runtimeArgs,
			skipFiles: ['<node_internals>/**'],
		};

		const started = await vscode.debug.startDebugging(undefined, configuration);
		if (!started) {
			void vscode.window.showErrorMessage('Failed to start debugging the script.');
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		void vscode.window.showErrorMessage(message);
	}
}