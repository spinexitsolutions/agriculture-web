// Password hashing (scrypt) and HMAC-signed session cookies — no external deps.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const COOKIE = 'bhoomi_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const file = path.join(db.DATA_DIR, '.secret');
  if (!fs.existsSync(file)) {
    fs.mkdirSync(db.DATA_DIR, { recursive: true });
    fs.writeFileSync(file, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
  }
  return fs.readFileSync(file, 'utf8').trim();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, user) {
  const { hash } = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex'));
}

// Create the first admin account if none exists.
function ensureAdmin() {
  const data = db.get();
  if (data.users.length) return;
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  db.update((d) => {
    d.users.push({ username, ...hashPassword(password), mustChange: !process.env.ADMIN_PASSWORD, createdAt: new Date().toISOString() });
  });
  console.log(`[auth] Created admin user "${username}"${process.env.ADMIN_PASSWORD ? '' : ' with default password "admin123" — change it in Admin → Account'}`);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function unsign(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setSession(res, username) {
  const token = sign({ u: username, exp: Date.now() + MAX_AGE_MS });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${MAX_AGE_MS / 1000}${secure}`);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`);
}

function currentUser(req) {
  const payload = unsign(parseCookies(req)[COOKIE]);
  if (!payload?.u) return null;
  return db.get().users.find((u) => u.username === payload.u) || null;
}

// ---------- shop customers (separate cookie from admin) ----------
const CUSTOMER_COOKIE = 'bhoomi_customer';

function setCustomer(res, email) {
  const token = sign({ c: email, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append('Set-Cookie', `${CUSTOMER_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${secure}`);
}

function clearCustomer(res) {
  res.append('Set-Cookie', `${CUSTOMER_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function currentCustomer(req) {
  const payload = unsign(parseCookies(req)[CUSTOMER_COOKIE]);
  if (!payload?.c) return null;
  return db.get().customers.find((c) => c.email === payload.c) || null;
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
}

module.exports = { hashPassword, verifyPassword, ensureAdmin, setSession, clearSession, currentUser, requireAuth, setCustomer, clearCustomer, currentCustomer };
