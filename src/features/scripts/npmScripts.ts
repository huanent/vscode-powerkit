import * as vscode from 'vscode';

const npmScriptFoldersContext = 'vscode-powerkit.npmScriptFolders';
const terminalName = 'PowerKit npm';

type PackageJson = {
	scripts?: Record<string, unknown>;
};

export async function runNpmScript(folderUri: vscode.Uri | undefined): Promise<void> {
	if (!folderUri) {
		return;
	}

	const scripts = await getScripts(folderUri);
	if (scripts.length === 0) {
		void vscode.window.showInformationMessage('No npm scripts found in this folder.');
		await refreshNpmScriptFolders();
		return;
	}

	const selected = await vscode.window.showQuickPick(
		scripts.map(([label, description]) => ({ label, description })),
		{
			placeHolder: 'Select an npm script to run',
			title: 'Run npm Script',
		},
	);
	if (!selected) {
		return;
	}

	const terminal = vscode.window.createTerminal({ name: terminalName, cwd: folderUri });
	terminal.show();
	terminal.sendText(`npm run ${quoteArgument(selected.label)}`);
}

export function registerNpmScriptWatcher(context: vscode.ExtensionContext): void {
	const watcher = vscode.workspace.createFileSystemWatcher('**/package.json');
	watcher.onDidCreate(refreshNpmScriptFolders, undefined, context.subscriptions);
	watcher.onDidChange(refreshNpmScriptFolders, undefined, context.subscriptions);
	watcher.onDidDelete(refreshNpmScriptFolders, undefined, context.subscriptions);
	context.subscriptions.push(watcher);
	void refreshNpmScriptFolders();
}

async function getScripts(folderUri: vscode.Uri): Promise<Array<[string, string]>> {
	try {
		const content = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folderUri, 'package.json'));
		const packageJson = JSON.parse(Buffer.from(content).toString('utf8')) as PackageJson;
		if (!packageJson.scripts || typeof packageJson.scripts !== 'object') {
			return [];
		}

		return Object.entries(packageJson.scripts)
			.filter((entry): entry is [string, string] => typeof entry[1] === 'string')
			.sort(([left], [right]) => left.localeCompare(right));
	} catch {
		return [];
	}
}

async function refreshNpmScriptFolders(): Promise<void> {
	const packageJsonUris = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**');
	const folders: Record<string, boolean> = {};

	await Promise.all(packageJsonUris.map(async packageJsonUri => {
		const folderUri = vscode.Uri.joinPath(packageJsonUri, '..');
		if ((await getScripts(folderUri)).length > 0) {
			folders[folderUri.fsPath] = true;
		}
	}));

	await vscode.commands.executeCommand('setContext', npmScriptFoldersContext, folders);
}

function quoteArgument(value: string): string {
	return `"${value.replaceAll('"', '\\"')}"`;
}