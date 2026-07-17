import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      target: 'es2022',
      // Manual chunks: split heavy vendor libraries for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Chart library (~200KB) — loads only when Analytics/Research panels are visited
            'vendor-recharts': ['recharts'],
            // AWS SDK (~400KB) — loads only when file management is used
            'vendor-aws': ['@aws-sdk/client-s3'],
            // Google Gemini AI SDK — loads with any AI-powered panel
            'vendor-genai': ['@google/genai'],
            // React ecosystem core
            'vendor-react': ['react', 'react-dom'],
            // Animation library
            'vendor-motion': ['motion'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['server/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test-setup.ts'],
    },
    // Stress tests run separately with node environment (no jsdom needed)
    // Usage: npx vitest run --config vite.stress.config.ts stress-tests/stress-01.mjs
  };
});