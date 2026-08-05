import {
	Activity, FolderOpen, LoaderCircle, Pause, Play, Plus, RefreshCw, Rocket, Save, Trash2, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { vscode } from './vscodeApi';

type LaunchAgentState = 'running' | 'loaded' | 'unloaded' | 'error';

interface LaunchAgentConfig {
	fileName?: string;
	label: string;
	program: string;
	programArguments: string[];
	workingDirectory: string;
	environmentVariables: Record<string, string>;
	keepAlive: boolean;
	runAtLoad: boolean;
	throttleInterval: number;
	standardOutPath: string;
	standardErrorPath: string;
	extra: Record<string, unknown>;
}

interface LaunchAgent extends LaunchAgentConfig {
	fileName: string;
	state: LaunchAgentState;
	pid?: number;
	lastExitCode?: number;
	error?: string;
}

interface LaunchAgentDetails {
	label: string;
	state: LaunchAgentState;
	pid?: number;
	lastExitCode?: number;
	runs?: number;
	activeCount?: number;
	program?: string;
	workingDirectory?: string;
	standardOutPath?: string;
	standardErrorPath?: string;
	reason?: string;
	raw: string;
}

type ExtensionMessage =
	| { type: 'launchdAgents'; agents: LaunchAgent[]; message?: string }
	| { type: 'launchdDetails'; details: LaunchAgentDetails }
	| { type: 'launchdError'; message: string };

const blankConfig: LaunchAgentConfig = {
	label: '',
	program: '/bin/zsh',
	programArguments: [],
	workingDirectory: '',
	environmentVariables: {},
	keepAlive: false,
	runAtLoad: false,
	throttleInterval: 10,
	standardOutPath: '',
	standardErrorPath: '',
	extra: {},
};

export function LaunchdApp() {
	const [agents, setAgents] = useState<LaunchAgent[]>([]);
	const [selectedFileName, setSelectedFileName] = useState<string>();
	const [draft, setDraft] = useState<LaunchAgentConfig>({ ...blankConfig });
	const [argumentsText, setArgumentsText] = useState('');
	const [environmentText, setEnvironmentText] = useState('');
	const [busy, setBusy] = useState(true);
	const [notice, setNotice] = useState<string>();
	const [error, setError] = useState<string>();
	const [details, setDetails] = useState<LaunchAgentDetails>();
	const [detailsLoading, setDetailsLoading] = useState(false);

	useEffect(() => {
		const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
			if (event.data.type === 'launchdError') {
				setError(event.data.message);
				setBusy(false);
				setDetailsLoading(false);
				return;
			}
			if (event.data.type === 'launchdDetails') {
				setDetails(event.data.details);
				setDetailsLoading(false);
				return;
			}
			setAgents(event.data.agents);
			setNotice(event.data.message);
			setError(undefined);
			setBusy(false);
		};
		window.addEventListener('message', handleMessage);
		vscode.postMessage({ type: 'ready' });
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	useEffect(() => {
		if (!selectedFileName) {
			return;
		}
		const selected = agents.find(agent => agent.fileName === selectedFileName);
		if (selected) {
			setEditor(selected);
		} else {
			createNew();
		}
	}, [agents, selectedFileName]);

	const setEditor = (config: LaunchAgentConfig) => {
		setDraft({ ...config, environmentVariables: { ...config.environmentVariables }, extra: { ...config.extra } });
		setArgumentsText(config.programArguments.join('\n'));
		setEnvironmentText(Object.entries(config.environmentVariables).map(([key, value]) => `${key}=${value}`).join('\n'));
	};

	const selectAgent = (agent: LaunchAgent) => {
		setSelectedFileName(agent.fileName);
		setEditor(agent);
		setNotice(undefined);
		setError(undefined);
	};

	const createNew = () => {
		setSelectedFileName(undefined);
		setEditor(blankConfig);
		setNotice(undefined);
		setError(undefined);
	};

	const runAction = (message: object) => {
		setBusy(true);
		setNotice(undefined);
		setError(undefined);
		vscode.postMessage(message);
	};

	const save = () => {
		let environmentVariables: Record<string, string>;
		try {
			environmentVariables = parseEnvironment(environmentText);
		} catch (parseError) {
			setError(parseError instanceof Error ? parseError.message : 'Invalid environment variables.');
			return;
		}
		const config = {
			...draft,
			programArguments: argumentsText.split('\n').map(value => value.trim()).filter(Boolean),
			environmentVariables,
		};
		setSelectedFileName(`${config.label.trim()}.plist`);
		runAction({ type: 'save', config });
	};

	const remove = (agent: LaunchAgent) => {
		if (window.confirm(`Delete ${agent.label}? This removes ${agent.fileName} from ~/Library/LaunchAgents.`)) {
			runAction({ type: 'remove', fileName: agent.fileName, label: agent.label });
		}
	};

	const showDetails = (agent: LaunchAgent) => {
		setDetails(undefined);
		setDetailsLoading(true);
		setError(undefined);
		vscode.postMessage({ type: 'details', label: agent.label });
	};

	const update = <Key extends keyof LaunchAgentConfig>(key: Key, value: LaunchAgentConfig[Key]) => {
		setDraft(current => ({ ...current, [key]: value }));
	};

	return (
		<main className="launchd-app">
		<header className="page-header">
			<div className="heading">
				<div className="title-icon"><Rocket size={22} aria-hidden="true" /></div>
				<div><h1>LaunchAgents</h1><p>Manage per-user background services in ~/Library/LaunchAgents.</p></div>
			</div>
			<div className="header-actions">
				<button className="icon-button" type="button" title="Open LaunchAgents folder" aria-label="Open LaunchAgents folder" onClick={() => vscode.postMessage({ type: 'openDirectory' })}><FolderOpen size={17} /></button>
				<button className="icon-button" type="button" title="Refresh status" aria-label="Refresh status" disabled={busy} onClick={() => runAction({ type: 'refresh' })}><RefreshCw className={busy ? 'spin' : ''} size={17} /></button>
				<button className="primary-button" type="button" onClick={createNew}><Plus size={16} />New agent</button>
			</div>
		</header>

		{error && <div className="message error-message" role="alert">{error}</div>}
		{notice && <div className="message success-message" role="status">{notice}</div>}

		<div className="launchd-workspace">
			<aside className="agent-list" aria-label="LaunchAgents">
				<div className="list-heading"><span>Agents</span><span className="count">{agents.length}</span></div>
				{busy && agents.length === 0 ? (
					<div className="empty-state"><LoaderCircle className="spin" size={22} /><span>Scanning LaunchAgents</span></div>
				) : agents.length === 0 ? (
					<div className="empty-state"><Rocket size={22} /><span>No LaunchAgents found</span></div>
				) : agents.map(agent => (
					<article key={agent.fileName} className={`agent-row ${selectedFileName === agent.fileName ? 'selected' : ''}`} onClick={() => selectAgent(agent)}>
						<div className="agent-summary">
							<span className={`status-dot ${agent.state}`} title={statusLabel(agent)} />
							<div><strong>{agent.label}</strong><small>{statusLabel(agent)}</small></div>
						</div>
						<div className="row-actions">
							<button type="button" title="Runtime details" aria-label={`View runtime details for ${agent.label}`} disabled={detailsLoading || agent.state === 'error'} onClick={event => { event.stopPropagation(); showDetails(agent); }}><Activity size={14} /></button>
							{agent.state === 'running' || agent.state === 'loaded' ? (
								<button type="button" title="Stop" aria-label={`Stop ${agent.label}`} disabled={busy} onClick={event => { event.stopPropagation(); runAction({ type: 'stop', label: agent.label }); }}><Pause size={14} /></button>
							) : (
								<button type="button" title="Start" aria-label={`Start ${agent.label}`} disabled={busy || agent.state === 'error'} onClick={event => { event.stopPropagation(); runAction({ type: 'start', fileName: agent.fileName, label: agent.label }); }}><Play size={14} /></button>
							)}
							<button type="button" className="danger-action" title="Delete" aria-label={`Delete ${agent.label}`} disabled={busy} onClick={event => { event.stopPropagation(); remove(agent); }}><Trash2 size={14} /></button>
						</div>
					</article>
				))}
			</aside>

			<section className="editor" aria-label="LaunchAgent configuration">
				<div className="editor-heading">
					<div><span className="eyebrow">{draft.fileName ? 'Edit agent' : 'New agent'}</span><h2>{draft.label || 'Untitled LaunchAgent'}</h2></div>
					<button className="primary-button" type="button" disabled={busy} onClick={save}>{busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}Save</button>
				</div>

				<div className="form-grid">
					<label className="span-2"><span>Label</span><input value={draft.label} onChange={event => update('label', event.target.value)} placeholder="com.example.worker" spellCheck={false} /></label>
					<label className="span-2"><span>Program</span><input value={draft.program} onChange={event => update('program', event.target.value)} placeholder="/usr/local/bin/node" spellCheck={false} /></label>
					<label className="span-2"><span>Program arguments <small>one per line</small></span><textarea value={argumentsText} onChange={event => setArgumentsText(event.target.value)} placeholder={'/path/to/script.js\n--production'} spellCheck={false} /></label>
					<label className="span-2"><span>Working directory</span><input value={draft.workingDirectory} onChange={event => update('workingDirectory', event.target.value)} placeholder="/Users/me/project" spellCheck={false} /></label>

					<div className="toggle-field">
						<div><strong>Run at load</strong><small>Start immediately after loading</small></div>
						<input type="checkbox" role="switch" checked={draft.runAtLoad} onChange={event => update('runAtLoad', event.target.checked)} />
					</div>
					<div className="toggle-field">
						<div><strong>Keep alive</strong><small>Restart after the process exits</small></div>
						<input type="checkbox" role="switch" checked={draft.keepAlive} onChange={event => update('keepAlive', event.target.checked)} />
					</div>

					<label><span>Throttle interval <small>seconds</small></span><input type="number" min="0" step="1" value={draft.throttleInterval} onChange={event => update('throttleInterval', Number(event.target.value))} /></label>
					<div />
					<label className="span-2"><span>Environment variables <small>KEY=value, one per line</small></span><textarea value={environmentText} onChange={event => setEnvironmentText(event.target.value)} placeholder={'NODE_ENV=production\nPORT=3000'} spellCheck={false} /></label>
					<label><span>Standard output path</span><input value={draft.standardOutPath} onChange={event => update('standardOutPath', event.target.value)} placeholder="/tmp/worker.log" spellCheck={false} /></label>
					<label><span>Standard error path</span><input value={draft.standardErrorPath} onChange={event => update('standardErrorPath', event.target.value)} placeholder="/tmp/worker.error.log" spellCheck={false} /></label>
				</div>
			</section>
		</div>

		{(detailsLoading || details) && (
			<div className="details-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) { setDetails(undefined); setDetailsLoading(false); } }}>
				<section className="details-panel" role="dialog" aria-modal="true" aria-label="LaunchAgent runtime details">
					<div className="details-heading">
						<div><span className="eyebrow">Runtime details</span><h2>{details?.label || 'Loading'}</h2></div>
						<button className="icon-button" type="button" title="Close" aria-label="Close runtime details" onClick={() => { setDetails(undefined); setDetailsLoading(false); }}><X size={17} /></button>
					</div>
					{detailsLoading ? (
						<div className="details-loading"><LoaderCircle className="spin" size={22} /><span>Reading launchctl state</span></div>
					) : details && (
						<div className="details-content">
							<div className="detail-status"><span className={`status-dot ${details.state}`} /><strong>{stateText(details.state)}</strong></div>
							<dl className="detail-grid">
								<Detail label="PID" value={details.pid} />
								<Detail label="Active count" value={details.activeCount} />
								<Detail label="Runs" value={details.runs} />
								<Detail label="Last exit code" value={details.lastExitCode} />
								<Detail label="Program" value={details.program} wide />
								<Detail label="Working directory" value={details.workingDirectory} wide />
								<Detail label="Standard output" value={details.standardOutPath} wide />
								<Detail label="Standard error" value={details.standardErrorPath} wide />
								<Detail label="Termination reason" value={details.reason} wide />
							</dl>
							<div className="raw-details"><h3>launchctl print</h3><pre>{details.raw}</pre></div>
						</div>
					)}
				</section>
			</div>
		)}
	</main>
	);
}

function Detail({ label, value, wide = false }: { label: string; value?: string | number; wide?: boolean }) {
	if (value === undefined || value === '') {
		return null;
	}
	return <div className={wide ? 'wide' : undefined}><dt>{label}</dt><dd>{value}</dd></div>;
}

function stateText(state: LaunchAgentState): string {
	if (state === 'running') {
		return 'Running';
	}
	if (state === 'loaded') {
		return 'Loaded, not running';
	}
	if (state === 'error') {
		return 'Invalid configuration';
	}
	return 'Not loaded';
}

function statusLabel(agent: LaunchAgent): string {
	if (agent.state === 'running') {
		return agent.pid ? `Running · PID ${agent.pid}` : 'Running';
	}
	if (agent.state === 'loaded') {
		return agent.lastExitCode === undefined ? 'Loaded' : `Loaded · Exit ${agent.lastExitCode}`;
	}
	if (agent.state === 'error') {
		return agent.error || 'Invalid plist';
	}
	return 'Not loaded';
}

function parseEnvironment(value: string): Record<string, string> {
	const entries = value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
		const separator = line.indexOf('=');
		if (separator <= 0) {
			throw new Error(`Environment variable must use KEY=value: ${line}`);
		}
		return [line.slice(0, separator).trim(), line.slice(separator + 1)] as const;
	});
	return Object.fromEntries(entries);
}