import { Check, Copy, Fingerprint, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useCrypto } from '../hooks/useCrypto';
import type { HashAlgorithm, SshKeyType } from '../types';
import {
	cryptoHeadingClass,
	cryptoHeadingIconClass,
	cryptoHeadingTextClass,
	cryptoSectionClass,
	fieldLabelClass,
	iconButtonClass,
	inputClass,
	primaryButtonClass,
	resultClass,
	resultHeadingClass,
	resultLabelClass,
	resultValueClass,
	segmentedActiveClass,
	segmentedButtonClass,
	segmentedControlClass,
	segmentedFieldClass,
	textareaClass,
} from './cryptoStyles';
import { JwtSection } from './JwtSection';

const hashAlgorithms: Array<{ value: HashAlgorithm; label: string }> = [
	{ value: 'md5', label: 'MD5' },
	{ value: 'sha1', label: 'SHA-1' },
	{ value: 'sha256', label: 'SHA-256' },
	{ value: 'sha512', label: 'SHA-512' },
];

const keyTypes: Array<{ value: SshKeyType; label: string }> = [
	{ value: 'ed25519', label: 'Ed25519' },
	{ value: 'rsa2048', label: 'RSA 2048' },
	{ value: 'rsa4096', label: 'RSA 4096' },
];

export function CryptoPanel() {
	const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgorithm>('md5');
	const [hashInput, setHashInput] = useState('');
	const [keyType, setKeyType] = useState<SshKeyType>('ed25519');
	const [comment, setComment] = useState('');
	const { hashResult, jwtToken, decodedJwt, keyPair, copiedTarget, error, generatingKey, hash, encodeJwt, decodeJwt, generateSshKey, copy } = useCrypto();

	return (
		<main className="mx-auto w-[min(980px,calc(100%-48px))] py-[42px] pb-14 max-[680px]:w-[min(980px,calc(100%-24px))] max-[680px]:pt-[22px]">
			<header className="mb-5 flex items-center justify-between gap-5 max-[680px]:flex-col max-[680px]:items-start">
				<div className="flex items-center gap-3.5">
					<div className="grid size-11 shrink-0 place-items-center border border-[color-mix(in_srgb,var(--vscode-charts-blue)_55%,var(--vscode-widget-border))] bg-[color-mix(in_srgb,var(--vscode-charts-blue)_12%,transparent)] text-[var(--vscode-charts-blue)]"><ShieldCheck size={22} aria-hidden="true" /></div>
					<div>
						<span className="mb-1 block text-[11px] font-semibold uppercase text-[var(--vscode-descriptionForeground)]">PowerKit</span>
						<h1 className="m-0 text-2xl font-semibold">Crypto</h1>
						<p className="mt-[5px] text-[13px] text-[var(--vscode-descriptionForeground)]">Generate SSH credentials and calculate text digests locally.</p>
					</div>
				</div>
			</header>

			{error && <div className="mb-5 grid gap-[7px] border-l-[3px] border-l-[var(--vscode-errorForeground)] bg-[var(--vscode-inputValidation-errorBackground)] p-[18px] text-[var(--vscode-descriptionForeground)]"><strong className="text-[var(--vscode-errorForeground)]">Operation failed</strong><span>{error}</span></div>}

			<section className={`${cryptoSectionClass} mt-0`}>
				<div className={cryptoHeadingClass}>
					<div className={cryptoHeadingIconClass}><Fingerprint size={19} aria-hidden="true" /></div>
					<div><h2 className="m-0 text-base font-semibold">Text digest</h2><p className={cryptoHeadingTextClass}>Hash UTF-8 text into a hexadecimal digest.</p></div>
				</div>

				<SegmentedControl
					label="Hash algorithm"
					options={hashAlgorithms}
					value={hashAlgorithm}
					onChange={value => setHashAlgorithm(value as HashAlgorithm)}
				/>
				<label className={fieldLabelClass} htmlFor="hash-input">Input</label>
				<textarea className={textareaClass} id="hash-input" value={hashInput} onChange={event => setHashInput(event.target.value)} placeholder="Enter text to hash" />
				<div className="mt-3 flex justify-end">
					<button className={primaryButtonClass} type="button" onClick={() => hash(hashAlgorithm, hashInput)}>Calculate digest</button>
				</div>
				{hashResult && (
					<ResultField label={`${hashAlgorithm.toUpperCase()} digest`} value={hashResult} copied={copiedTarget === 'hash'} onCopy={() => copy('hash', hashResult)} />
				)}
			</section>

			<JwtSection
				token={jwtToken}
				decoded={decodedJwt}
				copiedTarget={copiedTarget}
				onEncode={encodeJwt}
				onDecode={decodeJwt}
				onCopy={copy}
			/>

			<section className={`${cryptoSectionClass} border-t-[var(--vscode-charts-green)]`}>
				<div className={cryptoHeadingClass}>
					<div className={`${cryptoHeadingIconClass} text-[var(--vscode-charts-green)]`}><KeyRound size={19} aria-hidden="true" /></div>
					<div><h2 className="m-0 text-base font-semibold">SSH key pair</h2><p className={cryptoHeadingTextClass}>Create a public key and PKCS#8 PEM private key on this machine.</p></div>
				</div>

				<SegmentedControl
					label="Key type"
					options={keyTypes}
					value={keyType}
					onChange={value => setKeyType(value as SshKeyType)}
				/>
				<label className={fieldLabelClass} htmlFor="ssh-comment">Key comment</label>
				<input className={inputClass} id="ssh-comment" value={comment} onChange={event => setComment(event.target.value)} placeholder="name@host (optional)" />
				<div className="mt-3 flex justify-end">
					<button className={primaryButtonClass} type="button" disabled={generatingKey} onClick={() => generateSshKey(keyType, comment)}>
						{generatingKey && <LoaderCircle className="animate-[spin_900ms_linear_infinite]" size={15} aria-hidden="true" />}
						{generatingKey ? 'Generating...' : 'Generate key pair'}
					</button>
				</div>

				{keyPair && (
					<div className="grid gap-3.5">
						<ResultField label="Public key" value={keyPair.publicKey} copied={copiedTarget === 'publicKey'} onCopy={() => copy('publicKey', keyPair.publicKey)} multiline />
						<ResultField label="Private key" value={keyPair.privateKey} copied={copiedTarget === 'privateKey'} onCopy={() => copy('privateKey', keyPair.privateKey)} multiline sensitive />
					</div>
				)}
			</section>
		</main>
	);
}

interface SegmentedControlProps {
	label: string;
	options: Array<{ value: string; label: string }>;
	value: string;
	onChange(value: string): void;
}

function SegmentedControl({ label, options, value, onChange }: SegmentedControlProps) {
	return (
		<fieldset className={segmentedFieldClass}>
			<legend className={fieldLabelClass}>{label}</legend>
			<div className={segmentedControlClass}>
				{options.map(option => (
					<button key={option.value} className={`${segmentedButtonClass} ${value === option.value ? segmentedActiveClass : ''}`} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
						{option.label}
					</button>
				))}
			</div>
		</fieldset>
	);
}

interface ResultFieldProps {
	label: string;
	value: string;
	copied: boolean;
	multiline?: boolean;
	sensitive?: boolean;
	onCopy(): void;
}

function ResultField({ label, value, copied, multiline, sensitive, onCopy }: ResultFieldProps) {
	return (
		<div className={`${resultClass} ${sensitive ? 'border-l-[3px] border-l-[var(--vscode-charts-yellow)]' : ''}`}>
			<div className={resultHeadingClass}>
				<span className={resultLabelClass}>{label}</span>
				<button className={iconButtonClass} type="button" onClick={onCopy} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
					{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
				</button>
			</div>
			{multiline ? <pre className={resultValueClass}>{value}</pre> : <code className={resultValueClass}>{value}</code>}
		</div>
	);
}