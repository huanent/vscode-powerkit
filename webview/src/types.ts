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

export type NetworkExtensionMessage =
	| { type: 'loading' }
	| { type: 'loaded'; snapshot: NetworkSnapshot }
	| { type: 'error'; message: string }
	| { type: 'copied' };

export type GeneratorKind = 'timestampSeconds' | 'timestampMilliseconds' | 'uuid' | 'password';

export type GeneratorValues = Record<GeneratorKind, string>;

export type GeneratorsExtensionMessage =
	| { type: 'generatedAll'; values: GeneratorValues }
	| { type: 'generated'; kind: GeneratorKind; value: string }
	| { type: 'copied'; kind: GeneratorKind };