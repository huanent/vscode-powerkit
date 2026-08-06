import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { JwtApp } from '../features/jwt/JwtApp';
import '../styles.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<JwtApp />
	</StrictMode>,
);