import * as vscode from 'vscode';
import { NotebookPanel } from './notebookPanel';

export interface NoteSummary {
	id: string;
	title: string;
	modifiedAt: number;
}

export interface Note extends NoteSummary {
	content: string;
}

export class NotebookService implements vscode.Disposable {
	private static readonly lastNoteKey = 'vscode-powerkit.lastNote';
	private readonly notesUri: vscode.Uri;
	private readonly notesChangeEmitter = new vscode.EventEmitter<void>();
	readonly onDidChangeNotes = this.notesChangeEmitter.event;

	constructor(private readonly context: vscode.ExtensionContext) {
		this.notesUri = vscode.Uri.joinPath(context.globalStorageUri, 'notes');
	}

	async open(): Promise<void> {
		await NotebookPanel.show(this.context.extensionUri, this);
	}

	async create(): Promise<Note> {
		await vscode.workspace.fs.createDirectory(this.notesUri);
		const uri = await this.getAvailableNoteUri();
		await vscode.workspace.fs.writeFile(uri, new Uint8Array());
		await this.context.globalState.update(NotebookService.lastNoteKey, uri.toString());
		this.notesChangeEmitter.fire();
		return this.read(uri.toString());
	}

	async createAndOpen(): Promise<void> {
		const note = await this.create();
		await NotebookPanel.show(this.context.extensionUri, this, note.id);
	}

	async getInitialState(): Promise<{ notes: NoteSummary[]; activeNote?: Note }> {
		const notes = await this.getNotes();
		if (notes.length === 0) {
			const activeNote = await this.create();
			return { notes: await this.getNotes(), activeNote };
		}

		const lastNote = this.context.globalState.get<string>(NotebookService.lastNoteKey);
		const activeId = lastNote && notes.some(note => note.id === lastNote) ? lastNote : notes[0].id;
		return { notes, activeNote: await this.read(activeId) };
	}

	async getRecentNoteTitle(): Promise<string | undefined> {
		return (await this.getNotes()).at(0)?.title;
	}

	async getNotes(): Promise<NoteSummary[]> {
		await vscode.workspace.fs.createDirectory(this.notesUri);
		const entries = await vscode.workspace.fs.readDirectory(this.notesUri);
		const notes = await Promise.all(entries
			.filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
			.map(async ([name]) => {
				const uri = vscode.Uri.joinPath(this.notesUri, name);
				const stat = await vscode.workspace.fs.stat(uri);
				return {
					id: uri.toString(),
					title: name.slice(0, -3),
					modifiedAt: stat.mtime,
				};
			}));

		return notes.sort((left, right) => right.modifiedAt - left.modifiedAt);
	}

	async read(id: string): Promise<Note> {
		const uri = this.getNoteUri(id);
		const [content, stat] = await Promise.all([
			vscode.workspace.fs.readFile(uri),
			vscode.workspace.fs.stat(uri),
		]);
		return {
			id: uri.toString(),
			title: this.getNoteTitle(uri),
			modifiedAt: stat.mtime,
			content: new TextDecoder().decode(content),
		};
	}

	async save(id: string, content: string): Promise<void> {
		const uri = this.getNoteUri(id);
		await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
		this.notesChangeEmitter.fire();
	}

	async rename(id: string, requestedName: string): Promise<Note> {
		const uri = this.getNoteUri(id);
		const name = requestedName.trim();
		const validationError = await this.validateNoteName(name, uri);
		if (validationError) {
			throw new Error(validationError);
		}
		if (name === this.getNoteTitle(uri)) {
			return this.read(id);
		}

		const target = vscode.Uri.joinPath(this.notesUri, `${name}.md`);
		await vscode.workspace.fs.rename(uri, target);
		await this.context.globalState.update(NotebookService.lastNoteKey, target.toString());
		this.notesChangeEmitter.fire();
		return this.read(target.toString());
	}

	async delete(id: string): Promise<void> {
		const uri = this.getNoteUri(id);
		await vscode.workspace.fs.delete(uri);
		if (this.context.globalState.get<string>(NotebookService.lastNoteKey) === id) {
			await this.context.globalState.update(NotebookService.lastNoteKey, undefined);
		}
		this.notesChangeEmitter.fire();
	}

	async select(id: string): Promise<Note> {
		const note = await this.read(id);
		await this.context.globalState.update(NotebookService.lastNoteKey, note.id);
		return note;
	}

	dispose(): void {
		this.notesChangeEmitter.dispose();
	}

	private getNoteUri(id: string): vscode.Uri {
		const uri = vscode.Uri.parse(id);
		const notesPath = this.notesUri.path.endsWith('/') ? this.notesUri.path : `${this.notesUri.path}/`;
		if (uri.scheme !== this.notesUri.scheme || !uri.path.startsWith(notesPath) || !uri.path.endsWith('.md')) {
			throw new Error('Invalid note.');
		}
		return uri;
	}

	private getNoteTitle(uri: vscode.Uri): string {
		return uri.path.split('/').at(-1)?.slice(0, -3) ?? 'Untitled';
	}

	private async validateNoteName(name: string, currentUri: vscode.Uri): Promise<string | undefined> {
		if (!name) {
			return 'Enter a note name.';
		}
		if (name.includes('/') || name.includes('\\') || name.endsWith('.')) {
			return 'The note name contains invalid characters.';
		}

		const target = vscode.Uri.joinPath(this.notesUri, `${name}.md`);
		if (target.toString() === currentUri.toString()) {
			return undefined;
		}
		try {
			await vscode.workspace.fs.stat(target);
			return 'A note with this name already exists.';
		} catch {
			return undefined;
		}
	}

	private async getAvailableNoteUri(): Promise<vscode.Uri> {
		let suffix = 1;
		while (true) {
			const title = suffix === 1 ? 'Untitled' : `Untitled ${suffix}`;
			const uri = vscode.Uri.joinPath(this.notesUri, `${title}.md`);
			try {
				await vscode.workspace.fs.stat(uri);
				suffix += 1;
			} catch {
				return uri;
			}
		}
	}
}