// Drawn SVG scenes and portraits. When a matching AI image is listed in
// /art/manifest.json (e.g. "gate.jpg"), the app shows that image instead.

const W = 400;
const H = 225;

const wyrm = (x, y, s, fill, flip = false) => `
  <g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})" fill="${fill}">
    <path d="M0 0 C20 -8 40 -8 60 0 C70 -20 95 -34 120 -30 C100 -20 88 -8 84 4 C100 0 118 6 130 16 C108 14 92 16 80 12 C70 16 58 16 50 12 C38 18 20 18 8 10 C4 8 -4 4 -12 6 Z"/>
    <path d="M60 0 C50 -30 30 -44 10 -48 C24 -32 34 -18 40 -4 Z" opacity=".85"/>
  </g>`;

const stars = (n, seed = 7) => {
  let out = '';
  let r = seed;
  for (let i = 0; i < n; i++) {
    r = (r * 9301 + 49297) % 233280;
    const x = (r / 233280) * W;
    r = (r * 9301 + 49297) % 233280;
    const y = (r / 233280) * H * 0.5;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(i % 3) * 0.4 + 0.4}" fill="#e9e3d6" opacity="${0.3 + (i % 4) * 0.15}"/>`;
  }
  return out;
};

const sky = (id, top, bottom) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;

const waves = (y, color, opacity = 1) =>
  `<path d="M0 ${y} Q25 ${y - 5} 50 ${y} T100 ${y} T150 ${y} T200 ${y} T250 ${y} T300 ${y} T350 ${y} T400 ${y} V${H} H0 Z" fill="${color}" opacity="${opacity}"/>`;

const windows = (pts) => pts.map(([x, y]) => `<rect x="${x}" y="${y}" width="3" height="5" fill="#f0a35c" opacity=".9"/>`).join('');

const SCENES = {
  gate: () => `${sky('g1', '#1a2433', '#3b2b2a')}${stars(40)}
    <circle cx="320" cy="50" r="18" fill="#f3d9b0" opacity=".85"/>
    <path d="M150 225 L170 60 L200 40 L215 20 L230 45 L260 55 L285 225 Z" fill="#0f141b"/>
    <path d="M205 20 L215 0 L225 20 Z" fill="#0f141b"/>
    ${windows([[190, 70], [205, 60], [220, 72], [235, 90], [200, 100], [245, 120], [185, 130], [215, 140], [230, 160], [200, 175], [250, 180], [175, 190]])}
    <path d="M150 225 L165 200 L175 210 L190 185 L200 200 L210 180 L225 195 L240 175 L250 200 L262 190 L285 225 Z" fill="none" stroke="#c8a676" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>
    ${wyrm(70, 60, 0.45, '#0b0f14')}${wyrm(300, 95, 0.3, '#0b0f14', true)}
    ${waves(205, '#16222d')}${waves(215, '#0e161e')}`,

  drowning: () => `${sky('g2', '#5b6b76', '#9aa6a8')}
    <path d="M0 0 H150 L140 60 L160 120 L130 225 H0 Z" fill="#1c2329"/>
    <ellipse cx="120" cy="190" rx="16" ry="20" fill="#05080b"/><ellipse cx="80" cy="200" rx="12" ry="16" fill="#05080b"/><ellipse cx="40" cy="195" rx="14" ry="22" fill="#05080b"/>
    <line x1="120" y1="0" x2="120" y2="170" stroke="#c9b28f" stroke-width="1.2"/><line x1="80" y1="0" x2="82" y2="184" stroke="#c9b28f" stroke-width="1.2"/>
    <circle cx="120" cy="120" r="3" fill="#2a2a2a"/><circle cx="81" cy="150" r="3" fill="#2a2a2a"/>
    <path d="M150 215 C200 205 250 210 300 208 C340 206 380 200 400 196 V225 H150 Z" fill="#2f4550"/>
    <path d="M260 170 C300 150 350 150 400 140 V200 C360 196 320 200 280 196 Z" fill="#e7eef0" opacity=".55"/>
    <path d="M300 180 C330 165 370 160 400 150" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
    <circle cx="40" cy="214" r="4" fill="#6fd0e8" opacity=".8"/>`,

  courtyard: () => `${sky('g3', '#a7aeb0', '#d7d4cc')}
    <rect x="0" y="40" width="400" height="120" fill="#4a4d52"/>
    ${[20, 90, 160, 230, 300, 370].map((x) => `<path d="M${x - 20} 160 V90 A25 25 0 0 1 ${x + 30} 90 V160 Z" fill="#23262b"/>`).join('')}
    <rect x="0" y="160" width="400" height="65" fill="#8a857c"/>
    <ellipse cx="130" cy="192" rx="60" ry="14" fill="none" stroke="#5a1e1a" stroke-width="2" opacity=".7"/>
    <ellipse cx="290" cy="195" rx="55" ry="13" fill="none" stroke="#3a3a3a" stroke-width="2" opacity=".6"/>
    <g fill="#1b1d21"><rect x="112" y="150" width="8" height="34" rx="3"/><circle cx="116" cy="145" r="6"/><rect x="142" y="152" width="8" height="32" rx="3"/><circle cx="146" cy="147" r="6"/>
    <line x1="120" y1="160" x2="140" y2="150" stroke="#d9d9d9" stroke-width="2"/></g>
    <rect x="0" y="0" width="400" height="225" fill="#e8ecee" opacity=".18"/>`,

  archive: () => `${sky('g4', '#140f0b', '#2a1d12')}
    ${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="200" cy="${230 - i * 38}" rx="${190 - i * 22}" ry="${26 - i * 2}" fill="none" stroke="#5a3d22" stroke-width="10" opacity="${0.9 - i * 0.12}"/>`).join('')}
    ${Array.from({ length: 40 }, (_, i) => `<rect x="${20 + ((i * 37) % 360)}" y="${150 - ((i * 23) % 120)}" width="4" height="12" fill="${['#7a2f2a', '#2f5a4a', '#b08a4a', '#3a4a6a'][i % 4]}" opacity=".7"/>`).join('')}
    <radialGradient id="lamp"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
    <circle cx="200" cy="180" r="80" fill="url(#lamp)"/>
    <rect x="160" y="190" width="80" height="8" fill="#3a2715"/><rect x="194" y="170" width="12" height="20" fill="#f7c46a"/>`,

  roost: () => `${sky('g5', '#070a0f', '#111a22')}
    <path d="M0 0 H400 V225 H0 Z M60 225 C60 120 120 40 200 40 C280 40 340 120 340 225 Z" fill="#0a0d12" fill-rule="evenodd"/>
    ${stars(25, 3)}
    <circle cx="270" cy="85" r="14" fill="#dfe6ea" opacity=".7"/>
    <path d="M60 225 C80 190 140 170 200 175 C260 170 320 190 340 225 Z" fill="#1d2a33"/>
    <path d="M90 210 C110 180 170 175 200 190 C170 196 130 200 90 210 Z" fill="#2c4a4a"/>
    <path d="M210 205 C240 175 300 180 320 215 C290 205 250 205 210 205 Z" fill="#3a3a52"/>
    <circle cx="150" cy="186" r="3" fill="#ff8a3d"/><circle cx="150" cy="186" r="8" fill="#ff8a3d" opacity=".25"/>`,

  claiming: () => `${sky('g6', '#2a0f0c', '#6e2a18')}${stars(20, 11)}
    <circle cx="200" cy="80" r="46" fill="#ff7a3a"/><circle cx="200" cy="80" r="70" fill="#ff7a3a" opacity=".15"/>
    ${wyrm(40, 60, 0.55, '#12070a')}${wyrm(360, 50, 0.5, '#12070a', true)}${wyrm(160, 120, 0.35, '#12070a')}
    <path d="M0 180 L400 170 V225 H0 Z" fill="#12090a"/>
    ${Array.from({ length: 18 }, (_, i) => `<rect x="${60 + i * 16}" y="${160 - (i % 2) * 2}" width="5" height="14" rx="2" fill="#0a0506"/><circle cx="${62.5 + i * 16}" cy="${156 - (i % 2) * 2}" r="3" fill="#0a0506"/>`).join('')}`,

  sea: () => `${sky('g7', '#05080d', '#0d1a24')}${stars(50, 5)}
    <circle cx="80" cy="45" r="12" fill="#d8e2e8" opacity=".6"/>
    ${waves(140, '#0f2330')}
    <ellipse cx="260" cy="175" rx="90" ry="18" fill="#cfd8d6" opacity=".12"/>
    ${[60, 130, 200, 330].map((x, i) => `<rect x="${x}" y="${110 - i * 3}" width="8" height="${34 + i * 3}" fill="#9bb" opacity=".7"/><rect x="${x}" y="${110 - i * 3}" width="8" height="${34 + i * 3}" fill="${i === 2 ? '#111' : '#6fd0e8'}" opacity="${i === 2 ? '.8' : '.35'}"/>`).join('')}
    ${waves(165, '#0a1822')}${waves(190, '#07121a')}`,

  varnhollow: () => `${sky('g8', '#0f1420', '#2a2030')}${stars(20, 9)}
    <path d="M0 110 L40 90 L60 100 L90 70 L120 95 L160 80 L200 100 L240 75 L280 95 L320 70 L360 90 L400 80 V160 H0 Z" fill="#141019"/>
    ${windows([[45, 110], [95, 100], [130, 115], [170, 105], [215, 112], [250, 100], [290, 115], [330, 100], [365, 110]])}
    <rect x="0" y="160" width="400" height="12" fill="#3a2a1f"/>
    ${[70, 180, 300].map((x) => `<line x1="${x}" y1="60" x2="${x}" y2="170" stroke="#1a1418" stroke-width="3"/><path d="M${x} 70 L${x + 30} 110 L${x} 110 Z" fill="#241c22"/>`).join('')}
    ${[40, 140, 250, 360].map((x) => `<circle cx="${x}" cy="152" r="3" fill="#ffb760"/><circle cx="${x}" cy="152" r="10" fill="#ffb760" opacity=".2"/>`).join('')}
    ${waves(180, '#101a24')}`,

  infirmary: () => `${sky('g9', '#6b7479', '#b3b8b6')}
    ${[80, 200, 320].map((x) => `<rect x="${x - 6}" y="20" width="12" height="70" fill="#e8ecee" opacity=".7"/>`).join('')}
    <rect x="0" y="150" width="400" height="75" fill="#5a5a58"/>
    ${[40, 150, 260].map((x) => `<rect x="${x}" y="140" width="90" height="16" rx="3" fill="#e0dcd2"/><rect x="${x}" y="156" width="4" height="20" fill="#333"/><rect x="${x + 86}" y="156" width="4" height="20" fill="#333"/>`).join('')}
    ${[60, 90, 340, 360].map((x) => `<rect x="${x}" y="105" width="8" height="14" rx="2" fill="#7fe0a0" opacity=".6"/>`).join('')}`,
};

const PORTRAITS = {
  rhaelle: { skin: '#e9d2c0', hair: '#e6e0cf', coat: '#15161a', accent: '#9aa3ad', hairShape: 'braid' },
  dax: { skin: '#8a5a3c', hair: '#1b1411', coat: '#5a5f63', accent: '#c7b07a', hairShape: 'curls' },
  isolde: { skin: '#f0d6c2', hair: '#9a4a24', coat: '#233a2e', accent: '#d9c27a', hairShape: 'bun', glasses: true },
  corvin: { skin: '#dcc2ae', hair: '#0e0d10', coat: '#0d0e12', accent: '#c9ced6', hairShape: 'fall' },
  holt: { skin: '#cfb39a', hair: '#8d8f92', coat: '#111214', accent: '#b9bec4', hairShape: 'crop' },
  oril: { skin: '#e2c9b3', hair: '#e8e6e1', coat: '#223328', accent: '#c7a45a', hairShape: 'beard' },
};

function hair(p) {
  switch (p.hairShape) {
    case 'braid': return `<path d="M62 52 C62 26 118 26 118 52 L118 66 C112 48 68 48 62 66 Z" fill="${p.hair}"/><path d="M112 60 C124 80 122 110 116 130" stroke="${p.hair}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    case 'curls': return `<g fill="${p.hair}">${[64, 74, 84, 94, 104, 114].map((x) => `<circle cx="${x}" cy="${44 + (x % 3)}" r="9"/>`).join('')}</g>`;
    case 'bun': return `<circle cx="90" cy="30" r="12" fill="${p.hair}"/><line x1="82" y1="22" x2="100" y2="36" stroke="#d9c27a" stroke-width="2"/><path d="M60 58 C60 30 120 30 120 58 C112 46 68 46 60 58 Z" fill="${p.hair}"/><path d="M60 58 C56 70 58 84 62 90" stroke="${p.hair}" stroke-width="5" fill="none"/>`;
    case 'fall': return `<path d="M60 64 C58 28 122 26 120 60 C112 44 98 44 92 52 C86 60 74 56 70 50 C66 58 64 66 60 76 Z" fill="${p.hair}"/>`;
    case 'crop': return `<path d="M62 50 C64 30 116 30 118 50 C110 42 70 42 62 50 Z" fill="${p.hair}"/>`;
    case 'beard': return `<path d="M64 50 C66 32 114 32 116 50 Z" fill="${p.hair}"/><path d="M68 72 C70 110 110 110 112 72 C104 84 76 84 68 72 Z" fill="${p.hair}"/>`;
    default: return '';
  }
}

function person(p) {
  return `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="180" height="180" fill="#101820"/>
    <circle cx="90" cy="90" r="80" fill="${p.accent}" opacity=".08"/>
    <path d="M28 180 C30 130 60 118 90 118 C120 118 150 130 152 180 Z" fill="${p.coat}"/>
    <path d="M78 118 L90 140 L102 118" fill="none" stroke="${p.accent}" stroke-width="2" opacity=".7"/>
    <rect x="82" y="96" width="16" height="24" fill="${p.skin}"/>
    <ellipse cx="90" cy="68" rx="28" ry="34" fill="${p.skin}"/>
    ${hair(p)}
    <circle cx="80" cy="70" r="2.4" fill="#1a1a1a"/><circle cx="100" cy="70" r="2.4" fill="#1a1a1a"/>
    ${p.glasses ? `<g fill="none" stroke="#c7a45a" stroke-width="1.5"><circle cx="80" cy="70" r="7"/><circle cx="100" cy="70" r="7"/><line x1="87" y1="70" x2="93" y2="70"/></g>` : ''}
    ${p === PORTRAITS.corvin ? `<path d="M100 122 L108 128 L104 132 L112 138" stroke="#e8d6c8" stroke-width="1.5" fill="none"/>` : ''}
  </svg>`;
}

function grel() {
  return `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="180" height="180" fill="#0a0f14"/>
    <path d="M0 150 C30 90 70 60 120 58 C150 58 170 70 180 80 V180 H0 Z" fill="#2c3d4a"/>
    <path d="M40 120 C70 90 110 84 150 92" stroke="#1a2530" stroke-width="3" fill="none"/>
    ${[50, 70, 90, 110].map((x) => `<circle cx="${x}" cy="${130 - x / 6}" r="3" fill="#8a9a9a" opacity=".5"/>`).join('')}
    <path d="M110 76 L128 82" stroke="#1a2530" stroke-width="3"/>
    <circle cx="140" cy="84" r="7" fill="#ff8a3d"/><circle cx="140" cy="84" r="16" fill="#ff8a3d" opacity=".25"/>
    <path d="M100 84 C104 80 108 80 112 84" stroke="#6a5a50" stroke-width="3" fill="none"/>
  </svg>`;
}

export function sceneSvg(key) {
  const draw = SCENES[key] || SCENES.gate;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${key}">${draw()}</svg>`;
}

export function portraitSvg(key) {
  if (key === 'grel') return grel();
  return person(PORTRAITS[key] || PORTRAITS.holt);
}

let manifest = null;
export async function loadManifest() {
  try {
    const r = await fetch('/art/manifest.json');
    manifest = r.ok ? new Set(await r.json()) : new Set();
  } catch {
    manifest = new Set();
  }
}

// Returns markup for a scene or portrait, preferring an AI image if one exists.
export function art(key, kind = 'scene') {
  for (const ext of ['jpg', 'png', 'webp']) {
    const file = `${key}.${ext}`;
    if (manifest && manifest.has(file)) return `<img src="/art/${file}" alt="" loading="lazy">`;
  }
  return kind === 'portrait' ? portraitSvg(key) : sceneSvg(key);
}
