// Bundles the game + in-browser mock server into one HTML page for sharing
// as a playable preview. Usage: node preview/build.mjs <out.html>
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const out = process.argv[2] || 'preview/wyrmhold-preview.html';
const js = (await build({ entryPoints: ['preview/entry.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' })).outputFiles[0].text;
const css = readFileSync('public/style.css', 'utf8');
const extra = `
:root { color-scheme: dark; }
.top { top: env(safe-area-inset-top, 0px); }
.pv { position: fixed; left: 12px; bottom: calc(76px + env(safe-area-inset-bottom, 0px)); z-index: 25; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.pv-toggle { background: var(--panel-2); color: var(--muted); border: 1px dashed var(--line); border-radius: 99px; padding: 6px 12px; font-size: .75rem; cursor: pointer; }
.pv-panel { order: -1; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px; width: min(280px, calc(100vw - 24px)); display: grid; gap: 6px; box-shadow: 0 10px 30px #000a; }
.pv-panel[hidden] { display: none; }
.pv-panel p { margin: 0 0 4px; font-size: .78rem; color: var(--muted); }
.pv-panel button { text-align: left; background: var(--panel-2); color: var(--text); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; font-size: .82rem; cursor: pointer; }
.pv-panel button.danger { color: var(--bad); }
button:focus-visible, .choice:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; }
`;
const html = `<title>Wyrmhold</title>
<meta name="theme-color" content="#0c1117">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css}${extra}</style>
<div id="app"><div class="loading">Wyrmhold</div></div>
<div id="toast" role="status" aria-live="polite"></div>
<script>${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
writeFileSync(out, html);
console.log(out, (html.length / 1024).toFixed(1) + ' KB');
