import { createHash, createHmac, generateKeyPairSync, timingSafeEqual } from 'node:crypto';

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';
export type SshKeyType = 'ed25519' | 'rsa2048' | 'rsa4096';

export interface SshKeyPair {
	publicKey: string;
	privateKey: string;
}

export interface DecodedJwt {
	header: string;
	payload: string;
	signatureValid?: boolean;
}

export function hashText(value: string, algorithm: HashAlgorithm): string {
	return createHash(algorithm).update(value, 'utf8').digest('hex');
}

export function encodeJwt(payloadText: string, secret: string): string {
	if (!secret) {
		throw new Error('JWT secret is required.');
	}

	const payload = parseJsonObject(payloadText, 'JWT payload');
	const header = { alg: 'HS256', typ: 'JWT' };
	const encodedHeader = encodeBase64UrlJson(header);
	const encodedPayload = encodeBase64UrlJson(payload);
	const signingInput = `${encodedHeader}.${encodedPayload}`;
	const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');
	return `${signingInput}.${signature}`;
}

export function decodeJwt(token: string, secret: string): DecodedJwt {
	const parts = token.trim().split('.');
	if (parts.length !== 3 || parts.some(part => !part)) {
		throw new Error('JWT must contain three non-empty segments.');
	}

	const [encodedHeader, encodedPayload, signature] = parts;
	const header = parseJwtSegment(encodedHeader, 'header');
	const payload = parseJwtSegment(encodedPayload, 'payload');
	let signatureValid: boolean | undefined;

	if (secret) {
		if (header.alg !== 'HS256') {
			throw new Error('Signature verification supports HS256 tokens only.');
		}

		const expectedSignature = createHmac('sha256', secret)
			.update(`${encodedHeader}.${encodedPayload}`)
			.digest();
		const actualSignature = Buffer.from(signature, 'base64url');
		signatureValid = actualSignature.length === expectedSignature.length
			&& timingSafeEqual(actualSignature, expectedSignature);
	}

	return {
		header: JSON.stringify(header, null, 2),
		payload: JSON.stringify(payload, null, 2),
		signatureValid,
	};
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

function encodeBase64UrlJson(value: object): string {
	return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function parseJsonObject(value: string, label: string): Record<string, unknown> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw new Error(`${label} must be valid JSON.`);
	}

	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${label} must be a JSON object.`);
	}
	return parsed as Record<string, unknown>;
}

function parseJwtSegment(value: string, label: string): Record<string, unknown> {
	try {
		return parseJsonObject(Buffer.from(value, 'base64url').toString('utf8'), `JWT ${label}`);
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(`JWT ${label}`)) {
			throw error;
		}
		throw new Error(`JWT ${label} is not valid Base64URL JSON.`);
	}
}