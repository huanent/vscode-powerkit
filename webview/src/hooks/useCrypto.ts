import { useEffect, useState } from 'react';
import type { CryptoExtensionMessage, DecodedJwt, HashAlgorithm, SshKeyPair, SshKeyType } from '../types';
import { vscode } from '../vscodeApi';

export function useCrypto() {
	const [hashResult, setHashResult] = useState('');
	const [jwtToken, setJwtToken] = useState('');
	const [decodedJwt, setDecodedJwt] = useState<DecodedJwt>();
	const [keyPair, setKeyPair] = useState<SshKeyPair>();
	const [copiedTarget, setCopiedTarget] = useState<string>();
	const [error, setError] = useState<string>();
	const [generatingKey, setGeneratingKey] = useState(false);

	useEffect(() => {
		const handleMessage = (event: MessageEvent<CryptoExtensionMessage>) => {
			switch (event.data.type) {
				case 'hashed':
					setHashResult(event.data.value);
					setError(undefined);
					break;
				case 'jwtEncoded':
					setJwtToken(event.data.token);
					setError(undefined);
					break;
				case 'jwtDecoded':
					setDecodedJwt(event.data.decoded);
					setError(undefined);
					break;
				case 'sshKeyGenerated':
					setKeyPair(event.data.keyPair);
					setGeneratingKey(false);
					setError(undefined);
					break;
				case 'copied':
					setCopiedTarget(event.data.target);
					window.setTimeout(() => setCopiedTarget(undefined), 1600);
					break;
				case 'error':
					setError(event.data.message);
					setGeneratingKey(false);
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		vscode.postMessage({ type: 'ready' });
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	return {
		hashResult,
		jwtToken,
		decodedJwt,
		keyPair,
		copiedTarget,
		error,
		generatingKey,
		hash: (algorithm: HashAlgorithm, value: string) => vscode.postMessage({ type: 'hash', algorithm, value }),
		encodeJwt: (payload: string, secret: string) => vscode.postMessage({ type: 'encodeJwt', payload, secret }),
		decodeJwt: (token: string, secret: string) => vscode.postMessage({ type: 'decodeJwt', token, secret }),
		generateSshKey: (keyType: SshKeyType, comment: string) => {
			setGeneratingKey(true);
			setError(undefined);
			vscode.postMessage({ type: 'generateSshKey', keyType, comment });
		},
		copy: (target: string, value: string) => vscode.postMessage({ type: 'copy', target, value }),
	};
}