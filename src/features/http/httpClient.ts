import { tmpdir } from 'node:os';
import { basename, isAbsolute, join, relative } from 'node:path';
import * as vscode from 'vscode';
import { registerHttpFormatter } from './httpFormatter';
import { HTTP_METHODS, HttpLanguageService, registerHttpHoverProvider, registerHttpLanguageDiagnostics } from './httpLanguageService';

const headers = [
	['Accept', 'application/json'],
	['Authorization', 'Bearer ${1:token}'],
	['Content-Type', 'application/json'],
	['User-Agent', 'PowerKit HTTP Client'],
	['Cache-Control', 'no-cache'],
];
const languageService = new HttpLanguageService();
const temporaryHttpDirectory = join(tmpdir(), 'vscode-powerkit-http-client');
const temporaryHttpSaveDelay = 500;
const temporaryHttpEditorContext = 'vscode-powerkit.temporaryHttpEditor';

export function registerHttpClient(context: vscode.ExtensionContext): void {
	const output = vscode.window.createOutputChannel('PowerKit HTTP');
	const selector: vscode.DocumentSelector = { language: 'http' };

	context.subscriptions.push(
		output,
		vscode.commands.registerCommand('vscode-powerkit.openHttpClient', openTemporaryHttpFile),
		vscode.commands.registerCommand('vscode-powerkit.renameTemporaryHttpFile', renameTemporaryHttpFile),
		vscode.commands.registerCommand('vscode-powerkit.deleteTemporaryHttpFile', deleteTemporaryHttpFile),
		vscode.commands.registerCommand('vscode-powerkit.sendHttpRequest', async (uri?: vscode.Uri, line?: number) => {
			await sendRequest(output, uri, line);
		}),
		vscode.languages.registerCodeLensProvider(selector, new HttpCodeLensProvider()),
		vscode.languages.registerCompletionItemProvider(selector, new HttpCompletionProvider(), '{', ':', '@'),
		registerHttpHoverProvider(languageService),
		registerHttpFormatter(),
		registerTemporaryHttpAutoSave(),
		registerTemporaryHttpEditorContext(),
	);
	registerHttpLanguageDiagnostics(context, languageService);
}

async function openTemporaryHttpFile(): Promise<void> {
	const temporaryDirectory = vscode.Uri.file(temporaryHttpDirectory);
	const template = [
		'### New request',
		'GET https://example.com HTTP/1.1',
		'Accept: application/json',
		'',
	].join('\n');

	try {
		await vscode.workspace.fs.createDirectory(temporaryDirectory);
		const temporaryFile = await createTemporaryHttpUri(temporaryDirectory);
		await vscode.workspace.fs.writeFile(temporaryFile, Buffer.from(template, 'utf8'));
		const document = await vscode.workspace.openTextDocument(temporaryFile);
		await vscode.window.showTextDocument(document);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		void vscode.window.showErrorMessage(`Unable to open HTTP Client: ${message}`);
	}
}

async function createTemporaryHttpUri(directory: vscode.Uri): Promise<vscode.Uri> {
	return createAvailableTemporaryHttpUri(directory, formatLocalTimestamp(new Date()));
}

async function createAvailableTemporaryHttpUri(directory: vscode.Uri, baseName: string): Promise<vscode.Uri> {
	let suffix = 1;
	while (true) {
		const name = suffix === 1 ? `${baseName}.http` : `${baseName}-${suffix}.http`;
		const uri = vscode.Uri.joinPath(directory, name);
		if (!await uriExists(uri)) {
			return uri;
		}
		suffix++;
	}
}

function formatLocalTimestamp(date: Date): string {
	const parts = [
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate(),
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
	];
	return parts.map((part, index) => index === 0 ? String(part) : String(part).padStart(2, '0')).join('');
}

async function renameTemporaryHttpFile(): Promise<void> {
	const document = vscode.window.activeTextEditor?.document;
	if (!document || !isTemporaryHttpDocument(document)) {
		return;
	}

	const currentName = basename(document.uri.fsPath);
	const currentBaseName = currentName.slice(0, -'.http'.length);
	const input = await vscode.window.showInputBox({
		title: 'Rename HTTP Request',
		value: currentBaseName,
		prompt: 'Enter a file name without the .http extension. Leave empty to use the current timestamp.',
		validateInput: async value => {
			const baseName = normalizeHttpBaseName(value);
			if (!baseName) {
				return undefined;
			}
			if (baseName !== basename(baseName) || baseName.includes('/') || baseName.includes('\\')) {
				return 'Enter a file name without a directory path.';
			}
			const target = vscode.Uri.file(join(temporaryHttpDirectory, `${baseName}.http`));
			if (target.fsPath !== document.uri.fsPath && await uriExists(target)) {
				return 'A temporary HTTP request with this name already exists.';
			}
			return undefined;
		},
	});
	if (input === undefined) {
		return;
	}
	const requestedBaseName = normalizeHttpBaseName(input);
	if (requestedBaseName === currentBaseName) {
		return;
	}

	if (document.isDirty && !await document.save()) {
		void vscode.window.showErrorMessage('Unable to save the HTTP request before renaming it.');
		return;
	}

	const target = requestedBaseName
		? vscode.Uri.file(join(temporaryHttpDirectory, `${requestedBaseName}.http`))
		: await createAvailableTemporaryHttpUri(vscode.Uri.file(temporaryHttpDirectory), formatLocalTimestamp(new Date()));
	const edit = new vscode.WorkspaceEdit();
	edit.renameFile(document.uri, target);
	if (!await vscode.workspace.applyEdit(edit)) {
		void vscode.window.showErrorMessage('Unable to rename the temporary HTTP request.');
		return;
	}
	if (vscode.window.activeTextEditor?.document.uri.toString() !== target.toString()) {
		const renamedDocument = await vscode.workspace.openTextDocument(target);
		await vscode.window.showTextDocument(renamedDocument);
	}
}

function normalizeHttpBaseName(value: string): string {
	return value.trim().replace(/\.http$/i, '');
}

async function deleteTemporaryHttpFile(): Promise<void> {
	const document = vscode.window.activeTextEditor?.document;
	if (!document || !isTemporaryHttpDocument(document)) {
		return;
	}

	const edit = new vscode.WorkspaceEdit();
	edit.deleteFile(document.uri, { ignoreIfNotExists: false, recursive: false });
	if (!await vscode.workspace.applyEdit(edit)) {
		void vscode.window.showErrorMessage('Unable to delete the temporary HTTP request.');
		return;
	}
	if (vscode.window.activeTextEditor?.document.uri.toString() === document.uri.toString()) {
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	}
}

function registerTemporaryHttpEditorContext(): vscode.Disposable {
	const update = (editor: vscode.TextEditor | undefined): void => {
		void vscode.commands.executeCommand(
			'setContext',
			temporaryHttpEditorContext,
			Boolean(editor && isTemporaryHttpDocument(editor.document)),
		);
	};
	update(vscode.window.activeTextEditor);
	return vscode.window.onDidChangeActiveTextEditor(update);
}

async function uriExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri);
		return true;
	} catch {
		return false;
	}
}

function registerTemporaryHttpAutoSave(): vscode.Disposable {
	const saveTimers = new Map<string, NodeJS.Timeout>();
	const clearSaveTimer = (document: vscode.TextDocument): void => {
		const key = document.uri.toString();
		const timer = saveTimers.get(key);
		if (timer) {
			clearTimeout(timer);
			saveTimers.delete(key);
		}
	};

	const changeSubscription = vscode.workspace.onDidChangeTextDocument(event => {
		const document = event.document;
		if (!isTemporaryHttpDocument(document) || event.contentChanges.length === 0) {
			return;
		}

		clearSaveTimer(document);
		const key = document.uri.toString();
		saveTimers.set(key, setTimeout(() => {
			saveTimers.delete(key);
			if (!document.isClosed && document.isDirty) {
				void document.save().then(saved => {
					if (!saved && !document.isClosed) {
						void vscode.window.showWarningMessage('Unable to auto-save the temporary HTTP request.');
					}
				});
			}
		}, temporaryHttpSaveDelay));
	});
	const saveSubscription = vscode.workspace.onDidSaveTextDocument(clearSaveTimer);
	const closeSubscription = vscode.workspace.onDidCloseTextDocument(clearSaveTimer);

	return new vscode.Disposable(() => {
		changeSubscription.dispose();
		saveSubscription.dispose();
		closeSubscription.dispose();
		for (const timer of saveTimers.values()) {
			clearTimeout(timer);
		}
		saveTimers.clear();
	});
}

function isTemporaryHttpDocument(document: vscode.TextDocument): boolean {
	if (document.languageId !== 'http' || document.uri.scheme !== 'file') {
		return false;
	}
	const pathFromTemporaryDirectory = relative(temporaryHttpDirectory, document.uri.fsPath);
	return pathFromTemporaryDirectory !== ''
		&& !pathFromTemporaryDirectory.startsWith('..')
		&& !isAbsolute(pathFromTemporaryDirectory);
}

class HttpCodeLensProvider implements vscode.CodeLensProvider {
	provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
		const lenses: vscode.CodeLens[] = [];
		for (let line = 0; line < document.lineCount; line++) {
			if (!languageService.parseRequestLine(document.lineAt(line).text)) {
				continue;
			}

			lenses.push(new vscode.CodeLens(document.lineAt(line).range, {
				title: '$(play) Send Request',
				command: 'vscode-powerkit.sendHttpRequest',
				arguments: [document.uri, line],
			}));
		}
		return lenses;
	}
}

class HttpCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
		const linePrefix = document.lineAt(position).text.slice(0, position.character);
		const methodRange = languageService.getMethodRange(document, position);
		if (/^\s*[A-Za-z-]*$/.test(linePrefix) && methodRange) {
			return HTTP_METHODS.map(method => {
				const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Method);
				item.insertText = method;
				item.range = methodRange;
				item.detail = `HTTP ${method} request`;
				return item;
			});
		}

		const headerRange = languageService.getHeaderNameRange(document, position);
		if (/^\s*[!#$%&'*+.^_`|~0-9A-Za-z-]*$/.test(linePrefix) && headerRange) {
			const existingHeader = document.lineAt(position.line).text.includes(':');
			return headers.map(([name, value]) => {
				const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Property);
				item.insertText = existingHeader ? name : new vscode.SnippetString(`${name}: ${value}`);
				item.range = headerRange;
				item.detail = 'HTTP request header';
				return item;
			});
		}

		if (/\{\{[\w.-]*$/.test(linePrefix)) {
			return Array.from(languageService.collectVariables(document).keys(), name => {
				const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
				item.insertText = `${name}}}`;
				item.detail = 'HTTP file variable';
				return item;
			});
		}

		if (/^\s*@?[\w.-]*$/.test(linePrefix)) {
			const item = new vscode.CompletionItem('@variable', vscode.CompletionItemKind.Snippet);
			item.insertText = new vscode.SnippetString('@${1:name} = ${2:value}');
			item.detail = 'Define an HTTP file variable';
			return [item];
		}

		return [];
	}
}

async function sendRequest(output: vscode.OutputChannel, uri?: vscode.Uri, line?: number): Promise<void> {
	if (!vscode.workspace.isTrusted) {
		void vscode.window.showErrorMessage('Trust this workspace before sending HTTP requests.');
		return;
	}

	const editor = vscode.window.activeTextEditor;
	const document = uri ? await vscode.workspace.openTextDocument(uri) : editor?.document;
	if (!document || document.languageId !== 'http') {
		void vscode.window.showErrorMessage('Open an HTTP file before sending a request.');
		return;
	}

	const requestLine = line ?? (editor?.document.uri.toString() === document.uri.toString() ? editor.selection.active.line : 0);
	let request;
	try {
		request = languageService.parseRequest(document, requestLine);
	} catch (error) {
		void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
		return;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30_000);
	const startedAt = Date.now();
	output.appendLine(`\n> ${request.method} ${request.url}`);
	output.show(true);

	try {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `${request.method} ${request.url}`,
			cancellable: true,
		}, async (_progress, token) => {
			token.onCancellationRequested(() => controller.abort());
			const response = await fetch(request.url, {
				method: request.method,
				headers: request.headers,
				body: request.body,
				signal: controller.signal,
				redirect: 'follow',
			});
			const elapsed = Date.now() - startedAt;
			const body = await formatResponseBody(response);

			output.appendLine(`< HTTP ${response.status} ${response.statusText} (${elapsed} ms)`);
			response.headers.forEach((value, name) => output.appendLine(`${name}: ${value}`));
			output.appendLine('');
			output.appendLine(body);
			void vscode.window.showInformationMessage(`${request.method} completed: ${response.status} ${response.statusText} (${elapsed} ms)`);
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		output.appendLine(`! Request failed: ${message}`);
		void vscode.window.showErrorMessage(`HTTP request failed: ${message}`);
	} finally {
		clearTimeout(timeout);
	}
}

async function formatResponseBody(response: Response): Promise<string> {
	const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
	const bytes = new Uint8Array(await response.arrayBuffer());
	const textual = contentType.startsWith('text/')
		|| contentType.includes('json')
		|| contentType.includes('xml')
		|| contentType.includes('javascript')
		|| contentType.includes('x-www-form-urlencoded');
	if (!textual) {
		return `[Binary response: ${bytes.byteLength} bytes, ${contentType || 'unknown content type'}]`;
	}

	const text = new TextDecoder().decode(bytes);
	if (contentType.includes('json')) {
		try {
			return JSON.stringify(JSON.parse(text), null, 2);
		} catch {
			return text;
		}
	}
	return text;
}