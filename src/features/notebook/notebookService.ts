import * as vscode from 'vscode';

export class NotebookService implements vscode.Disposable {
	private static readonly activeContext = 'vscode-powerkit.notebookActive';
	private static readonly lastNoteKey = 'vscode-powerkit.lastNote';
	private static readonly saveDelay = 400;
	private readonly notesUri: vscode.Uri;
	private readonly pendingSaves = new Map<string, Promise<void>>();
	private readonly saveTimers = new Map<string, NodeJS.Timeout>();
	private readonly disposables: vscode.Disposable[];
	private activeDocument: vscode.TextDocument | undefined;

	constructor(private readonly context: vscode.ExtensionContext) {
		this.notesUri = vscode.Uri.joinPath(context.globalStorageUri, 'notes');
		this.activeDocument = vscode.window.activeTextEditor?.document;
		this.disposables = [
			vscode.workspace.onDidChangeTextDocument(event => this.scheduleSave(event.document)),
			vscode.window.onDidChangeActiveTextEditor(editor => this.changeActiveEditor(editor)),
		];
		void this.updateActiveContext(vscode.window.activeTextEditor);
	}

	async open(): Promise<void> {
		await vscode.workspace.fs.createDirectory(this.notesUri);

		const lastNote = this.context.globalState.get<string>(NotebookService.lastNoteKey);
		if (lastNote) {
			const uri = vscode.Uri.parse(lastNote);
			try {
				await vscode.workspace.fs.stat(uri);
				await this.openDocument(uri);
				return;
			} catch {
				await this.context.globalState.update(NotebookService.lastNoteKey, undefined);
			}
		}

		const notes = await vscode.workspace.fs.readDirectory(this.notesUri);
		const existingNote = notes
			.filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
			.map(([name]) => name)
			.sort()
			.at(-1);

		if (existingNote) {
			await this.openDocument(vscode.Uri.joinPath(this.notesUri, existingNote));
			return;
		}

		await this.create(false);
	}

	async create(replaceCurrent = true): Promise<void> {
		await vscode.workspace.fs.createDirectory(this.notesUri);
		const uri = await this.createNoteUri();
		await vscode.workspace.fs.writeFile(uri, new Uint8Array());
		await this.openDocument(uri, replaceCurrent);
	}

	dispose(): void {
		this.saveTimers.forEach(timer => clearTimeout(timer));
		this.disposables.forEach(disposable => disposable.dispose());
	}

	private async createNoteUri(): Promise<vscode.Uri> {
		const now = new Date();
		const timestamp = [
			now.getFullYear(),
			String(now.getMonth() + 1).padStart(2, '0'),
			String(now.getDate()).padStart(2, '0'),
			'-',
			String(now.getHours()).padStart(2, '0'),
			String(now.getMinutes()).padStart(2, '0'),
			String(now.getSeconds()).padStart(2, '0'),
		].join('');

		for (let suffix = 0; ; suffix++) {
			const name = suffix === 0 ? `Note-${timestamp}.md` : `Note-${timestamp}-${suffix}.md`;
			const uri = vscode.Uri.joinPath(this.notesUri, name);
			try {
				await vscode.workspace.fs.stat(uri);
			} catch {
				return uri;
			}
		}
	}

	private async openDocument(uri: vscode.Uri, replaceCurrent = false): Promise<void> {
		const activeEditor = vscode.window.activeTextEditor;
		const viewColumn = activeEditor?.viewColumn ?? vscode.ViewColumn.Active;
		if (replaceCurrent && activeEditor && this.isNote(activeEditor.document.uri)) {
			await this.saveNow(activeEditor.document);
			const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
			if (activeTab) {
				await vscode.window.tabGroups.close(activeTab);
			}
		}

		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document, { viewColumn, preview: false });
		await this.context.globalState.update(NotebookService.lastNoteKey, uri.toString());
	}

	private scheduleSave(document: vscode.TextDocument): void {
		if (!document.isDirty || !this.isNote(document.uri)) {
			return;
		}

		const key = document.uri.toString();
		const existingTimer = this.saveTimers.get(key);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		this.saveTimers.set(key, setTimeout(() => {
			this.saveTimers.delete(key);
			void this.queueSave(document);
		}, NotebookService.saveDelay));
	}

	private async saveNow(document: vscode.TextDocument): Promise<void> {
		const key = document.uri.toString();
		const timer = this.saveTimers.get(key);
		if (timer) {
			clearTimeout(timer);
			this.saveTimers.delete(key);
		}
		await this.queueSave(document);
	}

	private queueSave(document: vscode.TextDocument): Promise<void> {
		const key = document.uri.toString();
		const pending = this.pendingSaves.get(key) ?? Promise.resolve();
		const next = pending
			.catch(() => undefined)
			.then(async () => {
				if (document.isDirty && !document.isClosed) {
					await document.save();
				}
			})
			.catch(() => undefined)
			.finally(() => {
				if (this.pendingSaves.get(key) === next) {
					this.pendingSaves.delete(key);
				}
			});
		this.pendingSaves.set(key, next);
		return next;
	}

	private changeActiveEditor(editor: vscode.TextEditor | undefined): void {
		const previousDocument = this.activeDocument;
		this.activeDocument = editor?.document;
		if (previousDocument && previousDocument !== editor?.document && this.isNote(previousDocument.uri)) {
			void this.saveNow(previousDocument);
		}
		void this.updateActiveContext(editor);
	}

	private async updateActiveContext(editor: vscode.TextEditor | undefined): Promise<void> {
		await vscode.commands.executeCommand(
			'setContext',
			NotebookService.activeContext,
			editor !== undefined && this.isNote(editor.document.uri),
		);
	}

	private isNote(uri: vscode.Uri): boolean {
		const notesPath = this.notesUri.path.endsWith('/') ? this.notesUri.path : `${this.notesUri.path}/`;
		return uri.scheme === this.notesUri.scheme && uri.path.startsWith(notesPath) && uri.path.endsWith('.md');
	}
}