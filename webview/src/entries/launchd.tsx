import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LaunchdApp } from '../features/launchd/LaunchdApp';
import '../styles.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<LaunchdApp />
	</StrictMode>,
);