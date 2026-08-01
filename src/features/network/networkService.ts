import { isIP } from 'node:net';
import { reverse } from 'node:dns/promises';

export interface NetworkSnapshot {
	publicIp: string;
	publicIpVersion: 'IPv4' | 'IPv6';
	continent: string;
	country: string;
	region: string;
	city: string;
	postalCode: string;
	timezone: string;
	coordinates: string;
	asn: number | undefined;
	organization: string;
	isp: string;
	domain: string;
	reverseHostnames: string[];
	checkedAt: string;
}

interface IpWhoResponse {
	success: boolean;
	message?: string;
	type?: string;
	continent?: string;
	country?: string;
	region?: string;
	city?: string;
	postal?: string;
	latitude?: number;
	longitude?: number;
	timezone?: { id?: string };
	connection?: {
		asn?: number;
		org?: string;
		isp?: string;
		domain?: string;
	};
}

const providers = [
	async (): Promise<string> => {
		const response = await fetch('https://api.ipify.org?format=json', {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(10_000),
		});
		const data = await readJsonResponse(response);
		return data.ip;
	},
	async (): Promise<string> => {
		const response = await fetch('https://ifconfig.me/ip', {
			headers: { Accept: 'text/plain' },
			signal: AbortSignal.timeout(10_000),
		});
		assertSuccessfulResponse(response);
		return (await response.text()).trim();
	},
];

export async function getPublicIp(): Promise<string> {
	for (const provider of providers) {
		try {
			const ip = await provider();
			if (isIP(ip)) {
				return ip;
			}
		} catch {
			continue;
		}
	}

	throw new Error('Unable to retrieve public IP');
}

export async function getNetworkSnapshot(ip?: string): Promise<NetworkSnapshot> {
	const publicIp = ip?.trim() || await getPublicIp();
	const ipVersion = isIP(publicIp);
	if (!ipVersion) {
		throw new Error('Enter a valid IPv4 or IPv6 address');
	}

	const response = await fetch(`https://ipwho.is/${encodeURIComponent(publicIp)}`, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(10_000),
	});
	assertSuccessfulResponse(response);
	const details = await response.json() as IpWhoResponse;
	if (!details.success) {
		throw new Error(details.message || 'Unable to retrieve IP information');
	}

	const reverseHostnames = await reverse(publicIp).catch(() => []);

	return {
		publicIp,
		publicIpVersion: ipVersion === 6 ? 'IPv6' : 'IPv4',
		continent: details.continent || '',
		country: details.country || '',
		region: details.region || '',
		city: details.city || '',
		postalCode: details.postal || '',
		timezone: details.timezone?.id || '',
		coordinates: details.latitude !== undefined && details.longitude !== undefined
			? `${details.latitude}, ${details.longitude}`
			: '',
		asn: details.connection?.asn,
		organization: details.connection?.org || '',
		isp: details.connection?.isp || '',
		domain: details.connection?.domain || '',
		reverseHostnames,
		checkedAt: new Date().toISOString(),
	};
}

async function readJsonResponse(response: Response): Promise<{ ip: string }> {
	assertSuccessfulResponse(response);
	return await response.json() as { ip: string };
}

function assertSuccessfulResponse(response: Response): void {
	if (!response.ok) {
		throw new Error(`IP service returned ${response.status}`);
	}
}