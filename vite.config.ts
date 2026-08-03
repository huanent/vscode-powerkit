import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	root: 'webview',
	base: './',
	plugins: [react()],
	build: {
		outDir: '../media',
		emptyOutDir: true,
		rollupOptions: {
			input: 'webview/src/main.tsx',
			output: {
				entryFileNames: 'jwt.js',
				assetFileNames: assetInfo => assetInfo.names?.some(name => name.endsWith('.css'))
					? 'jwt.css'
					: 'assets/[name]-[hash][extname]',
			},
		},
	},
});