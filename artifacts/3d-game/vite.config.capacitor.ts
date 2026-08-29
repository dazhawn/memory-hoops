/**
 * Standalone Vite config for Capacitor / mobile builds.
 * Strips out all Replit-specific plugins and env requirements.
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '');
  const apiOrigin = (env.VITE_API_ORIGIN ?? '').trim();

  // A packaged app is served from capacitor://localhost or https://localhost,
  // so relative /api and /ws requests hit the bundle instead of the server.
  // Failing here beats shipping a build where the leaderboard and online play
  // silently do nothing.
  if (!apiOrigin) {
    throw new Error(
      'VITE_API_ORIGIN is required for Capacitor builds.\n' +
        'Set it to the deployed API origin, e.g.\n' +
        '  VITE_API_ORIGIN=https://api.example.com pnpm run build:mobile\n' +
        'or put it in artifacts/3d-game/.env.production.local (see .env.example).',
    );
  }
  if (!/^https?:\/\//.test(apiOrigin)) {
    throw new Error(`VITE_API_ORIGIN must start with http:// or https:// (got "${apiOrigin}").`);
  }
  if (apiOrigin.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(apiOrigin)) {
    // Android sets allowMixedContent: false, so a plain-http API is blocked.
    console.warn(
      `\n[capacitor build] VITE_API_ORIGIN is plain http (${apiOrigin}).\n` +
        'Android blocks mixed content, so this will fail on device. Use https for real builds.\n',
    );
  }

  return {
    base: './', // relative paths so Capacitor can load assets
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
      dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist'),
      emptyOutDir: true,
      // Keep chunks reasonable for mobile WebView
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
            react: ['react', 'react-dom'],
          },
        },
      },
    },
  };
});
