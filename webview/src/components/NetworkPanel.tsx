import { FormEvent, useEffect, useState } from 'react';
import { Building2, Check, Clock3, Compass, Copy, Globe2, MapPin, Network, RefreshCw, Search, Server, Waypoints } from 'lucide-react';
import { useNetwork } from '../hooks/useNetwork';

export function NetworkPanel() {
	const { snapshot, error, loading, copied, refresh, lookup, copyPublicIp } = useNetwork();
	const [ip, setIp] = useState('');

	useEffect(() => {
		if (snapshot) {
			setIp(snapshot.publicIp);
		}
	}, [snapshot]);

	function handleLookup(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		lookup(ip);
	}

	return (
		<main className="mx-auto w-[min(920px,calc(100%-48px))] py-7 pb-10 max-[680px]:w-[min(920px,calc(100%-24px))] max-[680px]:pt-[22px]">
			<header className="mb-5 flex items-center justify-between gap-5 max-[680px]:flex-col max-[680px]:items-start">
				<div className="flex items-center gap-3.5">
					<div className="grid size-11 shrink-0 place-items-center border border-[color-mix(in_srgb,var(--vscode-charts-green)_55%,var(--vscode-widget-border))] bg-[color-mix(in_srgb,var(--vscode-charts-green)_12%,transparent)] text-[var(--vscode-charts-green)]"><Network size={22} aria-hidden="true" /></div>
					<div>
						<span className="mb-1 block text-[11px] font-semibold uppercase text-[var(--vscode-descriptionForeground)]">PowerKit</span>
						<h1 className="m-0 text-2xl font-semibold">IP lookup</h1>
						<p className="mt-[5px] text-[13px] text-[var(--vscode-descriptionForeground)]">Location, network ownership, and reverse DNS details.</p>
					</div>
				</div>
				<button className="inline-flex min-h-[34px] cursor-pointer items-center justify-center gap-[7px] border border-[var(--vscode-button-border,transparent)] bg-[var(--vscode-button-secondaryBackground)] px-[13px] text-[var(--vscode-button-secondaryForeground)] hover:not-disabled:bg-[var(--vscode-button-secondaryHoverBackground)] focus-visible:[outline:1px_solid_var(--vscode-focusBorder)] focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-55 max-[680px]:w-full" type="button" onClick={() => ip.trim() ? lookup(ip) : refresh()} disabled={loading}>
					<RefreshCw className={loading ? 'animate-[spin_900ms_linear_infinite]' : undefined} size={15} aria-hidden="true" />
					Refresh
				</button>
			</header>

			<section className="border-t-2 border-t-[var(--vscode-charts-green)] bg-[var(--vscode-sideBar-background)] px-[18px] py-4" aria-live="polite">
				<form onSubmit={handleLookup}>
					<label className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase text-[var(--vscode-descriptionForeground)]" htmlFor="ip-address"><Globe2 size={14} aria-hidden="true" /> IP address</label>
					<div className="grid grid-cols-[minmax(0,1fr)_auto_auto_34px] items-center gap-2 max-[680px]:grid-cols-[minmax(0,1fr)_auto_34px]">
						<input className="h-[34px] w-full border border-[var(--vscode-input-border,transparent)] bg-[var(--vscode-input-background)] px-2.5 font-[var(--vscode-editor-font-family)] text-sm text-[var(--vscode-input-foreground)] outline-none placeholder:text-[var(--vscode-input-placeholderForeground)] focus-visible:[outline:1px_solid_var(--vscode-focusBorder)] focus-visible:outline-offset-2 max-[680px]:col-span-full" id="ip-address" value={ip} onChange={event => setIp(event.target.value)} placeholder="IPv4 or IPv6" spellCheck={false} />
						<span className="border border-[var(--vscode-widget-border)] bg-[var(--vscode-badge-background)] px-[7px] py-[3px] text-[11px] font-semibold text-[var(--vscode-badge-foreground)]">{snapshot?.publicIpVersion ?? 'IP'}</span>
						<button className="inline-flex min-h-[34px] cursor-pointer items-center justify-center gap-[7px] border border-transparent bg-[var(--vscode-button-background)] px-[13px] text-[var(--vscode-button-foreground)] hover:not-disabled:bg-[var(--vscode-button-hoverBackground)] focus-visible:[outline:1px_solid_var(--vscode-focusBorder)] focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-55 max-[680px]:col-start-1" type="submit" disabled={loading || !ip.trim()}><Search size={15} aria-hidden="true" />Lookup</button>
						<button className="grid size-[34px] cursor-pointer place-items-center border border-[var(--vscode-button-border,var(--vscode-widget-border))] bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:not-disabled:bg-[var(--vscode-button-secondaryHoverBackground)] focus-visible:[outline:1px_solid_var(--vscode-focusBorder)] focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-55" type="button" title="Copy IP address" aria-label="Copy IP address" onClick={copyPublicIp} disabled={!snapshot || loading}>
							{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
						</button>
					</div>
				</form>
			</section>

			{error ? <section className="grid gap-[7px] border-l-[3px] border-l-[var(--vscode-errorForeground)] bg-[var(--vscode-inputValidation-errorBackground)] p-[18px] text-[var(--vscode-descriptionForeground)]" role="alert"><strong className="text-[var(--vscode-errorForeground)]">IP information unavailable</strong><span>{error}</span></section> : null}

			<section className="mt-px grid grid-cols-2 gap-px bg-[var(--vscode-widget-border)] max-[680px]:grid-cols-1">
				<Fact icon={<MapPin size={17} />} label="Location" value={joinValues(snapshot?.city, snapshot?.region, snapshot?.country)} loading={loading} />
				<Fact icon={<Compass size={17} />} label="Continent / postal code" value={joinValues(snapshot?.continent, snapshot?.postalCode)} loading={loading} />
				<Fact icon={<Building2 size={17} />} label="ISP" value={snapshot?.isp} loading={loading} />
				<Fact icon={<Waypoints size={17} />} label="Organization / ASN" value={joinValues(snapshot?.organization, snapshot?.asn ? `AS${snapshot.asn}` : undefined)} loading={loading} />
				<Fact icon={<Server size={17} />} label="Reverse DNS" value={snapshot?.reverseHostnames.join(', ') || 'No PTR record'} loading={loading} />
				<Fact icon={<Globe2 size={17} />} label="Network domain" value={snapshot?.domain} loading={loading} />
				<Fact icon={<Compass size={17} />} label="Coordinates / timezone" value={joinValues(snapshot?.coordinates, snapshot?.timezone)} loading={loading} />
				<Fact icon={<Clock3 size={17} />} label="Last checked" value={snapshot ? formatCheckedAt(snapshot.checkedAt) : undefined} loading={loading} />
			</section>
		</main>
	);
}

interface FactProps {
	icon: React.ReactNode;
	label: string;
	value: string | undefined;
	loading: boolean;
}

function Fact({ icon, label, value, loading }: FactProps) {
	return (
		<div className="grid min-h-16 grid-cols-[28px_minmax(0,1fr)] items-center gap-2 bg-[var(--vscode-sideBar-background)] px-3.5 py-[11px]">
			<div className="grid size-7 place-items-center text-[var(--vscode-charts-blue)]">{icon}</div>
			<div>
				<span className="block text-[11px] font-semibold text-[var(--vscode-descriptionForeground)]">{label}</span>
				<strong className="mt-[3px] block [overflow-wrap:anywhere] text-[13px] font-medium">{loading ? 'Loading...' : value ?? 'Unavailable'}</strong>
			</div>
		</div>
	);
}

function joinValues(...values: Array<string | undefined>): string | undefined {
	const available = values.filter(Boolean);
	return available.length ? available.join(' · ') : undefined;
}

function formatCheckedAt(value: string): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'medium',
	}).format(new Date(value));
}