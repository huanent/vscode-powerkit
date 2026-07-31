import * as vscode from 'vscode';
import { getWebviewHtml } from '../../webview';
import { generateAll, generateValue, type GeneratorKind } from './generatorService';

type WebviewMessage =
	| { type: 'ready' }
	| { type: 'generateAll' }
	| { type: 'generate'; kind: GeneratorKind }
	| { type: 'copy'; kind: GeneratorKind; value: string };

export class GeneratorsPanel {
	static readonly viewType = 'vscode-powerkit.generators';
	private static currentPanel: GeneratorsPanel | undefined;

	static show(extensionUri: vscode.Uri): void {
		if (GeneratorsPanel.currentPanel) {
			GeneratorsPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			GeneratorsPanel.viewType,
			'Generators',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
				retainContextWhenHidden: true,
			},
		);

		GeneratorsPanel.currentPanel = new GeneratorsPanel(panel, extensionUri);
	}

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
	) {
		panel.iconPath = new vscode.ThemeIcon('symbol-misc');
		panel.webview.html = getWebviewHtml(panel.webview, extensionUri, 'generators');
		panel.onDidDispose(() => {
			GeneratorsPanel.currentPanel = undefined;
		});
		panel.webview.onDidReceiveMessage(message => this.handleMessage(message));
	}

	private async handleMessage(message: WebviewMessage): Promise<void> {
		switch (message.type) {
			case 'ready':
			case 'generateAll':
				await this.panel.webview.postMessage({ type: 'generatedAll', values: generateAll() });
				break;
			case 'generate':
				await this.panel.webview.postMessage({
					type: 'generated',
					kind: message.kind,
					value: generateValue(message.kind),
				});
				break;
			case 'copy':
				await vscode.env.clipboard.writeText(message.value);
				await this.panel.webview.postMessage({ type: 'copied', kind: message.kind });
				break;
		}
	}
}