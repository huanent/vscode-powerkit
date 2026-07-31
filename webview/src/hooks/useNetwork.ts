import { useEffect, useState } from 'react';
import type { NetworkExtensionMessage, NetworkSnapshot } from '../types';
import { vscode } from '../vscodeApi';

export function useNetwork() {
	const [snapshot, setSnapshot] = useState<NetworkSnapshot>();
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const handleMessage = (event: MessageEvent<NetworkExtensionMessage>) => {
			switch (event.data.type) {
				case 'loading':
					setLoading(true);
					setError('');
					break;
				case 'loaded':
					setSnapshot(event.data.snapshot);
					setLoading(false);
					break;
				case 'error':
					setError(event.data.message);
					setLoading(false);
					break;
				case 'copied':
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1600);
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		vscode.postMessage({ type: 'ready' });
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	return {
		snapshot,
		error,
		loading,
		copied,
		refresh: () => vscode.postMessage({ type: 'refresh' }),
		copyPublicIp: () => vscode.postMessage({ type: 'copyPublicIp' }),
	};
}