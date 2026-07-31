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
		<main className="generators-panel">
			<header className="page-header">
				<div className="title-group">
					<div className="title-icon generators-title-icon"><WandSparkles size={22} aria-hidden="true" /></div>
					<div>
						<span className="eyebrow">PowerKit</span>
						<h1>Generators</h1>
						<p>Fresh values for everyday development work.</p>
					</div>
				</div>
				<button className="refresh-button" type="button" onClick={generateAll}>
					<RefreshCw size={15} aria-hidden="true" />
					Generate all
				</button>
			</header>

			<section className="generator-list" aria-live="polite">
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
		<div className="generator-row">
			<div className="generator-details">
				<div className="generator-icon">{icon}</div>
				<div>
					<strong>{label}</strong>
					<span>{description}</span>
				</div>
			</div>
			<code className="generator-value">{value ?? 'Generating...'}</code>
			<div className="generator-actions">
				<button className="icon-button" type="button" onClick={onGenerate} title={`Generate new ${label}`} aria-label={`Generate new ${label}`}>
					<RefreshCw size={16} aria-hidden="true" />
				</button>
				<button className="icon-button" type="button" onClick={onCopy} disabled={!value} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
					{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
				</button>
			</div>
		</div>
	);
}