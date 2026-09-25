// Assembles dist-artifact/trading-simplified.html: one self-contained page.
import { readFileSync, writeFileSync } from 'node:fs';

const js = readFileSync('dist-artifact/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync('dist-artifact/app.css', 'utf8');
const REACT = 'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js';
const REACT_DOM = 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js';

const html = `<title>Trading Simplified</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>
:root { color-scheme: dark; }
body { background: #07090d; color: #e4e8ee; }
${css}
</style>
<div id="root"></div>
<script src="${REACT}"></script>
<script src="${REACT_DOM}"></script>
<script>${js}</script>
`;
writeFileSync('dist-artifact/trading-simplified.html', html);
console.log(`wrote dist-artifact/trading-simplified.html (${(html.length / 1024).toFixed(1)} KB)`);
