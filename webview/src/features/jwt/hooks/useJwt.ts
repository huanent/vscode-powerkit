import { useEffect, useRef, useState } from 'react';
import { vscode } from '../../../vscodeApi';
import type { DecodedJwt, JwtExtensionMessage, JwtMode } from '../types';

const initialPayload = '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}';

export function useJwt() {
	const [mode, setMode] = useState<JwtMode>('decode');
	const [payload, setPayload] = useState(initialPayload);
	const [tokenInput, setTokenInput] = useState('');
	const [secret, setSecret] = useState('');
	const [generatedToken, setGeneratedToken] = useState('');
	const [decoded, setDecoded] = useState<DecodedJwt>();
	const [error, setError] = useState<string>();
	const [copiedTarget, setCopiedTarget] = useState<string>();
	const latestRequestId = useRef(0);

	useEffect(() => {
		const handleMessage = (event: MessageEvent<JwtExtensionMessage>) => {
			if ('requestId' in event.data && event.data.requestId !== latestRequestId.current) {
				return;
			}
			switch (event.data.type) {
				case 'encoded':
					setGeneratedToken(event.data.token);
					setError(undefined);
					break;
				case 'decoded':
					setDecoded(event.data.decoded);
					setError(undefined);
					break;
				case 'copied':
					setCopiedTarget(event.data.target);
					window.setTimeout(() => setCopiedTarget(undefined), 1400);
					break;
				case 'error':
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

	const copy = (target: string, value: string) => vscode.postMessage({ type: 'copy', target, value });

	return {
		mode, setMode, payload, setPayload, tokenInput, setTokenInput, secret, setSecret,
		generatedToken, decoded, error, copiedTarget, copy,
	};
}