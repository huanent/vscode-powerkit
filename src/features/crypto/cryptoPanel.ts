import * as vscode from 'vscode';
import { getWebviewHtml } from '../../webview';
import { generateSshKeyPair, hashText, type HashAlgorithm, type SshKeyType } from './cryptoService';

type WebviewMessage =
	| { type: 'ready' }
	| { type: 'hash'; algorithm: HashAlgorithm; value: string }
	| { type: 'generateSshKey'; keyType: SshKeyType; comment: string }
	| { type: 'copy'; target: string; value: string };

export class CryptoPanel {
	static readonly viewType = 'vscode-powerkit.crypto';
	private static currentPanel: CryptoPanel | undefined;

	static show(extensionUri: vscode.Uri): void {
		if (CryptoPanel.currentPanel) {
			CryptoPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			CryptoPanel.viewType,
			'Crypto',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
				retainContextWhenHidden: true,
			},
		);

		CryptoPanel.currentPanel = new CryptoPanel(panel, extensionUri);
	}

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
	) {
		panel.iconPath = new vscode.ThemeIcon('key');
		panel.webview.html = getWebviewHtml(panel.webview, extensionUri, 'crypto');
		panel.onDidDispose(() => {
			CryptoPanel.currentPanel = undefined;
		});
		panel.webview.onDidReceiveMessage(message => this.handleMessage(message));
	}

	private async handleMessage(message: WebviewMessage): Promise<void> {
		try {
			switch (message.type) {
				case 'ready':
					break;
				case 'hash':
					await this.panel.webview.postMessage({
						type: 'hashed',
						algorithm: message.algorithm,
						value: hashText(message.value, message.algorithm),
					});
					break;
				case 'generateSshKey':
					await this.panel.webview.postMessage({
						type: 'sshKeyGenerated',
						keyPair: generateSshKeyPair(message.keyType, message.comment),
					});
					break;
				case 'copy':
					await vscode.env.clipboard.writeText(message.value);
					await this.panel.webview.postMessage({ type: 'copied', target: message.target });
					break;
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Crypto operation failed.';
			await this.panel.webview.postMessage({ type: 'error', message: errorMessage });
		}
	}
}