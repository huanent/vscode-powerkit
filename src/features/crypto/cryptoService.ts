import { createHash, generateKeyPairSync } from 'node:crypto';

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';
export type SshKeyType = 'ed25519' | 'rsa2048' | 'rsa4096';

export interface SshKeyPair {
	publicKey: string;
	privateKey: string;
}

export function hashText(value: string, algorithm: HashAlgorithm): string {
	return createHash(algorithm).update(value, 'utf8').digest('hex');
}

export function generateSshKeyPair(type: SshKeyType, comment: string): SshKeyPair {
	if (type === 'ed25519') {
		const { publicKey, privateKey } = generateKeyPairSync('ed25519');
		const publicJwk = publicKey.export({ format: 'jwk' });
		const publicBlob = Buffer.concat([
			encodeSshString('ssh-ed25519'),
			encodeSshBuffer(decodeBase64Url(publicJwk.x!)),
		]);

		return {
			publicKey: appendComment(`ssh-ed25519 ${publicBlob.toString('base64')}`, comment),
			privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
		};
	}

	const modulusLength = type === 'rsa4096' ? 4096 : 2048;
	const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength });
	const publicJwk = publicKey.export({ format: 'jwk' });
	const publicBlob = Buffer.concat([
		encodeSshString('ssh-rsa'),
		encodeSshMpint(decodeBase64Url(publicJwk.e!)),
		encodeSshMpint(decodeBase64Url(publicJwk.n!)),
	]);

	return {
		publicKey: appendComment(`ssh-rsa ${publicBlob.toString('base64')}`, comment),
		privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
	};
}

function appendComment(publicKey: string, comment: string): string {
	const trimmedComment = comment.trim();
	return trimmedComment ? `${publicKey} ${trimmedComment}` : publicKey;
}

function encodeSshString(value: string): Buffer {
	return encodeSshBuffer(Buffer.from(value, 'ascii'));
}

function encodeSshBuffer(value: Buffer): Buffer {
	const length = Buffer.allocUnsafe(4);
	length.writeUInt32BE(value.length);
	return Buffer.concat([length, value]);
}

function encodeSshMpint(value: Buffer): Buffer {
	const normalized = value[0] !== undefined && (value[0] & 0x80) !== 0
		? Buffer.concat([Buffer.from([0]), value])
		: value;
	return encodeSshBuffer(normalized);
}

function decodeBase64Url(value: string): Buffer {
	return Buffer.from(value, 'base64url');
}