export const commandIds = {
	open: 'vscode-powerkit.openChat',
	newChat: 'vscode-powerkit.newChat',
	newTab: 'vscode-powerkit.newChatTab',
} as const;

export const editorViewType = 'vscode-powerkit.chatEditor';
export const webviewFocusContextKey = 'vscode-powerkit.chatWebviewFocus';

export const storageKeys = {
	selectedModel: 'vscode-powerkit.chat.selectedModelId',
	cachedModels: 'vscode-powerkit.chat.cachedModels',
	currentSession: 'vscode-powerkit.chat.currentSessionId',
} as const;