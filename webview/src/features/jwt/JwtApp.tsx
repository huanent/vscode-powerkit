import { CircleCheck, CircleX, KeyRound } from 'lucide-react';
import { FieldLabel, PageHeading, TextArea, TextInput } from '../../components/ui';
import { JwtResult } from './components/JwtResult';
import { useJwt } from './hooks/useJwt';

export function JwtApp() {
	const jwt = useJwt();
	return (
		<main className="mx-auto w-[min(880px,calc(100%-40px))] py-8 pb-14 max-[600px]:w-[calc(100%-24px)] max-[600px]:pt-5">
			<PageHeading icon={<KeyRound size={22} aria-hidden="true" />} title="JWT Token" description="Generate HS256 tokens or inspect and verify an existing token." accentClassName="text-(--vscode-charts-yellow)" />

			<div className="mb-4 grid w-65 grid-cols-2 border border-(--vscode-widget-border) max-[600px]:w-full" role="group" aria-label="JWT operation">
				{(['decode', 'generate'] as const).map(mode => (
					<button key={mode} type="button" className={`min-h-8.5 border-0 bg-transparent text-(--vscode-foreground) capitalize first:border-r first:border-(--vscode-widget-border) ${jwt.mode === mode ? 'bg-(--vscode-button-background)! text-(--vscode-button-foreground)!' : ''}`} onClick={() => jwt.setMode(mode)}>{mode}</button>
				))}
			</div>

			<section className="border-t-[3px] border-(--vscode-charts-yellow) bg-(--vscode-sideBar-background) p-5.5 max-[600px]:p-4">
				<label className="block">
					<FieldLabel>{jwt.mode === 'decode' ? 'JWT token' : 'Payload JSON'}</FieldLabel>
					<TextArea className="min-h-45 p-3" value={jwt.mode === 'decode' ? jwt.tokenInput : jwt.payload} onChange={event => jwt.mode === 'decode' ? jwt.setTokenInput(event.target.value) : jwt.setPayload(event.target.value)} placeholder={jwt.mode === 'decode' ? 'eyJhbGciOiJIUzI1NiIs...' : undefined} spellCheck={false} autoFocus />
				</label>
				<label className="mt-4.5 block">
					<FieldLabel hint={jwt.mode === 'decode' ? 'optional, verifies HS256 signature' : 'required for HS256'}>Secret</FieldLabel>
					<TextInput type="password" value={jwt.secret} onChange={event => jwt.setSecret(event.target.value)} placeholder={jwt.mode === 'decode' ? 'Optional' : 'Required'} />
				</label>
			</section>

			{jwt.error && <div className="mt-3.5 border-l-[3px] border-(--vscode-errorForeground) bg-(--vscode-inputValidation-errorBackground) px-3 py-2.5 text-(--vscode-errorForeground)" role="alert">{jwt.error}</div>}
			{jwt.mode === 'generate' && jwt.generatedToken && <div className="mt-4.5"><JwtResult title="JWT" value={jwt.generatedToken} copied={jwt.copiedTarget === 'token'} onCopy={() => jwt.copy('token', jwt.generatedToken)} /></div>}
			{jwt.mode === 'decode' && jwt.decoded && (
				<div className="mt-4.5 grid gap-3.5">
					{jwt.decoded.signatureValid !== undefined && <div className={`flex items-center gap-2 text-xs font-semibold ${jwt.decoded.signatureValid ? 'text-(--vscode-testing-iconPassed)' : 'text-(--vscode-testing-iconFailed)'}`}>{jwt.decoded.signatureValid ? <CircleCheck size={17} /> : <CircleX size={17} />}{jwt.decoded.signatureValid ? 'Signature valid' : 'Signature invalid'}</div>}
					<JwtResult title="Header" value={jwt.decoded.header} copied={jwt.copiedTarget === 'header'} onCopy={() => jwt.copy('header', jwt.decoded!.header)} />
					<JwtResult title="Payload" value={jwt.decoded.payload} copied={jwt.copiedTarget === 'payload'} onCopy={() => jwt.copy('payload', jwt.decoded!.payload)} />
				</div>
			)}
		</main>
	);
}