/* Bhoomi — shared helpers for the public site (window.BH). */
(function () {
  'use strict';

  const I18N = window.BHOOMI_I18N;
  const BH = (window.BH = {
    PREVIEW: new URLSearchParams(location.search).has('preview'),
    site: null, // localized site data
    raw: null, // raw data from /api/site (with translations)
    sections: {}, // home section renderers
    views: {}, // route views
    t: (k, v) => I18N.t(k, v),
  });

  // Slow connection or Data Saver → smaller images and no heavy motion.
  const conn = navigator.connection || {};
  BH.lowData = !!(conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || ''));

  // ---------- DOM ----------
  BH.$ = (s, el = document) => el.querySelector(s);
  BH.$$ = (s, el = document) => [...el.querySelectorAll(s)];
  BH.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  BH.pad = (n) => String(n).padStart(2, '0');

  // ---------- text ----------
  const esc = (BH.esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  BH.fmt = (s = '') => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
  BH.plain = (s = '') => String(s).replace(/\*/g, '');
  const url = (BH.url = (u = '') => (/^\s*(javascript|data|vbscript):/i.test(u) ? '#' : esc(u)));
  BH.isExternal = (h = '') => /^(https?:)?\/\//.test(h) && !h.startsWith(location.origin);
  BH.linkAttrs = (h) => `href="${url(h)}"${BH.isExternal(h) ? ' target="_blank" rel="noopener"' : ''}`;
  BH.money = (n) => `${BH.site?.commerce?.currencySymbol || '₹'}${Number(n || 0).toLocaleString('en-IN')}`;
  BH.date = (d, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => { const x = new Date(d); return isNaN(x) ? esc(d) : x.toLocaleDateString(I18N.lang === 'en' ? 'en-IN' : `${I18N.lang}-IN`, opts); };

  // ---------- images (responsive Unsplash srcset, lazy, graceful fallback) ----------
  const WIDTHS = [480, 800, 1200, 1800];
  BH.img = (src, alt = '', { sizes = '100vw', eager = false, extra = '' } = {}) => {
    if (!src) return '';
    let srcset = '';
    let s = src;
    if (/images\.unsplash\.com/.test(src)) {
      const widths = BH.lowData ? WIDTHS.slice(0, 2) : WIDTHS;
      const at = (w) => src.replace(/([?&])w=\d+/, `$1w=${w}`).replace(/([?&])q=\d+/, `$1q=${BH.lowData ? 55 : 75}`) + (/[?&]w=/.test(src) ? '' : `${src.includes('?') ? '&' : '?'}w=${w}`);
      srcset = ` srcset="${widths.map((w) => `${url(at(w))} ${w}w`).join(', ')}" sizes="${sizes}"`;
      s = at(BH.lowData ? 800 : 1200);
    }
    return `<img src="${url(s)}"${srcset} alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''} decoding="async" onerror="this.classList.add('img-fallback');this.parentElement.classList.add('ph')" ${extra}>`;
  };

  // ---------- markdown (safe subset) ----------
  BH.md = (src = '') => {
    const inline = (s) => esc(s)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img src="${url(u)}" alt="${a}" loading="lazy">`)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, u) => `<a ${BH.linkAttrs(u.replace(/&amp;/g, '&'))}>${txt}</a>`)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^\w])_(.+?)_(?=[^\w]|$)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    const out = [];
    let list = null;
    let para = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
    String(src).replace(/\r/g, '').split('\n').forEach((line) => {
      const l = line.trim();
      let m;
      if (!l) { flushPara(); flushList(); return; }
      if ((m = l.match(/^(#{2,4})\s+(.*)$/))) { flushPara(); flushList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); return; }
      if ((m = l.match(/^[-*]\s+(.*)$/)) || (m = l.match(/^\d+[.)]\s+(.*)$/))) {
        flushPara();
        const tag = /^\d/.test(l) ? 'ol' : 'ul';
        if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
        list.items.push(m[1]);
        return;
      }
      if ((m = l.match(/^>\s?(.*)$/))) { flushPara(); flushList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); return; }
      flushList();
      para.push(l);
    });
    flushPara(); flushList();
    return out.join('');
  };
  BH.readMins = (s = '') => Math.max(1, Math.round(String(s).split(/\s+/).length / 200));

  // ---------- network ----------
  BH.api = async (path, body, method) => {
    const res = await fetch(path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(j.error || 'Something went wrong. Please try again.'), { status: res.status });
    return j;
  };

  // ---------- cart (localStorage) ----------
  const KEY = 'bhoomi:cart';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = (items) => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ } document.dispatchEvent(new CustomEvent('cart')); };
  BH.cart = {
    items: read,
    count: () => read().reduce((a, i) => a + i.qty, 0),
    add(id, qty = 1) { const items = read(); const it = items.find((i) => i.id === id); if (it) it.qty = Math.min(50, it.qty + qty); else items.push({ id, qty }); write(items); },
    set(id, qty) { write(read().map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(50, qty)) } : i))); },
    remove(id) { write(read().filter((i) => i.id !== id)); },
    clear() { write([]); },
    // Join with catalogue data, dropping products that disappeared.
    lines() {
      return read().map((i) => ({ ...i, product: BH.site.products.find((p) => p.id === i.id) })).filter((l) => l.product);
    },
  };
  BH.totals = (lines) => {
    const c = BH.site.commerce;
    const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
    const delivery = !lines.length || (c.freeDeliveryAbove && subtotal >= c.freeDeliveryAbove) ? 0 : c.deliveryFee;
    return { subtotal, delivery, total: subtotal + delivery };
  };

  // ---------- toast ----------
  BH.toast = (msg) => {
    let box = BH.$('#toast');
    if (!box) { box = document.createElement('div'); box.id = 'toast'; box.className = 'toast'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    box.textContent = msg;
    box.classList.add('is-on');
    clearTimeout(box._t);
    box._t = setTimeout(() => box.classList.remove('is-on'), 2600);
  };

  // ---------- form helpers ----------
  // Floating-label field: f('name', t('name'), { type, required, full, options })
  BH.field = (name, label, o = {}) => {
    const id = `f-${name}-${Math.random().toString(36).slice(2, 6)}`;
    const req = o.required ? ' required' : '';
    const val = o.value != null ? ` value="${esc(o.value)}"` : '';
    let control;
    if (o.options) control = `<select id="${id}" name="${name}"${req}>${o.options.map((op) => { const [v, l] = Array.isArray(op) ? op : [op, op]; return `<option value="${esc(v)}"${String(o.value) === String(v) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
    else if (o.type === 'textarea') control = `<textarea id="${id}" name="${name}" placeholder=" "${req}>${esc(o.value || '')}</textarea>`;
    else control = `<input id="${id}" name="${name}" type="${o.type || 'text'}" placeholder=" "${req}${val}${o.attrs ? ' ' + o.attrs : ''}>`;
    return `<div class="fl${o.full ? ' fl--full' : ''}${o.options ? ' fl--select' : ''}">${control}<label for="${id}">${esc(label)}${o.required ? '' : ''}</label></div>`;
  };

  // Submit a farmer/business/job form to /api/leads.
  BH.bindLead = (form, type, extra = {}) => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = BH.$('.status', form);
    const btn = BH.$('button[type="submit"]', form);
    const data = Object.fromEntries(new FormData(form));
    if ([...form.querySelectorAll('[required]')].some((el) => !el.value.trim())) { status.className = 'status err'; status.textContent = BH.t('fillRequired'); return; }
    btn.disabled = true; status.className = 'status'; status.textContent = BH.t('sending');
    try {
      if (BH.PREVIEW) throw new Error(BH.t('previewForms'));
      await BH.api('/api/leads', { type, ...extra, ...data, language: I18N.lang });
      form.reset();
      status.className = 'status ok'; status.textContent = BH.t('formThanks');
      window.gtag?.('event', 'generate_lead', { form: type });
    } catch (err) { status.className = 'status err'; status.textContent = err.message; } finally { btn.disabled = false; }
  });

  BH.ICON = {
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    left: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8V6.5c0-.7.5-1 1-1h2V2h-3c-2.8 0-4 2-4 4.3V8H8v3.5h2V22h4V11.5h2.8L17 8h-3Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15V9l5.8 3-5.8 3Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5Z"/></svg>',
  };

  // Shared section heading
  BH.head = (s, { center = true, extra = '', tag = 'h2', cls = 'h2' } = {}) => `
    <div class="head${center ? ' center' : ' head--split'}" data-reveal>
      <div>
        ${s.eyebrow ? `<span class="kicker">${esc(s.eyebrow)}</span>` : ''}
        ${s.title ? `<${tag} class="${cls}">${BH.fmt(s.title)}</${tag}>` : ''}
        ${center && s.subtitle ? `<p class="sub">${esc(s.subtitle)}</p>` : ''}
      </div>
      ${extra}
    </div>`;

  // Product card used on home shelf, shop grid and related products.
  BH.productCard = (p, i = 0) => {
    const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    const out = Number(p.stock) <= 0;
    return `
      <article class="card${out ? ' is-out' : ''}" data-cat="${esc(p.category)}" data-reveal style="--d:${Math.min(i, 4) * 0.06}s">
        <a class="card__link" href="/products/${esc(p.slug)}" aria-label="${esc(p.name)}"></a>
        <span class="card__badge">${esc(out ? BH.t('outOfStock') : p.badge || (off ? BH.t('off', { n: off }) : ''))}</span>
        <h3>${esc(p.name)}</h3>
        <span class="card__cat">${esc(p.category)} · ${esc(p.unit)}</span>
        <div class="card__img">${BH.img(p.images?.[0], p.name, { sizes: '(max-width: 700px) 80vw, 340px' })}</div>
        <div class="card__foot">
          <span class="card__price">${BH.money(p.price)}${off ? ` <s>${BH.money(p.mrp)}</s>` : ''}</span>
          ${out ? '' : `<button class="btn btn--sm" data-add="${esc(p.id)}">${BH.t('addToCart')}</button>`}
        </div>
      </article>`;
  };
})();
