import * as vscode from 'vscode';
import { getNotebookWebviewHtml } from '../../webview';
import type { NotebookService } from './notebookService';

type WebviewMessage =
	| { type: 'ready' }
	| { type: 'create' }
	| { type: 'select'; id: string }
	| { type: 'save'; id: string; content: string }
	| { type: 'rename'; id: string; name: string }
	| { type: 'delete'; id: string };

export class NotebookPanel implements vscode.Disposable {
	private static readonly viewType = 'vscode-powerkit.notebook';
	private static currentPanel: NotebookPanel | undefined;

	static async show(extensionUri: vscode.Uri, service: NotebookService, selectedId?: string): Promise<void> {
		if (NotebookPanel.currentPanel) {
			NotebookPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
			if (selectedId) {
				await NotebookPanel.currentPanel.select(selectedId);
			}
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			NotebookPanel.viewType,
			'Notebook',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
				retainContextWhenHidden: true,
			},
		);
		NotebookPanel.currentPanel = new NotebookPanel(panel, extensionUri, service, selectedId);
	}

	private readonly disposables: vscode.Disposable[];
	private messageQueue = Promise.resolve();

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		private readonly service: NotebookService,
		private readonly selectedId?: string,
	) {
		panel.iconPath = new vscode.ThemeIcon('notebook');
		panel.webview.html = getNotebookWebviewHtml(panel.webview, extensionUri);
		this.disposables = [
			panel.onDidDispose(() => this.dispose()),
			panel.onDidChangeViewState(() => this.updateActiveContext()),
			panel.webview.onDidReceiveMessage(message => {
				this.messageQueue = this.messageQueue.then(() => this.handleMessage(message));
			}),
		];
		void this.updateActiveContext();
	}

	private async handleMessage(message: WebviewMessage): Promise<void> {
		try {
			switch (message.type) {
				case 'ready': {
					const state = await this.service.getInitialState();
					const activeNote = this.selectedId
						? await this.service.select(this.selectedId)
						: state.activeNote;
					await this.panel.webview.postMessage({ type: 'state', notes: state.notes, activeNote });
					break;
				}
				case 'create': {
					const note = await this.service.create();
					await this.postState(note);
					break;
				}
				case 'select':
					await this.postState(await this.service.select(message.id));
					break;
				case 'save':
					await this.service.save(message.id, message.content);
					await this.panel.webview.postMessage({
						type: 'saved',
						id: message.id,
						notes: await this.service.getNotes(),
					});
					break;
				case 'rename':
					await this.postState(await this.service.rename(message.id, message.name));
					break;
				case 'delete': {
					await this.service.delete(message.id);
					const state = await this.service.getInitialState();
					await this.panel.webview.postMessage({ type: 'state', ...state });
					break;
				}
			}
		} catch (error) {
			await this.panel.webview.postMessage({
				type: 'error',
				message: error instanceof Error ? error.message : 'Notebook operation failed.',
			});
		}
	}

	private async select(id: string): Promise<void> {
		await this.postState(await this.service.select(id));
	}

	private async postState(activeNote: Awaited<ReturnType<NotebookService['read']>>): Promise<void> {
		await this.panel.webview.postMessage({
			type: 'state',
			notes: await this.service.getNotes(),
			activeNote,
		});
	}

	private async updateActiveContext(): Promise<void> {
		await vscode.commands.executeCommand(
			'setContext',
			'vscode-powerkit.notebookActive',
			this.panel.active,
		);
	}

	dispose(): void {
		if (NotebookPanel.currentPanel !== this) {
			return;
		}
		NotebookPanel.currentPanel = undefined;
		void vscode.commands.executeCommand('setContext', 'vscode-powerkit.notebookActive', false);
		this.disposables.forEach(disposable => disposable.dispose());
	}
}