import { Check, CircleCheck, CircleX, Copy, KeyRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DecodedJwt, ExtensionMessage } from './types';
import { vscode } from './vscodeApi';

type Mode = 'generate' | 'decode';

export function App() {
	const [mode, setMode] = useState<Mode>('decode');
	const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
	const [tokenInput, setTokenInput] = useState('');
	const [secret, setSecret] = useState('');
	const [generatedToken, setGeneratedToken] = useState('');
	const [decoded, setDecoded] = useState<DecodedJwt>();
	const [error, setError] = useState<string>();
	const [copiedTarget, setCopiedTarget] = useState<string>();
	const latestRequestId = useRef(0);

	useEffect(() => {
		const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
			switch (event.data.type) {
				case 'encoded':
					if (event.data.requestId !== latestRequestId.current) {
						break;
					}
					setGeneratedToken(event.data.token);
					setError(undefined);
					break;
				case 'decoded':
					if (event.data.requestId !== latestRequestId.current) {
						break;
					}
					setDecoded(event.data.decoded);
					setError(undefined);
					break;
				case 'copied':
					setCopiedTarget(event.data.target);
					window.setTimeout(() => setCopiedTarget(undefined), 1400);
					break;
				case 'error':
					if (event.data.requestId !== latestRequestId.current) {
						break;
					}
					setError(event.data.message);
					break;
			}
		};
		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	useEffect(() => {
		const requestId = ++latestRequestId.current;
		setError(undefined);
		if (mode === 'generate') {
			setDecoded(undefined);
			if (!payload.trim() || !secret) {
				setGeneratedToken('');
				return;
			}
			vscode.postMessage({ type: 'encode', requestId, payload, secret });
			return;
		}

		setGeneratedToken('');
		if (!tokenInput.trim()) {
			setDecoded(undefined);
			return;
		}
		vscode.postMessage({ type: 'decode', requestId, token: tokenInput, secret });
	}, [mode, payload, secret, tokenInput]);

	const copy = (target: string, value: string) => {
		vscode.postMessage({ type: 'copy', target, value });
	};

	return (
		<main>
			<header>
				<div className="title-icon"><KeyRound size={22} aria-hidden="true" /></div>
				<div>
					<h1>JWT Token</h1>
					<p>Generate HS256 tokens or inspect and verify an existing token.</p>
				</div>
			</header>

			<div className="mode-control" role="group" aria-label="JWT operation">
				<button type="button" className={mode === 'decode' ? 'active' : ''} onClick={() => setMode('decode')}>Decode</button>
				<button type="button" className={mode === 'generate' ? 'active' : ''} onClick={() => setMode('generate')}>Generate</button>
			</div>

			<section className="workspace">
				{mode === 'decode' ? (
					<label>
						<span>JWT token</span>
						<textarea value={tokenInput} onChange={event => setTokenInput(event.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." spellCheck={false} autoFocus />
					</label>
				) : (
					<label>
						<span>Payload JSON</span>
						<textarea value={payload} onChange={event => setPayload(event.target.value)} spellCheck={false} autoFocus />
					</label>
				)}

				<label className="secret-field">
					<span>Secret <small>{mode === 'decode' ? 'optional, verifies HS256 signature' : 'required for HS256'}</small></span>
					<input type="password" value={secret} onChange={event => setSecret(event.target.value)} placeholder={mode === 'decode' ? 'Optional' : 'Required'} />
				</label>
			</section>

			{error && <div className="error" role="alert">{error}</div>}

			{mode === 'generate' && generatedToken && (
				<Result title="JWT" value={generatedToken} copied={copiedTarget === 'token'} onCopy={() => copy('token', generatedToken)} />
			)}

			{mode === 'decode' && decoded && (
				<div className="results">
					{decoded.signatureValid !== undefined && (
						<div className={`signature ${decoded.signatureValid ? 'valid' : 'invalid'}`}>
							{decoded.signatureValid ? <CircleCheck size={17} /> : <CircleX size={17} />}
							{decoded.signatureValid ? 'Signature valid' : 'Signature invalid'}
						</div>
					)}
					<Result title="Header" value={decoded.header} copied={copiedTarget === 'header'} onCopy={() => copy('header', decoded.header)} />
					<Result title="Payload" value={decoded.payload} copied={copiedTarget === 'payload'} onCopy={() => copy('payload', decoded.payload)} />
				</div>
			)}
		</main>
	);
}

function Result({ title, value, copied, onCopy }: { title: string; value: string; copied: boolean; onCopy(): void }) {
	return (
		<section className="result">
			<div className="result-heading">
				<h2>{title}</h2>
				<button className="icon-button" type="button" onClick={onCopy} title={`Copy ${title}`} aria-label={`Copy ${title}`}>
					{copied ? <Check size={16} /> : <Copy size={16} />}
				</button>
			</div>
			<pre>{value}</pre>
		</section>
	);
}