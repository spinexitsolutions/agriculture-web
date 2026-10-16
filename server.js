const express = require('express');
const multer = require('multer');
const compression = require('compression');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const db = require('./lib/db');
const auth = require('./lib/auth');
const shop = require('./lib/shop');
const mandi = require('./lib/mandi');
const { defaults, PRESETS, SECTION_LABELS, COLLECTIONS } = require('./lib/defaults');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

auth.ensureAdmin();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(compression());
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
  const c = data.commerce;
  return {
    settings: data.settings,
    navigation: data.navigation,
    theme: data.theme,
    sections: data.sections.filter((s) => s.enabled),
    products: data.products.filter((p) => p.active),
    posts: data.posts.filter((p) => p.published).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    pages: data.pages,
    team: data.team,
    jobs: data.jobs.filter((j) => j.active),
    crops: data.crops,
    advisories: data.advisories,
    schemes: data.schemes,
    commerce: {
      enabled: !!c.enabled, currencySymbol: c.currencySymbol, deliveryFee: Number(c.deliveryFee) || 0, freeDeliveryAbove: Number(c.freeDeliveryAbove) || 0,
      minOrder: Number(c.minOrder) || 0, cod: !!c.cod, deliveryDays: c.deliveryDays, orderNote: c.orderNote,
      online: !!(i.razorpay.enabled && i.razorpay.keyId && i.razorpay.keySecret),
    },
    integrations: {
      weather: { enabled: !!i.weather.enabled, city: i.weather.city, units: i.weather.units },
      whatsapp: i.whatsapp.enabled ? { enabled: true, number: i.whatsapp.number, message: i.whatsapp.message } : { enabled: false },
      recaptcha: i.recaptcha.enabled ? { enabled: true, siteKey: i.recaptcha.siteKey } : { enabled: false },
      mandi: { enabled: !!(i.mandi.enabled && i.mandi.apiKey), defaultState: i.mandi.defaultState },
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

// ---------- farmer / business requests ----------
const LEAD_TYPES = {
  'farmer-registration': 'Farmer registration',
  'soil-test': 'Soil test booking',
  callback: 'Call-back request',
  'bulk-quote': 'Bulk / B2B quote',
  'job-application': 'Job application',
};

app.post('/api/leads', rateLimit(8, 10 * 60 * 1000), (req, res) => {
  const { type, website, ...fields } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot
  if (!LEAD_TYPES[type]) return res.status(400).json({ error: 'Unknown form.' });
  const clean = {};
  Object.entries(fields).slice(0, 25).forEach(([k, v]) => {
    if (/^[a-zA-Z][\w-]{0,40}$/.test(k) && v != null && typeof v !== 'object') clean[k] = String(v).trim().slice(0, 2000);
  });
  if (!clean.name || !(clean.phone || clean.email)) return res.status(400).json({ error: 'Please add your name and a phone number.' });
  if (clean.phone && !/^[+\d\s-]{10,15}$/.test(clean.phone)) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (clean.email && !/^\S+@\S+\.\S+$/.test(clean.email)) return res.status(400).json({ error: 'Please enter a valid email.' });
  const lead = { id: crypto.randomUUID(), type, label: LEAD_TYPES[type], fields: clean, status: 'new', createdAt: new Date().toISOString() };
  db.update((d) => d.leads.unshift(lead));
  sendWebhook('lead.created', lead);
  res.json({ ok: true });
});

// ---------- mandi prices ----------
app.get('/api/mandi', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=600');
    res.json(await mandi.prices({ state: String(req.query.state || ''), district: String(req.query.district || ''), commodity: String(req.query.commodity || '') }));
  } catch (e) {
    res.status(e.status || 502).json({ error: e.status ? e.message : 'Mandi prices are unavailable right now.' });
  }
});

// ---------- shop ----------
app.post('/api/pincode', (req, res) => res.json(shop.checkPincode(req.body?.pincode)));

app.post('/api/cart/price', (req, res) => {
  try { res.json(shop.priceCart(req.body?.items)); } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/orders', rateLimit(10, 10 * 60 * 1000), async (req, res) => {
  try {
    const result = await shop.createOrder(req.body || {}, auth.currentCustomer(req));
    sendWebhook('order.created', result.order);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/orders/:number/verify', (req, res) => {
  try {
    const order = shop.verifyPayment(req.params.number, req.body || {});
    sendWebhook('order.paid', order);
    res.json({ order });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/orders/track', rateLimit(20, 10 * 60 * 1000), (req, res) => {
  const order = shop.track(req.body?.number, req.body?.phone);
  if (!order) return res.status(404).json({ error: 'No order found with that number and phone.' });
  res.json({ order });
});

// ---------- customer accounts ----------
const publicCustomer = (c) => ({ name: c.name, email: c.email, phone: c.phone, address: c.address || null });

app.post('/api/account/register', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const { name = '', email = '', phone = '', password = '' } = req.body || {};
  const e = String(email).trim().toLowerCase();
  if (!String(name).trim() || !/^\S+@\S+\.\S+$/.test(e)) return res.status(400).json({ error: 'Please enter your name and a valid email.' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (db.get().customers.some((c) => c.email === e)) return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
  const customer = { id: crypto.randomUUID(), name: String(name).trim().slice(0, 120), email: e, phone: String(phone).trim().slice(0, 20), ...auth.hashPassword(String(password)), createdAt: new Date().toISOString() };
  db.update((d) => d.customers.push(customer));
  auth.setCustomer(res, e);
  res.json({ customer: publicCustomer(customer) });
});

app.post('/api/account/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const e = String(req.body?.email || '').trim().toLowerCase();
  const c = db.get().customers.find((x) => x.email === e);
  if (!c || !auth.verifyPassword(String(req.body?.password || ''), c)) return res.status(401).json({ error: 'Wrong email or password.' });
  auth.setCustomer(res, e);
  res.json({ customer: publicCustomer(c) });
});

app.post('/api/account/logout', (req, res) => { auth.clearCustomer(res); res.json({ ok: true }); });

app.get('/api/account/me', (req, res) => {
  const c = auth.currentCustomer(req);
  if (!c) return res.status(401).json({ error: 'Not signed in' });
  const orders = db.get().orders.filter((o) => o.customerEmail === c.email).map(shop.publicOrder);
  res.json({ customer: publicCustomer(c), orders });
});

app.patch('/api/account/me', (req, res) => {
  const c = auth.currentCustomer(req);
  if (!c) return res.status(401).json({ error: 'Not signed in' });
  const { name, phone, address } = req.body || {};
  db.update((d) => {
    const x = d.customers.find((y) => y.email === c.email);
    if (name) x.name = String(name).slice(0, 120);
    if (phone) x.phone = String(phone).slice(0, 20);
    if (address && typeof address === 'object') x.address = Object.fromEntries(Object.entries(address).slice(0, 10).map(([k, v]) => [k, String(v).slice(0, 200)]));
  });
  res.json({ customer: publicCustomer(db.get().customers.find((y) => y.email === c.email)) });
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
  const { users, customers, ...rest } = db.get();
  res.json({
    ...rest,
    customers: customers.map(({ hash, salt, ...c }) => c),
    presets: PRESETS, sectionLabels: SECTION_LABELS, sectionDefaults: defaults().sections,
    orderStatuses: shop.STATUSES, leadTypes: LEAD_TYPES,
  });
});

const replaceable = ['settings', 'navigation', 'theme', 'sections', 'integrations', 'commerce', ...COLLECTIONS];
admin.put('/:key', (req, res) => {
  const key = req.params.key;
  const value = req.body;
  if (!replaceable.includes(key)) return res.status(400).json({ error: 'Unknown key' });
  const isArray = key === 'navigation' || key === 'sections' || COLLECTIONS.includes(key);
  if (COLLECTIONS.includes(key) && value.some?.((x) => !x || typeof x !== 'object' || !x.id)) {
    return res.status(400).json({ error: 'Every item needs an id' });
  }
  if (['products', 'posts', 'pages'].includes(key)) {
    const slugs = value.map((x) => x.slug);
    if (slugs.some((sl) => !/^[a-z0-9-]+$/.test(sl || ''))) return res.status(400).json({ error: 'Every item needs a URL slug (lowercase letters, numbers and dashes).' });
    if (new Set(slugs).size !== slugs.length) return res.status(400).json({ error: 'Two items share the same URL slug.' });
  }
  if (isArray !== Array.isArray(value) || value === null || typeof value !== 'object') {
    return res.status(400).json({ error: `Invalid ${key} payload` });
  }
  if (key === 'sections' && value.some((s) => !s || !s.id || !SECTION_LABELS[s.type])) {
    return res.status(400).json({ error: 'Every section needs an id and a known type' });
  }
  if (key === 'integrations') {
    clearCache('weather:');
    clearCache('custom:');
    mandi.clear();
  }
  db.update((d) => { d[key] = value; });
  res.json({ ok: true });
});

// Orders
admin.patch('/orders/:id', (req, res) => {
  const o = shop.setStatus(req.params.id, req.body || {});
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json({ order: o });
});
admin.get('/orders.csv', (req, res) => {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['number', 'date', 'status', 'payment', 'name', 'phone', 'city', 'pincode', 'items', 'total'].join(','),
    ...db.get().orders.map((o) => [o.number, o.createdAt, o.status, `${o.payment.method}/${o.payment.status}`, o.address.name, o.address.phone, o.address.city, o.address.pincode, o.lines.map((l) => `${l.qty}x ${l.name}`).join('; '), o.total].map(q).join(','))];
  res.set('Content-Type', 'text/csv').set('Content-Disposition', 'attachment; filename="orders.csv"').send(rows.join('\n'));
});

// Leads (farmer forms, bulk quotes, job applications)
admin.patch('/leads/:id', (req, res) => {
  db.update((d) => {
    const l = d.leads.find((x) => x.id === req.params.id);
    if (!l) return;
    if (['new', 'contacted', 'closed'].includes(req.body?.status)) l.status = req.body.status;
    if (typeof req.body?.note === 'string') l.note = req.body.note.slice(0, 2000);
  });
  res.json({ ok: true });
});
admin.delete('/leads/:id', (req, res) => {
  db.update((d) => { d.leads = d.leads.filter((x) => x.id !== req.params.id); });
  res.json({ ok: true });
});
admin.get('/leads.csv', (req, res) => {
  const leads = db.get().leads.filter((l) => !req.query.type || l.type === req.query.type);
  const keys = [...new Set(leads.flatMap((l) => Object.keys(l.fields)))];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['type', 'status', 'date', ...keys].join(','), ...leads.map((l) => [l.label, l.status, l.createdAt, ...keys.map((k) => l.fields[k])].map(q).join(','))];
  res.set('Content-Type', 'text/csv').set('Content-Disposition', 'attachment; filename="requests.csv"').send(rows.join('\n'));
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

admin.post('/test/mandi', async (req, res) => {
  const saved = db.get().integrations.mandi;
  try {
    mandi.clear();
    db.get().integrations.mandi = { ...saved, ...(req.body || {}), enabled: true };
    const r = await mandi.prices({});
    res.json({ ok: true, result: { state: r.state, rows: r.records.length, sample: r.records.slice(0, 3) } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    db.get().integrations.mandi = saved;
    mandi.clear();
  }
});

admin.post('/test/razorpay', async (req, res) => {
  const cfg = { ...db.get().integrations.razorpay, ...(req.body || {}) };
  if (!cfg.keyId || !cfg.keySecret) return res.status(400).json({ error: 'Key ID and Key Secret are required' });
  try {
    const r = await fetch('https://api.razorpay.com/v1/orders?count=1', { headers: { Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64')}` } });
    if (!r.ok) throw new Error(r.status === 401 ? 'Razorpay rejected these keys' : `Razorpay responded ${r.status}`);
    res.json({ ok: true, result: { connected: true, mode: cfg.keyId.startsWith('rzp_live') ? 'live' : 'test' } });
  } catch (e) {
    res.status(400).json({ error: e.message });
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
  const { users, customers, ...rest } = db.get();
  res.set('Content-Disposition', `attachment; filename="bhoomi-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(rest);
});

admin.post('/import', (req, res) => {
  const data = req.body;
  if (!data || !Array.isArray(data.sections) || !data.settings || !data.theme) return res.status(400).json({ error: 'This does not look like a Bhoomi backup file' });
  const { users, customers } = db.get();
  db.replace({ ...data, users, customers });
  clearCache('');
  res.json({ ok: true });
});

admin.post('/reset', (req, res) => {
  const keep = req.body?.keep || [];
  const fresh = defaults();
  const current = db.get();
  const next = { ...fresh, users: current.users };
  for (const k of ['messages', 'subscribers', 'media', 'integrations', 'orders', 'leads', 'customers']) if (keep.includes(k)) next[k] = current[k];
  db.replace(next);
  clearCache('');
  res.json({ ok: true });
});

app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- pages ----------
const { fontUrl, stack } = require('./public/js/fonts.js');

const STATIC_ROUTES = {
  products: ['Shop fresh produce', 'Order farm-fresh, traceable produce delivered to your door.'],
  blog: ['Journal', 'Stories, research and guides from the field.'],
  mandi: ['Mandi prices today', 'Live APMC mandi prices for your state, updated daily from data.gov.in.'],
  advisory: ['Crop calendar & advisory', 'Sowing and harvest calendar, crop advisories and government schemes for farmers.'],
  contact: ['Contact us', 'Questions about produce, partnerships or the farmer programme? Get in touch.'],
  bulk: ['Bulk & business supply', 'Contract-grown produce for restaurants, retailers and exporters.'],
  cart: ['Your cart', ''], checkout: ['Checkout', ''], account: ['Your account', ''], track: ['Track your order', ''],
};
const NOINDEX = ['cart', 'checkout', 'account', 'track', 'order'];
const stripMd = (s = '') => String(s).replace(/[#*_>`\[\]]|\(.*?\)/g, '').replace(/\s+/g, ' ').trim();

// Title/description/image (and structured data) for each URL, so links share well and Google sees real content.
function routeMeta(data, urlPath, origin) {
  const seo = data.settings.seo;
  const site = data.settings.siteName;
  const parts = urlPath.replace(/\/+$/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const t = (x) => `${x} — ${site}`;
  const [a, b] = parts;
  if (!parts.length) {
    return { title: seo.title, description: seo.description, image: seo.ogImage,
      jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: site, url: origin, email: data.settings.contact.email, telephone: data.settings.contact.phone, address: data.settings.contact.address } };
  }
  if (parts.length === 1 && STATIC_ROUTES[a]) return { title: t(STATIC_ROUTES[a][0]), description: STATIC_ROUTES[a][1] || seo.description, image: seo.ogImage, noindex: NOINDEX.includes(a) };
  if (a === 'order' && b) return { title: t('Order status'), description: '', noindex: true };
  if (a === 'products' && b && parts.length === 2) {
    const p = data.products.find((x) => x.slug === b && x.active);
    if (p) {
      return { title: t(p.name), description: p.summary || stripMd(p.description).slice(0, 160), image: p.images?.[0],
        jsonld: { '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: p.images, description: p.summary, category: p.category,
          offers: { '@type': 'Offer', priceCurrency: 'INR', price: p.price, availability: `https://schema.org/${Number(p.stock) > 0 ? 'InStock' : 'OutOfStock'}`, url: `${origin}/products/${p.slug}` } } };
    }
  }
  if (a === 'blog' && b && parts.length === 2) {
    const p = data.posts.find((x) => x.slug === b && x.published);
    if (p) {
      return { title: t(p.title), description: p.excerpt, image: p.cover, type: 'article',
        jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, image: p.cover, datePublished: p.date, author: { '@type': 'Person', name: p.author } } };
    }
  }
  if (a === 'services' && b && parts.length === 2) {
    const svc = data.sections.filter((x) => x.type === 'services').flatMap((x) => x.items || []).find((x) => x.slug === b);
    if (svc) return { title: t(svc.title), description: svc.text, image: svc.image };
  }
  if (parts.length === 1) {
    const page = data.pages.find((x) => x.slug === a);
    if (page) return { title: t(page.title), description: page.seoDescription || page.subtitle || stripMd(page.content).slice(0, 160), image: page.cover || seo.ogImage };
  }
  return null;
}

function renderIndex(data, req) {
  const { settings, theme, integrations } = data;
  const seo = settings.seo;
  const origin = `${req.protocol}://${req.get('host')}`;
  const meta = routeMeta(data, req.path, origin) || { title: `Page not found — ${settings.siteName}`, description: seo.description, noindex: true };
  const ga = integrations.googleAnalytics;
  const c = theme.colors;
  const vars = Object.entries(c).map(([k, v]) => `--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`).join(';');
  const head = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<meta name="keywords" content="${escapeHtml(seo.keywords)}">`,
    meta.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${escapeHtml(origin + req.path)}">`,
    `<meta property="og:type" content="${meta.type || 'website'}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="${escapeHtml(c.bg)}">`,
    `<link rel="manifest" href="/manifest.webmanifest">`,
    settings.favicon ? `<link rel="icon" href="${escapeHtml(settings.favicon)}">` : `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    fontUrl([theme.fonts.heading, theme.fonts.body]) ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link id="font-link" rel="stylesheet" href="${fontUrl([theme.fonts.heading, theme.fonts.body])}">` : '',
    `<link rel="preconnect" href="https://images.unsplash.com">`,
    `<style id="theme-vars">:root{${vars};--font-heading:${stack(theme.fonts.heading).replace(/</g, '')};--font-body:${stack(theme.fonts.body).replace(/</g, '')};--radius:${Number(theme.radius) || 0}px}</style>`,
    meta.jsonld ? `<script type="application/ld+json">${JSON.stringify(meta.jsonld).replace(/</g, '\\u003c')}</script>` : '',
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
  return {
    status: routeMeta(data, req.path, origin) ? 200 : 404,
    html: html.replace('<!--HEAD-->', head).replace('<!--BODY_END-->', integrations.customScripts.bodyEnd || '').replace(/\{\{V\}\}/g, ASSET_VERSION),
  };
}

const ASSET_VERSION = String(Date.now().toString(36));

app.get(['/admin', '/admin/*'], (req, res, next) => {
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(PUBLIC, 'admin', 'index.html'));
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /cart\nDisallow: /checkout\nDisallow: /account\n\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const data = db.get();
  const origin = `${req.protocol}://${req.get('host')}`;
  const urls = ['/', ...Object.keys(STATIC_ROUTES).filter((k) => !NOINDEX.includes(k)).map((k) => `/${k}`),
    ...data.pages.map((p) => `/${p.slug}`),
    ...data.products.filter((p) => p.active).map((p) => `/products/${p.slug}`),
    ...data.posts.filter((p) => p.published).map((p) => `/blog/${p.slug}`),
    ...data.sections.filter((x) => x.type === 'services').flatMap((x) => x.items || []).filter((i) => i.slug).map((i) => `/services/${i.slug}`)];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].map((u) => `  <url><loc>${escapeHtml(origin + u)}</loc></url>`).join('\n')}\n</urlset>\n`);
});

app.use('/vendor/lenis.min.js', express.static(path.join(ROOT, 'node_modules', 'lenis', 'dist', 'lenis.min.js'), { maxAge: '7d' }));
app.use('/uploads', express.static(UPLOADS, { maxAge: '30d' }));
app.use(express.static(PUBLIC, { index: false, maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0 }));

// Every other GET is a page of the single-page site.
app.get('*', (req, res) => {
  if (path.extname(req.path)) return res.status(404).end();
  const { status, html } = renderIndex(db.get(), req);
  res.set('Cache-Control', 'no-store');
  res.status(status).type('html').send(html);
});

app.listen(PORT, () => {
  console.log(`\n  🌾 Bhoomi is running`);
  console.log(`     Website: http://localhost:${PORT}`);
  console.log(`     Admin:   http://localhost:${PORT}/admin\n`);
});
