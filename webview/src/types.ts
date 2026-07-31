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

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';

export type SshKeyType = 'ed25519' | 'rsa2048' | 'rsa4096';

export interface SshKeyPair {
	publicKey: string;
	privateKey: string;
}

export type CryptoExtensionMessage =
	| { type: 'hashed'; algorithm: HashAlgorithm; value: string }
	| { type: 'sshKeyGenerated'; keyPair: SshKeyPair }
	| { type: 'copied'; target: string }
	| { type: 'error'; message: string };