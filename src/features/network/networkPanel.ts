import * as vscode from 'vscode';
import { getWebviewHtml } from '../../webview';
import { getNetworkSnapshot } from './networkService';

type WebviewMessage =
	| { type: 'ready' }
	| { type: 'refresh' }
	| { type: 'copyPublicIp' };

export class NetworkPanel {
	static readonly viewType = 'vscode-powerkit.network';
	private static currentPanel: NetworkPanel | undefined;
	private publicIp = '';

	static show(extensionUri: vscode.Uri): void {
		if (NetworkPanel.currentPanel) {
			NetworkPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			NetworkPanel.viewType,
			'Network',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
				retainContextWhenHidden: true,
			},
		);

		NetworkPanel.currentPanel = new NetworkPanel(panel, extensionUri);
	}

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
	) {
		panel.iconPath = new vscode.ThemeIcon('globe');
		panel.webview.html = getWebviewHtml(panel.webview, extensionUri);
		panel.onDidDispose(() => {
			NetworkPanel.currentPanel = undefined;
		});
		panel.webview.onDidReceiveMessage(message => this.handleMessage(message));
	}

	private async handleMessage(message: WebviewMessage): Promise<void> {
		switch (message.type) {
			case 'ready':
			case 'refresh':
				await this.loadNetworkSnapshot();
				break;
			case 'copyPublicIp':
				if (this.publicIp) {
					await vscode.env.clipboard.writeText(this.publicIp);
					await this.panel.webview.postMessage({ type: 'copied' });
				}
				break;
		}
	}

	private async loadNetworkSnapshot(): Promise<void> {
		await this.panel.webview.postMessage({ type: 'loading' });

		try {
			const snapshot = await getNetworkSnapshot();
			this.publicIp = snapshot.publicIp;
			await this.panel.webview.postMessage({ type: 'loaded', snapshot });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unable to retrieve network information';
			await this.panel.webview.postMessage({ type: 'error', message });
		}
	}
}