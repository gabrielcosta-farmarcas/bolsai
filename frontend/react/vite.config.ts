import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Dentro do Docker a API se chama `api`; fora dele, use API_PROXY_TARGET=http://localhost:4000.
const target = process.env.API_PROXY_TARGET || 'http://localhost:4000';

// Cabeçalhos de segurança da tela. No desenvolvimento o Vite precisa de scripts e estilos inline
// (recarga automática); no ambiente real, o servidor que entrega a tela deve usar a política sem 'unsafe-inline'.
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    headers: securityHeaders,
    watch: { usePolling: true },
    proxy: {
      '/api': target,
      '/health': target,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
