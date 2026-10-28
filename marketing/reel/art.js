// Brand-coloured flat illustrations (SVG) that stand in for photos when they can't be downloaded.
// kind: field | green | greenhouse | produce | sprout | tractor | dusk
function rng(seed) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const hills = (w, h, y, amp, color, r, extra = '') => {
  const pts = [];
  const n = 6;
  for (let i = 0; i <= n; i++) pts.push([(i / n) * w, y + Math.sin(i * 1.3 + r() * 6) * amp]);
  let d = `M0 ${h} L0 ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
    d += ` C${x0 + (x1 - x0) / 2} ${y0}, ${x0 + (x1 - x0) / 2} ${y1}, ${x1} ${y1}`;
  }
  return `<path d="${d} L${w} ${h} Z" fill="${color}" ${extra}/>`;
};

function landscape(w, h, r, pal) {
  const sunX = w * (0.25 + r() * 0.5); const sunY = h * (0.3 + r() * 0.1);
  let rows = '';
  for (let i = 0; i < 26; i++) {
    const y = h * 0.72 + Math.pow(i / 26, 1.8) * h * 0.3;
    rows += `<path d="M${-w * 0.2} ${y} Q${w / 2} ${y - h * 0.03} ${w * 1.2} ${y}" stroke="${pal.row}" stroke-width="${1 + i * 0.35}" fill="none" opacity="${0.25 + i * 0.02}"/>`;
  }
  return `
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.sky[0]}"/><stop offset="1" stop-color="${pal.sky[1]}"/></linearGradient>
      <radialGradient id="glow" cx="${sunX / w}" cy="${sunY / h}" r=".6"><stop offset="0" stop-color="${pal.sun}" stop-opacity=".55"/><stop offset="1" stop-color="${pal.sun}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <rect width="${w}" height="${h}" fill="url(#glow)"/>
    <circle cx="${sunX}" cy="${sunY}" r="${h * 0.07}" fill="${pal.sun}"/>
    ${hills(w, h, h * 0.52, h * 0.04, pal.hill[0], r, 'opacity=".9"')}
    ${hills(w, h, h * 0.6, h * 0.035, pal.hill[1], r)}
    ${hills(w, h, h * 0.7, h * 0.03, pal.hill[2], r)}
    ${rows}`;
}

const PALETTES = {
  field: { sky: ['#f7c873', '#f3e2bd'], sun: '#fff3d1', hill: ['#c9a25a', '#b98b3c', '#a8752a'], row: '#7a531a' },
  green: { sky: ['#bfe3e8', '#eef6ea'], sun: '#ffffff', hill: ['#7fb36a', '#4f9a4f', '#2f7d3e'], row: '#1d5a2b' },
  dusk: { sky: ['#3b2a4a', '#f08a5d'], sun: '#ffd27f', hill: ['#5a3a52', '#40283f', '#2a1a2c'], row: '#120a14' },
};

function svg(kind, w = 1600, h = 1000, seed = kind) {
  const r = rng(seed);
  let body = '';
  if (kind === 'field' || kind === 'green' || kind === 'dusk') body = landscape(w, h, r, PALETTES[kind]);
  else if (kind === 'tractor') {
    body = landscape(w, h, r, PALETTES.green);
    const x = w * 0.55; const y = h * 0.66; const s = h / 1000;
    body += `<g transform="translate(${x} ${y}) scale(${s})" fill="#1d1d1f">
      <rect x="-10" y="-120" width="150" height="70" rx="10" fill="#c0392b"/><rect x="60" y="-190" width="80" height="80" rx="8" fill="#c0392b"/>
      <rect x="72" y="-178" width="56" height="44" rx="4" fill="#bfe3e8"/><circle cx="120" cy="-30" r="55"/><circle cx="120" cy="-30" r="22" fill="#888"/>
      <circle cx="10" cy="-20" r="35"/><circle cx="10" cy="-20" r="13" fill="#888"/><rect x="20" y="-170" width="10" height="55"/></g>`;
  } else if (kind === 'greenhouse') {
    body = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f4ec"/><stop offset="1" stop-color="#cfe6d3"/></linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>`;
    for (let i = -1; i < 7; i++) {
      const x = i * w / 5;
      body += `<path d="M${x} ${h} L${x} ${h * 0.45} Q${x + w / 10} ${h * 0.12} ${x + w / 5} ${h * 0.45} L${x + w / 5} ${h}" fill="none" stroke="#9cc5a6" stroke-width="6"/>`;
    }
    for (let i = 0; i < 9; i++) {
      const y = h * 0.62 + i * h * 0.05;
      for (let j = 0; j < 26; j++) body += `<ellipse cx="${(j / 25) * w + (i % 2) * 20}" cy="${y}" rx="${16 + i * 3}" ry="${10 + i * 2}" fill="${['#3f9a4c', '#2f7d3e', '#5bb35f'][(i + j) % 3]}"/>`;
    }
  } else if (kind === 'produce') {
    const colors = ['#d9442b', '#f39c12', '#7cb342', '#8e44ad', '#e74c3c', '#2e7d32', '#f1c40f', '#c0392b'];
    body = `<rect width="${w}" height="${h}" fill="#efe6d6"/>`;
    for (let i = 0; i < 70; i++) {
      const cx = r() * w; const cy = r() * h; const rad = h * (0.04 + r() * 0.07);
      const c = colors[Math.floor(r() * colors.length)];
      body += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${c}"/><ellipse cx="${cx - rad * 0.3}" cy="${cy - rad * 0.35}" rx="${rad * 0.28}" ry="${rad * 0.16}" fill="#fff" opacity=".35"/>`;
      if (r() > 0.6) body += `<path d="M${cx} ${cy - rad} q ${rad * 0.3} ${-rad * 0.5} ${rad * 0.7} ${-rad * 0.4}" stroke="#2e7d32" stroke-width="${rad * 0.15}" fill="none" stroke-linecap="round"/>`;
    }
  } else if (kind === 'sprout') {
    body = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f3e1"/><stop offset=".62" stop-color="#d8ead0"/><stop offset=".62" stop-color="#6b4a2f"/><stop offset="1" stop-color="#4a3220"/></linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#s)"/>`;
    const cx = w / 2; const base = h * 0.62;
    body += `<path d="M${cx} ${base} C${cx} ${base - h * 0.15}, ${cx + 10} ${base - h * 0.25}, ${cx} ${base - h * 0.3}" stroke="#4f9a4f" stroke-width="${h * 0.02}" fill="none" stroke-linecap="round"/>
      <path d="M${cx} ${base - h * 0.28} C${cx - w * 0.22} ${base - h * 0.5}, ${cx - w * 0.3} ${base - h * 0.2}, ${cx} ${base - h * 0.27} Z" fill="#5bb35f"/>
      <path d="M${cx} ${base - h * 0.29} C${cx + w * 0.2} ${base - h * 0.55}, ${cx + w * 0.3} ${base - h * 0.25}, ${cx} ${base - h * 0.28} Z" fill="#7cc142"/>`;
    for (let i = 0; i < 120; i++) body += `<circle cx="${r() * w}" cy="${base + r() * (h - base)}" r="${2 + r() * 5}" fill="#3a2716" opacity=".5"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}

// Unsplash photo ids used by the site → illustration kind
const MAP = {
  '1500382017468-9049fed747ef': 'field', '1625246333195-78d9c38ad449': 'tractor', '1464226184884-fa280b87c399': 'green',
  '1574943320219-553eb213f72d': 'field', '1523348837708-15d4a09cfac2': 'greenhouse', '1530836369250-ef72a3f5cda8': 'sprout',
  '1500937386664-56d1dfef3854': 'dusk', '1592982537447-7440770cbfc9': 'produce', '1560493676-04071c5f467b': 'green',
  '1542838132-92c53300491e': 'produce', '1488459716781-31db52582fe9': 'produce', '1498837167922-ddd27525d352': 'produce',
  '1444858291040-58f756a3bdd6': 'green', '1416879595882-3373a0480b5b': 'sprout', '1501004318641-b39e6451bec6': 'sprout',
  '1471193945509-9ad0617afabf': 'produce',
};
const kindFor = (url) => { const m = String(url).match(/photo-([\w-]+?)(\?|$)/); return (m && MAP[m[1]]) || 'green'; };

module.exports = { svg, kindFor };
