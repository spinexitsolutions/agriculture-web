// Live mandi (APMC) prices from data.gov.in (Agmarknet daily prices).
const db = require('./db');

const cache = new Map();

async function fetchRecords(cfg, state) {
  const key = `${cfg.resourceId}:${state}`;
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.records;
  const params = new URLSearchParams({ 'api-key': cfg.apiKey, format: 'json', limit: '1000' });
  if (state) params.set('filters[state.keyword]', state);
  const res = await fetch(`https://api.data.gov.in/resource/${encodeURIComponent(cfg.resourceId)}?${params}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`data.gov.in responded ${res.status}`);
  const j = await res.json();
  const records = (j.records || []).map((r) => ({
    state: r.state, district: r.district, market: r.market, commodity: r.commodity, variety: r.variety,
    date: r.arrival_date, min: Number(r.min_price) || 0, max: Number(r.max_price) || 0, modal: Number(r.modal_price) || 0,
  }));
  cache.set(key, { records, exp: Date.now() + 30 * 60 * 1000 });
  return records;
}

async function prices({ state, district, commodity } = {}) {
  const cfg = db.get().integrations.mandi;
  if (!cfg.enabled || !cfg.apiKey) throw Object.assign(new Error('Mandi prices are not configured.'), { status: 404 });
  const st = state || cfg.defaultState || '';
  let records;
  try {
    records = await fetchRecords(cfg, st);
  } catch (e) {
    if (!st) throw e;
    records = await fetchRecords(cfg, ''); // some API versions reject the state filter
  }
  // Filter locally too, in case the API ignored a filter.
  if (st) records = records.filter((r) => !r.state || r.state.toLowerCase() === st.toLowerCase());
  if (district) records = records.filter((r) => r.district?.toLowerCase() === district.toLowerCase());
  if (commodity) records = records.filter((r) => r.commodity?.toLowerCase().includes(commodity.toLowerCase()));
  const districts = [...new Set(records.map((r) => r.district).filter(Boolean))].sort();
  return { state: st, updated: records[0]?.date || null, districts, records: records.slice(0, 300) };
}

function clear() { cache.clear(); }

module.exports = { prices, clear };
