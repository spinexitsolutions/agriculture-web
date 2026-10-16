/* Bhoomi Admin — a schema-driven CMS for the public site. */
(() => {
  'use strict';

  // ---------- tiny DOM helper ----------
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (['value', 'checked', 'selected', 'disabled', 'multiple'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  }
  const $ = (s, el = document) => el.querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] = a[k] && typeof a[k] === 'object' ? a[k] : {}), o); t[last] = v; };
  const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}`;
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const I = {
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="7.5" r="1.2" fill="currentColor"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
    plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 2v6m6-6v6M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
    desk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    grip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 9 5 4h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M14 3H6v18h12V7l-4-4Z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 13h5l1 3h6l1-3h5"/><path d="M5 5h14l2 8v6H3v-6l2-8Z"/></svg>',
    sprout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6Zm0 0c0-3 2-5 6-5 0 3-2 5-6 5Z"/></svg>',
    brief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    leaf: '<svg width="28" height="28" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#ffffff" opacity=".12"/><path d="M32 50V20m0 10c-8 0-14-5-14-13 8 0 14 5 14 13Zm0 8c8 0 14-5 14-13-8 0-14 5-14 13Z" fill="none" stroke="#d9a441" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const icon = (name) => h('span', { html: I[name], style: { display: 'inline-grid' } });

  // ---------- api + toasts ----------
  async function api(method, path, body, isForm) {
    const res = await fetch(`/api/admin${path}`, {
      method,
      headers: isForm ? undefined : { 'Content-Type': 'application/json' },
      body: body == null ? undefined : isForm ? body : JSON.stringify(body),
      credentials: 'same-origin',
    });
    const data = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
    if (res.status === 401 && path !== '/login') { state.user = null; renderLogin(); throw new Error('Session expired, please log in again'); }
    if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { data });
    return data;
  }
  function toast(msg, type = 'ok') {
    const t = h('div', { class: `toast ${type}` }, msg);
    $('#toasts').append(t);
    setTimeout(() => t.remove(), type === 'err' ? 6000 : 3000);
  }

  // ---------- state ----------
  const state = { user: null, data: null, dirty: new Set(), preview: false, previewMobile: false, selected: null, iframe: null, editLang: 'en', sel: {}, tab: {} };
  const COLLECTIONS = ['products', 'posts', 'pages', 'team', 'jobs', 'crops', 'advisories', 'schemes'];
  const SAVE_KEYS = ['settings', 'navigation', 'theme', 'sections', 'integrations', 'commerce', ...COLLECTIONS];
  const LANGS = { en: 'English', hi: 'हिन्दी (Hindi)', mr: 'मराठी (Marathi)', ta: 'தமிழ் (Tamil)' };

  function markDirty(key) {
    state.dirty.add(key);
    updateSaveBtn();
    pushPreview();
  }
  function updateSaveBtn() {
    const b = $('#save-btn');
    if (!b) return;
    b.disabled = !state.dirty.size;
    b.classList.toggle('is-dirty', !!state.dirty.size);
    b.lastChild.textContent = state.dirty.size ? `Save changes (${state.dirty.size})` : 'All saved';
  }
  async function saveAll() {
    if (!state.dirty.size) return;
    const b = $('#save-btn');
    b.disabled = true;
    try {
      for (const key of [...state.dirty]) {
        if (!SAVE_KEYS.includes(key)) continue;
        await api('PUT', `/${key}`, state.data[key]);
        state.dirty.delete(key);
      }
      toast('Changes published to the live site');
      if (state.iframe) state.iframe.contentWindow.location.reload();
    } catch (e) {
      toast(e.message, 'err');
    }
    updateSaveBtn();
  }

  // ---------- preview ----------
  function previewSite() {
    const d = state.data; const i = d.integrations;
    return {
      settings: d.settings, navigation: d.navigation, theme: d.theme, sections: d.sections.filter((s) => s.enabled),
      products: d.products.filter((p) => p.active), posts: d.posts.filter((p) => p.published).sort((a, b) => String(b.date).localeCompare(String(a.date))),
      pages: d.pages, team: d.team, jobs: d.jobs.filter((j) => j.active), crops: d.crops, advisories: d.advisories, schemes: d.schemes,
      integrations: {
        mandi: { enabled: !!(i.mandi.enabled && i.mandi.apiKey), defaultState: i.mandi.defaultState },
        weather: { enabled: !!i.weather.enabled, city: i.weather.city, units: i.weather.units },
        whatsapp: i.whatsapp.enabled ? { enabled: true, number: i.whatsapp.number, message: i.whatsapp.message } : { enabled: false },
        customApis: i.customApis.filter((a) => a.enabled && a.public).map((a) => ({ id: a.id, name: a.name, display: a.display || {} })),
      },
    };
  }
  const pushPreview = debounce(() => {
    if (!state.preview || !state.iframe?.contentWindow) return;
    state.iframe.contentWindow.postMessage({ type: 'bhoomi:preview', site: clone(previewSite()), lang: state.editLang }, location.origin);
  }, 250);
  function previewGo(path) {
    if (state.preview && state.iframe?.contentWindow && path) state.iframe.contentWindow.postMessage({ type: 'bhoomi:navigate', path }, location.origin);
  }
  function scrollPreviewTo(id) {
    if (state.preview && state.iframe?.contentWindow) state.iframe.contentWindow.postMessage({ type: 'bhoomi:scrollTo', id }, location.origin);
  }

  // ---------- schema-driven fields ----------
  // def: { k, t, label, hint, options, fields, itemLabel, newItem, show, rerender, placeholder }
  const F = {
    text: (k, label, o) => ({ k, t: 'text', label, ...o }),
    area: (k, label, o) => ({ k, t: 'textarea', label, ...o }),
    img: (k, label, o) => ({ k, t: 'image', label, ...o }),
    num: (k, label, o) => ({ k, t: 'number', label, ...o }),
    bool: (k, label, o) => ({ k, t: 'toggle', label, ...o }),
    link: (k, label, o) => ({ k, t: 'link', label, ...o }),
    sel: (k, label, options, o) => ({ k, t: 'select', label, options, ...o }),
    secret: (k, label, o) => ({ k, t: 'secret', label, ...o }),
    code: (k, label, o) => ({ k, t: 'code', label, ...o }),
    list: (k, label, fields, o) => ({ k, t: 'list', label, fields, ...o }),
    md: (k, label, o) => ({ k, t: 'markdown', label, hint: 'Formatting: ## Heading · **bold** · _italic_ · - bullet list · [link text](/products)', ...o }),
    strings: (k, label, o) => ({ k, t: 'strings', label, ...o }),
  };
  const EM = 'Wrap words in *asterisks* to highlight them in the accent colour.';

  function renderForm(defs, obj, onChange, rerender) {
    const wrap = h('div', { class: 'stack' });
    const draw = () => {
      wrap.replaceChildren(...defs.filter((d) => !d.show || d.show(obj)).map((d) => (d.row
        ? h('div', { class: `grid-${d.row.length}` }, d.row.filter((x) => !x.show || x.show(obj)).map((x) => fieldEl(x, obj, change)))
        : fieldEl(d, obj, change))));
    };
    const change = (def) => { onChange(); if (def?.rerender) (rerender || draw)(); };
    draw();
    return wrap;
  }
  const row = (...defs) => ({ row: defs });

  // In translation mode, text fields read/write obj._t[lang][key]; everything else stays shared.
  const TRANSLATABLE = ['text', 'textarea', 'strings', 'markdown'];
  function translatedField(def, obj, change) {
    const lang = state.editLang;
    const base = getPath(obj, def.k);
    const tr = obj._t?.[lang]?.[def.k];
    const set = (v) => {
      obj._t = obj._t || {}; obj._t[lang] = obj._t[lang] || {};
      if (v === '' || (Array.isArray(v) && !v.length)) delete obj._t[lang][def.k]; else obj._t[lang][def.k] = v;
      change(def);
    };
    const ph = Array.isArray(base) ? base.join('\n') : String(base ?? '');
    let control;
    if (def.t === 'text') control = h('input', { type: 'text', value: tr ?? '', placeholder: ph, onInput: (e) => set(e.target.value) });
    else if (def.t === 'strings') control = h('textarea', { rows: 5, placeholder: ph, onInput: (e) => set(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean)) }, (tr || []).join('\n'));
    else control = h('textarea', { rows: def.t === 'markdown' ? 12 : def.rows || 3, class: def.t === 'markdown' ? 'md' : '', placeholder: ph, onInput: (e) => set(e.target.value) }, tr ?? '');
    return h('div', { class: 'field field--tr' }, h('label', {}, def.label || '', h('span', { class: 'badge badge--tr' }, lang.toUpperCase())), control,
      h('span', { class: 'hint' }, tr ? '' : 'Not translated yet — the English text (shown faded) is used.'));
  }

  function fieldEl(def, obj, change) {
    if (state.editLang !== 'en' && def.k && TRANSLATABLE.includes(def.t) && !def.noTr) return translatedField(def, obj, change);
    if (state.editLang !== 'en' && def.t === 'link') return translatedField({ ...def, k: `${def.k}.label`, t: 'text', label: `${def.label} — label` }, obj, change);
    const val = def.k ? getPath(obj, def.k) : undefined;
    const set = (v) => { setPath(obj, def.k, v); change(def); };
    const wrap = (control) => h('div', { class: 'field' }, def.label && def.t !== 'toggle' ? h('label', {}, def.label) : null, control, def.hint ? h('span', { class: 'hint' }, def.hint) : null);

    switch (def.t) {
      case 'text': case 'url': case 'email': case 'date':
        return wrap(h('input', { type: def.t === 'date' ? 'date' : 'text', value: val ?? '', placeholder: def.placeholder, onInput: (e) => set(e.target.value) }));
      case 'number':
        return wrap(h('input', { type: 'number', value: val ?? '', min: def.min, max: def.max, step: def.step || 'any', onInput: (e) => set(e.target.value === '' ? '' : Number(e.target.value)) }));
      case 'textarea':
        return wrap(h('textarea', { rows: def.rows || 3, placeholder: def.placeholder, onInput: (e) => set(e.target.value) }, val ?? ''));
      case 'code':
        return wrap(h('textarea', { class: 'code', spellcheck: 'false', placeholder: def.placeholder, onInput: (e) => set(e.target.value) }, val ?? ''));
      case 'toggle':
        return h('div', { class: 'field' }, h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: !!val, onChange: (e) => set(e.target.checked) }), h('span', { class: 'sw' }), def.label), def.hint ? h('span', { class: 'hint' }, def.hint) : null);
      case 'select':
        return wrap(h('select', { onChange: (e) => set(e.target.value) }, (typeof def.options === 'function' ? def.options() : def.options).map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return h('option', { value: v, selected: String(val) === String(v) }, l);
        })));
      case 'secret': {
        const input = h('input', { type: 'password', value: val ?? '', placeholder: def.placeholder, autocomplete: 'off', onInput: (e) => set(e.target.value) });
        return wrap(h('div', { class: 'secret' }, input, h('button', { type: 'button', class: 'btn btn--ghost btn--sm', title: 'Show / hide', onClick: () => { input.type = input.type === 'password' ? 'text' : 'password'; } }, icon('eye'))));
      }
      case 'color': {
        const text = h('input', { type: 'text', value: val || '' });
        const pick = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(val) ? val : '#000000' });
        pick.addEventListener('input', () => { text.value = pick.value; set(pick.value); });
        text.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) pick.value = text.value; set(text.value); });
        return wrap(h('div', { class: 'color' }, pick, text));
      }
      case 'range': {
        const out = h('output', {}, `${val}${def.unit || ''}`);
        return wrap(h('div', { class: 'range' }, h('input', { type: 'range', min: def.min, max: def.max, step: def.step || 1, value: val, onInput: (e) => { out.textContent = `${e.target.value}${def.unit || ''}`; set(Number(e.target.value)); } }), out));
      }
      case 'image': {
        const thumb = h('div', { class: 'thumb', style: { backgroundImage: val ? `url("${val}")` : '' } });
        const input = h('input', { type: 'text', value: val ?? '', placeholder: 'https://… or choose from library', onInput: (e) => { thumb.style.backgroundImage = e.target.value ? `url("${e.target.value}")` : ''; set(e.target.value); } });
        const choose = () => openMediaPicker((u) => { input.value = u; thumb.style.backgroundImage = `url("${u}")`; set(u); });
        return wrap(h('div', { class: 'img-field' }, thumb, h('div', { class: 'stack', style: { gap: '6px' } }, input, h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn btn--sm', onClick: choose }, icon('image'), 'Choose image'),
          val ? h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onClick: () => { input.value = ''; thumb.style.backgroundImage = ''; set(''); } }, 'Clear') : null))));
      }
      case 'link': {
        const v = val && typeof val === 'object' ? val : {};
        if (!val) setPath(obj, def.k, v);
        return wrap(h('div', { class: 'grid-2' },
          h('input', { type: 'text', value: v.label || '', placeholder: 'Button label', onInput: (e) => { v.label = e.target.value; change(def); } }),
          h('input', { type: 'text', value: v.href || '', placeholder: '#section or https://…', onInput: (e) => { v.href = e.target.value; change(def); } })));
      }
      case 'markdown':
        return wrap(h('textarea', { rows: def.rows || 12, class: 'md', placeholder: def.placeholder, onInput: (e) => set(e.target.value) }, val ?? ''));
      case 'tags':
        return wrap(h('input', { type: 'text', value: (val || []).join(', '), placeholder: 'comma, separated', onInput: (e) => set(e.target.value.split(',').map((x) => x.trim()).filter(Boolean)) }));
      case 'months': {
        const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chosen = new Set(val || []);
        return wrap(h('div', { class: 'months' }, M.map((m, i) => h('label', { class: `month${chosen.has(i + 1) ? ' is-on' : ''}` },
          h('input', { type: 'checkbox', checked: chosen.has(i + 1), onChange: (e) => { e.target.checked ? chosen.add(i + 1) : chosen.delete(i + 1); e.target.parentElement.classList.toggle('is-on', e.target.checked); set([...chosen].sort((a, b) => a - b)); } }), m))));
      }
      case 'imagelist': {
        if (!Array.isArray(val)) setPath(obj, def.k, []);
        const arr = getPath(obj, def.k);
        const box = h('div', { class: 'imglist' });
        const draw = () => box.replaceChildren(...arr.map((u, i) => h('div', { class: 'imglist__item', style: { backgroundImage: `url("${u}")` } },
          i === 0 ? h('span', { class: 'badge' }, 'Cover') : null,
          h('div', { class: 'imglist__bar' },
            i > 0 ? h('button', { type: 'button', class: 'btn btn--sm btn--icon', title: 'Make cover', onClick: () => { arr.unshift(arr.splice(i, 1)[0]); change(def); draw(); } }, icon('up')) : null,
            h('button', { type: 'button', class: 'btn btn--sm btn--icon btn--danger', title: 'Remove', onClick: () => { arr.splice(i, 1); change(def); draw(); } }, icon('trash'))))),
        h('button', { type: 'button', class: 'imglist__add', onClick: () => openMediaPicker((u) => { arr.push(u); change(def); draw(); }) }, icon('plus'), 'Add image'));
        draw();
        return wrap(box);
      }
      case 'strings':
        return wrap(h('textarea', { rows: 5, placeholder: 'One item per line', onInput: (e) => set(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)) }, (val || []).join('\n')));
      case 'apis': {
        const apis = state.data.integrations.customApis;
        const chosen = new Set(val || []);
        if (!apis.length) return wrap(h('p', { class: 'muted small' }, 'No custom APIs yet. Add them under Integrations → Custom APIs.'));
        return wrap(h('div', { class: 'stack', style: { gap: '8px' } }, apis.map((a) => h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', checked: chosen.has(a.id), onChange: (e) => { e.target.checked ? chosen.add(a.id) : chosen.delete(a.id); set([...chosen]); } }), h('span', { class: 'sw' }),
          a.name || a.id, !a.public || !a.enabled ? h('span', { class: 'badge badge--warn' }, 'not public') : null)),
        h('span', { class: 'hint' }, 'Leave all unchecked to show every public API.')));
      }
      case 'action': {
        const out = h('div');
        const b = h('button', { type: 'button', class: 'btn btn--sm' }, def.label);
        b.addEventListener('click', async () => {
          b.disabled = true; out.replaceChildren(h('span', { class: 'spin' }));
          try { out.replaceChildren(h('pre', { class: 'result' }, JSON.stringify(await def.run(obj), null, 2).slice(0, 4000))); } catch (e) { out.replaceChildren(h('pre', { class: 'result err' }, e.message + (e.data?.body ? '\n\n' + JSON.stringify(e.data.body, null, 2).slice(0, 2000) : ''))); }
          b.disabled = false;
        });
        return h('div', { class: 'field' }, h('div', {}, b), out);
      }
      case 'list':
        return wrap(listEl(def, obj, change));
      case 'custom':
        return def.render(obj, change);
      default:
        return h('div', {}, `Unknown field ${def.t}`);
    }
  }

  function listEl(def, obj, change) {
    if (!Array.isArray(getPath(obj, def.k))) setPath(obj, def.k, []);
    const arr = getPath(obj, def.k);
    const box = h('div', { class: 'list' });
    const open = new Set();
    const imgKey = def.fields.find((f) => f.t === 'image')?.k;
    const label = (it, i) => (typeof def.itemLabel === 'function' ? def.itemLabel(it, i) : it[def.itemLabel || def.fields[0].k]) || `Item ${i + 1}`;
    const draw = () => {
      box.replaceChildren(...arr.map((it, i) => {
        const titleEl = h('span', { class: 'title' }, String(label(it, i)).replace(/\*/g, ''));
        const item = h('div', { class: `list-item${open.has(it) ? '' : ' is-collapsed'}` },
          h('div', { class: 'list-item__head', onClick: (e) => { if (e.target.closest('button')) return; open.has(it) ? open.delete(it) : open.add(it); item.classList.toggle('is-collapsed'); } },
            h('span', { class: 'chev', html: I.down, style: { width: '14px', display: 'inline-grid' } }),
            imgKey ? h('span', { class: 'mini-thumb', style: { backgroundImage: it[imgKey] ? `url("${it[imgKey]}")` : '' } }) : null,
            titleEl,
            h('button', { type: 'button', class: 'btn btn--ghost btn--icon', title: 'Move up', disabled: i === 0, onClick: () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); change(); draw(); } }, icon('up')),
            h('button', { type: 'button', class: 'btn btn--ghost btn--icon', title: 'Move down', disabled: i === arr.length - 1, onClick: () => { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); change(); draw(); } }, icon('down')),
            h('button', { type: 'button', class: 'btn btn--ghost btn--icon', title: 'Duplicate', onClick: () => { const c = clone(it); if ('id' in c) c.id = uid('api'); arr.splice(i + 1, 0, c); change(); draw(); } }, icon('copy')),
            h('button', { type: 'button', class: 'btn btn--ghost btn--icon btn--danger', title: 'Remove', onClick: () => { if (confirm('Remove this item?')) { arr.splice(i, 1); change(); draw(); } } }, icon('trash'))),
          h('div', { class: 'list-item__body' }, renderForm(def.fields, it, () => { titleEl.textContent = String(label(it, i)).replace(/\*/g, ''); const t = item.querySelector('.mini-thumb'); if (t) t.style.backgroundImage = it[imgKey] ? `url("${it[imgKey]}")` : ''; change(); })));
        return item;
      }), h('div', {}, h('button', { type: 'button', class: 'btn btn--sm', onClick: () => {
        const n = def.newItem ? def.newItem() : Object.fromEntries(def.fields.filter((f) => f.k).map((f) => [f.k, f.t === 'toggle' ? false : f.t === 'list' ? [] : '']));
        arr.push(n); open.add(n); change(); draw();
      } }, icon('plus'), def.addLabel || 'Add item')));
    };
    draw();
    return box;
  }

  // ---------- section schemas ----------
  const SCHEMAS = {
    hero: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Headline', { hint: EM }), F.area('subtitle', 'Subtitle'), row(F.link('primaryCta', 'Primary button'), F.link('secondaryCta', 'Secondary button')),
      F.list('images', 'Slideshow images', [F.img('src', 'Image'), F.text('caption', 'Caption')], { itemLabel: 'caption', addLabel: 'Add slide' }),
      F.list('badges', 'Key facts', [row(F.text('value', 'Value'), F.text('label', 'Label'))], { itemLabel: 'value', newItem: () => ({ value: '', label: '' }) }),
      row(F.num('interval', 'Seconds per slide', { min: 2, max: 30 }), F.bool('showWeather', 'Show live weather chip'))],
    marquee: [F.strings('items', 'Scrolling words', { hint: 'One per line' }), F.num('speed', 'Speed (px/sec)', { min: 5, max: 200 })],
    about: [F.text('eyebrow', 'Eyebrow'), F.area('statement', 'Big statement', { rows: 4, hint: 'Lights up word-by-word as visitors scroll.' }), row(F.img('image', 'Main image'), F.img('secondaryImage', 'Small image')), F.text('imageAlt', 'Image alt text'),
      F.list('points', 'Key points', [F.text('title', 'Title'), F.area('text', 'Text')])],
    stats: [F.list('items', 'Counters', [row(F.num('value', 'Number'), F.text('suffix', 'Suffix (+, %, k)')), F.text('label', 'Label')], { itemLabel: (it) => `${it.value}${it.suffix || ''} — ${it.label}` })],
    services: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Title', { hint: EM }), F.list('items', 'Services (bento tiles: large, small, small, wide…)', [row(F.text('tag', 'Label'), F.text('title', 'Title')), F.area('text', 'Description'), F.img('image', 'Image'), F.text('link', 'Learn more link (optional)')], { itemLabel: 'title' })],
    process: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Title', { hint: EM }), F.list('steps', 'Steps (sticky scrollytelling)', [row(F.text('label', 'Label (e.g. Week 2)'), F.text('title', 'Title')), F.area('text', 'Text'), F.img('image', 'Image')], { itemLabel: 'title' })],
    products: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Title', { hint: EM }), F.text('subtitle', 'Subtitle'),
      F.list('items', 'Products', [row(F.text('name', 'Name'), F.text('category', 'Category (used for filters)')), row(F.text('price', 'Price'), F.text('unit', 'Unit'), F.text('badge', 'Badge')), F.img('image', 'Image')], { itemLabel: 'name', addLabel: 'Add product' })],
    live: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Title', { hint: EM }), F.area('text', 'Intro text'), F.bool('showWeather', 'Show weather card (Integrations → Weather)'), { k: 'apiIds', t: 'apis', label: 'Custom API cards' }],
    gallery: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Title', { hint: EM }), F.list('images', 'Images', [F.img('src', 'Image'), F.text('caption', 'Caption')], { itemLabel: 'caption', addLabel: 'Add image' })],
    testimonials: [F.text('eyebrow', 'Eyebrow'), F.list('items', 'Testimonials', [F.area('quote', 'Quote'), row(F.text('name', 'Name'), F.text('role', 'Role')), F.img('avatar', 'Avatar (optional)')], { itemLabel: 'name' })],
    journal: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Title', { hint: EM }), F.list('posts', 'Posts', [F.text('title', 'Title'), row(F.text('tag', 'Tag'), { k: 'date', t: 'date', label: 'Date' }), F.area('excerpt', 'Excerpt'), F.img('image', 'Cover image'), F.text('link', 'Link (URL)')], { itemLabel: 'title', addLabel: 'Add post' })],
    faq: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Title', { hint: EM }), F.list('items', 'Questions', [F.text('q', 'Question'), F.area('a', 'Answer')], { itemLabel: 'q', addLabel: 'Add question' })],
    cta: [F.text('title', 'Title', { hint: EM }), F.area('text', 'Text'), F.img('image', 'Background image'), F.link('button', 'Button')],
    contact: [F.text('eyebrow', 'Eyebrow'), F.text('title', 'Title', { hint: EM }), F.area('text', 'Intro text'), row(F.bool('showNewsletter', 'Show newsletter box', { rerender: true }), F.text('newsletterTitle', 'Newsletter title')),
      { t: 'custom', render: () => h('p', { class: 'hint small muted' }, 'Email, phone, address and map are edited in Settings → Contact. Submissions arrive in Messages.') }],
  };

  // ---------- shell ----------
  const NAV_GROUPS = [
    ['Content', [['dashboard', 'Dashboard', 'dash'], ['sections', 'Homepage sections', 'layers'], ['pages', 'Pages', 'file'], ['blog', 'Blog', 'book'], ['media', 'Media library', 'image']]],
    ['Shop', [['products', 'Products', 'box'], ['orders', 'Orders', 'bag'], ['customers', 'Customers', 'users'], ['shop', 'Shop settings', 'store']]],
    ['Farmers & company', [['requests', 'Requests & leads', 'inbox'], ['advisory', 'Crop calendar & advisory', 'sprout'], ['team', 'Team & careers', 'brief']]],
    ['Settings', [['theme', 'Theme & design', 'palette'], ['settings', 'Site & languages', 'cog'], ['integrations', 'Integrations & APIs', 'plug'], ['messages', 'Messages', 'mail'], ['subscribers', 'Subscribers', 'users'], ['account', 'Account & backup', 'user']]],
  ];
  const NAV = NAV_GROUPS.flatMap((g) => g[1]);
  const PREVIEWABLE = ['sections', 'theme', 'settings', 'pages', 'blog', 'products', 'team', 'advisory', 'shop'];
  const TRANSLATABLE_PAGES = ['sections', 'settings', 'pages', 'blog', 'products', 'team', 'advisory'];
  const route = () => (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/')[0];

  function renderShell() {
    const badges = {
      messages: state.data.messages.filter((m) => !m.read).length,
      orders: state.data.orders.filter((o) => o.status === 'placed').length,
      requests: state.data.leads.filter((l) => l.status === 'new').length,
    };
    const r = route();
    const current = NAV.find((n) => n[0] === r) || NAV[0];
    const previewable = PREVIEWABLE.includes(r);
    const langs = state.data.settings.languages?.enabled || ['en'];
    if (!langs.includes(state.editLang)) state.editLang = 'en';
    const langSel = TRANSLATABLE_PAGES.includes(r) && langs.length > 1
      ? h('label', { class: `langsel${state.editLang !== 'en' ? ' is-tr' : ''}`, title: 'Content language you are editing' }, icon('globe'),
        h('select', { onChange: (e) => { state.editLang = e.target.value; renderShell(); } }, langs.map((l) => h('option', { value: l, selected: l === state.editLang }, l === 'en' ? 'Editing: English' : `Translating: ${LANGS[l] || l}`))))
      : null;
    document.body.classList.toggle('with-preview', state.preview && previewable);

    const iframe = state.iframe || h('iframe', { title: 'Live preview', src: '/?preview=1' });
    if (!state.iframe) { iframe.addEventListener('load', () => pushPreview()); state.iframe = iframe; }

    $('#root').replaceChildren(h('div', { class: 'shell' },
      h('aside', { class: 'side' },
        h('div', { class: 'side__brand', html: `${I.leaf}<span>${(state.data.settings.siteName || 'Bhoomi').replace(/[<>&]/g, '')}</span><small>CMS</small>` }),
        NAV_GROUPS.map(([g, items]) => [h('div', { class: 'side__label' }, g),
          items.map(([id, label, ic]) => h('a', { href: `#/${id}`, class: r === id ? 'is-active' : '', html: `${I[ic]}<span>${label}</span>${badges[id] ? `<span class="pill">${badges[id]}</span>` : ''}` }))]),
        h('div', { class: 'side__foot' },
          h('a', { href: '/', target: '_blank', html: `${I.ext}<span>View website</span>` }),
          h('a', { href: '#', onClick: async (e) => { e.preventDefault(); await api('POST', '/logout'); location.reload(); }, html: `${I.out}<span>Log out (${state.user.username})</span>` }))),
      h('div', { class: `main${state.editLang !== 'en' && TRANSLATABLE_PAGES.includes(r) ? ' is-translating' : ''}` },
        h('div', { class: 'top' },
          h('button', { class: 'btn btn--ghost btn--icon top__burger', onClick: () => document.body.classList.toggle('nav-open') }, icon('menu')),
          h('h1', { class: 'grow' }, current[1]),
          langSel,
          previewable ? h('button', { class: 'btn', onClick: () => { state.preview = !state.preview; renderShell(); } }, icon('eye'), state.preview ? 'Hide preview' : 'Live preview') : null,
          h('a', { class: 'btn', href: '/', target: '_blank' }, icon('ext'), 'Open site'),
          h('button', { id: 'save-btn', class: 'btn btn--primary', onClick: saveAll }, h('span', {}, ''))),
        h('div', { class: 'content-wrap' },
          h('div', { class: 'content', id: 'page' }),
          h('div', { class: `preview${state.previewMobile ? ' is-mobile' : ''}` },
            h('div', { class: 'preview__bar' },
              h('span', { class: 'badge badge--ok' }, h('span', { class: 'dot' }), 'Live preview — unsaved changes appear instantly'),
              h('span', { class: 'grow' }),
              h('button', { class: 'btn btn--sm btn--icon', title: 'Desktop', onClick: (e) => { state.previewMobile = false; e.target.closest('.preview').classList.remove('is-mobile'); } }, icon('desk')),
              h('button', { class: 'btn btn--sm btn--icon', title: 'Mobile', onClick: (e) => { state.previewMobile = true; e.target.closest('.preview').classList.add('is-mobile'); } }, icon('phone'))),
            h('div', { class: 'preview__frame' }, iframe))))));
    updateSaveBtn();
    document.body.classList.remove('nav-open');
    const page = PAGES[r] || PAGES.dashboard;
    $('#page').replaceChildren(page());
    if (state.preview && previewable) pushPreview();
  }

  const card = (title, body, actions) => h('div', { class: 'card' },
    title ? h('div', { class: 'card__head' }, h('h3', {}, title), actions || null) : null,
    h('div', { class: 'card__body' }, body));

  // ---------- generic collection editor (list + form) ----------
  const autoSlug = new WeakSet();
  function collectionPage({ key, title, schema, newItem, label, sub, thumb, slugFrom, path, note, empty }) {
    const arr = state.data[key];
    const listBox = h('div', { class: 'sec-list' });
    const editor = h('div');
    const search = h('input', { class: 'input', type: 'search', placeholder: 'Search…', onInput: () => drawList() });
    const sel = () => arr.find((x) => x.id === state.sel[key]);
    if (!sel()) state.sel[key] = arr[0]?.id;
    const changed = () => markDirty(key);

    function drawList() {
      const term = search.value.trim().toLowerCase();
      const items = arr.filter((it) => !term || JSON.stringify(it).toLowerCase().includes(term));
      listBox.replaceChildren(...(items.length ? items.map((it) => {
        const th = thumb?.(it);
        return h('div', { class: `sec-row${it.id === state.sel[key] ? ' is-active' : ''}`, onClick: () => { state.sel[key] = it.id; drawList(); drawEditor(); previewGo(path?.(it)); } },
          th !== undefined ? h('span', { class: 'mini-thumb', style: { backgroundImage: th ? `url("${th}")` : '' } }) : null,
          h('div', { class: 'grow' }, h('div', { class: 'sec-row__name' }, String(label(it) || 'Untitled').replace(/\*/g, '')), sub ? h('div', { class: 'sec-row__type' }, sub(it)) : null));
      }) : [h('div', { class: 'empty' }, empty || 'Nothing here yet.')]));
    }

    function drawEditor() {
      const it = sel();
      if (!it) { editor.replaceChildren(card(null, h('div', { class: 'empty' }, 'Select an item or add a new one.'))); return; }
      const idx = arr.indexOf(it);
      const onChange = () => {
        if (slugFrom && autoSlug.has(it)) it.slug = slug(getPath(it, slugFrom) || '');
        const slugInput = editor.querySelector('[data-slug] input');
        if (slugInput && autoSlug.has(it) && document.activeElement !== slugInput) slugInput.value = it.slug;
        changed(); drawList();
      };
      const slugField = (d) => ({ ...d, t: 'custom', render: () => {
        const inp = h('input', { type: 'text', value: it.slug || '', onInput: (e) => { autoSlug.delete(it); it.slug = slug(e.target.value); changed(); } });
        return h('div', { class: 'field', 'data-slug': '' }, h('label', {}, d.label || 'URL slug'), inp, h('span', { class: 'hint' }, path ? `URL: ${path({ ...it, slug: '' })}…` : ''));
      } });
      const mapDef = (d) => (d.row ? { row: d.row.map(mapDef) } : d.k === 'slug' ? slugField(d) : d);
      const defs = schema.map(mapDef);
      editor.replaceChildren(card(String(label(it) || 'Untitled').replace(/\*/g, ''), h('div', { class: 'stack' }, note ? h('p', { class: 'hint' }, note(it)) : null, renderForm(defs, it, onChange)),
        h('div', { class: 'row' },
          path && it.slug ? h('a', { class: 'btn btn--sm', href: path(it), target: '_blank' }, icon('ext'), 'View') : null,
          h('button', { class: 'btn btn--sm btn--icon', title: 'Move up', disabled: idx === 0, onClick: () => { arr.splice(idx - 1, 0, arr.splice(idx, 1)[0]); changed(); drawList(); drawEditor(); } }, icon('up')),
          h('button', { class: 'btn btn--sm btn--icon', title: 'Move down', disabled: idx === arr.length - 1, onClick: () => { arr.splice(idx + 1, 0, arr.splice(idx, 1)[0]); changed(); drawList(); drawEditor(); } }, icon('down')),
          h('button', { class: 'btn btn--sm btn--icon', title: 'Duplicate', onClick: () => { const c = clone(it); c.id = uid(key.slice(0, 2)); if ('slug' in c) c.slug = `${c.slug}-copy`; arr.splice(idx + 1, 0, c); state.sel[key] = c.id; changed(); drawList(); drawEditor(); } }, icon('copy')),
          h('button', { class: 'btn btn--sm btn--icon btn--danger', title: 'Delete', onClick: () => { if (!confirm('Delete this item? (Not saved until you click Save.)')) return; arr.splice(idx, 1); state.sel[key] = arr[Math.max(0, idx - 1)]?.id; changed(); drawList(); drawEditor(); } }, icon('trash')))));
    }

    drawList(); drawEditor();
    return h('div', { class: 'sections-layout' },
      h('div', { class: 'card sec-panel' },
        h('div', { class: 'card__head' }, h('h3', {}, `${title} (${arr.length})`),
          h('button', { class: 'btn btn--sm btn--primary', onClick: () => { const n = { id: uid(key.slice(0, 2)), ...newItem() }; if (slugFrom) autoSlug.add(n); arr.unshift(n); state.sel[key] = n.id; search.value = ''; changed(); drawList(); drawEditor(); } }, icon('plus'), 'Add')),
        h('div', { style: { padding: '10px 10px 0' } }, search),
        listBox),
      editor);
  }

  const tabs = (name, defs) => {
    const cur = state.tab[name] || defs[0][0];
    const body = (defs.find((d) => d[0] === cur) || defs[0])[2]();
    return h('div', { class: 'stack', style: { gap: '18px' } },
      h('div', { class: 'tabs' }, defs.map(([id, label]) => h('button', { type: 'button', class: cur === id ? 'is-active' : '', onClick: () => { state.tab[name] = id; renderShell(); } }, label))),
      body);
  };

  const money = (n) => `${state.data.commerce.currencySymbol || '₹'}${Number(n || 0).toLocaleString('en-IN')}`;
  const STATUS_LABEL = { pending_payment: 'Awaiting payment', placed: 'New', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
  function orderDetail(o) {
    const status = h('select', { class: 'input', style: { width: 'auto' } }, state.data.orderStatuses.map((st) => h('option', { value: st, selected: o.status === st }, STATUS_LABEL[st])));
    const note = h('input', { class: 'input', placeholder: 'Note for customer (e.g. courier & tracking no.)' });
    const a = o.address;
    return h('div', { class: 'stack', style: { gap: '14px' } },
      h('div', { class: 'grid-2' },
        h('table', { class: 'kv' }, o.lines.map((l) => h('tr', {}, h('th', {}, `${l.qty} × ${l.name} (${l.unit})`), h('td', {}, money(l.total)))),
          h('tr', {}, h('th', {}, 'Delivery'), h('td', {}, money(o.delivery))), h('tr', {}, h('th', {}, h('b', {}, 'Total')), h('td', {}, h('b', {}, money(o.total))))),
        h('div', {}, h('b', {}, a.name), h('div', {}, a.phone, a.email ? ` · ${a.email}` : ''), h('div', { class: 'muted' }, [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(', ')),
          o.note ? h('p', { class: 'muted' }, `Note: ${o.note}`) : null,
          h('div', { class: 'muted small', style: { marginTop: '8px' } }, `Payment: ${o.payment.method === 'cod' ? 'Cash on delivery' : 'Razorpay'} · ${o.payment.status}`))),
      h('div', { class: 'row wrap' }, status, note, h('button', { class: 'btn btn--sm btn--primary', onClick: async () => {
        try { const r = await api('PATCH', `/orders/${o.id}`, { status: status.value, note: note.value }); Object.assign(o, r.order); toast(status.value === 'cancelled' ? 'Order cancelled — stock restored' : 'Order updated'); const d = await api('GET', '/data'); state.data.products = d.products; renderShell(); } catch (e) { toast(e.message, 'err'); }
      } }, 'Update'),
      h('a', { class: 'btn btn--sm', href: `https://wa.me/${String(a.phone).replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}?text=${encodeURIComponent(`Hi ${a.name}, your ${state.data.settings.siteName} order ${o.number} is ${STATUS_LABEL[o.status].toLowerCase()}.`)}`, target: '_blank' }, 'WhatsApp customer')),
      h('div', { class: 'muted small' }, o.history.map((x) => `${fmtDate(x.at)} — ${STATUS_LABEL[x.status]}${x.note ? ` (${x.note})` : ''}`).join(' · ')));
  }

  const statusBadge = (st) => h('span', { class: `badge ${st === 'delivered' ? 'badge--ok' : st === 'cancelled' ? 'badge--off' : st === 'placed' || st === 'new' ? 'badge--warn' : ''}` }, STATUS_LABEL[st] || st);

  // ---------- pages ----------
  const PAGES = {
    products() {
      return collectionPage({
        key: 'products', title: 'Products', slugFrom: 'name', path: (p) => `/products/${p.slug}`,
        label: (p) => p.name, sub: (p) => `${money(p.price)} · ${p.category || '—'} · ${Number(p.stock) > 0 ? `${p.stock} in stock` : 'out of stock'}${p.active ? '' : ' · hidden'}`, thumb: (p) => p.images?.[0] || '',
        newItem: () => ({ slug: '', name: 'New product', category: '', price: 0, mrp: 0, unit: '1 kg', stock: 0, badge: '', featured: false, active: true, images: [], summary: '', description: '' }),
        schema: [
          row(F.text('name', 'Name'), { k: 'slug', label: 'URL slug' }),
          row(F.text('category', 'Category (used for filters)'), F.text('unit', 'Unit (e.g. 5 kg, 1 L, kit)')),
          row(F.num('price', 'Price (₹)', { min: 0 }), F.num('mrp', 'MRP (₹, optional)', { min: 0, hint: 'Shows a strike-through and % off' }), F.num('stock', 'Stock', { min: 0, hint: 'Reduced automatically by orders' })),
          row(F.text('badge', 'Badge (Bestseller, New…)'), F.bool('featured', 'Show on homepage shelf'), F.bool('active', 'Visible in shop')),
          { k: 'images', t: 'imagelist', label: 'Photos (first one is the cover)' },
          F.area('summary', 'Short summary', { rows: 2 }),
          F.md('description', 'Full description'),
        ],
      });
    },

    orders() {
      const statuses = state.data.orderStatuses;
      const filter = state.tab.orderFilter || 'open';
      const open = (o) => !['delivered', 'cancelled'].includes(o.status);
      const list = state.data.orders.filter((o) => (filter === 'all' ? true : filter === 'open' ? open(o) : o.status === filter));
      const revenue = state.data.orders.filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment').reduce((a, o) => a + o.total, 0);
      const body = h('div', {}, list.length ? list.map((o) => {
        const el = h('div', { class: 'msg order-row' },
          h('div', { class: 'row row--between wrap' }, h('span', { class: 'msg__name' }, o.number, ' ', h('span', { class: 'muted', style: { fontWeight: 400 } }, `${o.address.name} · ${o.address.city}`)), h('span', { class: 'row' }, statusBadge(o.status), h('b', {}, money(o.total)))),
          h('div', { class: 'muted small' }, `${fmtDate(o.createdAt)} · ${o.lines.reduce((a, l) => a + l.qty, 0)} items · ${o.payment.method === 'cod' ? 'Cash on delivery' : `Online (${o.payment.status})`}`),
          h('div', { class: 'msg__body' }, orderDetail(o)));
        el.addEventListener('click', (e) => { if (!e.target.closest('button, a, select, input, textarea')) el.classList.toggle('is-open'); });
        return el;
      }) : h('div', { class: 'empty' }, 'No orders here yet.'));
      return h('div', { class: 'stack', style: { gap: '20px' } },
        h('div', { class: 'grid-4' }, [['Open orders', state.data.orders.filter(open).length], ['All orders', state.data.orders.length], ['Revenue (excl. cancelled)', money(revenue)], ['Customers', state.data.customers.length]].map(([l, v]) => h('div', { class: 'card stat-card' }, h('span', { class: 'muted' }, l), h('b', {}, v)))),
        h('div', { class: 'card' }, h('div', { class: 'card__head' },
          h('div', { class: 'tabs' }, [['open', 'Open'], ['all', 'All'], ...statuses.map((st) => [st, STATUS_LABEL[st]])].map(([id, l]) => h('button', { class: filter === id ? 'is-active' : '', onClick: () => { state.tab.orderFilter = id; renderShell(); } }, l))),
          h('a', { class: 'btn btn--sm', href: '/api/admin/orders.csv' }, 'Export CSV')), h('div', { class: 'card__body card__body--flush' }, body)));
    },

    customers() {
      const cs = state.data.customers;
      const count = (email) => state.data.orders.filter((o) => o.customerEmail === email).length;
      return card(`Customer accounts (${cs.length})`, cs.length ? h('table', { class: 'table' }, h('thead', {}, h('tr', {}, ['Name', 'Email', 'Phone', 'Orders', 'Joined'].map((x) => h('th', {}, x)))),
        h('tbody', {}, cs.map((c) => h('tr', {}, h('td', {}, c.name), h('td', {}, c.email), h('td', {}, c.phone || '—'), h('td', {}, count(c.email)), h('td', { class: 'muted' }, fmtDate(c.createdAt))))))
        : h('div', { class: 'empty' }, 'No customer accounts yet. Guests can also check out without an account.'));
    },

    shop() {
      const c = state.data.commerce;
      const ch = () => markDirty('commerce');
      const rz = state.data.integrations.razorpay;
      return h('div', { class: 'stack', style: { gap: '20px' } },
        h('div', { class: 'grid-2' },
          card('Store', renderForm([
            F.bool('enabled', 'Shop is open (cart & checkout)'),
            row(F.text('currencySymbol', 'Currency symbol'), F.text('deliveryDays', 'Delivery time shown to customers')),
            row(F.num('deliveryFee', 'Delivery fee', { min: 0 }), F.num('freeDeliveryAbove', 'Free delivery above', { min: 0 }), F.num('minOrder', 'Minimum order', { min: 0 })),
            F.area('orderNote', 'Note shown at checkout', { rows: 2 }),
          ], c, ch)),
          card('Payments', h('div', { class: 'stack' },
            renderForm([F.bool('cod', 'Accept cash on delivery')], c, ch),
            h('div', { class: 'row row--between wrap' }, h('div', {}, h('b', {}, 'Online payments (UPI, cards, netbanking) via Razorpay'), h('div', { class: 'muted small' }, rz.enabled && rz.keyId ? `Connected (${rz.keyId.startsWith('rzp_live') ? 'live' : 'test'} mode)` : 'Not connected')),
              h('a', { class: 'btn btn--sm', href: '#/integrations' }, 'Set up Razorpay'))))),
        card('Delivery areas (pincodes)', renderForm([F.code('pincodes', 'Serviceable pincodes', { hint: 'One rule per line: an exact pincode (422003), a prefix with * (422*), or a range (400001-400104). Leave empty to deliver everywhere.' })], c, ch)));
    },

    blog() {
      return collectionPage({
        key: 'posts', title: 'Posts', slugFrom: 'title', path: (p) => `/blog/${p.slug}`,
        label: (p) => p.title, sub: (p) => `${p.published ? 'Published' : 'Draft'} · ${p.category || 'Uncategorised'} · ${p.date || ''}`, thumb: (p) => p.cover || '',
        newItem: () => ({ slug: '', title: 'New post', category: '', tags: [], excerpt: '', cover: '', author: state.user.username, date: new Date().toISOString().slice(0, 10), published: false, content: '' }),
        schema: [
          F.text('title', 'Title'),
          row({ k: 'slug', label: 'URL slug' }, F.text('category', 'Category'), { k: 'date', t: 'date', label: 'Date' }),
          row(F.text('author', 'Author'), { k: 'tags', t: 'tags', label: 'Tags' }, F.bool('published', 'Published')),
          F.area('excerpt', 'Excerpt (shown on cards and Google)', { rows: 2 }),
          F.img('cover', 'Cover image'),
          F.md('content', 'Article', { rows: 18 }),
        ],
      });
    },

    pages() {
      const special = { about: 'The team (Team & careers) is shown below this page.', farmers: 'The registration, soil-test and call-back forms are shown below this page. Submissions arrive in Requests & leads.', careers: 'Open jobs and the application form (Team & careers) are shown below this page.' };
      return collectionPage({
        key: 'pages', title: 'Pages', slugFrom: 'title', path: (p) => `/${p.slug}`,
        label: (p) => p.title, sub: (p) => `/${p.slug}${p.showInFooter ? ' · in footer' : ''}`,
        newItem: () => ({ slug: '', title: 'New page', subtitle: '', cover: '', content: '', seoDescription: '', showInFooter: false }),
        note: (p) => special[p.slug] || 'Link to this page from the menu in Site & languages → Navigation.',
        schema: [
          row(F.text('title', 'Title'), { k: 'slug', label: 'URL slug' }),
          F.text('subtitle', 'Subtitle'),
          F.img('cover', 'Cover image (optional)'),
          F.md('content', 'Content', { rows: 18 }),
          row(F.text('seoDescription', 'Google description'), F.bool('showInFooter', 'Show in footer “Legal” column')),
        ],
      });
    },

    team() {
      return tabs('team', [
        ['team', 'Team', () => collectionPage({ key: 'team', title: 'Team', path: () => '/about', label: (m) => m.name, sub: (m) => m.role, thumb: (m) => m.photo || '',
          newItem: () => ({ name: 'New member', role: '', photo: '', bio: '' }),
          schema: [row(F.text('name', 'Name', { noTr: true }), F.text('role', 'Role')), F.img('photo', 'Photo'), F.area('bio', 'Short bio', { rows: 2 })] })],
        ['jobs', 'Jobs', () => collectionPage({ key: 'jobs', title: 'Jobs', path: () => '/careers', label: (j) => j.title, sub: (j) => `${j.location} · ${j.active ? 'open' : 'closed'}`,
          newItem: () => ({ title: 'New role', location: '', type: 'Full-time', active: true, description: '' }),
          schema: [F.text('title', 'Title'), row(F.text('location', 'Location'), F.text('type', 'Type'), F.bool('active', 'Open')), F.md('description', 'Description')] })],
      ]);
    },

    advisory() {
      return tabs('advisory', [
        ['crops', 'Crop calendar', () => collectionPage({ key: 'crops', title: 'Crops', path: () => '/advisory', label: (c) => c.crop, sub: (c) => c.season,
          newItem: () => ({ crop: 'New crop', season: 'Kharif', sow: [], harvest: [], notes: '' }),
          schema: [row(F.text('crop', 'Crop'), F.sel('season', 'Season', ['Kharif', 'Rabi', 'Zaid', 'Perennial'])), { k: 'sow', t: 'months', label: 'Sowing months' }, { k: 'harvest', t: 'months', label: 'Harvest months' }, F.text('notes', 'Tip')] })],
        ['advisories', 'Advisories', () => collectionPage({ key: 'advisories', title: 'Advisories', path: () => '/advisory', label: (a) => a.title, sub: (a) => `${a.severity} · ${a.date}`,
          newItem: () => ({ title: 'New advisory', crop: '', region: '', date: new Date().toISOString().slice(0, 10), severity: 'Info', content: '' }),
          schema: [F.text('title', 'Title'), row(F.text('crop', 'Crop'), F.text('region', 'Region')), row({ k: 'date', t: 'date', label: 'Date' }, F.sel('severity', 'Level', ['Info', 'Medium', 'High'])), F.md('content', 'Advice', { rows: 8 })] })],
        ['schemes', 'Government schemes', () => collectionPage({ key: 'schemes', title: 'Schemes', path: () => '/advisory', label: (x) => x.name, sub: (x) => x.link,
          newItem: () => ({ name: 'New scheme', summary: '', eligibility: '', link: '' }),
          schema: [F.text('name', 'Name'), F.area('summary', 'What it offers', { rows: 3 }), F.area('eligibility', 'Who can apply', { rows: 2 }), F.text('link', 'Official link', { noTr: true })] })],
      ]);
    },

    requests() {
      const types = state.data.leadTypes;
      const filter = state.tab.leadFilter || 'all';
      const list = state.data.leads.filter((l) => filter === 'all' || l.type === filter);
      const label = { name: 'Name', phone: 'Phone', email: 'Email', village: 'Village', district: 'District', state: 'State', land: 'Land (acres)', crops: 'Crops', date: 'Preferred date', time: 'Call time', preferredLanguage: 'Language', message: 'Message', company: 'Company', products: 'Products', quantity: 'Quantity', frequency: 'Frequency', city: 'City', role: 'Role', resume: 'CV link', language: 'Site language' };
      const body = list.length ? list.map((l) => {
        const f = l.fields;
        const el = h('div', { class: `msg${l.status === 'new' ? ' unread' : ''}` },
          h('div', { class: 'row row--between wrap' }, h('span', { class: 'msg__name' }, f.name, ' ', h('span', { class: 'muted', style: { fontWeight: 400 } }, f.phone || f.email || '')), h('span', { class: 'row' }, h('span', { class: 'badge' }, l.label), statusBadge(l.status))),
          h('div', { class: 'muted small' }, [fmtDate(l.createdAt), f.village, f.district, f.company, f.role].filter(Boolean).join(' · ')),
          h('div', { class: 'msg__body' },
            h('table', { class: 'kv' }, Object.entries(f).map(([k, v]) => h('tr', {}, h('th', {}, label[k] || k), h('td', {}, /^https?:\/\//.test(v) ? h('a', { href: v, target: '_blank', rel: 'noopener' }, v) : v)))),
            h('div', { class: 'row wrap', style: { marginTop: '12px' } },
              f.phone ? h('a', { class: 'btn btn--sm btn--primary', href: `tel:${f.phone}` }, 'Call') : null,
              f.phone ? h('a', { class: 'btn btn--sm', href: `https://wa.me/${String(f.phone).replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`, target: '_blank' }, 'WhatsApp') : null,
              f.email ? h('a', { class: 'btn btn--sm', href: `mailto:${f.email}` }, 'Email') : null,
              h('select', { class: 'input', style: { width: 'auto' }, onChange: async (e) => { l.status = e.target.value; await api('PATCH', `/leads/${l.id}`, { status: l.status }); renderShell(); } }, ['new', 'contacted', 'closed'].map((st) => h('option', { value: st, selected: l.status === st }, st[0].toUpperCase() + st.slice(1)))),
              h('button', { class: 'btn btn--sm btn--danger', onClick: async () => { if (!confirm('Delete this request?')) return; await api('DELETE', `/leads/${l.id}`); state.data.leads = state.data.leads.filter((x) => x !== l); renderShell(); } }, 'Delete')),
            h('textarea', { class: 'input', rows: 2, placeholder: 'Internal note (saved when you click away)', style: { marginTop: '10px' }, onChange: (e) => { l.note = e.target.value; api('PATCH', `/leads/${l.id}`, { note: l.note }); } }, l.note || '')));
        el.addEventListener('click', (e) => { if (!e.target.closest('button, a, select, input, textarea, table')) el.classList.toggle('is-open'); });
        return el;
      }) : h('div', { class: 'empty' }, 'No requests yet. Farmer registrations, soil-test bookings, call-backs, bulk quotes and job applications appear here.');
      return h('div', { class: 'card' }, h('div', { class: 'card__head' },
        h('div', { class: 'tabs' }, [['all', 'All'], ...Object.entries(types)].map(([id, lb]) => h('button', { class: filter === id ? 'is-active' : '', onClick: () => { state.tab.leadFilter = id; renderShell(); } }, `${lb} (${id === 'all' ? state.data.leads.length : state.data.leads.filter((x) => x.type === id).length})`))),
        h('a', { class: 'btn btn--sm', href: `/api/admin/leads.csv${filter === 'all' ? '' : `?type=${filter}`}` }, 'Export CSV')), h('div', { class: 'card__body card__body--flush' }, body));
    },

    dashboard() {
      const d = state.data;
      const unread = d.messages.filter((m) => !m.read).length;
      const checks = [
        [!state.user.mustChange, 'Change the default admin password', '#/account'],
        [d.settings.siteName !== 'Bhoomi' || d.settings.contact.email !== 'hello@bhoomi.farm', 'Add your brand name & contact details', '#/settings'],
        [d.theme.preset !== 'orchard' || d.theme.colors.primary !== '#1f7a3a', 'Pick a theme & fonts', '#/theme'],
        [d.integrations.googleAnalytics.enabled, 'Connect Google Analytics', '#/integrations'],
        [d.integrations.unsplash.enabled, 'Connect Unsplash for image search', '#/integrations'],
        [d.media.length > 0, 'Upload your own photos', '#/media'],
        [d.integrations.razorpay.enabled && !!d.integrations.razorpay.keyId, 'Connect Razorpay for online payments', '#/integrations'],
        [d.integrations.mandi.apiKey && !d.integrations.mandi.apiKey.startsWith('579b464db66ec23bdd000001'), 'Add your own data.gov.in key for mandi prices', '#/integrations'],
        [d.pages.some((p) => p._t), 'Translate your pages into Hindi / Marathi', '#/pages'],
        [!d.pages.some((p) => p.slug === 'privacy-policy' && /Template/.test(p.content)), 'Review the legal page templates with a lawyer', '#/pages'],
      ];
      return h('div', { class: 'stack', style: { gap: '20px' } },
        state.user.mustChange ? h('div', { class: 'card', style: { borderColor: '#f0c4ba', background: '#fdf3f0' } }, h('div', { class: 'card__body row row--between wrap' }, h('div', {}, h('b', {}, 'You are using the default password.'), h('div', { class: 'muted' }, 'Change it now to keep your site secure.')), h('a', { class: 'btn btn--primary', href: '#/account' }, 'Change password'))) : null,
        h('div', { class: 'hello' }, h('div', { class: 'small', style: { opacity: 0.8, letterSpacing: '.1em', textTransform: 'uppercase' } }, new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })),
          h('h2', { style: { margin: '8px 0 10px' } }, `Namaste, ${state.user.username} 🌱`),
          h('p', { style: { opacity: 0.85, maxWidth: '52ch' } }, 'Edit every section, switch themes, connect APIs and watch it all update in the live preview.'),
          h('div', { class: 'row wrap', style: { marginTop: '18px' } }, h('a', { class: 'btn btn--accent', href: '#/sections' }, 'Edit content'), h('a', { class: 'btn', href: '#/theme' }, 'Customize theme'))),
        h('div', { class: 'grid-4' },
          [['New orders', d.orders.filter((o) => o.status === 'placed').length, '#/orders'], ['New requests', d.leads.filter((l) => l.status === 'new').length, '#/requests'], ['Unread messages', unread, '#/messages'], ['Products', d.products.length, '#/products']]
            .map(([l, v, href]) => h('a', { class: 'card stat-card', href, style: { textDecoration: 'none' } }, h('span', { class: 'muted' }, l), h('b', {}, v)))),
        h('div', { class: 'grid-2' },
          card('Recent messages', d.messages.length ? h('div', {}, d.messages.slice(0, 5).map((m) => h('div', { class: 'check' }, h('i', {}, m.read ? '✓' : '•'), h('div', { class: 'grow' }, h('b', {}, m.name), h('div', { class: 'muted small' }, (m.subject ? `${m.subject} · ` : '') + fmtDate(m.createdAt)))))) : h('div', { class: 'empty' }, 'No messages yet. They will appear here when visitors use the contact form.'), h('a', { class: 'btn btn--sm', href: '#/messages' }, 'View all')),
          card('Launch checklist', h('div', {}, checks.map(([done, label, href]) => h('a', { class: `check${done ? ' done' : ''}`, href, style: { textDecoration: 'none' } }, h('i', {}, done ? '✓' : ''), h('span', {}, label)))))));
    },

    sections() {
      const d = state.data;
      if (!state.selected || !d.sections.find((s) => s.id === state.selected)) state.selected = d.sections[0]?.id;
      const listBox = h('div', { class: 'sec-list' });
      const editor = h('div');
      let dragIndex = null;

      const drawList = () => {
        listBox.replaceChildren(...d.sections.map((s, i) => {
          const rowEl = h('div', { class: `sec-row${s.id === state.selected ? ' is-active' : ''}${s.enabled ? '' : ' is-off'}`, draggable: 'true',
            onClick: (e) => { if (e.target.closest('.toggle, button')) return; state.selected = s.id; drawList(); drawEditor(); scrollPreviewTo(s.id); } },
          h('span', { class: 'sec-row__handle', html: I.grip }),
          h('div', { class: 'grow' }, h('div', { class: 'sec-row__name' }, s.name || d.sectionLabels[s.type] || s.type), h('div', { class: 'sec-row__type' }, `${d.sectionLabels[s.type]} · #${s.id}`)),
          h('label', { class: 'toggle', title: s.enabled ? 'Visible' : 'Hidden' }, h('input', { type: 'checkbox', checked: s.enabled, onChange: (e) => { s.enabled = e.target.checked; markDirty('sections'); drawList(); } }), h('span', { class: 'sw' })));
          rowEl.addEventListener('dragstart', (e) => { dragIndex = i; e.dataTransfer.effectAllowed = 'move'; });
          rowEl.addEventListener('dragover', (e) => { e.preventDefault(); rowEl.classList.add('drag-over'); });
          rowEl.addEventListener('dragleave', () => rowEl.classList.remove('drag-over'));
          rowEl.addEventListener('drop', (e) => { e.preventDefault(); if (dragIndex == null || dragIndex === i) return; d.sections.splice(i, 0, d.sections.splice(dragIndex, 1)[0]); dragIndex = null; markDirty('sections'); drawList(); });
          return rowEl;
        }));
      };

      const drawEditor = () => {
        const s = d.sections.find((x) => x.id === state.selected);
        if (!s) { editor.replaceChildren(card(null, h('div', { class: 'empty' }, 'No sections yet — add one.'))); return; }
        const idx = d.sections.indexOf(s);
        const meta = [row(F.text('name', 'Section name (admin only)', { placeholder: d.sectionLabels[s.type], noTr: true }), {
          t: 'custom', render: () => {
            const inp = h('input', { type: 'text', value: s.id });
            inp.addEventListener('change', () => {
              const v = slug(inp.value);
              if (!v || d.sections.some((x) => x !== s && x.id === v)) { toast('Anchor ID must be unique', 'err'); inp.value = s.id; return; }
              d.navigation.forEach((n) => { if (n.href === `#${s.id}`) { n.href = `#${v}`; markDirty('navigation'); } });
              s.id = v; state.selected = v; markDirty('sections'); drawList();
            });
            return h('div', { class: 'field' }, h('label', {}, 'Anchor ID (for menu links: #id)'), inp);
          },
        })];
        editor.replaceChildren(card(`${d.sectionLabels[s.type]}`, h('div', { class: 'stack' },
          renderForm(meta, s, () => { markDirty('sections'); drawList(); }),
          h('hr', { class: 'sep' }),
          renderForm(SCHEMAS[s.type] || [], s, () => markDirty('sections'))),
        h('div', { class: 'row' },
          h('button', { class: 'btn btn--sm btn--icon', title: 'Move up', disabled: idx === 0, onClick: () => { d.sections.splice(idx - 1, 0, d.sections.splice(idx, 1)[0]); markDirty('sections'); drawList(); drawEditor(); } }, icon('up')),
          h('button', { class: 'btn btn--sm btn--icon', title: 'Move down', disabled: idx === d.sections.length - 1, onClick: () => { d.sections.splice(idx + 1, 0, d.sections.splice(idx, 1)[0]); markDirty('sections'); drawList(); drawEditor(); } }, icon('down')),
          h('button', { class: 'btn btn--sm', onClick: () => { const c = clone(s); c.id = uniqueId(s.type); c.name = `${s.name || d.sectionLabels[s.type]} (copy)`; d.sections.splice(idx + 1, 0, c); state.selected = c.id; markDirty('sections'); drawList(); drawEditor(); } }, icon('copy'), 'Duplicate'),
          h('button', { class: 'btn btn--sm btn--danger', onClick: () => { if (!confirm('Delete this section? You can undo by not saving.')) return; d.sections.splice(idx, 1); state.selected = d.sections[Math.max(0, idx - 1)]?.id; markDirty('sections'); drawList(); drawEditor(); } }, icon('trash')))));
      };

      const uniqueId = (type) => { let n = 1; let id = type; while (d.sections.some((x) => x.id === id)) id = `${type}-${++n}`; return id; };
      const addSel = h('select', { class: 'input' }, Object.entries(d.sectionLabels).map(([k, v]) => h('option', { value: k }, v)));
      const add = () => {
        const type = addSel.value;
        const tpl = clone(d.sectionDefaults.find((x) => x.type === type) || { type });
        tpl.id = uniqueId(type); tpl.enabled = true;
        d.sections.push(tpl); state.selected = tpl.id; markDirty('sections'); drawList(); drawEditor(); scrollPreviewTo(tpl.id);
      };

      drawList(); drawEditor();
      return h('div', { class: 'sections-layout' },
        h('div', { class: 'card sec-panel' },
          h('div', { class: 'card__head' }, h('h3', {}, 'Homepage sections'), h('span', { class: 'muted small' }, 'Drag to reorder')),
          listBox,
          h('div', { class: 'card__body', style: { borderTop: '1px solid var(--line)' } }, h('div', { class: 'row' }, addSel, h('button', { class: 'btn btn--primary', onClick: add }, icon('plus'), 'Add')))),
        editor);
    },

    theme() {
      const t = state.data.theme;
      const presets = state.data.presets;
      const box = h('div', { class: 'stack', style: { gap: '20px' } });
      const changed = () => markDirty('theme');
      const COLORS = [['primary', 'Primary'], ['primaryContrast', 'Text on primary'], ['accent', 'Accent'], ['bg', 'Background'], ['surface', 'Surface'], ['text', 'Text'], ['muted', 'Muted text'], ['border', 'Borders']];
      const FONTS = window.BHOOMI_FONTS.FONTS;
      const draw = () => {
        const stack = window.BHOOMI_FONTS.stack;
        const sample = h('div', { class: 'font-sample', style: { fontFamily: stack(t.fonts.heading), fontWeight: 700, letterSpacing: '-0.035em', background: t.colors.bg, color: t.colors.text } }, 'Food, grown ', h('span', { style: { background: `linear-gradient(100deg, ${t.colors.primary}, ${t.colors.accent})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } }, 'right.'), h('div', { style: { fontFamily: stack(t.fonts.body), fontWeight: 400, letterSpacing: '-0.02em', fontSize: '15px', marginTop: '8px', color: t.colors.muted } }, 'Regenerative farming and farm-to-door produce.'));
        const fontLink = $('#admin-font-preview') || document.head.appendChild(h('link', { id: 'admin-font-preview', rel: 'stylesheet' }));
        fontLink.href = window.BHOOMI_FONTS.fontUrl([t.fonts.heading, t.fonts.body]) || 'data:text/css,';
        box.replaceChildren(
          card('Theme presets', h('div', { class: 'presets' }, Object.entries(presets).map(([key, p]) => h('button', { class: `preset${t.preset === key ? ' is-active' : ''}`, onClick: () => { t.preset = key; t.colors = clone(p.colors); t.fonts = clone(p.fonts); changed(); draw(); } },
            h('div', { class: 'preset__sw' }, ['primary', 'accent', 'bg', 'surface', 'text'].map((c) => h('span', { style: { background: p.colors[c] } }))),
            h('div', { class: 'preset__name' }, p.label, t.preset === key ? h('span', {}, '✓') : null))))),
          h('div', { class: 'grid-2' },
            card('Colours', h('div', { class: 'grid-2' }, COLORS.map(([k, l]) => fieldEl({ k: `colors.${k}`, t: 'color', label: l }, t, () => { t.preset = 'custom'; changed(); sample.style.background = t.colors.bg; sample.style.color = t.colors.text; })))),
            card('Typography & shape', h('div', { class: 'stack' },
              sample,
              renderForm([
                row(F.sel('fonts.heading', 'Heading font', Object.keys(FONTS.heading), { rerender: true }), F.sel('fonts.body', 'Body font', Object.keys(FONTS.body), { rerender: true })),
                { k: 'radius', t: 'range', label: 'Corner radius', min: 0, max: 40, unit: 'px' },
              ], t, changed, draw)))),
          card('Layout & motion', renderForm([
            row(F.sel('heroStyle', 'Hero style', [['reveal', 'Product — centred headline, photo zooms to full-bleed'], ['split', 'Split — headline beside a framed photo'], ['minimal', 'Immersive — full-screen photo with text on top']]),
              F.sel('animations', 'Animations', [['full', 'Full — scroll zoom, parallax, storytelling'], ['reduced', 'Reduced — gentle fades only'], ['none', 'None']])),
            F.bool('smoothScroll', 'Inertia smooth scrolling (off feels most native)'),
          ], t, changed)),
          card('Custom CSS', renderForm([F.code('customCss', 'Extra CSS (applied on top of the theme)', { placeholder: '.hero__title { letter-spacing: -0.05em; }', hint: 'Advanced. Variables available: --primary, --accent, --bg, --surface, --text, --muted, --radius, --font-heading, --font-body.' })], t, changed)));
      };
      draw();
      return box;
    },

    settings() {
      const s = state.data.settings;
      const ch = () => markDirty('settings');
      return h('div', { class: 'stack', style: { gap: '20px' } },
        h('div', { class: 'grid-2' },
          card('Brand', renderForm([row(F.text('siteName', 'Site name'), F.text('logoText', 'Logo text')), F.text('tagline', 'Tagline'), F.img('logoImage', 'Logo image (optional, replaces text)'), F.img('favicon', 'Favicon')], s, ch)),
          card('Announcement bar', renderForm([F.bool('announcement.enabled', 'Show announcement bar'), F.text('announcement.text', 'Text'), F.text('announcement.link', 'Link')], s, ch))),
        card('Languages', h('div', { class: 'stack' },
          h('p', { class: 'muted' }, 'Visitors can switch language from the globe icon in the menu. Interface text (buttons, forms, shop) is translated automatically. To translate your own content, pick a language from “Translating:” at the top of any content page.'),
          h('div', { class: 'row wrap', style: { gap: '18px' } }, Object.entries(LANGS).map(([code, name]) => {
            const on = (s.languages.enabled || []).includes(code);
            return h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: on, disabled: code === 'en', onChange: (e) => {
              const set = new Set(s.languages.enabled || ['en']); e.target.checked ? set.add(code) : set.delete(code);
              s.languages.enabled = Object.keys(LANGS).filter((l) => set.has(l));
              if (!s.languages.enabled.includes(s.languages.default)) s.languages.default = 'en';
              ch(); renderShell();
            } }), h('span', { class: 'sw' }), name);
          })),
          renderForm([F.sel('languages.default', 'Default language for first-time visitors', () => (s.languages.enabled || ['en']).map((l) => [l, LANGS[l]]))], s, ch))),
        card('Navigation menu', renderForm([F.list('navigation', '', [row(F.text('label', 'Label'), F.text('href', 'Link (/page, /#section or https://…)', { noTr: true }))], { itemLabel: 'label', addLabel: 'Add menu link', newItem: () => ({ label: 'New link', href: '#' }) })], state.data, () => markDirty('navigation'))),
        h('div', { class: 'grid-2' },
          card('SEO & social sharing', renderForm([F.text('seo.title', 'Page title'), F.area('seo.description', 'Meta description', { hint: 'Aim for 140–160 characters.' }), F.text('seo.keywords', 'Keywords'), F.img('seo.ogImage', 'Share image (1200×630)')], s, ch)),
          card('Contact details', renderForm([row(F.text('contact.email', 'Email'), F.text('contact.phone', 'Phone')), F.area('contact.address', 'Address', { rows: 2 }), F.text('contact.hours', 'Opening hours'), F.area('contact.mapEmbed', 'Google Maps embed', { hint: 'Google Maps → Share → Embed a map → paste the <iframe> code or its src URL.' })], s, ch))),
        h('div', { class: 'grid-2' },
          card('Social links', renderForm(['instagram', 'facebook', 'twitter', 'youtube', 'linkedin'].map((k) => F.text(`social.${k}`, k[0].toUpperCase() + k.slice(1), { placeholder: 'https://… (leave empty to hide)' })), s, ch)),
          card('Footer', renderForm([F.area('footer.text', 'Footer note'), F.text('footer.copyright', 'Copyright', { hint: '{year} is replaced with the current year.' })], s, ch))));
    },

    media() {
      const box = h('div', { class: 'stack', style: { gap: '20px' } });
      box.append(mediaManager({ mode: 'manage' }));
      return box;
    },

    integrations() {
      const i = state.data.integrations;
      const ch = () => markDirty('integrations');
      const status = (on) => h('span', { class: `badge ${on ? 'badge--ok' : 'badge--off'}` }, h('span', { class: 'dot' }), on ? 'Connected' : 'Off');
      const integ = (emoji, title, desc, on, form) => h('div', { class: 'card' }, h('div', { class: 'card__body' },
        h('div', { class: 'integ' }, h('div', { class: 'integ__icon' }, emoji), h('div', { class: 'stack', style: { gap: '4px' } }, h('div', { class: 'row row--between' }, h('h3', {}, title), status(on)), h('p', { class: 'muted' }, desc))), form));
      const save1st = h('p', { class: 'hint small muted' }, 'Tip: test buttons use the values you typed, even before saving.');

      return h('div', { class: 'stack', style: { gap: '20px' } },
        h('div', { class: 'card' }, h('div', { class: 'card__body' }, h('p', {}, 'Connect third-party services and your own APIs. Keys are stored on your server and never sent to visitors — the site calls them through a secure server proxy.'), save1st)),
        h('div', { class: 'grid-2' },
          integ('🌦️', 'Weather', 'Live farm weather in the hero and “Live data” section. Open-Meteo works without a key; OpenWeatherMap needs one.', i.weather.enabled, renderForm([
            F.bool('weather.enabled', 'Enable weather'),
            row(F.sel('weather.provider', 'Provider', [['open-meteo', 'Open-Meteo (free, no key)'], ['openweathermap', 'OpenWeatherMap']], { rerender: true }), F.sel('weather.units', 'Units', [['metric', 'Metric (°C)'], ['imperial', 'Imperial (°F)']])),
            F.secret('weather.apiKey', 'OpenWeatherMap API key', { show: (o) => o.weather.provider === 'openweathermap' }),
            row(F.text('weather.city', 'Location name'), F.text('weather.lat', 'Latitude'), F.text('weather.lon', 'Longitude')),
            { t: 'action', label: 'Test weather', run: async (o) => (await api('POST', '/test/weather', o.weather)).result },
          ], i, ch)),
          integ('💳', 'Razorpay payments', 'Accept UPI, cards, netbanking and wallets at checkout. Use test keys first, then switch to live keys.', i.razorpay.enabled && !!i.razorpay.keyId, renderForm([
            F.bool('razorpay.enabled', 'Enable online payments'),
            F.text('razorpay.keyId', 'Key ID', { placeholder: 'rzp_test_…', noTr: true }),
            F.secret('razorpay.keySecret', 'Key Secret', { hint: 'Razorpay Dashboard → Account & Settings → API Keys.' }),
            { t: 'action', label: 'Test connection', run: async (o) => (await api('POST', '/test/razorpay', o.razorpay)).result },
          ], i, ch)),
          integ('🌾', 'Mandi prices (data.gov.in)', 'Live APMC prices on the Mandi page and homepage. Get a free API key at data.gov.in (the default sample key returns only a few rows).', i.mandi.enabled && !!i.mandi.apiKey, renderForm([
            F.bool('mandi.enabled', 'Enable mandi prices'),
            F.secret('mandi.apiKey', 'data.gov.in API key'),
            row(F.text('mandi.resourceId', 'Resource ID', { noTr: true }), F.sel('mandi.defaultState', 'Default state', ['Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'])),
            { t: 'action', label: 'Test mandi API', run: async (o) => (await api('POST', '/test/mandi', o.mandi)).result },
          ], i, ch)),
          integ('📈', 'Google Analytics 4', 'Track visitors, page views and contact-form leads.', i.googleAnalytics.enabled, renderForm([F.bool('googleAnalytics.enabled', 'Enable Google Analytics'), F.text('googleAnalytics.measurementId', 'Measurement ID', { placeholder: 'G-XXXXXXXXXX' })], i, ch)),
          integ('📷', 'Unsplash', 'Search millions of free photos straight from the media picker.', i.unsplash.enabled, renderForm([F.bool('unsplash.enabled', 'Enable Unsplash search'), F.secret('unsplash.accessKey', 'Access Key', { hint: 'Create a free app at unsplash.com/developers and copy its Access Key.' })], i, ch)),
          integ('💬', 'WhatsApp', 'Floating chat button and “Order on WhatsApp” buttons on products.', i.whatsapp.enabled, renderForm([F.bool('whatsapp.enabled', 'Enable WhatsApp'), F.text('whatsapp.number', 'Number with country code', { placeholder: '919876543210' }), F.text('whatsapp.message', 'Default message')], i, ch)),
          integ('🔗', 'Webhook', 'POST every contact message and new subscriber to Zapier, Make, n8n, Slack or your CRM.', i.webhook.enabled, renderForm([F.bool('webhook.enabled', 'Enable webhook'), F.text('webhook.url', 'Webhook URL', { placeholder: 'https://hooks.zapier.com/…' }), F.secret('webhook.secret', 'Signing secret (optional)', { hint: 'Requests include an X-Bhoomi-Signature HMAC-SHA256 header.' }),
            { t: 'action', label: 'Send test event', run: async (o) => api('POST', '/test/webhook', o.webhook) }], i, ch)),
          integ('🛡️', 'reCAPTCHA v3', 'Invisible spam protection for the contact form.', i.recaptcha.enabled, renderForm([F.bool('recaptcha.enabled', 'Enable reCAPTCHA'), F.text('recaptcha.siteKey', 'Site key'), F.secret('recaptcha.secretKey', 'Secret key')], i, ch))),
        card('Custom APIs', h('div', { class: 'stack' },
          h('p', { class: 'muted' }, 'Connect any JSON API — mandi crop prices (data.gov.in), soil sensors, your ERP, exchange rates… Public APIs can be shown as cards in the “Live data” section. Use {{apiKey}} anywhere in the URL, headers or body to insert the key securely on the server.'),
          renderForm([F.list('customApis', '', [
            row(F.text('name', 'Display name'), F.sel('method', 'Method', ['GET', 'POST', 'PUT'])),
            F.text('url', 'URL', { placeholder: 'https://api.data.gov.in/resource/…?api-key={{apiKey}}&format=json' }),
            row(F.secret('apiKey', 'API key / token'), F.num('cacheSeconds', 'Cache (seconds)', { min: 10 })),
            F.code('headers', 'Headers (JSON)', { placeholder: '{ "Authorization": "Bearer {{apiKey}}" }' }),
            F.code('body', 'Request body (for POST/PUT)', { show: (o) => o.method && o.method !== 'GET' }),
            row(F.text('display.path', 'Data path in response', { placeholder: 'records' }), F.num('display.limit', 'Max rows')),
            row(F.text('display.labelKey', 'Label field', { placeholder: 'commodity' }), F.text('display.valueKey', 'Value field', { placeholder: 'modal_price' })),
            row(F.text('display.prefix', 'Value prefix', { placeholder: '₹ ' }), F.text('display.suffix', 'Value suffix', { placeholder: ' /qtl' })),
            row(F.bool('enabled', 'Enabled'), F.bool('public', 'Show on website')),
            { t: 'action', label: 'Test request', run: async (o) => (await api('POST', '/test/api', o)).result },
          ], { itemLabel: (a) => `${a.name || 'Untitled API'}${a.enabled ? '' : ' (disabled)'}`, addLabel: 'Add custom API', newItem: () => ({ id: uid('api'), name: 'New API', method: 'GET', url: '', apiKey: '', headers: '', body: '', cacheSeconds: 300, enabled: true, public: false, display: { path: '', limit: 6, labelKey: '', valueKey: '', prefix: '', suffix: '' } }) })], i, ch))),
        card('Custom code', renderForm([F.code('customScripts.head', 'Inside <head>', { placeholder: '<!-- Meta Pixel, Hotjar, Tawk.to, verification tags… -->' }), F.code('customScripts.bodyEnd', 'Before </body>', { placeholder: '<script>…</script>' })], i, ch)));
    },

    messages() {
      const list = h('div');
      const draw = () => {
        const msgs = state.data.messages;
        list.replaceChildren(msgs.length ? h('div', {}, msgs.map((m) => {
          const el = h('div', { class: `msg${m.read ? '' : ' unread'}`, onClick: async (e) => {
            if (e.target.closest('button, a')) return;
            el.classList.toggle('is-open');
            if (!m.read) { m.read = true; el.classList.remove('unread'); api('PATCH', `/messages/${m.id}`, { read: true }).catch(() => {}); }
          } },
          h('div', { class: 'row row--between wrap' }, h('span', { class: 'msg__name' }, m.name, ' ', h('span', { class: 'muted', style: { fontWeight: 400 } }, `<${m.email}>`)), h('span', { class: 'muted small' }, fmtDate(m.createdAt))),
          h('div', { class: 'muted' }, [m.subject, m.phone].filter(Boolean).join(' · ') || 'General enquiry'),
          h('div', { class: 'msg__body' }, m.message, h('div', { class: 'row', style: { marginTop: '12px' } },
            h('a', { class: 'btn btn--sm btn--primary', href: `mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message'))}` }, 'Reply by email'),
            m.phone ? h('a', { class: 'btn btn--sm', href: `tel:${m.phone}` }, 'Call') : null,
            h('button', { class: 'btn btn--sm', onClick: async () => { m.read = !m.read; await api('PATCH', `/messages/${m.id}`, { read: m.read }); draw(); } }, m.read ? 'Mark unread' : 'Mark read'),
            h('button', { class: 'btn btn--sm btn--danger', onClick: async () => { if (!confirm('Delete this message?')) return; await api('DELETE', `/messages/${m.id}`); state.data.messages = state.data.messages.filter((x) => x !== m); draw(); } }, 'Delete'))));
          return el;
        })) : h('div', { class: 'empty' }, 'No messages yet.'));
      };
      draw();
      return h('div', { class: 'card' }, h('div', { class: 'card__head' }, h('h3', {}, `Inbox (${state.data.messages.length})`), h('button', { class: 'btn btn--sm', onClick: () => refreshInbox().then(() => renderShell()) }, 'Refresh')), h('div', { class: 'card__body card__body--flush' }, list));
    },

    subscribers() {
      const subs = state.data.subscribers;
      const body = subs.length ? h('table', { class: 'table' }, h('thead', {}, h('tr', {}, h('th', {}, 'Email'), h('th', {}, 'Subscribed'), h('th', {}, ''))),
        h('tbody', {}, subs.map((s) => h('tr', {}, h('td', {}, s.email), h('td', { class: 'muted' }, fmtDate(s.createdAt)), h('td', { style: { textAlign: 'right' } }, h('button', { class: 'btn btn--sm btn--danger', onClick: async () => { if (!confirm(`Remove ${s.email}?`)) return; await api('DELETE', `/subscribers/${encodeURIComponent(s.email)}`); state.data.subscribers = subs.filter((x) => x !== s); renderShell(); } }, 'Remove'))))))
        : h('div', { class: 'empty' }, 'No subscribers yet. Enable the newsletter box in the Contact section.');
      return h('div', { class: 'card' }, h('div', { class: 'card__head' }, h('h3', {}, `Newsletter subscribers (${subs.length})`), h('a', { class: 'btn btn--sm', href: '/api/admin/subscribers.csv' }, 'Export CSV')), h('div', { class: 'card__body card__body--flush' }, body));
    },

    account() {
      const form = { username: state.user.username, current: '', next: '', confirm: '' };
      const importInput = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onChange: async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try {
          const json = JSON.parse(await file.text());
          if (!confirm('Replace ALL site content with this backup?')) return;
          await api('POST', '/import', json); toast('Backup restored'); await reload();
        } catch (err) { toast(err.message, 'err'); }
      } });
      return h('div', { class: 'grid-2' },
        card('Login & password', h('form', { class: 'stack', onSubmit: async (e) => {
          e.preventDefault();
          if (form.next !== form.confirm) return toast('New passwords do not match', 'err');
          try { await api('POST', '/password', form); state.user.username = form.username; state.user.mustChange = false; toast('Password updated'); renderShell(); } catch (err) { toast(err.message, 'err'); }
        } }, renderForm([F.text('username', 'Username'), F.secret('current', 'Current password'), row(F.secret('next', 'New password', { hint: 'At least 8 characters' }), F.secret('confirm', 'Confirm new password'))], form, () => {}), h('div', {}, h('button', { class: 'btn btn--primary', type: 'submit' }, 'Update login')))),
        card('Backup & restore', h('div', { class: 'stack' },
          h('p', { class: 'muted' }, 'Download all content, theme, integrations, messages and subscribers as a JSON file. Uploaded images stay in the /uploads folder.'),
          h('div', { class: 'row wrap' }, h('a', { class: 'btn', href: '/api/admin/export' }, 'Download backup'), h('button', { class: 'btn', onClick: () => importInput.click() }, 'Restore from backup'), importInput),
          h('hr', { class: 'sep' }),
          h('p', { class: 'muted' }, 'Reset all content and theme to the original demo. Messages, subscribers, media and integrations are kept.'),
          h('div', {}, h('button', { class: 'btn btn--danger', onClick: async () => { if (!confirm('Reset content & theme to defaults? This cannot be undone.')) return; await api('POST', '/reset', { keep: ['messages', 'subscribers', 'media', 'integrations'] }); toast('Site reset'); await reload(); } }, 'Reset to demo content')))));
    },
  };

  // ---------- media ----------
  function mediaManager({ mode, onPick }) {
    const tabs = ['library', 'upload', 'unsplash', 'url'];
    let tab = 'library';
    const root = h('div', { class: 'stack' });
    const pick = (u, extra) => { if (onPick) onPick(u, extra); };

    const draw = () => {
      const tabBar = h('div', { class: 'tabs' }, tabs.map((t) => h('button', { type: 'button', class: tab === t ? 'is-active' : '', onClick: () => { tab = t; draw(); } }, { library: `Library (${state.data.media.length})`, upload: 'Upload', unsplash: 'Unsplash', url: 'From URL' }[t])));
      let body;
      if (tab === 'library') {
        body = state.data.media.length ? h('div', { class: 'media-grid' }, state.data.media.map((m) => h('div', { class: 'media-tile', title: m.name, onClick: (e) => { if (!e.target.closest('button') && onPick) pick(m.url); } },
          h('img', { src: m.url, alt: m.name, loading: 'lazy' }), m.credit ? h('span', { class: 'credit' }, m.credit) : null,
          h('div', { class: 'media-tile__bar' },
            onPick ? h('button', { class: 'btn btn--sm', onClick: () => pick(m.url) }, 'Use') : null,
            h('button', { class: 'btn btn--sm btn--icon', title: 'Copy URL', onClick: () => { navigator.clipboard?.writeText(m.url.startsWith('/') ? location.origin + m.url : m.url); toast('URL copied'); } }, icon('copy')),
            h('button', { class: 'btn btn--sm btn--icon btn--danger', title: 'Delete', onClick: async () => { if (!confirm('Delete this file? Sections using it will show a placeholder.')) return; await api('DELETE', `/media/${m.id}`); state.data.media = state.data.media.filter((x) => x !== m); draw(); } }, icon('trash'))))))
          : h('div', { class: 'empty' }, 'Your library is empty. Upload images or save some from Unsplash.');
      } else if (tab === 'upload') {
        const input = h('input', { type: 'file', accept: 'image/*', multiple: true, style: { display: 'none' } });
        const zone = h('div', { class: 'dropzone' }, h('div', { style: { fontSize: '28px' } }, '⬆️'), h('b', {}, 'Drop images here or click to browse'), h('div', { class: 'small' }, 'JPG, PNG, WebP, AVIF, SVG, GIF · up to 10 MB each'));
        const upload = async (files) => {
          if (!files.length) return;
          const fd = new FormData(); [...files].forEach((f) => fd.append('files', f));
          zone.replaceChildren(h('span', { class: 'spin' }), ' Uploading…');
          try { const r = await api('POST', '/media', fd, true); state.data.media.unshift(...r.items); toast(`${r.items.length} file(s) uploaded`); if (onPick && r.items.length === 1) pick(r.items[0].url); tab = 'library'; } catch (e) { toast(e.message, 'err'); }
          draw();
        };
        zone.addEventListener('click', () => input.click());
        input.addEventListener('change', () => upload(input.files));
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('is-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
        zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('is-over'); upload(e.dataTransfer.files); });
        body = h('div', {}, zone, input);
      } else if (tab === 'unsplash') {
        const u = state.data.integrations.unsplash;
        if (!u.enabled || !u.accessKey) {
          body = h('div', { class: 'empty' }, h('p', {}, 'Connect Unsplash to search free high-quality photos.'), h('a', { class: 'btn btn--primary', href: '#/integrations', onClick: () => $('.modal')?.remove() }, 'Set up Unsplash'));
        } else {
          const results = h('div', { class: 'media-grid' });
          const q = h('input', { class: 'input', placeholder: 'Search: wheat field, tractor, organic vegetables…', value: 'agriculture' });
          const search = async () => {
            results.replaceChildren(h('span', { class: 'spin' }));
            try {
              const r = await api('GET', `/unsplash?q=${encodeURIComponent(q.value)}`);
              results.replaceChildren(...(r.results.length ? r.results.map((p) => h('div', { class: 'media-tile', style: { background: p.color } },
                h('img', { src: p.thumb, alt: p.alt, loading: 'lazy' }), h('span', { class: 'credit' }, `📷 ${p.author}`),
                h('div', { class: 'media-tile__bar', style: { opacity: 1 } },
                  onPick ? h('button', { class: 'btn btn--sm', onClick: () => { api('POST', '/unsplash/track', { download: p.download }); pick(p.url); } }, 'Use') : null,
                  h('button', { class: 'btn btn--sm', onClick: async () => { const r2 = await api('POST', '/media/url', { url: p.url, name: p.alt || p.id, credit: `Photo by ${p.author} on Unsplash` }); api('POST', '/unsplash/track', { download: p.download }); state.data.media.unshift(r2.item); toast('Saved to library'); } }, 'Save')))) : [h('div', { class: 'empty' }, 'No results')]));
            } catch (e) { results.replaceChildren(h('pre', { class: 'result err' }, e.message)); }
          };
          q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
          body = h('div', { class: 'stack' }, h('div', { class: 'row' }, q, h('button', { class: 'btn btn--primary', onClick: search }, 'Search')), results);
          setTimeout(search, 0);
        }
      } else {
        const inp = h('input', { class: 'input', placeholder: 'https://images.unsplash.com/photo-…' });
        body = h('div', { class: 'row' }, inp, h('button', { class: 'btn btn--primary', onClick: async () => {
          try { const r = await api('POST', '/media/url', { url: inp.value.trim() }); state.data.media.unshift(r.item); toast('Added to library'); if (onPick) pick(r.item.url); tab = 'library'; draw(); } catch (e) { toast(e.message, 'err'); }
        } }, 'Add'));
      }
      root.replaceChildren(mode === 'manage' ? card('Media library', h('div', { class: 'stack' }, tabBar, body)) : h('div', { class: 'stack' }, tabBar, body));
    };
    draw();
    return root;
  }

  function openMediaPicker(onPick) {
    const modal = h('div', { class: 'modal', onClick: (e) => { if (e.target === modal) modal.remove(); } });
    const close = () => modal.remove();
    modal.append(h('div', { class: 'modal__box' },
      h('div', { class: 'card__head' }, h('h3', {}, 'Choose an image'), h('button', { class: 'btn btn--ghost btn--sm', onClick: close }, '✕')),
      h('div', { class: 'modal__body' }, mediaManager({ mode: 'pick', onPick: (u) => { onPick(u); close(); } }))));
    document.body.append(modal);
  }

  // ---------- login ----------
  function renderLogin() {
    const err = h('p', { class: 'small', style: { color: 'var(--danger)', minHeight: '1.2em' } });
    $('#root').replaceChildren(h('div', { class: 'login' },
      h('div', { class: 'login__art' }, h('div', { class: 'row', html: `${I.leaf}<b style="font-family:Fraunces,serif;font-size:22px;font-weight:400">Bhoomi CMS</b>` }), h('h1', { html: 'Tend your website like a <em>garden</em>.' })),
      h('div', { class: 'login__form' }, h('form', { onSubmit: async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try { const r = await api('POST', '/login', fd); state.user = { username: r.username, mustChange: r.mustChange }; await start(); } catch (x) { err.textContent = x.message; }
      } },
      h('div', {}, h('h2', {}, 'Welcome back'), h('p', { class: 'muted' }, 'Sign in to manage your website.')),
      h('div', { class: 'field' }, h('label', {}, 'Username'), h('input', { type: 'text', name: 'username', autocomplete: 'username', required: true, value: '' })),
      h('div', { class: 'field' }, h('label', {}, 'Password'), h('input', { type: 'password', name: 'password', autocomplete: 'current-password', required: true })),
      err,
      h('button', { class: 'btn btn--primary', type: 'submit', style: { padding: '12px' } }, 'Sign in'),
      h('p', { class: 'muted small' }, 'First time? The default login is admin / admin123 — change it right after signing in.')))));
  }

  // ---------- boot ----------
  async function reload() {
    state.data = await api('GET', '/data');
    state.dirty.clear();
    renderShell();
  }
  async function start() {
    state.data = await api('GET', '/data');
    renderShell();
  }

  // Pull fresh messages/subscribers without touching unsaved edits.
  async function refreshInbox() {
    const fresh = await api('GET', '/data');
    const changed = fresh.messages.length !== state.data.messages.length || fresh.subscribers.length !== state.data.subscribers.length;
    state.data.messages = fresh.messages;
    state.data.subscribers = fresh.subscribers;
    if (changed) renderShell();
  }

  addEventListener('hashchange', () => {
    if (!state.data) return;
    renderShell();
    if (['dashboard', 'messages', 'subscribers'].includes(route())) refreshInbox().catch(() => {});
  });
  addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's' && state.data) { e.preventDefault(); saveAll(); } });
  addEventListener('beforeunload', (e) => { if (state.dirty.size) { e.preventDefault(); e.returnValue = ''; } });

  (async () => {
    try { state.user = await api('GET', '/me'); await start(); } catch { renderLogin(); }
  })();
})();
