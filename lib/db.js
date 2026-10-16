// Tiny JSON-file datastore with atomic writes. Good enough for a single-site CMS.
const fs = require('fs');
const path = require('path');
const { defaults } = require('./defaults');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let cache = null;

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fill in keys added in newer versions without touching existing content.
function mergeMissing(target, source) {
  for (const key of Object.keys(source)) {
    if (!(key in target)) target[key] = source[key];
    else if (isPlainObject(target[key]) && isPlainObject(source[key])) mergeMissing(target[key], source[key]);
  }
  return target;
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function load() {
  if (cache) return cache;
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    cache = mergeMissing(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')), defaults());
  } else {
    cache = defaults();
    save();
  }
  return cache;
}

function save() {
  ensureDir();
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function get() {
  return load();
}

function update(mutator) {
  const db = load();
  mutator(db);
  save();
  return db;
}

function replace(next) {
  cache = mergeMissing(next, defaults());
  save();
  return cache;
}

module.exports = { get, update, replace, DATA_DIR };
