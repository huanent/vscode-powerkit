export interface NoteSummary {
	id: string;
	title: string;
	modifiedAt: number;
}

export interface Note extends NoteSummary {
	content: string;
}

export type NotebookExtensionMessage =
	| { type: 'state'; notes: NoteSummary[]; activeNote?: Note }
	| { type: 'saved'; id: string; notes: NoteSummary[] }
	| { type: 'error'; message: string };