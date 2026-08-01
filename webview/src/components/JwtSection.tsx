import { Check, CircleCheck, CircleX, Copy, FileKey } from 'lucide-react';
import { useState } from 'react';
import type { DecodedJwt } from '../types';
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
		<section className={`${cryptoSectionClass} border-t-(--vscode-charts-yellow)`}>
			<div className={cryptoHeadingClass}>
				<div className={`${cryptoHeadingIconClass} text-(--vscode-charts-yellow)`}><FileKey size={19} aria-hidden="true" /></div>
				<div><h2 className="m-0 text-base font-semibold">JWT</h2><p className={cryptoHeadingTextClass}>Generate or decode HS256 JSON Web Tokens locally.</p></div>
			</div>

			<fieldset className={segmentedFieldClass}>
				<legend className={fieldLabelClass}>Operation</legend>
				<div className={segmentedControlClass}>
					<button className={`${segmentedButtonClass} ${mode === 'encode' ? segmentedActiveClass : ''}`} type="button" aria-pressed={mode === 'encode'} onClick={() => setMode('encode')}>Generate</button>
					<button className={`${segmentedButtonClass} ${mode === 'decode' ? segmentedActiveClass : ''}`} type="button" aria-pressed={mode === 'decode'} onClick={() => setMode('decode')}>Decode</button>
				</div>
			</fieldset>

			{mode === 'encode' ? (
				<>
					<label className={fieldLabelClass} htmlFor="jwt-payload">Payload JSON</label>
					<textarea id="jwt-payload" className={`${textareaClass} font-(--vscode-editor-font-family) text-xs`} value={payload} onChange={event => setPayload(event.target.value)} spellCheck={false} />
				</>
			) : (
				<>
					<label className={fieldLabelClass} htmlFor="jwt-token">JWT</label>
					<textarea id="jwt-token" className={`${textareaClass} font-(--vscode-editor-font-family) text-xs`} value={jwtInput} onChange={event => setJwtInput(event.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." spellCheck={false} />
				</>
			)}

			<label className={`${fieldLabelClass} mt-4`} htmlFor="jwt-secret">Secret {mode === 'decode' && <span className="font-normal">(optional, used to verify signature)</span>}</label>
			<input className={inputClass} id="jwt-secret" type="password" value={secret} onChange={event => setSecret(event.target.value)} placeholder={mode === 'encode' ? 'Required' : 'Optional'} />
			<div className="mt-3 flex justify-end">
				<button className={primaryButtonClass} type="button" onClick={() => mode === 'encode' ? onEncode(payload, secret) : onDecode(jwtInput, secret)}>
					{mode === 'encode' ? 'Generate JWT' : 'Decode JWT'}
				</button>
			</div>

			{mode === 'encode' && token && (
				<JwtResult label="JWT" value={token} copied={copiedTarget === 'jwt'} onCopy={() => onCopy('jwt', token)} />
			)}

			{mode === 'decode' && decoded && (
				<div className="mt-4.5 grid gap-3.5">
					{decoded.signatureValid !== undefined && (
						<div className={`flex items-center gap-2 text-xs font-semibold ${decoded.signatureValid ? 'text-(--vscode-testing-iconPassed)' : 'text-(--vscode-testing-iconFailed)'}`}>
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
		<div className={`${resultClass} mt-0`}>
			<div className={resultHeadingClass}>
				<span className={resultLabelClass}>{label}</span>
				<button className={iconButtonClass} type="button" onClick={onCopy} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
					{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
				</button>
			</div>
			<pre className={resultValueClass}>{value}</pre>
		</div>
	);
}