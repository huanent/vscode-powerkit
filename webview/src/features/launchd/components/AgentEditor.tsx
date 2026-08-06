import { LoaderCircle, Save } from 'lucide-react';
import { FieldLabel, PrimaryButton, TextArea, TextInput } from '../../../components/ui';
import type { LaunchAgentConfig } from '../types';

export function AgentEditor({ draft, argumentsText, environmentText, busy, onArgumentsChange, onEnvironmentChange, onUpdate, onSave }: {
	draft: LaunchAgentConfig;
	argumentsText: string;
	environmentText: string;
	busy: boolean;
	onArgumentsChange(value: string): void;
	onEnvironmentChange(value: string): void;
	onUpdate<Key extends keyof LaunchAgentConfig>(key: Key, value: LaunchAgentConfig[Key]): void;
	onSave(): void;
}) {
	return (
		<section className="min-w-0 bg-(--vscode-editor-background)" aria-label="LaunchAgent configuration">
			<div className="flex min-h-19 items-center justify-between gap-4 border-t-[3px] border-t-(--vscode-charts-green) border-b border-b-(--vscode-widget-border) px-4.5 py-3">
				<div><Eyebrow>{draft.fileName ? 'Edit agent' : 'New agent'}</Eyebrow><h2 className="m-0 text-[17px] font-semibold break-anywhere">{draft.label || 'Untitled LaunchAgent'}</h2></div>
				<PrimaryButton type="button" disabled={busy} onClick={onSave}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}Save</PrimaryButton>
			</div>
			<div className="grid grid-cols-2 gap-4.5 p-5.5 max-[760px]:grid-cols-1 max-[760px]:p-4">
				<FormField className="col-span-2 max-[760px]:col-auto" label="Label"><TextInput value={draft.label} onChange={event => onUpdate('label', event.target.value)} placeholder="com.example.worker" spellCheck={false} /></FormField>
				<FormField className="col-span-2 max-[760px]:col-auto" label="Program"><TextInput value={draft.program} onChange={event => onUpdate('program', event.target.value)} placeholder="/usr/local/bin/node" spellCheck={false} /></FormField>
				<FormField className="col-span-2 max-[760px]:col-auto" label="Program arguments" hint="one per line"><TextArea value={argumentsText} onChange={event => onArgumentsChange(event.target.value)} placeholder={'/path/to/script.js\n--production'} spellCheck={false} /></FormField>
				<FormField className="col-span-2 max-[760px]:col-auto" label="Working directory"><TextInput value={draft.workingDirectory} onChange={event => onUpdate('workingDirectory', event.target.value)} placeholder="/Users/me/project" spellCheck={false} /></FormField>
				<ToggleField label="Run at load" description="Start immediately after loading" checked={draft.runAtLoad} onChange={value => onUpdate('runAtLoad', value)} />
				<ToggleField label="Keep alive" description="Restart after the process exits" checked={draft.keepAlive} onChange={value => onUpdate('keepAlive', value)} />
				<FormField label="Throttle interval" hint="seconds"><TextInput type="number" min="0" step="1" value={draft.throttleInterval} onChange={event => onUpdate('throttleInterval', Number(event.target.value))} /></FormField>
				<div className="max-[760px]:hidden" />
				<FormField className="col-span-2 max-[760px]:col-auto" label="Environment variables" hint="KEY=value, one per line"><TextArea value={environmentText} onChange={event => onEnvironmentChange(event.target.value)} placeholder={'NODE_ENV=production\nPORT=3000'} spellCheck={false} /></FormField>
				<FormField label="Standard output path"><TextInput value={draft.standardOutPath} onChange={event => onUpdate('standardOutPath', event.target.value)} placeholder="/tmp/worker.log" spellCheck={false} /></FormField>
				<FormField label="Standard error path"><TextInput value={draft.standardErrorPath} onChange={event => onUpdate('standardErrorPath', event.target.value)} placeholder="/tmp/worker.error.log" spellCheck={false} /></FormField>
			</div>
		</section>
	);
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
	return <span className="mb-1 block text-[10px] font-semibold uppercase text-(--vscode-descriptionForeground)">{children}</span>;
}

function FormField({ className = '', label, hint, children }: { className?: string; label: string; hint?: string; children: React.ReactNode }) {
	return <label className={className}><FieldLabel hint={hint}>{label}</FieldLabel>{children}</label>;
}

function ToggleField({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange(value: boolean): void }) {
	return <label className="flex min-h-14.5 items-center justify-between gap-4 border border-(--vscode-widget-border) px-3 py-2.5"><span><strong className="block text-xs font-semibold">{label}</strong><small className="mt-1 block text-[11px] text-(--vscode-descriptionForeground)">{description}</small></span><input className="h-4.5 w-9 shrink-0 accent-(--vscode-button-background)" type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} /></label>;
}