import { useEffect, useState } from 'react';
import type { GeneratorKind, GeneratorsExtensionMessage, GeneratorValues } from '../types';
import { vscode } from '../vscodeApi';

export function useGenerators() {
	const [values, setValues] = useState<GeneratorValues>();
	const [copiedKind, setCopiedKind] = useState<GeneratorKind>();

	useEffect(() => {
		const handleMessage = (event: MessageEvent<GeneratorsExtensionMessage>) => {
			switch (event.data.type) {
				case 'generatedAll':
					setValues(event.data.values);
					break;
				case 'generated':
					const { kind, value } = event.data;
					setValues(current => current ? { ...current, [kind]: value } : current);
					break;
				case 'copied':
					setCopiedKind(event.data.kind);
					window.setTimeout(() => setCopiedKind(undefined), 1600);
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		vscode.postMessage({ type: 'ready' });
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	return {
		values,
		copiedKind,
		generateAll: () => vscode.postMessage({ type: 'generateAll' }),
		generate: (kind: GeneratorKind) => vscode.postMessage({ type: 'generate', kind }),
		copy: (kind: GeneratorKind, value: string) => vscode.postMessage({ type: 'copy', kind, value }),
	};
}