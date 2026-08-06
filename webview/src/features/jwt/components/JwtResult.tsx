import { Check, Copy } from 'lucide-react';
import { IconButton } from '../../../components/ui';

export function JwtResult({ title, value, copied, onCopy }: { title: string; value: string; copied: boolean; onCopy(): void }) {
	return (
		<section className="border border-(--vscode-widget-border) bg-(--vscode-sideBar-background)">
			<div className="flex min-h-10 items-center justify-between border-b border-(--vscode-widget-border) pr-2.5 pl-3.5">
				<h2 className="m-0 text-xs font-semibold">{title}</h2>
				<IconButton className="size-7.5 border-0" type="button" onClick={onCopy} title={`Copy ${title}`} aria-label={`Copy ${title}`}>
					{copied ? <Check size={16} /> : <Copy size={16} />}
				</IconButton>
			</div>
			<pre className="m-0 whitespace-pre-wrap p-3.5 font-(--vscode-editor-font-family) text-xs leading-6 break-anywhere">{value}</pre>
		</section>
	);
}