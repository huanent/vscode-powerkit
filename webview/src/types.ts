export interface DecodedJwt {
	header: string;
	payload: string;
	signatureValid?: boolean;
}

export type ExtensionMessage =
	| { type: 'encoded'; requestId: number; token: string }
	| { type: 'decoded'; requestId: number; decoded: DecodedJwt }
	| { type: 'copied'; target: string }
	| { type: 'error'; requestId: number; message: string };