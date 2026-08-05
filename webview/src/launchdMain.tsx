import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LaunchdApp } from './LaunchdApp';
import './launchd.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<LaunchdApp />
	</StrictMode>,
);