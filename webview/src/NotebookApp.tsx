import { BookOpenText, FileText, Menu, MoreHorizontal, Plus, Search, Trash2, X } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { MilkdownEditor } from './MilkdownEditor';
import type { Note, NotebookExtensionMessage, NoteSummary } from './notebookTypes';
import { vscode } from './vscodeApi';

type SaveState = 'saved' | 'saving' | 'editing';

export function NotebookApp() {
	const [notes, setNotes] = useState<NoteSummary[]>([]);
	const [activeNote, setActiveNote] = useState<Note>();
	const [query, setQuery] = useState('');
	const [saveState, setSaveState] = useState<SaveState>('saved');
	const [error, setError] = useState<string>();
	const [menuOpen, setMenuOpen] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [renameValue, setRenameValue] = useState('');
	const [deletePending, setDeletePending] = useState(false);
	const saveTimer = useRef<number | undefined>(undefined);
	const activeIdRef = useRef<string | undefined>(undefined);
	const pendingSaveRef = useRef<{ id: string; content: string } | undefined>(undefined);
	const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

	useEffect(() => {
		const handleMessage = (event: MessageEvent<NotebookExtensionMessage>) => {
			switch (event.data.type) {
				case 'state':
					window.clearTimeout(saveTimer.current);
					setNotes(event.data.notes);
					setActiveNote(event.data.activeNote);
					activeIdRef.current = event.data.activeNote?.id;
					setRenameValue(event.data.activeNote?.title ?? '');
					setSaveState('saved');
					setError(undefined);
					setMenuOpen(false);
					setDeletePending(false);
					setSidebarOpen(false);
					break;
				case 'saved':
					setNotes(event.data.notes);
					if (event.data.id === activeIdRef.current) {
						setSaveState('saved');
					}
					break;
				case 'error':
					setError(event.data.message);
					setSaveState('editing');
					break;
			}
		};
		window.addEventListener('message', handleMessage);
		vscode.postMessage({ type: 'ready' });
		return () => {
			window.removeEventListener('message', handleMessage);
			window.clearTimeout(saveTimer.current);
		};
	}, []);

	const visibleNotes = deferredQuery
		? notes.filter(note => note.title.toLocaleLowerCase().includes(deferredQuery))
		: notes;

	const scheduleSave = (content: string) => {
		if (!activeNote) {
			return;
		}
		const noteId = activeNote.id;
		pendingSaveRef.current = { id: noteId, content };
		setSaveState('editing');
		window.clearTimeout(saveTimer.current);
		saveTimer.current = window.setTimeout(() => {
			pendingSaveRef.current = undefined;
			setSaveState('saving');
			vscode.postMessage({ type: 'save', id: noteId, content });
		}, 450);
	};

	const flushPendingSave = () => {
		window.clearTimeout(saveTimer.current);
		const pendingSave = pendingSaveRef.current;
		if (pendingSave) {
			pendingSaveRef.current = undefined;
			vscode.postMessage({ type: 'save', ...pendingSave });
		}
	};

	const selectNote = (id: string) => {
		if (id === activeNote?.id) {
			setSidebarOpen(false);
			return;
		}
		flushPendingSave();
		vscode.postMessage({ type: 'select', id });
	};

	const submitRename = () => {
		if (!activeNote) {
			return;
		}
		const name = renameValue.trim();
		if (!name) {
			setRenameValue(activeNote.title);
			return;
		}
		if (name === activeNote.title) {
			setRenameValue(name);
			return;
		}
		flushPendingSave();
		vscode.postMessage({ type: 'rename', id: activeNote.id, name });
	};

	return (
		<div className="h-screen w-screen overflow-hidden bg-[var(--vscode-editor-background)] font-[var(--vscode-font-family)] text-[var(--vscode-foreground)]">
			<div className={`fixed inset-0 z-35 bg-black/30 transition-[opacity,visibility] duration-120 ${sidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={() => setSidebarOpen(false)} />
			<aside className={`fixed top-[50px] left-2 z-40 flex h-[min(560px,calc(100vh-58px))] w-[min(320px,calc(100vw-16px))] min-w-0 flex-col rounded-[7px] border border-[var(--vscode-menu-border,var(--vscode-widget-border))] bg-[var(--vscode-sideBar-background)] shadow-[0_12px_36px_rgba(0,0,0,.3)] transition-[opacity,transform,visibility] duration-120 max-[720px]:h-[calc(100vh-58px)] ${sidebarOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1.5 opacity-0'}`} aria-hidden={!sidebarOpen}>
				<div className="flex h-[50px] shrink-0 items-center gap-2.5 px-3">
					<div className="grid size-[30px] place-items-center rounded-md bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)]"><BookOpenText size={18} /></div>
					<strong className="text-sm font-semibold">Notes</strong>
					<button className="ml-auto grid size-[34px] place-items-center rounded-[5px] border-0 bg-transparent text-[var(--vscode-icon-foreground)] hover:bg-[var(--vscode-toolbar-hoverBackground)]" type="button" title="Close notes" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
				</div>
				<button className="mx-3.5 mt-1 mb-3 flex h-9 shrink-0 items-center justify-center gap-[7px] rounded-[5px] border-0 bg-[var(--vscode-button-background)] font-semibold text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]" type="button" onClick={() => { flushPendingSave(); vscode.postMessage({ type: 'create' }); }}>
					<Plus size={17} /> New note
				</button>
				<label className="mx-3.5 mb-[18px] flex h-[34px] shrink-0 items-center gap-2 rounded-[5px] border border-[var(--vscode-input-border,var(--vscode-widget-border))] bg-[var(--vscode-input-background)] px-[9px] text-[var(--vscode-descriptionForeground)] focus-within:border-[var(--vscode-focusBorder)]">
					<Search size={15} aria-hidden="true" />
					<input className="min-w-0 flex-1 border-0 bg-transparent text-xs text-[var(--vscode-input-foreground)] outline-0" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search notes" aria-label="Search notes" />
				</label>
				<div className="flex items-center justify-between px-4 pb-[7px] text-[11px] font-semibold text-[var(--vscode-descriptionForeground)] uppercase"><span>History</span><span>{notes.length}</span></div>
				<nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 [scrollbar-color:var(--vscode-scrollbarSlider-background)_transparent]" aria-label="Note history">
					{visibleNotes.map(note => (
						<button key={note.id} type="button" className={`grid w-full grid-cols-[20px_minmax(0,1fr)] items-start gap-[7px] rounded-[5px] border-0 px-2 py-[9px] text-left hover:bg-[var(--vscode-list-hoverBackground)] ${note.id === activeNote?.id ? 'bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]' : 'bg-transparent text-[var(--vscode-sideBar-foreground)]'}`} onClick={() => selectNote(note.id)}>
							<FileText className="mt-px" size={16} />
							<span className="min-w-0"><strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold">{note.title}</strong><small className="mt-[3px] block overflow-hidden text-[10px] text-ellipsis whitespace-nowrap opacity-65">{formatRelativeTime(note.modifiedAt)}</small></span>
						</button>
					))}
					{visibleNotes.length === 0 && <p className="mx-2 my-3.5 text-center text-xs text-[var(--vscode-descriptionForeground)]">No matching notes</p>}
				</nav>
			</aside>

			<main className="flex h-full min-w-0 flex-col bg-[var(--vscode-editor-background)]">
				<header className="relative flex h-[58px] shrink-0 items-center gap-2 border-b border-[var(--vscode-editorGroup-border,var(--vscode-widget-border))] bg-[var(--vscode-editor-background)] pr-[18px] pl-2.5">
					<button className="grid size-[34px] place-items-center rounded-[5px] border-0 bg-transparent text-[var(--vscode-icon-foreground)] hover:bg-[var(--vscode-toolbar-hoverBackground)]" type="button" title="Open notes" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(value => !value)}><Menu size={19} /></button>
					<div className="min-w-0 flex-1">
						<input
							className="h-[26px] w-[min(100%,560px)] rounded-sm border border-transparent bg-transparent px-1.5 text-[15px] font-semibold text-[var(--vscode-editor-foreground)] outline-0 hover:border-[var(--vscode-input-border,var(--vscode-widget-border))] focus:border-[var(--vscode-focusBorder)] focus:bg-[var(--vscode-input-background)] focus:text-[var(--vscode-input-foreground)] disabled:opacity-100"
							value={renameValue}
							disabled={!activeNote}
							placeholder="Loading..."
							onChange={event => setRenameValue(event.target.value)}
							onBlur={submitRename}
							onKeyDown={event => {
								if (event.key === 'Enter') {
									event.currentTarget.blur();
								} else if (event.key === 'Escape' && activeNote) {
									setRenameValue(activeNote.title);
									event.currentTarget.blur();
								}
							}}
							aria-label="Note title"
						/>
					</div>
					<div className="relative">
						<button className="grid size-[34px] place-items-center rounded-[5px] border-0 bg-transparent text-[var(--vscode-icon-foreground)] hover:bg-[var(--vscode-toolbar-hoverBackground)]" type="button" title="Note actions" onClick={() => setMenuOpen(value => !value)}><MoreHorizontal size={20} /></button>
						{menuOpen && (
							<div className="absolute top-[38px] right-0 z-20 w-[150px] rounded-md border border-[var(--vscode-menu-border,var(--vscode-widget-border))] bg-[var(--vscode-menu-background)] p-1 shadow-[0_8px_24px_rgba(0,0,0,.24)]">
								<button className="flex h-[31px] w-full items-center gap-2 rounded-sm border-0 bg-transparent px-2 text-left text-xs text-[var(--vscode-errorForeground)] hover:bg-[var(--vscode-menu-selectionBackground)] hover:text-[var(--vscode-menu-selectionForeground)]" type="button" onClick={() => { setDeletePending(true); setMenuOpen(false); }}><Trash2 size={15} /> Delete</button>
							</div>
						)}
					</div>
				</header>

				{error && <div className="flex items-center justify-between border-b border-[var(--vscode-inputValidation-errorBorder)] bg-[var(--vscode-inputValidation-errorBackground)] px-4 py-2 text-xs text-[var(--vscode-inputValidation-errorForeground,var(--vscode-errorForeground))]" role="alert">{error}<button className="grid place-items-center border-0 bg-transparent text-inherit" type="button" onClick={() => setError(undefined)}><X size={15} /></button></div>}
				<section className="min-h-0 flex-1 overflow-auto [scrollbar-color:var(--vscode-scrollbarSlider-background)_transparent]">
					{activeNote && <MilkdownEditor key={activeNote.id} noteId={activeNote.id} content={activeNote.content} onChange={scheduleSave} onReady={() => setSaveState('saved')} />}
				</section>
			</main>

			{deletePending && activeNote && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-5" role="presentation">
					<div className="w-[min(390px,100%)] rounded-[7px] border border-[var(--vscode-widget-border)] bg-[var(--vscode-editorWidget-background)] p-[22px] shadow-[0_18px_50px_rgba(0,0,0,.35)]" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
						<div className="grid size-[38px] place-items-center rounded-full bg-[var(--vscode-inputValidation-errorBackground)] text-[var(--vscode-errorForeground)]"><Trash2 size={20} /></div>
						<h2 className="mt-3.5 mb-[7px] text-base" id="delete-title">Delete “{activeNote.title}”?</h2>
						<p className="m-0 text-xs text-[var(--vscode-descriptionForeground)]">This note will be permanently removed.</p>
						<div className="mt-[22px] flex justify-end gap-2">
							<button className="h-8 rounded-sm border border-[var(--vscode-button-border,transparent)] bg-[var(--vscode-button-secondaryBackground)] px-3.5 text-[var(--vscode-button-secondaryForeground)]" type="button" onClick={() => setDeletePending(false)}>Cancel</button>
							<button className="h-8 rounded-sm border border-[var(--vscode-button-border,transparent)] bg-[var(--vscode-errorForeground)] px-3.5 text-[var(--vscode-button-foreground)]" type="button" onClick={() => { flushPendingSave(); vscode.postMessage({ type: 'delete', id: activeNote.id }); }}>Delete</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function formatRelativeTime(timestamp: number): string {
	const elapsed = Date.now() - timestamp;
	const minutes = Math.max(1, Math.floor(elapsed / 60_000));
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours}h ago`;
	}
	const days = Math.floor(hours / 24);
	return days < 7 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
}