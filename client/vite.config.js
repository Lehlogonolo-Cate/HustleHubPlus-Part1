import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const certDir = path.resolve(dirname, '..', 'api', 'certs');
const keyFile = path.join(certDir, 'localhost-key.pem');
const certFile = path.join(certDir, 'localhost-cert.pem');

// Reuse the API's local certificate so the dev server also runs on HTTPS
const https =
  fs.existsSync(keyFile) && fs.existsSync(certFile)
    ? { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }
    : undefined;

// Same policy nginx sends in production, applied to `npm run preview`
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https,
    // The browser only talks to the Vite server; API calls are forwarded to the backend
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://localhost:4000',
        changeOrigin: true,
        // The local API uses a self-signed certificate
        secure: false
      }
    }
  },
  preview: {
    port: 4173,
    https,
    headers: { 'Content-Security-Policy': contentSecurityPolicy }
  },
  build: {
    sourcemap: false
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    coverage: {
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**']
    }
  }
});
