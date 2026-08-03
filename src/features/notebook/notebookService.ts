import * as vscode from 'vscode';

interface NoteSummary {
	title: string;
	modifiedAt: number;
	uri: vscode.Uri;
}

interface NoteItem extends vscode.QuickPickItem, NoteSummary { }

export class NotebookService implements vscode.Disposable {
	private static readonly activeContext = 'vscode-powerkit.notebookActive';
	private static readonly lastNoteKey = 'vscode-powerkit.lastNote';
	private static readonly saveDelay = 400;
	private readonly notesUri: vscode.Uri;
	private readonly pendingSaves = new Map<string, Promise<void>>();
	private readonly saveTimers = new Map<string, NodeJS.Timeout>();
	private readonly disposables: vscode.Disposable[];
	private readonly notesChangeEmitter = new vscode.EventEmitter<void>();
	readonly onDidChangeNotes = this.notesChangeEmitter.event;
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

		await this.create(false);
	}

	async create(replaceCurrent = true): Promise<void> {
		await vscode.workspace.fs.createDirectory(this.notesUri);
		const name = await vscode.window.showInputBox({
			prompt: 'Enter a name for the new note',
			placeHolder: 'Note name',
			validateInput: value => this.validateNoteName(value),
		});
		if (!name) {
			return;
		}

		const uri = vscode.Uri.joinPath(this.notesUri, `${name.trim()}.md`);
		await vscode.workspace.fs.writeFile(uri, new Uint8Array());
		this.notesChangeEmitter.fire();
		await this.openDocument(uri, replaceCurrent);
	}

	async getRecentNoteTitle(): Promise<string | undefined> {
		await vscode.workspace.fs.createDirectory(this.notesUri);
		return (await this.getNotes()).at(0)?.title;
	}

	private async getNotes(): Promise<NoteSummary[]> {
		await vscode.workspace.fs.createDirectory(this.notesUri);
		const entries = await vscode.workspace.fs.readDirectory(this.notesUri);
		const notes = await Promise.all(entries
			.filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
			.map(async ([name]) => {
				const uri = vscode.Uri.joinPath(this.notesUri, name);
				const stat = await vscode.workspace.fs.stat(uri);
				return {
					title: name.slice(0, -3),
					modifiedAt: stat.mtime,
					uri,
				};
			}));

		return notes.sort((left, right) => right.modifiedAt - left.modifiedAt);
	}

	async selectNote(): Promise<void> {
		const notes = (await this.getNotes()).map(note => ({
			...note,
			label: note.title,
			description: new Date(note.modifiedAt).toLocaleString(),
		}));
		if (notes.length === 0) {
			const action = await vscode.window.showInformationMessage('No notes found.', 'New Note');
			if (action === 'New Note') {
				await this.create();
			}
			return;
		}

		const selected = await vscode.window.showQuickPick(notes, {
			placeHolder: 'Select a note to open',
			matchOnDescription: true,
		});
		if (selected) {
			await this.openDocument(selected.uri, true);
		}
	}

	async manage(): Promise<void> {
		await vscode.workspace.fs.createDirectory(this.notesUri);

		while (true) {
			const notes = (await this.getNotes()).map(note => ({
				...note,
				label: note.title,
				description: new Date(note.modifiedAt).toLocaleString(),
			}));
			if (notes.length === 0) {
				const action = await vscode.window.showInformationMessage('No notes found.', 'New Note');
				if (action === 'New Note') {
					await this.create();
				}
				return;
			}

			const selected = await vscode.window.showQuickPick(notes, {
				placeHolder: 'Select a note to manage',
				matchOnDescription: true,
			});
			if (!selected) {
				return;
			}

			const action = await vscode.window.showQuickPick([
				{ label: '$(edit) Rename', value: 'rename' },
				{ label: '$(trash) Delete', value: 'delete' },
			], {
				placeHolder: selected.label,
			});

			switch (action?.value) {
				case 'rename':
					await this.rename(selected.uri);
					break;
				case 'delete':
					await this.delete(selected.uri);
					break;
				default:
					break;
			}
		}
	}

	dispose(): void {
		this.saveTimers.forEach(timer => clearTimeout(timer));
		this.disposables.forEach(disposable => disposable.dispose());
		this.notesChangeEmitter.dispose();
	}

	private async rename(uri: vscode.Uri): Promise<void> {
		const currentName = uri.path.split('/').at(-1)?.slice(0, -3) ?? '';
		const name = await vscode.window.showInputBox({
			prompt: 'Rename note',
			value: currentName,
			valueSelection: [0, currentName.length],
			validateInput: value => this.validateNoteName(value, uri),
		});
		if (!name || name === currentName) {
			return;
		}

		const document = vscode.workspace.textDocuments.find(item => item.uri.toString() === uri.toString());
		if (document) {
			await this.saveNow(document);
		}

		const target = vscode.Uri.joinPath(this.notesUri, `${name.trim()}.md`);
		const edit = new vscode.WorkspaceEdit();
		edit.renameFile(uri, target);
		if (!await vscode.workspace.applyEdit(edit)) {
			void vscode.window.showErrorMessage('Unable to rename the note.');
			return;
		}

		if (this.context.globalState.get<string>(NotebookService.lastNoteKey) === uri.toString()) {
			await this.context.globalState.update(NotebookService.lastNoteKey, target.toString());
		}
		this.notesChangeEmitter.fire();
	}

	private async delete(uri: vscode.Uri): Promise<void> {
		const name = uri.path.split('/').at(-1)?.slice(0, -3) ?? 'this note';
		const confirmation = await vscode.window.showWarningMessage(
			`Delete "${name}" permanently?`,
			{ modal: true },
			'Delete',
		);
		if (confirmation !== 'Delete') {
			return;
		}

		const document = vscode.workspace.textDocuments.find(item => item.uri.toString() === uri.toString());
		if (document) {
			await this.saveNow(document);
		}
		await this.closeTabs(uri);
		await vscode.workspace.fs.delete(uri);

		if (this.context.globalState.get<string>(NotebookService.lastNoteKey) === uri.toString()) {
			await this.context.globalState.update(NotebookService.lastNoteKey, undefined);
		}
		this.notesChangeEmitter.fire();
	}

	private async validateNoteName(value: string, currentUri?: vscode.Uri): Promise<string | undefined> {
		const name = value.trim();
		if (!name) {
			return 'Enter a note name.';
		}
		if (name.includes('/') || name.includes('\\') || name.endsWith('.')) {
			return 'The note name contains invalid characters.';
		}

		const target = vscode.Uri.joinPath(this.notesUri, `${name}.md`);
		if (target.toString() === currentUri?.toString()) {
			return undefined;
		}
		try {
			await vscode.workspace.fs.stat(target);
			return 'A note with this name already exists.';
		} catch {
			return undefined;
		}
	}

	private async closeTabs(uri: vscode.Uri): Promise<void> {
		const tabs = vscode.window.tabGroups.all
			.flatMap(group => group.tabs)
			.filter(tab => tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uri.toString());
		if (tabs.length > 0) {
			await vscode.window.tabGroups.close(tabs);
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
					if (await document.save()) {
						this.notesChangeEmitter.fire();
					}
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