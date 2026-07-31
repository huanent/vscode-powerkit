import { randomInt, randomUUID } from 'node:crypto';

export type GeneratorKind = 'timestampSeconds' | 'timestampMilliseconds' | 'uuid' | 'password';

const passwordCharacters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';

export function generateValue(kind: GeneratorKind): string {
	switch (kind) {
		case 'timestampSeconds':
			return Math.floor(Date.now() / 1000).toString();
		case 'timestampMilliseconds':
			return Date.now().toString();
		case 'uuid':
			return randomUUID();
		case 'password':
			return Array.from({ length: 20 }, () => passwordCharacters[randomInt(passwordCharacters.length)]).join('');
	}
}

export function generateAll(): Record<GeneratorKind, string> {
	return {
		timestampSeconds: generateValue('timestampSeconds'),
		timestampMilliseconds: generateValue('timestampMilliseconds'),
		uuid: generateValue('uuid'),
		password: generateValue('password'),
	};
}