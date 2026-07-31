import { Check, Clock3, Copy, Globe2, HardDrive, Network, RefreshCw, Router, Server } from 'lucide-react';
import { useNetwork } from '../hooks/useNetwork';

export function NetworkPanel() {
	const { snapshot, error, loading, copied, refresh, copyPublicIp } = useNetwork();

	return (
		<main className="network-panel">
			<header className="page-header">
				<div className="title-group">
					<div className="title-icon"><Network size={22} aria-hidden="true" /></div>
					<div>
						<span className="eyebrow">PowerKit</span>
						<h1>Network overview</h1>
						<p>Current public identity and active local interfaces.</p>
					</div>
				</div>
				<button className="refresh-button" type="button" onClick={refresh} disabled={loading}>
					<RefreshCw className={loading ? 'spinning' : undefined} size={15} aria-hidden="true" />
					Refresh
				</button>
			</header>

			{error ? (
				<section className="error-state" role="alert">
					<strong>Network information unavailable</strong>
					<span>{error}</span>
				</section>
			) : (
				<>
					<section className="public-ip-section" aria-live="polite">
						<div className="public-ip-heading">
							<div>
								<span className="section-label"><Globe2 size={14} aria-hidden="true" /> Public address</span>
								<code className="public-ip">{loading ? 'Checking...' : snapshot?.publicIp ?? 'Unavailable'}</code>
							</div>
							<span className="status-badge">{snapshot?.publicIpVersion ?? 'IP'}</span>
						</div>
						<button className="copy-button" type="button" onClick={copyPublicIp} disabled={!snapshot || loading}>
							{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
							{copied ? 'Copied' : 'Copy address'}
						</button>
					</section>

					<section className="facts-grid">
						<Fact icon={<Server size={17} />} label="Hostname" value={snapshot?.hostname} loading={loading} />
						<Fact icon={<HardDrive size={17} />} label="System" value={snapshot?.operatingSystem} loading={loading} />
						<Fact icon={<Router size={17} />} label="DNS servers" value={snapshot?.dnsServers.join(', ') || 'Not reported'} loading={loading} />
						<Fact icon={<Clock3 size={17} />} label="Last checked" value={snapshot ? formatCheckedAt(snapshot.checkedAt) : undefined} loading={loading} />
					</section>

					<section className="interfaces-section">
						<div className="section-heading">
							<div>
								<span className="eyebrow">Local machine</span>
								<h2>Active interfaces</h2>
							</div>
							<span className="interface-count">{snapshot?.localAddresses.length ?? 0}</span>
						</div>

						<div className="interface-list">
							{loading ? <div className="loading-line">Reading interfaces...</div> : null}
							{!loading && snapshot?.localAddresses.length === 0 ? <div className="empty-state">No active external interfaces found.</div> : null}
							{snapshot?.localAddresses.map(item => (
								<div className="interface-row" key={`${item.name}-${item.address}`}>
									<div className="interface-name"><Network size={15} aria-hidden="true" /><span>{item.name}</span></div>
									<code>{item.address}</code>
									<span className="family-badge">{item.family}</span>
								</div>
							))}
						</div>
					</section>
				</>
			)}
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
		<div className="fact">
			<div className="fact-icon">{icon}</div>
			<div>
				<span>{label}</span>
				<strong>{loading ? 'Loading...' : value ?? 'Unavailable'}</strong>
			</div>
		</div>
	);
}

function formatCheckedAt(value: string): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'medium',
	}).format(new Date(value));
}