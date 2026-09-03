import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
        root: 'webview',
        base: './',
        plugins: [react(), tailwindcss()],
        build: {
                outDir: '../media',
                emptyOutDir: true,
                rollupOptions: {
                        input: {
                                launchd: 'webview/src/features/launchd/main.tsx',
                                chat: 'webview/src/features/chat/main.tsx',
                                explorer: 'webview/src/features/explorer/main/main.tsx',
                                archive: 'webview/src/features/explorer/previews/archive/main.tsx',
                                sqlite: 'webview/src/features/explorer/previews/sqlite/main.tsx',
                                spreadsheet: 'webview/src/features/explorer/previews/excel/main.tsx',
                        },
                        output: {
                                entryFileNames: '[name].js',
                                assetFileNames: assetInfo => assetInfo.names?.some(name => name === 'explorer.css')
                                        ? 'explorer.css'
                                        : assetInfo.names?.some(name => name.endsWith('.css'))
                                                ? '[name][extname]'
                                        : 'assets/[name]-[hash][extname]',
                        },
                },
                cssCodeSplit: true,
        },
});
