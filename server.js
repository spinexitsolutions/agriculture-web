const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const db = require('./lib/db');
const auth = require('./lib/auth');
const { defaults, PRESETS, SECTION_LABELS } = require('./lib/defaults');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

auth.ensureAdmin();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));

// ---------- helpers ----------
const cache = new Map();
async function cached(key, seconds, fn) {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  const value = await fn();
  cache.set(key, { value, exp: Date.now() + seconds * 1000 });
  return value;
}

function clearCache(prefix) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}

async function fetchJson(url, options = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    if (!res.ok) {
      const err = new Error(`Upstream responded ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function getPath(obj, dotted) {
  if (!dotted) return obj;
  return dotted.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.path}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key) || { n: 0, reset: now + windowMs };
    if (entry.reset < now) { entry.n = 0; entry.reset = now + windowMs; }
    entry.n += 1;
    hits.set(key, entry);
    if (entry.n > max) return res.status(429).json({ error: 'Too many requests, please try again shortly.' });
    next();
  };
}

// Data the public site is allowed to see — never includes secrets.
function publicSite(data) {
  const i = data.integrations;
  return {
    settings: data.settings,
    navigation: data.navigation,
    theme: data.theme,
    sections: data.sections.filter((s) => s.enabled),
    integrations: {
      weather: { enabled: !!i.weather.enabled, city: i.weather.city, units: i.weather.units },
      whatsapp: i.whatsapp.enabled ? { enabled: true, number: i.whatsapp.number, message: i.whatsapp.message } : { enabled: false },
      recaptcha: i.recaptcha.enabled ? { enabled: true, siteKey: i.recaptcha.siteKey } : { enabled: false },
      customApis: i.customApis.filter((a) => a.enabled && a.public).map((a) => ({ id: a.id, name: a.name, display: a.display || {} })),
    },
  };
}

// ---------- weather ----------
const WMO = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'], 71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'],
  75: ['Heavy snow', '❄️'], 80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Violent showers', '⛈️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm & hail', '⛈️'], 99: ['Thunderstorm & hail', '⛈️'],
};

async function getWeather(cfg) {
  const imperial = cfg.units === 'imperial';
  if (cfg.provider === 'openweathermap') {
    if (!cfg.apiKey) throw new Error('OpenWeatherMap API key is missing');
    const q = cfg.lat && cfg.lon ? `lat=${encodeURIComponent(cfg.lat)}&lon=${encodeURIComponent(cfg.lon)}` : `q=${encodeURIComponent(cfg.city)}`;
    const w = await fetchJson(`https://api.openweathermap.org/data/2.5/weather?${q}&units=${imperial ? 'imperial' : 'metric'}&appid=${encodeURIComponent(cfg.apiKey)}`);
    return {
      city: cfg.city || w.name,
      temp: Math.round(w.main.temp),
      humidity: w.main.humidity,
      wind: Math.round(w.wind.speed * (imperial ? 1 : 3.6)),
      condition: w.weather?.[0]?.description || '',
      icon: owmIcon(w.weather?.[0]?.id),
      unit: imperial ? '°F' : '°C',
      windUnit: imperial ? 'mph' : 'km/h',
      daily: [],
    };
  }
  // Open-Meteo: free, no key required.
  const params = new URLSearchParams({
    latitude: cfg.lat, longitude: cfg.lon,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto', forecast_days: '5',
    temperature_unit: imperial ? 'fahrenheit' : 'celsius',
    wind_speed_unit: imperial ? 'mph' : 'kmh',
  });
  const w = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);
  const [condition, icon] = WMO[w.current.weather_code] || ['—', '🌡️'];
  return {
    city: cfg.city,
    temp: Math.round(w.current.temperature_2m),
    humidity: w.current.relative_humidity_2m,
    wind: Math.round(w.current.wind_speed_10m),
    precipitation: w.current.precipitation,
    condition, icon,
    unit: imperial ? '°F' : '°C',
    windUnit: imperial ? 'mph' : 'km/h',
    daily: (w.daily?.time || []).map((date, i) => ({
      date,
      max: Math.round(w.daily.temperature_2m_max[i]),
      min: Math.round(w.daily.temperature_2m_min[i]),
      rain: w.daily.precipitation_probability_max?.[i] ?? null,
      icon: (WMO[w.daily.weather_code[i]] || ['', '🌡️'])[1],
    })),
  };
}

function owmIcon(id = 800) {
  if (id < 300) return '⛈️';
  if (id < 600) return '🌧️';
  if (id < 700) return '🌨️';
  if (id < 800) return '🌫️';
  if (id === 800) return '☀️';
  return id === 801 ? '🌤️' : '☁️';
}

// ---------- custom APIs ----------
function buildApiRequest(api) {
  const fill = (s) => String(s || '').replace(/\{\{\s*apiKey\s*\}\}/g, api.apiKey || '');
  let headers = {};
  if (api.headers) {
    try { headers = JSON.parse(fill(api.headers)); } catch { throw new Error('Headers must be valid JSON'); }
  }
  const method = (api.method || 'GET').toUpperCase();
  const opts = { method, headers: { Accept: 'application/json', ...headers } };
  if (method !== 'GET' && api.body) {
    opts.body = fill(api.body);
    if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) opts.headers['Content-Type'] = 'application/json';
  }
  return { url: fill(api.url), opts };
}

async function runCustomApi(api) {
  if (!/^https?:\/\//i.test(api.url || '')) throw new Error('URL must start with http:// or https://');
  const { url, opts } = buildApiRequest(api);
  const raw = await fetchJson(url, opts);
  return getPath(raw, api.display?.path);
}

// ---------- public API ----------
app.get('/api/site', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(publicSite(db.get()));
});

app.get('/api/weather', async (req, res) => {
  const cfg = db.get().integrations.weather;
  if (!cfg.enabled) return res.status(404).json({ error: 'Weather integration disabled' });
  try {
    res.json(await cached(`weather:${JSON.stringify(cfg)}`, 600, () => getWeather(cfg)));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get('/api/custom/:id', async (req, res) => {
  const api = db.get().integrations.customApis.find((a) => a.id === req.params.id && a.enabled && a.public);
  if (!api) return res.status(404).json({ error: 'Not found' });
  try {
    const data = await cached(`custom:${api.id}`, Math.max(10, Number(api.cacheSeconds) || 300), () => runCustomApi(api));
    res.json({ name: api.name, data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.post('/api/contact', rateLimit(5, 10 * 60 * 1000), async (req, res) => {
  const { name = '', email = '', phone = '', subject = '', message = '', website = '' } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot
  if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email) || !message.trim()) {
    return res.status(400).json({ error: 'Please provide your name, a valid email and a message.' });
  }
  const integrations = db.get().integrations;
  if (integrations.recaptcha.enabled && integrations.recaptcha.secretKey) {
    try {
      const v = await fetchJson('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: integrations.recaptcha.secretKey, response: req.body.token || '' }),
      });
      if (!v.success) return res.status(400).json({ error: 'Captcha verification failed.' });
    } catch {
      return res.status(502).json({ error: 'Captcha verification unavailable.' });
    }
  }
  const entry = {
    id: crypto.randomUUID(),
    name: name.slice(0, 120), email: email.slice(0, 160), phone: String(phone).slice(0, 40),
    subject: String(subject).slice(0, 160), message: message.slice(0, 5000),
    read: false, createdAt: new Date().toISOString(),
  };
  db.update((d) => d.messages.unshift(entry));
  sendWebhook('contact.created', entry);
  res.json({ ok: true });
});

app.post('/api/subscribe', rateLimit(5, 10 * 60 * 1000), (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email.' });
  let added = false;
  db.update((d) => {
    if (!d.subscribers.some((s) => s.email === email)) {
      d.subscribers.unshift({ email, createdAt: new Date().toISOString() });
      added = true;
    }
  });
  if (added) sendWebhook('subscriber.created', { email });
  res.json({ ok: true });
});

function sendWebhook(event, payload) {
  const hook = db.get().integrations.webhook;
  if (!hook.enabled || !hook.url) return;
  const body = JSON.stringify({ event, payload, sentAt: new Date().toISOString() });
  const headers = { 'Content-Type': 'application/json', 'X-Bhoomi-Event': event };
  if (hook.secret) headers['X-Bhoomi-Signature'] = crypto.createHmac('sha256', hook.secret).update(body).digest('hex');
  fetch(hook.url, { method: 'POST', headers, body }).catch((e) => console.warn('[webhook] failed:', e.message));
}

// ---------- admin API ----------
const admin = express.Router();

admin.post('/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const user = db.get().users.find((u) => u.username === username);
  if (!user || !auth.verifyPassword(password, user)) return res.status(401).json({ error: 'Invalid username or password' });
  auth.setSession(res, user.username);
  res.json({ ok: true, username: user.username, mustChange: !!user.mustChange });
});

admin.post('/logout', (req, res) => {
  auth.clearSession(res);
  res.json({ ok: true });
});

admin.use(auth.requireAuth);

admin.get('/me', (req, res) => res.json({ username: req.user.username, mustChange: !!req.user.mustChange }));

admin.get('/data', (req, res) => {
  const { users, ...rest } = db.get();
  res.json({ ...rest, presets: PRESETS, sectionLabels: SECTION_LABELS, sectionDefaults: defaults().sections });
});

const replaceable = ['settings', 'navigation', 'theme', 'sections', 'integrations'];
admin.put('/:key(settings|navigation|theme|sections|integrations)', (req, res) => {
  const key = req.params.key;
  const value = req.body;
  if (!replaceable.includes(key)) return res.status(400).json({ error: 'Unknown key' });
  const isArray = key === 'navigation' || key === 'sections';
  if (isArray !== Array.isArray(value) || value === null || typeof value !== 'object') {
    return res.status(400).json({ error: `Invalid ${key} payload` });
  }
  if (key === 'sections' && value.some((s) => !s || !s.id || !SECTION_LABELS[s.type])) {
    return res.status(400).json({ error: 'Every section needs an id and a known type' });
  }
  if (key === 'integrations') {
    clearCache('weather:');
    clearCache('custom:');
  }
  db.update((d) => { d[key] = value; });
  res.json({ ok: true });
});

// Messages
admin.patch('/messages/:id', (req, res) => {
  db.update((d) => {
    const m = d.messages.find((x) => x.id === req.params.id);
    if (m) m.read = !!req.body.read;
  });
  res.json({ ok: true });
});
admin.delete('/messages/:id', (req, res) => {
  db.update((d) => { d.messages = d.messages.filter((x) => x.id !== req.params.id); });
  res.json({ ok: true });
});

// Subscribers
admin.delete('/subscribers/:email', (req, res) => {
  db.update((d) => { d.subscribers = d.subscribers.filter((s) => s.email !== req.params.email); });
  res.json({ ok: true });
});
admin.get('/subscribers.csv', (req, res) => {
  const rows = ['email,subscribed_at', ...db.get().subscribers.map((s) => `${s.email},${s.createdAt}`)];
  res.set('Content-Type', 'text/csv').set('Content-Disposition', 'attachment; filename="subscribers.csv"').send(rows.join('\n'));
});

// Media
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|gif|webp|avif|svg\+xml|x-icon|vnd\.microsoft\.icon)$/.test(file.mimetype)),
});

admin.post('/media', upload.array('files', 20), (req, res) => {
  const items = (req.files || []).map((f) => ({
    id: crypto.randomUUID(), url: `/uploads/${f.filename}`, name: f.originalname, size: f.size, type: f.mimetype, createdAt: new Date().toISOString(),
  }));
  if (!items.length) return res.status(400).json({ error: 'No valid image files uploaded' });
  db.update((d) => d.media.unshift(...items));
  res.json({ items });
});

admin.post('/media/url', (req, res) => {
  const { url, name = '', credit = '' } = req.body || {};
  if (!/^https?:\/\//.test(url || '')) return res.status(400).json({ error: 'Invalid URL' });
  const item = { id: crypto.randomUUID(), url, name: name || url.split('?')[0].split('/').pop(), credit, external: true, createdAt: new Date().toISOString() };
  db.update((d) => d.media.unshift(item));
  res.json({ item });
});

admin.delete('/media/:id', (req, res) => {
  let removed;
  db.update((d) => {
    removed = d.media.find((m) => m.id === req.params.id);
    d.media = d.media.filter((m) => m.id !== req.params.id);
  });
  if (removed && removed.url.startsWith('/uploads/')) {
    fs.promises.unlink(path.join(UPLOADS, path.basename(removed.url))).catch(() => {});
  }
  res.json({ ok: true });
});

// Integrations
admin.get('/unsplash', async (req, res) => {
  const cfg = db.get().integrations.unsplash;
  if (!cfg.enabled || !cfg.accessKey) return res.status(400).json({ error: 'Enable Unsplash and add an Access Key in Integrations first.' });
  try {
    const q = encodeURIComponent(req.query.q || 'agriculture');
    const page = Math.max(1, Number(req.query.page) || 1);
    const data = await fetchJson(`https://api.unsplash.com/search/photos?query=${q}&page=${page}&per_page=24&orientation=${req.query.orientation || 'landscape'}`, {
      headers: { Authorization: `Client-ID ${cfg.accessKey}`, 'Accept-Version': 'v1' },
    });
    res.json({
      total: data.total,
      results: data.results.map((p) => ({
        id: p.id, thumb: p.urls.small, url: `${p.urls.raw}&auto=format&fit=crop&w=2000&q=80`,
        alt: p.alt_description || '', author: p.user.name, authorUrl: p.user.links.html, color: p.color,
        download: p.links.download_location,
      })),
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

admin.post('/unsplash/track', async (req, res) => {
  // Unsplash API guidelines ask apps to ping download_location when a photo is used.
  const cfg = db.get().integrations.unsplash;
  if (cfg.accessKey && /^https:\/\/api\.unsplash\.com\//.test(req.body?.download || '')) {
    fetch(req.body.download, { headers: { Authorization: `Client-ID ${cfg.accessKey}` } }).catch(() => {});
  }
  res.json({ ok: true });
});

admin.post('/test/weather', async (req, res) => {
  try {
    res.json({ ok: true, result: await getWeather({ ...db.get().integrations.weather, ...(req.body || {}) }) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

admin.post('/test/api', async (req, res) => {
  try {
    res.json({ ok: true, result: await runCustomApi(req.body || {}) });
  } catch (e) {
    res.status(400).json({ error: e.message, body: e.body });
  }
});

admin.post('/test/webhook', async (req, res) => {
  const hook = { ...db.get().integrations.webhook, ...(req.body || {}) };
  if (!hook.url) return res.status(400).json({ error: 'Webhook URL is required' });
  try {
    const body = JSON.stringify({ event: 'test', payload: { hello: 'from Bhoomi' }, sentAt: new Date().toISOString() });
    const headers = { 'Content-Type': 'application/json', 'X-Bhoomi-Event': 'test' };
    if (hook.secret) headers['X-Bhoomi-Signature'] = crypto.createHmac('sha256', hook.secret).update(body).digest('hex');
    const r = await fetch(hook.url, { method: 'POST', headers, body });
    res.json({ ok: r.ok, status: r.status });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Account
admin.post('/password', (req, res) => {
  const { current = '', next = '', username } = req.body || {};
  if (!auth.verifyPassword(current, req.user)) return res.status(400).json({ error: 'Current password is incorrect' });
  if (next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  const newName = (username || req.user.username).trim();
  db.update((d) => {
    const u = d.users.find((x) => x.username === req.user.username);
    Object.assign(u, auth.hashPassword(next), { mustChange: false, username: newName });
  });
  auth.setSession(res, newName);
  res.json({ ok: true });
});

// Backup
admin.get('/export', (req, res) => {
  const { users, ...rest } = db.get();
  res.set('Content-Disposition', `attachment; filename="bhoomi-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(rest);
});

admin.post('/import', (req, res) => {
  const data = req.body;
  if (!data || !Array.isArray(data.sections) || !data.settings || !data.theme) return res.status(400).json({ error: 'This does not look like a Bhoomi backup file' });
  const users = db.get().users;
  db.replace({ ...data, users });
  clearCache('');
  res.json({ ok: true });
});

admin.post('/reset', (req, res) => {
  const keep = req.body?.keep || [];
  const fresh = defaults();
  const current = db.get();
  const next = { ...fresh, users: current.users };
  for (const k of ['messages', 'subscribers', 'media', 'integrations']) if (keep.includes(k)) next[k] = current[k];
  db.replace(next);
  clearCache('');
  res.json({ ok: true });
});

app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- pages ----------
const { fontUrl } = require('./public/js/fonts.js');

function renderIndex(data) {
  const { settings, theme, integrations } = data;
  const seo = settings.seo;
  const ga = integrations.googleAnalytics;
  const c = theme.colors;
  const vars = Object.entries(c).map(([k, v]) => `--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`).join(';');
  const head = [
    `<title>${escapeHtml(seo.title || settings.siteName)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}">`,
    `<meta name="keywords" content="${escapeHtml(seo.keywords)}">`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}">`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}">`,
    seo.ogImage ? `<meta property="og:image" content="${escapeHtml(seo.ogImage)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="${escapeHtml(c.primary)}">`,
    settings.favicon ? `<link rel="icon" href="${escapeHtml(settings.favicon)}">` : `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    `<link id="font-link" rel="stylesheet" href="${fontUrl([theme.fonts.heading, theme.fonts.body])}">`,
    `<link rel="preconnect" href="https://images.unsplash.com">`,
    `<style id="theme-vars">:root{${vars};--font-heading:'${theme.fonts.heading}';--font-body:'${theme.fonts.body}';--radius:${Number(theme.radius) || 0}px}</style>`,
    ga.enabled && /^G-[A-Z0-9]+$/i.test(ga.measurementId)
      ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga.measurementId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga.measurementId}');</script>`
      : '',
    integrations.recaptcha.enabled && integrations.recaptcha.siteKey
      ? `<script src="https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(integrations.recaptcha.siteKey)}" async defer></script>`
      : '',
    theme.customCss ? `<style id="custom-css">${theme.customCss.replace(/<\/style/gi, '')}</style>` : '',
    integrations.customScripts.head || '',
  ].join('\n    ');
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  return html
    .replace('<!--HEAD-->', head)
    .replace('<!--BODY_END-->', integrations.customScripts.bodyEnd || '');
}

app.get(['/', '/index.html'], (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(renderIndex(db.get()));
});

app.get(['/admin', '/admin/*'], (req, res, next) => {
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(PUBLIC, 'admin', 'index.html'));
});

app.use('/vendor/lenis.min.js', express.static(path.join(ROOT, 'node_modules', 'lenis', 'dist', 'lenis.min.js')));
app.use('/uploads', express.static(UPLOADS, { maxAge: '30d' }));
app.use(express.static(PUBLIC, { index: false, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));

app.use((req, res) => res.status(404).type('html').send(renderIndex(db.get())));

app.listen(PORT, () => {
  console.log(`\n  🌾 Bhoomi is running`);
  console.log(`     Website: http://localhost:${PORT}`);
  console.log(`     Admin:   http://localhost:${PORT}/admin\n`);
});
