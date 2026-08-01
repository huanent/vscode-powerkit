import { Check, Clock3, Copy, Dices, KeyRound, RefreshCw, Timer, WandSparkles } from 'lucide-react';
import { useGenerators } from '../hooks/useGenerators';
import type { GeneratorKind, GeneratorValues } from '../types';

const generators: Array<{
	kind: GeneratorKind;
	label: string;
	description: string;
	icon: React.ReactNode;
}> = [
	{
		kind: 'timestampSeconds',
		label: 'Unix timestamp',
		description: 'Seconds since 1970-01-01 UTC',
		icon: <Clock3 size={18} aria-hidden="true" />,
	},
	{
		kind: 'timestampMilliseconds',
		label: 'Unix milliseconds',
		description: 'Milliseconds since 1970-01-01 UTC',
		icon: <Timer size={18} aria-hidden="true" />,
	},
	{
		kind: 'uuid',
		label: 'UUID v4',
		description: 'Random RFC 4122 identifier',
		icon: <Dices size={18} aria-hidden="true" />,
	},
	{
		kind: 'password',
		label: 'Random password',
		description: '20 characters without ambiguous symbols',
		icon: <KeyRound size={18} aria-hidden="true" />,
	},
];

export function GeneratorsPanel() {
	const { values, copiedKind, generateAll, generate, copy } = useGenerators();

	return (
		<main className="mx-auto w-[min(980px,calc(100%-48px))] py-10.5 pb-14 max-[680px]:w-[min(980px,calc(100%-24px))] max-[680px]:pt-5.5">
			<header className="mb-5 flex items-center justify-between gap-5 max-[680px]:flex-col max-[680px]:items-start">
				<div className="flex items-center gap-3.5">
					<div className="grid size-11 shrink-0 place-items-center border border-[color-mix(in_srgb,var(--vscode-charts-yellow)_55%,var(--vscode-widget-border))] bg-[color-mix(in_srgb,var(--vscode-charts-yellow)_12%,transparent)] text-(--vscode-charts-yellow)"><WandSparkles size={22} aria-hidden="true" /></div>
					<div>
						<span className="mb-1 block text-[11px] font-semibold uppercase text-(--vscode-descriptionForeground)">PowerKit</span>
						<h1 className="m-0 text-2xl font-semibold">Generators</h1>
						<p className="mt-1.25 text-[13px] text-(--vscode-descriptionForeground)">Fresh values for everyday development work.</p>
					</div>
				</div>
				<button className="inline-flex min-h-8.5 cursor-pointer items-center justify-center gap-1.75 border border-(--vscode-button-border,transparent) bg-(--vscode-button-secondaryBackground) px-3.25 text-(--vscode-button-secondaryForeground) hover:not-disabled:bg-(--vscode-button-secondaryHoverBackground) focus-visible:[outline:1px_solid_var(--vscode-focusBorder)] focus-visible:outline-offset-2 max-[680px]:w-full" type="button" onClick={generateAll}>
					<RefreshCw size={15} aria-hidden="true" />
					Generate all
				</button>
			</header>

			<section className="border-t-[3px] border-t-(--vscode-charts-yellow) bg-(--vscode-widget-border)" aria-live="polite">
				{generators.map(generator => (
					<GeneratorRow
						key={generator.kind}
						{...generator}
						value={values?.[generator.kind]}
						copied={copiedKind === generator.kind}
						onGenerate={() => generate(generator.kind)}
						onCopy={() => values && copy(generator.kind, values[generator.kind])}
					/>
				))}
			</section>
		</main>
	);
}

interface GeneratorRowProps {
	kind: keyof GeneratorValues;
	label: string;
	description: string;
	icon: React.ReactNode;
	value: string | undefined;
	copied: boolean;
	onGenerate(): void;
	onCopy(): void;
}

function GeneratorRow({ label, description, icon, value, copied, onGenerate, onCopy }: GeneratorRowProps) {
	return (
		<div className="grid min-h-23 grid-cols-[minmax(190px,0.8fr)_minmax(260px,1.4fr)_auto] items-center gap-5 border-b border-b-(--vscode-widget-border) bg-(--vscode-sideBar-background) px-4.5 py-4 max-[680px]:grid-cols-[minmax(0,1fr)_auto] max-[680px]:gap-3.25">
			<div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-2.75">
				<div className="grid size-8.5 place-items-center text-(--vscode-charts-yellow)">{icon}</div>
				<div>
					<strong className="block text-[13px] font-semibold">{label}</strong>
					<span className="mt-1 block text-[11px] text-(--vscode-descriptionForeground)">{description}</span>
				</div>
			</div>
			<code className="min-w-0 wrap-anywhere font-(--vscode-editor-font-family) text-sm text-(--vscode-textLink-foreground) max-[680px]:col-span-full max-[680px]:row-start-2">{value ?? 'Generating...'}</code>
			<div className="flex gap-1.5 max-[680px]:col-start-2 max-[680px]:row-start-1">
				<button className="grid size-8.5 cursor-pointer place-items-center border border-(--vscode-button-border,var(--vscode-widget-border)) bg-(--vscode-button-secondaryBackground) text-(--vscode-button-secondaryForeground) hover:not-disabled:bg-(--vscode-button-secondaryHoverBackground) focus-visible:[outline:1px_solid_var(--vscode-focusBorder)] focus-visible:outline-offset-2" type="button" onClick={onGenerate} title={`Generate new ${label}`} aria-label={`Generate new ${label}`}>
					<RefreshCw size={16} aria-hidden="true" />
				</button>
				<button className="grid size-8.5 cursor-pointer place-items-center border border-(--vscode-button-border,var(--vscode-widget-border)) bg-(--vscode-button-secondaryBackground) text-(--vscode-button-secondaryForeground) hover:not-disabled:bg-(--vscode-button-secondaryHoverBackground) focus-visible:[outline:1px_solid_var(--vscode-focusBorder)] focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-55" type="button" onClick={onCopy} disabled={!value} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
					{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
				</button>
			</div>
		</div>
	);
}