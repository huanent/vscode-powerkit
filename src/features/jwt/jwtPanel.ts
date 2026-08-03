import * as vscode from 'vscode';
import { getWebviewHtml } from '../../webview';
import { decodeJwt, encodeJwt } from './jwtService';

type WebviewMessage =
	| { type: 'encode'; requestId: number; payload: string; secret: string }
	| { type: 'decode'; requestId: number; token: string; secret: string }
	| { type: 'copy'; target: string; value: string };

export class JwtPanel {
	static readonly viewType = 'vscode-powerkit.jwt';
	private static currentPanel: JwtPanel | undefined;

	static show(extensionUri: vscode.Uri): void {
		if (JwtPanel.currentPanel) {
			JwtPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			JwtPanel.viewType,
			'JWT Token',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
				retainContextWhenHidden: true,
			},
		);
		JwtPanel.currentPanel = new JwtPanel(panel, extensionUri);
	}

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
	) {
		panel.iconPath = new vscode.ThemeIcon('key');
		panel.webview.html = getWebviewHtml(panel.webview, extensionUri);
		panel.onDidDispose(() => {
			JwtPanel.currentPanel = undefined;
		});
		panel.webview.onDidReceiveMessage(message => this.handleMessage(message));
	}

	private async handleMessage(message: WebviewMessage): Promise<void> {
		try {
			switch (message.type) {
				case 'encode':
					await this.panel.webview.postMessage({
						type: 'encoded',
						requestId: message.requestId,
						token: encodeJwt(message.payload, message.secret),
					});
					break;
				case 'decode':
					await this.panel.webview.postMessage({
						type: 'decoded',
						requestId: message.requestId,
						decoded: decodeJwt(message.token, message.secret),
					});
					break;
				case 'copy':
					await vscode.env.clipboard.writeText(message.value);
					await this.panel.webview.postMessage({ type: 'copied', target: message.target });
					break;
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'JWT operation failed.';
			if (message.type !== 'copy') {
				await this.panel.webview.postMessage({
					type: 'error',
					requestId: message.requestId,
					message: errorMessage,
				});
			}
		}
	}
}