// Single-file build for hosting as a claude.ai Artifact: React loads from cdnjs
// as UMD globals; app code and CSS are inlined by scripts/build-artifact.js.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^react\/jsx-runtime$/, replacement: fileURLToPath(new URL('./scripts/jsx-runtime-shim.js', import.meta.url)) }],
  },
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: 'src/main.jsx',
      external: ['react', 'react-dom/client'],
      output: {
        format: 'iife',
        entryFileNames: 'app.js',
        assetFileNames: 'app[extname]',
        globals: { react: 'React', 'react-dom/client': 'ReactDOM' },
      },
    },
  },
});
