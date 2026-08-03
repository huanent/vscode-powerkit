import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import { useEffect, useRef } from 'react';

interface MilkdownEditorProps {
	noteId: string;
	content: string;
	onChange(content: string): void;
	onReady(): void;
}

export function MilkdownEditor({ noteId, content, onChange, onReady }: MilkdownEditorProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const onChangeRef = useRef(onChange);
	const onReadyRef = useRef(onReady);

	useEffect(() => {
		onChangeRef.current = onChange;
		onReadyRef.current = onReady;
	});

	useEffect(() => {
		if (!rootRef.current) {
			return;
		}

		let disposed = false;
		const editor = new Crepe({
			root: rootRef.current,
			defaultValue: content,
			features: {
				[Crepe.Feature.CodeMirror]: false,
				[Crepe.Feature.ImageBlock]: false,
				[Crepe.Feature.Latex]: false,
			},
		});
		editor.on(listener => {
			listener.markdownUpdated((_context, markdown, previousMarkdown) => {
				if (markdown !== previousMarkdown) {
					onChangeRef.current(markdown);
				}
			});
		});
		void editor.create().then(() => {
			if (!disposed) {
				onReadyRef.current();
			}
		});

		return () => {
			disposed = true;
			void editor.destroy();
		};
	}, [noteId, content]);

	return (
		<div
			className="min-h-full [--crepe-base-font-size:15px] [--crepe-color-background:var(--vscode-editor-background,#fff)] [--crepe-color-error:var(--vscode-errorForeground,#d32f2f)] [--crepe-color-hover:var(--vscode-list-hoverBackground,var(--vscode-toolbar-hoverBackground,#e8e8e8))] [--crepe-color-inline-area:var(--vscode-textCodeBlock-background,var(--vscode-textBlockQuote-background,var(--vscode-editorWidget-background,#f3f3f3)))] [--crepe-color-inline-code:var(--vscode-textPreformat-foreground,var(--vscode-editor-foreground,#202020))] [--crepe-color-inverse:var(--vscode-editor-foreground,#202020)] [--crepe-color-on-background:var(--vscode-editor-foreground,#202020)] [--crepe-color-on-inverse:var(--vscode-editor-background,#fff)] [--crepe-color-on-secondary:var(--vscode-button-secondaryForeground,var(--vscode-foreground,#202020))] [--crepe-color-on-surface-variant:var(--vscode-descriptionForeground,var(--vscode-foreground,#616161))] [--crepe-color-on-surface:var(--vscode-editorWidget-foreground,var(--vscode-foreground,#202020))] [--crepe-color-outline:var(--vscode-widget-border,var(--vscode-contrastBorder,var(--vscode-descriptionForeground,#8c8c8c)))] [--crepe-color-primary:var(--vscode-textLink-foreground,var(--vscode-focusBorder,#006ab1))] [--crepe-color-secondary:var(--vscode-button-secondaryBackground,var(--vscode-toolbar-hoverBackground,#e5e5e5))] [--crepe-color-selected:var(--vscode-editor-selectionBackground,var(--vscode-list-activeSelectionBackground,#add6ff))] [--crepe-color-surface-low:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#f3f3f3))] [--crepe-color-surface:var(--vscode-editorWidget-background,var(--vscode-editor-background,#fff))] [--crepe-font-code:var(--vscode-editor-font-family)] [--crepe-font-default:var(--vscode-font-family)] [--crepe-font-title:Georgia,'Times_New_Roman',serif] [--crepe-shadow-1:0_2px_8px_var(--vscode-widget-shadow,rgba(0,0,0,.24))] [--crepe-shadow-2:0_8px_24px_var(--vscode-widget-shadow,rgba(0,0,0,.32))] [[class~='vscode-dark']_&]:[--crepe-color-hover:var(--vscode-list-hoverBackground,var(--vscode-toolbar-hoverBackground,rgba(255,255,255,.08)))] [[class~='vscode-dark']_&]:[--crepe-color-inline-area:var(--vscode-textCodeBlock-background,var(--vscode-editorWidget-background,rgba(255,255,255,.07)))] [[class~='vscode-dark']_&]:[--crepe-color-outline:var(--vscode-widget-border,var(--vscode-contrastBorder,#6b6b6b))] [[class~='vscode-dark']_&]:[--crepe-color-surface-low:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,var(--vscode-editor-background,#252526)))] [[class~='vscode-dark']_&]:[--crepe-color-surface:var(--vscode-editorWidget-background,var(--vscode-sideBar-background,var(--vscode-editor-background,#252526)))] [[class~='vscode-dark']_&]:[--crepe-shadow-1:0_4px_12px_var(--vscode-widget-shadow,rgba(0,0,0,.5))] [[class~='vscode-dark']_&]:[--crepe-shadow-2:0_10px_32px_var(--vscode-widget-shadow,rgba(0,0,0,.62))] [[class~='vscode-high-contrast']_&]:[--crepe-color-outline:var(--vscode-widget-border,var(--vscode-contrastBorder,#6b6b6b))] [[class~='vscode-high-contrast-light']_&]:[--crepe-color-outline:var(--vscode-widget-border,var(--vscode-contrastBorder,#6b6b6b))] [&_.milkdown]:min-h-full [&_.ProseMirror]:mx-auto [&_.ProseMirror]:min-h-[calc(100vh-58px)] [&_.ProseMirror]:w-[min(780px,calc(100%-64px))] [&_.ProseMirror]:pt-12 [&_.ProseMirror]:pb-[120px] [&_.ProseMirror]:leading-[1.7] [&_.ProseMirror]:outline-none max-[720px]:[&_.ProseMirror]:w-[calc(100%-32px)] max-[720px]:[&_.ProseMirror]:pt-[30px] [&_.ProseMirror_h1]:tracking-normal [&_.ProseMirror_h2]:tracking-normal [&_.ProseMirror_h3]:tracking-normal [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-[var(--vscode-textBlockQuote-border,transparent)] [&_.ProseMirror_code]:border [&_.ProseMirror_code]:border-[var(--vscode-textBlockQuote-border,transparent)] [&_.ProseMirror_pre_code]:border-0 [&_.ProseMirror_blockquote]:text-[var(--vscode-descriptionForeground,var(--vscode-editor-foreground))] [&_.ProseMirror_hr]:opacity-90 [&_.milkdown-toolbar]:border [&_.milkdown-toolbar]:border-[var(--vscode-widget-border,var(--vscode-contrastBorder,transparent))] [&_.milkdown-slash-menu]:border [&_.milkdown-slash-menu]:border-[var(--vscode-widget-border,var(--vscode-contrastBorder,transparent))] [&_.milkdown-slash-menu_.menu-groups]:[scrollbar-color:var(--vscode-scrollbarSlider-background)_transparent] [&_.milkdown-link-preview>.link-preview]:border [&_.milkdown-link-preview>.link-preview]:border-[var(--vscode-widget-border,var(--vscode-contrastBorder,transparent))] [&_.milkdown-link-edit>.link-edit]:border [&_.milkdown-link-edit>.link-edit]:border-[var(--vscode-widget-border,var(--vscode-contrastBorder,transparent))] [&_.milkdown-table-block_.cell-handle]:border [&_.milkdown-table-block_.cell-handle]:border-[var(--vscode-widget-border,var(--vscode-contrastBorder,transparent))] [&_.milkdown-table-block_.button-group]:border [&_.milkdown-table-block_.button-group]:border-[var(--vscode-widget-border,var(--vscode-contrastBorder,transparent))] [&_.milkdown_input::placeholder]:text-[var(--vscode-input-placeholderForeground,var(--vscode-descriptionForeground))]"
			ref={rootRef}
		/>
	);
}