import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

document.documentElement.className = 'font-[var(--vscode-font-family)] text-[var(--vscode-foreground)] bg-[var(--vscode-editor-background)] scheme-light dark:scheme-dark';
document.body.className = 'm-0 min-h-screen bg-[linear-gradient(135deg,color-mix(in_srgb,var(--vscode-charts-green)_6%,transparent),transparent_38%),var(--vscode-editor-background)]';

createRoot(document.getElementById('root')!).render(
	<App />,
);