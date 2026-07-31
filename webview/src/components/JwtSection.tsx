import { Check, CircleCheck, CircleX, Copy, FileKey } from 'lucide-react';
import { useState } from 'react';
import type { DecodedJwt } from '../types';

interface JwtSectionProps {
	token: string;
	decoded?: DecodedJwt;
	copiedTarget?: string;
	onEncode(payload: string, secret: string): void;
	onDecode(token: string, secret: string): void;
	onCopy(target: string, value: string): void;
}

export function JwtSection({ token, decoded, copiedTarget, onEncode, onDecode, onCopy }: JwtSectionProps) {
	const [mode, setMode] = useState<'encode' | 'decode'>('encode');
	const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe"\n}');
	const [jwtInput, setJwtInput] = useState('');
	const [secret, setSecret] = useState('');

	return (
		<section className="crypto-section jwt-section">
			<div className="crypto-section-heading">
				<div className="crypto-heading-icon"><FileKey size={19} aria-hidden="true" /></div>
				<div><h2>JWT</h2><p>Generate or decode HS256 JSON Web Tokens locally.</p></div>
			</div>

			<fieldset className="segmented-field">
				<legend>Operation</legend>
				<div className="segmented-control">
					<button className={mode === 'encode' ? 'active' : ''} type="button" aria-pressed={mode === 'encode'} onClick={() => setMode('encode')}>Generate</button>
					<button className={mode === 'decode' ? 'active' : ''} type="button" aria-pressed={mode === 'decode'} onClick={() => setMode('decode')}>Decode</button>
				</div>
			</fieldset>

			{mode === 'encode' ? (
				<>
					<label className="field-label" htmlFor="jwt-payload">Payload JSON</label>
					<textarea id="jwt-payload" className="code-input" value={payload} onChange={event => setPayload(event.target.value)} spellCheck={false} />
				</>
			) : (
				<>
					<label className="field-label" htmlFor="jwt-token">JWT</label>
					<textarea id="jwt-token" className="code-input" value={jwtInput} onChange={event => setJwtInput(event.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." spellCheck={false} />
				</>
			)}

			<label className="field-label jwt-secret-label" htmlFor="jwt-secret">Secret {mode === 'decode' && <span>(optional, used to verify signature)</span>}</label>
			<input id="jwt-secret" type="password" value={secret} onChange={event => setSecret(event.target.value)} placeholder={mode === 'encode' ? 'Required' : 'Optional'} />
			<div className="crypto-action-row">
				<button className="primary-button" type="button" onClick={() => mode === 'encode' ? onEncode(payload, secret) : onDecode(jwtInput, secret)}>
					{mode === 'encode' ? 'Generate JWT' : 'Decode JWT'}
				</button>
			</div>

			{mode === 'encode' && token && (
				<JwtResult label="JWT" value={token} copied={copiedTarget === 'jwt'} onCopy={() => onCopy('jwt', token)} />
			)}

			{mode === 'decode' && decoded && (
				<div className="jwt-results">
					{decoded.signatureValid !== undefined && (
						<div className={`jwt-signature-status ${decoded.signatureValid ? 'valid' : 'invalid'}`}>
							{decoded.signatureValid ? <CircleCheck size={17} aria-hidden="true" /> : <CircleX size={17} aria-hidden="true" />}
							<span>{decoded.signatureValid ? 'Signature valid' : 'Signature invalid'}</span>
						</div>
					)}
					<JwtResult label="Header" value={decoded.header} copied={copiedTarget === 'jwtHeader'} onCopy={() => onCopy('jwtHeader', decoded.header)} />
					<JwtResult label="Payload" value={decoded.payload} copied={copiedTarget === 'jwtPayload'} onCopy={() => onCopy('jwtPayload', decoded.payload)} />
				</div>
			)}
		</section>
	);
}

interface JwtResultProps {
	label: string;
	value: string;
	copied: boolean;
	onCopy(): void;
}

function JwtResult({ label, value, copied, onCopy }: JwtResultProps) {
	return (
		<div className="crypto-result">
			<div className="result-heading">
				<span>{label}</span>
				<button className="icon-button" type="button" onClick={onCopy} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
					{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
				</button>
			</div>
			<pre>{value}</pre>
		</div>
	);
}