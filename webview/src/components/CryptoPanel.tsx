import { Check, Copy, Fingerprint, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useCrypto } from '../hooks/useCrypto';
import type { HashAlgorithm, SshKeyType } from '../types';

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
	const { hashResult, keyPair, copiedTarget, error, generatingKey, hash, generateSshKey, copy } = useCrypto();

	return (
		<main className="crypto-panel">
			<header className="page-header">
				<div className="title-group">
					<div className="title-icon crypto-title-icon"><ShieldCheck size={22} aria-hidden="true" /></div>
					<div>
						<span className="eyebrow">PowerKit</span>
						<h1>Crypto</h1>
						<p>Generate SSH credentials and calculate text digests locally.</p>
					</div>
				</div>
			</header>

			{error && <div className="error-state crypto-error"><strong>Operation failed</strong><span>{error}</span></div>}

			<section className="crypto-section hash-section">
				<div className="crypto-section-heading">
					<div className="crypto-heading-icon"><Fingerprint size={19} aria-hidden="true" /></div>
					<div><h2>Text digest</h2><p>Hash UTF-8 text into a hexadecimal digest.</p></div>
				</div>

				<SegmentedControl
					label="Hash algorithm"
					options={hashAlgorithms}
					value={hashAlgorithm}
					onChange={value => setHashAlgorithm(value as HashAlgorithm)}
				/>
				<label className="field-label" htmlFor="hash-input">Input</label>
				<textarea id="hash-input" value={hashInput} onChange={event => setHashInput(event.target.value)} placeholder="Enter text to hash" />
				<div className="crypto-action-row">
					<button className="primary-button" type="button" onClick={() => hash(hashAlgorithm, hashInput)}>Calculate digest</button>
				</div>
				{hashResult && (
					<ResultField label={`${hashAlgorithm.toUpperCase()} digest`} value={hashResult} copied={copiedTarget === 'hash'} onCopy={() => copy('hash', hashResult)} />
				)}
			</section>

			<section className="crypto-section ssh-section">
				<div className="crypto-section-heading">
					<div className="crypto-heading-icon"><KeyRound size={19} aria-hidden="true" /></div>
					<div><h2>SSH key pair</h2><p>Create a public key and PKCS#8 PEM private key on this machine.</p></div>
				</div>

				<SegmentedControl
					label="Key type"
					options={keyTypes}
					value={keyType}
					onChange={value => setKeyType(value as SshKeyType)}
				/>
				<label className="field-label" htmlFor="ssh-comment">Key comment</label>
				<input id="ssh-comment" value={comment} onChange={event => setComment(event.target.value)} placeholder="name@host (optional)" />
				<div className="crypto-action-row">
					<button className="primary-button" type="button" disabled={generatingKey} onClick={() => generateSshKey(keyType, comment)}>
						{generatingKey && <LoaderCircle className="spinning" size={15} aria-hidden="true" />}
						{generatingKey ? 'Generating...' : 'Generate key pair'}
					</button>
				</div>

				{keyPair && (
					<div className="key-results">
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
		<fieldset className="segmented-field">
			<legend>{label}</legend>
			<div className="segmented-control">
				{options.map(option => (
					<button key={option.value} className={value === option.value ? 'active' : ''} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
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
		<div className={`crypto-result${sensitive ? ' sensitive-result' : ''}`}>
			<div className="result-heading">
				<span>{label}</span>
				<button className="icon-button" type="button" onClick={onCopy} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
					{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
				</button>
			</div>
			{multiline ? <pre>{value}</pre> : <code>{value}</code>}
		</div>
	);
}