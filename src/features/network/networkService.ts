import { isIP } from 'node:net';
import { getServers } from 'node:dns';
import { arch, hostname, networkInterfaces, platform, release } from 'node:os';

export interface NetworkAddress {
	name: string;
	address: string;
	family: 'IPv4' | 'IPv6';
}

export interface NetworkSnapshot {
	publicIp: string;
	publicIpVersion: 'IPv4' | 'IPv6';
	hostname: string;
	operatingSystem: string;
	dnsServers: string[];
	localAddresses: NetworkAddress[];
	checkedAt: string;
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

export async function getNetworkSnapshot(): Promise<NetworkSnapshot> {
	const publicIp = await getPublicIp();
	const ipVersion = isIP(publicIp);

	return {
		publicIp,
		publicIpVersion: ipVersion === 6 ? 'IPv6' : 'IPv4',
		hostname: hostname(),
		operatingSystem: `${platform()} ${release()} (${arch()})`,
		dnsServers: getServers(),
		localAddresses: getLocalAddresses(),
		checkedAt: new Date().toISOString(),
	};
}

function getLocalAddresses(): NetworkAddress[] {
	return Object.entries(networkInterfaces()).flatMap(([name, addresses]) =>
		(addresses ?? [])
			.filter(address => !address.internal)
			.map(address => ({
				name,
				address: address.address,
				family: address.family,
			})),
	);
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