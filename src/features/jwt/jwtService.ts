import { createHmac, timingSafeEqual } from 'node:crypto';

export interface DecodedJwt {
	header: string;
	payload: string;
	signatureValid?: boolean;
}

export function encodeJwt(payloadText: string, secret: string): string {
	if (!secret) {
		throw new Error('JWT secret is required.');
	}

	const payload = parseJsonObject(payloadText, 'JWT payload');
	const encodedHeader = encodeBase64UrlJson({ alg: 'HS256', typ: 'JWT' });
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

function encodeBase64UrlJson(value: object): string {
	return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function parseJwtSegment(value: string, label: string): Record<string, unknown> {
	let decoded: string;
	try {
		decoded = Buffer.from(value, 'base64url').toString('utf8');
	} catch {
		throw new Error(`JWT ${label} is not valid Base64URL JSON.`);
	}
	return parseJsonObject(decoded, `JWT ${label}`);
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