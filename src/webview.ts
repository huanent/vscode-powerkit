import * as vscode from 'vscode';

interface WebviewHtmlOptions {
        entry: string;
        title: string;
        allowImages?: boolean;
        useStyleNonce?: boolean;
        allowInlineStyleAttributes?: boolean;
}

export function getWebviewHtml(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
        options: WebviewHtmlOptions,
): string {
        const nonce = getNonce();
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', `${options.entry}.css`));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', `${options.entry}.js`));
        const imagePolicy = options.allowImages ? ` img-src ${webview.cspSource} https: data:;` : '';
        const stylePolicy = options.useStyleNonce
                ? `style-src ${webview.cspSource} 'nonce-${nonce}';`
                : `style-src ${webview.cspSource} 'unsafe-inline';`;
        const styleAttributePolicy = options.allowInlineStyleAttributes ? " style-src-attr 'unsafe-inline';" : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none';${imagePolicy} font-src ${webview.cspSource}; ${stylePolicy}${styleAttributePolicy} script-src ${webview.cspSource} 'nonce-${nonce}';">
        <link rel="stylesheet" href="${styleUri}">
        <title>${options.title}</title>
</head>
<body>
        <div id="root"></div>
        <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nonce = '';
        for (let index = 0; index < 32; index++) {
                nonce += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return nonce;
}
