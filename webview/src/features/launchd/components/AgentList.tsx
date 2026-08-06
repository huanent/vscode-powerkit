import { Activity, LoaderCircle, Pause, Play, Rocket, Trash2 } from 'lucide-react';
import type { LaunchAgent, LaunchAgentState } from '../types';
import { statusLabel } from '../utils';

const stateClassNames: Record<LaunchAgentState, string> = {
	running: 'bg-(--vscode-testing-iconPassed) shadow-[0_0_0_3px_color-mix(in_srgb,var(--vscode-testing-iconPassed)_18%,transparent)]',
	loaded: 'bg-(--vscode-charts-yellow)',
	unloaded: 'bg-(--vscode-descriptionForeground)',
	error: 'bg-(--vscode-testing-iconFailed)',
};

export function StatusDot({ state, title }: { state: LaunchAgentState; title?: string }) {
	return <span className={`size-2 shrink-0 rounded-full ${stateClassNames[state]}`} title={title} />;
}

export function AgentList({ agents, selectedFileName, busy, detailsLoading, onSelect, onAction, onDetails, onRemove }: {
	agents: LaunchAgent[];
	selectedFileName?: string;
	busy: boolean;
	detailsLoading: boolean;
	onSelect(agent: LaunchAgent): void;
	onAction(message: object): void;
	onDetails(agent: LaunchAgent): void;
	onRemove(agent: LaunchAgent): void;
}) {
	return (
		<aside className="border-r border-(--vscode-widget-border) bg-(--vscode-sideBar-background) max-[760px]:max-h-[310px] max-[760px]:overflow-auto max-[760px]:border-r-0 max-[760px]:border-b" aria-label="LaunchAgents">
			<div className="flex min-h-12 items-center justify-between border-b border-(--vscode-widget-border) px-3.5 text-xs font-semibold uppercase"><span>Agents</span><span className="grid h-5.5 min-w-5.5 place-items-center border border-(--vscode-widget-border) text-[11px] text-(--vscode-descriptionForeground)">{agents.length}</span></div>
			{busy && agents.length === 0 ? <EmptyState icon={<LoaderCircle className="animate-spin" size={22} />} label="Scanning LaunchAgents" /> : agents.length === 0 ? <EmptyState icon={<Rocket size={22} />} label="No LaunchAgents found" /> : agents.map(agent => {
				const selected = selectedFileName === agent.fileName;
				return (
					<article key={agent.fileName} className={`group flex min-h-15.5 items-center justify-between gap-2 border-b border-(--vscode-widget-border) py-2 pr-2 pl-3.5 hover:bg-(--vscode-list-hoverBackground) ${selected ? 'bg-(--vscode-list-activeSelectionBackground) text-(--vscode-list-activeSelectionForeground)' : ''}`} onClick={() => onSelect(agent)}>
						<div className="flex min-w-0 items-center gap-2.5"><StatusDot state={agent.state} title={statusLabel(agent)} /><div className="min-w-0"><strong className="block truncate text-xs font-semibold">{agent.label}</strong><small className={`mt-1 block truncate text-[11px] ${selected ? 'text-inherit opacity-75' : 'text-(--vscode-descriptionForeground)'}`}>{statusLabel(agent)}</small></div></div>
						<div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-[760px]:opacity-100">
							<RowButton title="Runtime details" aria-label={`View runtime details for ${agent.label}`} disabled={detailsLoading || agent.state === 'error'} onClick={event => { event.stopPropagation(); onDetails(agent); }}><Activity size={14} /></RowButton>
							{agent.state === 'running' || agent.state === 'loaded' ? <RowButton title="Stop" aria-label={`Stop ${agent.label}`} disabled={busy} onClick={event => { event.stopPropagation(); onAction({ type: 'stop', label: agent.label }); }}><Pause size={14} /></RowButton> : <RowButton title="Start" aria-label={`Start ${agent.label}`} disabled={busy || agent.state === 'error'} onClick={event => { event.stopPropagation(); onAction({ type: 'start', fileName: agent.fileName, label: agent.label }); }}><Play size={14} /></RowButton>}
							<RowButton className="hover:text-(--vscode-errorForeground)" title="Delete" aria-label={`Delete ${agent.label}`} disabled={busy} onClick={event => { event.stopPropagation(); onRemove(agent); }}><Trash2 size={14} /></RowButton>
						</div>
					</article>
				);
			})}
		</aside>
	);
}

function RowButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return <button className={`grid size-7 place-items-center border-0 bg-transparent text-inherit hover:bg-(--vscode-toolbar-hoverBackground) disabled:cursor-default disabled:opacity-55 ${className}`} {...props} />;
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
	return <div className="grid min-h-47.5 place-content-center justify-items-center gap-2.5 text-xs text-(--vscode-descriptionForeground)">{icon}<span>{label}</span></div>;
}