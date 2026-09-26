// Assembles dist-artifact/trading-simplified.html: one self-contained page.
import { readFileSync, writeFileSync } from 'node:fs';

const js = readFileSync('dist-artifact/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync('dist-artifact/app.css', 'utf8');

// #root holds a visible fallback until React replaces it, so a script failure
// never shows as a blank screen.
const html = `<title>Trading Simplified</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700&family=Figtree:wght@400;500;600;700&display=swap">
<style>
.boot { min-height: 60vh; display: grid; place-items: center; padding-inline: 16px; font: 15px/1.5 Figtree, system-ui, sans-serif; color: rgb(var(--ink-3)); text-align: center; }
${css}
</style>
<div id="root"><div class="boot"><p>Loading Trading Simplified…<br>If this message stays, reload the page.</p></div></div>
<script>
window.addEventListener('error', function (e) {
  var root = document.getElementById('root');
  if (root && root.querySelector('.boot')) {
    root.querySelector('.boot').innerHTML = '<p>The prototype could not start.<br>' + String(e.message || 'Unknown error').replace(/[<>&]/g, '') + '</p>';
  }
});
</script>
<script>${js}</script>
`;
writeFileSync('dist-artifact/trading-simplified.html', html);
console.log(`wrote dist-artifact/trading-simplified.html (${(html.length / 1024).toFixed(1)} KB)`);
