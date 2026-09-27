// Single-file build for hosting as a claude.ai Artifact. Everything (React
// included) is bundled into one IIFE and inlined by scripts/build-artifact.js,
// so the hosted page has no runtime dependency on any script CDN.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        format: 'iife',
        entryFileNames: 'app.js',
        assetFileNames: 'app[extname]',
      },
    },
  },
});
