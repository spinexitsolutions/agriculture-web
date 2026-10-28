// Captures the live website (mobile scroll clip + key screens) for the reel.
// Usage: node capture.js [baseUrl]   — set REAL_PHOTOS=1 to keep the real Unsplash photos.
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const { svg, kindFor } = require('./art');

const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = path.join(__dirname, 'assets');
fs.mkdirSync(path.join(OUT, 'scroll'), { recursive: true });

const SAMPLE_MANDI = {
  state: 'Maharashtra', updated: '28/10/2026', districts: ['Nashik', 'Pune', 'Ahmednagar', 'Solapur'],
  records: [
    ['Onion', 'Red', 'Lasalgaon', 'Nashik', 1450, 2310, 2050], ['Tomato', 'Hybrid', 'Pimpalgaon', 'Nashik', 900, 1600, 1300],
    ['Soybean', 'Yellow', 'Latur', 'Latur', 4300, 4720, 4580], ['Wheat', 'Lokwan', 'Pune', 'Pune', 2650, 3100, 2900],
    ['Grapes', 'Thompson', 'Nashik', 'Nashik', 4000, 6500, 5200], ['Pomegranate', 'Bhagwa', 'Solapur', 'Solapur', 6000, 11000, 8500],
    ['Cotton', 'H-4', 'Akola', 'Akola', 6900, 7350, 7150], ['Tur (Arhar)', 'Red', 'Ahmednagar', 'Ahmednagar', 7100, 7600, 7400],
  ].map(([commodity, variety, market, district, min, max, modal]) => ({ state: 'Maharashtra', commodity, variety, market, district, date: '28/10/2026', min, max, modal })),
};
const SAMPLE_WEATHER = { city: 'Nashik', temp: 29, humidity: 54, wind: 11, condition: 'Partly cloudy', icon: '⛅', unit: '°C', windUnit: 'km/h',
  daily: ['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'].map((date, i) => ({ date, max: 30 - (i % 2), min: 18 + (i % 3), icon: ['⛅', '☀️', '☀️', '🌤️', '⛅'][i] })) };

const HIDE = '.fab,.preview-badge{display:none!important} [data-reveal]{opacity:1!important;transform:none!important;transition:none!important} .statement .w{transition:none!important}';

async function prep(ctx) {
  if (!process.env.REAL_PHOTOS) {
    await ctx.route(/images\.unsplash\.com/, (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg(kindFor(route.request().url()), 1600, 1000, route.request().url().split('?')[0]) }));
  }
  await ctx.route(/\/api\/mandi/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAMPLE_MANDI) }));
  await ctx.route(/\/api\/weather/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAMPLE_WEATHER) }));
}

async function shot(page, url, file, { y = 0, wait = 900, before } = {}) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE });
  if (before) await before(page);
  if (y) { await page.evaluate((yy) => window.scrollTo(0, typeof yy === 'string' ? document.querySelector(yy).getBoundingClientRect().top + scrollY - 60 : yy), y); }
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 90 });
  console.log('✓', file);
}

(async () => {
  const browser = await chromium.launch();

  // Admin session + a demo order so the order timeline has something to show.
  const api = await (await browser.newContext()).request;
  await api.post(`${BASE}/api/admin/login`, { data: { username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASSWORD || 'admin123' } });
  const placed = await (await api.post(`${BASE}/api/orders`, { data: { items: [{ id: 'p1', qty: 1 }, { id: 'p2', qty: 1 }], address: { name: 'Ravi Kumar', phone: '9876500000', line1: '12 Market Road', city: 'Nashik', state: 'Maharashtra', pincode: '422001' }, payment: 'cod' } })).json();
  const data = await (await api.get(`${BASE}/api/admin/data`)).json();
  const ord = data.orders.find((o) => o.number === placed.order.number);
  for (const status of ['confirmed', 'packed', 'shipped']) await api.patch(`${BASE}/api/admin/orders/${ord.id}`, { data: { status, note: status === 'shipped' ? 'Out from Nashik hub' : '' } });

  // ---------- mobile ----------
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.4, isMobile: true, hasTouch: true });
  await prep(mctx);
  const m = await mctx.newPage();

  // Scroll clip of the homepage (frames played back inside the phone mockup).
  await m.goto(BASE + '/', { waitUntil: 'networkidle' });
  await m.addStyleTag({ content: HIDE });
  await m.waitForTimeout(1200);
  const FR = 120; const END = 4300;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  for (let i = 0; i < FR; i++) {
    await m.evaluate((y) => window.scrollTo(0, y), Math.round(ease(i / (FR - 1)) * END));
    await m.waitForTimeout(70);
    await m.screenshot({ path: path.join(OUT, 'scroll', `${String(i).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 86 });
  }
  console.log('✓ scroll clip');

  await shot(m, '/products/heirloom-vegetables-box', 'm-product.jpg');
  await shot(m, '/products', 'm-shop.jpg', { y: '[data-grid]' });
  await shot(m, '/cart', 'm-cart.jpg', { before: async (p) => { await p.evaluate(() => { localStorage.setItem('bhoomi:cart', JSON.stringify([{ id: 'p1', qty: 1 }, { id: 'p3', qty: 2 }, { id: 'p6', qty: 1 }])); }); await p.reload({ waitUntil: 'networkidle' }); await p.addStyleTag({ content: HIDE }); } });
  await shot(m, `/order/${ord.number}`, 'm-order.jpg', { before: async (p) => { await p.evaluate((n) => sessionStorage.setItem(`bhoomi:order:${n}`, JSON.stringify({ phone: '9876500000' })), ord.number); await p.goto(`${BASE}/order/${ord.number}`, { waitUntil: 'networkidle' }); await p.addStyleTag({ content: HIDE }); } });
  await shot(m, '/farmers', 'm-farmers.jpg', { y: '#forms' });
  await shot(m, '/mandi', 'm-mandi.jpg', { y: 140 });
  for (const lang of ['hi', 'mr', 'ta']) {
    await shot(m, `/?lang=${lang}`, `m-hero-${lang}.jpg`);
  }
  await shot(m, '/?lang=en', 'm-hero-en.jpg');

  // ---------- desktop ----------
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await prep(dctx);
  const d = await dctx.newPage();
  await shot(d, '/', 'd-home.jpg');
  await shot(d, '/advisory', 'd-advisory.jpg', { y: 150 });
  await shot(d, '/mandi', 'd-mandi.jpg', { y: 120 });
  await d.goto(BASE + '/admin');
  await d.fill('input[name=username]', process.env.ADMIN_USER || 'admin');
  await d.fill('input[name=password]', process.env.ADMIN_PASSWORD || 'admin123');
  await d.click('button[type=submit]');
  await d.waitForTimeout(900);
  for (const [hash, file] of [['dashboard', 'a-dashboard.jpg'], ['orders', 'a-orders.jpg'], ['products', 'a-products.jpg']]) {
    await d.evaluate((h) => { location.hash = `#/${h}`; }, hash);
    await d.waitForTimeout(700);
    if (hash === 'orders') { await d.click('.order-row'); await d.waitForTimeout(300); }
    await d.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 90 });
    console.log('✓', file);
  }
  await d.evaluate(() => { location.hash = '#/theme'; });
  await d.waitForTimeout(500);
  await d.click('text=Live preview');
  await d.waitForTimeout(3000);
  await d.screenshot({ path: path.join(OUT, 'a-theme.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ a-theme.jpg');

  // Big illustrations for full-screen moments in the reel.
  for (const k of ['field', 'green', 'greenhouse', 'produce', 'dusk']) fs.writeFileSync(path.join(OUT, `art-${k}.svg`), svg(k, 1080, 1920, `reel-${k}`));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
