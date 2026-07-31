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

export type ExtensionMessage =
	| { type: 'loading' }
	| { type: 'loaded'; snapshot: NetworkSnapshot }
	| { type: 'error'; message: string }
	| { type: 'copied' };