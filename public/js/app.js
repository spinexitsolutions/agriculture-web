/* Bhoomi app shell: theme, nav/footer, client-side router, motion, live preview. */
(function () {
  'use strict';
  const BH = window.BH;
  const I18N = window.BHOOMI_I18N;
  const { $, $$, esc, t, ICON, clamp, linkAttrs } = BH;
  const root = document.documentElement;
  const state = { timers: [], observers: [], scrollers: [], layouts: [], weather: null, motion: 'full', lenis: null, view: null };

  // ---------- language ----------
  function pickLang(settings) {
    const enabled = settings.languages?.enabled?.length ? settings.languages.enabled : ['en'];
    const q = new URLSearchParams(location.search).get('lang');
    let saved = null;
    try { saved = localStorage.getItem('bhoomi:lang'); } catch { /* ignore */ }
    return [q, saved, settings.languages?.default, 'en'].find((l) => l && enabled.includes(l)) || enabled[0];
  }
  function setLang(lang, rerender = true) {
    I18N.lang = lang;
    try { localStorage.setItem('bhoomi:lang', lang); } catch { /* ignore */ }
    root.lang = lang;
    BH.site = I18N.localize(BH.raw, lang);
    if (rerender) { renderChrome(); route(); }
  }

  // ---------- theme ----------
  function applyTheme(theme) {
    const F = window.BHOOMI_FONTS;
    const stack = (f) => (F ? F.stack(f) : 'system-ui, sans-serif');
    const vars = Object.entries(theme.colors || {}).map(([k, v]) => `--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`).join(';');
    let styleEl = $('#theme-vars');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'theme-vars'; document.head.appendChild(styleEl); }
    styleEl.textContent = `:root{${vars};--font-heading:${stack(theme.fonts?.heading)};--font-body:${stack(theme.fonts?.body)};--radius:${Number(theme.radius) || 0}px}`;
    const href = F ? F.fontUrl([theme.fonts?.heading, theme.fonts?.body]) : '';
    let link = $('#font-link');
    if (href) {
      if (!link) { link = document.createElement('link'); link.id = 'font-link'; link.rel = 'stylesheet'; document.head.appendChild(link); }
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    }
    let css = $('#custom-css');
    if (BH.PREVIEW || theme.customCss) {
      if (!css) { css = document.createElement('style'); css.id = 'custom-css'; document.head.appendChild(css); }
      css.textContent = theme.customCss || '';
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.motion = reduced ? 'none' : BH.lowData ? 'reduced' : (theme.animations || 'full');
    root.classList.toggle('no-motion', state.motion === 'none');
  }

  // ---------- chrome ----------
  const logo = (st) => (st.logoImage ? `<img src="${BH.url(st.logoImage)}" alt="${esc(st.siteName)}">` : `${ICON.leaf}<span>${esc(st.logoText || st.siteName)}</span>`);

  function renderChrome() {
    const site = BH.site;
    const { settings, navigation = [] } = site;
    const langs = (settings.languages?.enabled || ['en']).filter((l) => I18N.LANGS[l]);
    const langMenu = langs.length > 1 ? `
      <div class="lang"><button class="icon-btn" data-lang-toggle aria-label="${esc(t('language'))}" aria-haspopup="true">${ICON.globe}<span>${I18N.lang.toUpperCase()}</span></button>
        <div class="lang__menu" role="menu">${langs.map((l) => `<button role="menuitem" data-lang="${l}" class="${l === I18N.lang ? 'is-active' : ''}">${esc(I18N.LANGS[l])}</button>`).join('')}</div></div>` : '';
    const shopOn = site.commerce?.enabled;

    $('#nav').innerHTML = `
      <div class="nav__inner">
        <a class="logo" href="/" aria-label="${esc(settings.siteName)}">${logo(settings)}</a>
        <nav class="nav__links" aria-label="Main">${navigation.map((n) => `<a ${linkAttrs(n.href)}>${esc(n.label)}</a>`).join('')}</nav>
        <div class="nav__right">
          ${langMenu}
          ${shopOn ? `<a class="icon-btn" href="/account" aria-label="${esc(t('account'))}">${ICON.user}</a>
          <a class="icon-btn cart-btn" href="/cart" aria-label="${esc(t('cart'))}">${ICON.bag}<span class="cart-count" data-cart-count hidden></span></a>` : ''}
          <button class="burger" aria-label="${esc(t('menu'))}" aria-expanded="false"><span></span></button>
        </div>
      </div>`;

    $('#menu').innerHTML = `${navigation.map((n, i) => `<a ${linkAttrs(n.href)} style="--d:${0.05 + i * 0.04}s">${esc(n.label)}</a>`).join('')}
      ${langs.length > 1 ? `<div class="menu__langs">${langs.map((l) => `<button data-lang="${l}" class="${l === I18N.lang ? 'is-active' : ''}">${esc(I18N.LANGS[l])}</button>`).join('')}</div>` : ''}
      <div class="menu__foot"><span>${esc(settings.contact?.email || '')}</span><span>${esc(settings.contact?.phone || '')}</span></div>`;

    const ann = settings.announcement;
    const showRibbon = !!(ann?.enabled && ann.text);
    $('#ribbon').innerHTML = showRibbon ? `<div class="ribbon">${esc(ann.text)}${ann.link ? `<a class="link" ${linkAttrs(ann.link)}>${t('learnMore')}</a>` : ''}</div>` : '';
    document.body.classList.toggle('no-ribbon', !showRibbon);

    const f = settings.footer || {};
    const social = Object.entries(settings.social || {}).filter(([k, v]) => v && ICON[k]);
    const legal = (site.pages || []).filter((p) => p.showInFooter);
    const col = (title, links) => `<div><h4>${esc(title)}</h4><ul>${links.filter(Boolean).map(([l, h]) => `<li><a ${linkAttrs(h)}>${esc(l)}</a></li>`).join('')}</ul></div>`;
    const page = (slug) => site.pages.find((p) => p.slug === slug);
    $('#footer').innerHTML = `
      <div class="footer__inner">
        ${f.text ? `<p class="footer__note">${esc(f.text)}</p>` : ''}
        <div class="footer__cols">
          <div><a class="logo" href="/">${logo(settings)}</a><p>${esc(settings.tagline || '')}</p>${social.length ? `<div class="socials">${social.map(([k, v]) => `<a ${linkAttrs(v)} aria-label="${k}">${ICON[k]}</a>`).join('')}</div>` : ''}
            <p style="margin-top:14px">${esc(settings.contact?.phone || '')}<br>${esc(settings.contact?.email || '')}</p></div>
          ${shopOn ? col(t('fShop'), [[t('allProducts'), '/products'], [t('bulk'), '/bulk'], [t('trackOrder'), '/track'], [t('account'), '/account']]) : ''}
          ${col(t('fFarmers'), [page('farmers') && [page('farmers').title, '/farmers'], [BH.plain(t('mandiTitle')), '/mandi'], [t('calendar'), '/advisory'], [t('schemes'), '/advisory']])}
          ${col(t('fCompany'), [page('about') && [page('about').title, '/about'], page('careers') && [page('careers').title, '/careers'], [t('journal'), '/blog'], [t('fContact'), '/contact']])}
          ${legal.length ? col(t('fLegal'), legal.map((p) => [p.title, `/${p.slug}`])) : ''}
        </div>
        <div class="footer__bottom"><span>${esc((f.copyright || '').replace('{year}', new Date().getFullYear()))}</span><span><a href="/sitemap.xml">Sitemap</a> · <a href="/admin">Admin</a></span></div>
      </div>`;

    const wa = site.integrations?.whatsapp;
    $('#floating').innerHTML = `
      ${wa?.enabled && wa.number ? `<a class="fab" href="https://wa.me/${encodeURIComponent(wa.number)}?text=${encodeURIComponent(wa.message || '')}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.whatsapp}</a>` : ''}
      ${BH.PREVIEW ? '<span class="preview-badge">Live preview</span>' : ''}`;
    updateCartCount();
  }

  function updateCartCount() {
    const el = $('[data-cart-count]');
    if (!el) return;
    const n = BH.cart.count();
    el.hidden = !n; el.textContent = n > 99 ? '99+' : n;
  }

  function markActiveNav() {
    const p = location.pathname;
    $$('.nav__links a, .menu a').forEach((a) => {
      const h = a.getAttribute('href') || '';
      a.classList.toggle('is-active', h !== '/' && h.startsWith('/') && (p === h || p.startsWith(`${h}/`)));
    });
  }

  // ---------- router ----------
  const ROUTES = [
    [/^\/$/, 'home'],
    [/^\/products\/?$/, 'products'], [/^\/products\/([^/]+)\/?$/, 'product', 'slug'],
    [/^\/cart\/?$/, 'cart'], [/^\/checkout\/?$/, 'checkout'], [/^\/order\/([^/]+)\/?$/, 'order', 'number'],
    [/^\/track\/?$/, 'track'], [/^\/account\/?$/, 'account'],
    [/^\/blog\/?$/, 'blog'], [/^\/blog\/([^/]+)\/?$/, 'post', 'slug'],
    [/^\/services\/([^/]+)\/?$/, 'service', 'slug'],
    [/^\/contact\/?$/, 'contact'], [/^\/bulk\/?$/, 'bulk'], [/^\/mandi\/?$/, 'mandi'], [/^\/advisory\/?$/, 'advisory'],
    [/^\/([a-z0-9-]+)\/?$/, 'page', 'slug'],
  ];

  function resolve(path) {
    for (const [re, name, param] of ROUTES) {
      const m = path.match(re);
      if (m) return { name, params: param ? { [param]: decodeURIComponent(m[1]) } : {} };
    }
    return { name: 'notfound', params: {} };
  }

  BH.go = (href, replace = false) => {
    const u = new URL(href, location.origin);
    if (u.origin !== location.origin) { location.href = href; return; }
    if (!replace) history.replaceState({ ...(history.state || {}), y: scrollY }, '');
    history[replace ? 'replaceState' : 'pushState']({ y: 0 }, '', u.pathname + u.search + u.hash);
    route({ hash: u.hash });
  };

  function route({ restoreY, hash } = {}) {
    const site = BH.site;
    closeMenu();
    teardown();
    const { name, params } = resolve(location.pathname);
    let view;
    try { view = (BH.views[name] || BH.views.notfound)(params); } catch (e) { console.error(e); view = BH.views.notfound(); }
    state.view = name;
    const app = $('#app');
    app.innerHTML = `<div id="top"></div>${view.html}`;
    const immersive = name === 'home' && site.theme.heroStyle === 'minimal' && site.sections?.find((s) => s.enabled !== false)?.type === 'hero';
    $('#nav').classList.toggle('nav--clear', immersive);
    document.body.classList.toggle('has-clear-nav', immersive);
    document.body.dataset.view = name;
    app.style.paddingTop = '';
    document.title = name === 'home' ? (site.settings.seo?.title || site.settings.siteName) : `${BH.plain(view.title || '')} — ${site.settings.siteName}`;
    markActiveNav();
    initBehaviours();
    try { view.init?.(app); } catch (e) { console.error(e); }
    layout();
    if (hash && hash.length > 1) {
      requestAnimationFrame(() => { const el = document.getElementById(hash.slice(1)); if (el) scrollToEl(el, false); });
    } else {
      window.scrollTo(0, restoreY || 0);
    }
    window.gtag?.('event', 'page_view', { page_path: location.pathname });
  }

  // ---------- behaviours (re-run on every view) ----------
  function teardown() {
    state.timers.forEach(clearInterval);
    state.observers.forEach((o) => o.disconnect());
    state.timers = []; state.observers = []; state.scrollers = []; state.layouts = [];
  }
  const animated = () => state.motion !== 'none';
  const rich = () => state.motion === 'full';
  const onScroll = (fn) => state.scrollers.push(fn);
  const onLayout = (fn) => state.layouts.push(fn);
  const layout = () => state.layouts.forEach((fn) => fn());
  const every = (fn, ms) => { const tm = setInterval(fn, ms); state.timers.push(tm); return tm; };
  const isVisible = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

  function initBehaviours() {
    initReveals(); initHero(); initStrip(); initWords(); initCounters(); initParallax(); initStory();
    initShelf(); initGallery(); initQuotes(); initFaq(); initContactForms(); initCta();
    loadWeather(); loadApis(); loadMandiMini();
  }

  function initReveals() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    $$('[data-reveal]').forEach((el) => io.observe(el));
    state.observers.push(io);
  }

  function initHero() {
    const hero = $('[data-hero]');
    if (!hero) return;
    const slides = $$('.hero__slide', hero);
    const dots = $$('.pager [data-go]', hero);
    const cap = $('.js-hero-cap', hero);
    const sec = BH.site.sections.find((s) => s.type === 'hero') || {};
    const imgs = (sec.images || []).filter((i) => i.src);
    const interval = (Number(sec.interval) || 6) * 1000;
    let index = 0; let timer;
    const go = (n) => {
      if (slides.length < 2) return;
      index = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      if (cap) cap.textContent = imgs[index]?.caption || '';
    };
    const restart = () => { clearInterval(timer); timer = every(() => go(index + 1), interval); };
    dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.go)); restart(); }));
    if (slides.length > 1 && !BH.lowData) restart();
    const stage = $('[data-stage]', hero);
    if (stage) {
      const pin = $('.hero__pin', stage);
      if (!animated()) { pin.style.setProperty('--p', 1); return; }
      onScroll(() => {
        const r = stage.getBoundingClientRect();
        const travel = Math.max(1, r.height - innerHeight + 48);
        const p = clamp((innerHeight * 0.35 - r.top) / (travel * 0.75 + innerHeight * 0.35));
        pin.style.setProperty('--p', (1 - Math.pow(1 - p, 2)).toFixed(4));
      });
    }
  }

  function initStrip() {
    $$('[data-strip]').forEach((track) => {
      const group = $('.strip__group', track);
      if (!group || !group.children.length) return;
      const base = group.innerHTML; let guard = 0;
      while (group.scrollWidth < innerWidth * 1.2 && guard++ < 10) group.insertAdjacentHTML('beforeend', base);
      track.appendChild(group.cloneNode(true));
      const speed = (Number(track.dataset.strip) || 40) * 0.6;
      let x = 0; let last = performance.now();
      onScroll(() => {
        const now = performance.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (!animated()) return;
        const w = group.scrollWidth;
        x -= speed * dt; if (x <= -w) x += w;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });
  }

  function initWords() {
    $$('[data-words]').forEach((el) => {
      const words = $$('.w', el);
      if (!animated()) { words.forEach((w) => w.classList.add('on')); return; }
      onScroll(() => {
        const r = el.getBoundingClientRect();
        const start = innerHeight * 0.85; const end = innerHeight * 0.4;
        const lit = Math.round(clamp((start - r.top) / (start - end + r.height * 0.6)) * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < lit));
      });
    });
  }

  function initCounters() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target; const to = Number(el.dataset.count) || 0;
        if (!animated()) { el.textContent = to.toLocaleString('en-IN'); return; }
        const t0 = performance.now();
        const tick = (tm) => { const k = clamp((tm - t0) / 1600); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN'); if (k < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach((el) => io.observe(el));
    state.observers.push(io);
  }

  function initParallax() {
    if (!rich()) return;
    const els = $$('[data-parallax]');
    onScroll(() => els.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      el.style.transform = `translate3d(0,${((r.top + r.height / 2 - innerHeight / 2) * -(Number(el.dataset.parallax) || 0.06)).toFixed(1)}px,0)`;
    }));
  }

  function initStory() {
    $$('[data-story]').forEach((story) => {
      const steps = $$('.story__step', story);
      const imgs = $$('.story__img', story);
      const count = $('.js-story-count', story);
      let active = 0;
      onScroll(() => {
        let idx = 0;
        steps.forEach((st, i) => { if (st.getBoundingClientRect().top < innerHeight * 0.5) idx = i; });
        if (idx === active) return;
        active = idx;
        steps.forEach((st, i) => st.classList.toggle('is-active', i === idx));
        imgs.forEach((im, i) => im.classList.toggle('is-active', i === idx));
        if (count) count.textContent = `${BH.pad(idx + 1)} / ${BH.pad(steps.length)}`;
      });
    });
  }

  function initShelf() {
    $$('[data-shelf-section]').forEach((sec) => {
      const shelf = $('[data-shelf]', sec);
      const [prev, next] = $$('.paddle', sec);
      const update = () => { prev.disabled = shelf.scrollLeft < 8; next.disabled = shelf.scrollLeft + shelf.clientWidth >= shelf.scrollWidth - 8; };
      $$('.paddle', sec).forEach((b) => b.addEventListener('click', () => {
        const card = $('.card:not(.is-hidden)', shelf);
        shelf.scrollBy({ left: Number(b.dataset.dir) * ((card?.offsetWidth || 300) + 20) * 2, behavior: 'smooth' });
      }));
      shelf.addEventListener('scroll', update, { passive: true });
      onLayout(update);
      const chips = $$('[data-filter]', sec);
      chips.forEach((chip) => chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.toggle('is-active', c === chip));
        $$('.card', shelf).forEach((c) => c.classList.toggle('is-hidden', chip.dataset.filter !== '*' && c.dataset.cat !== chip.dataset.filter));
        shelf.scrollTo({ left: 0 }); update();
      }));
    });
  }

  function initGallery() {
    $$('[data-gallery]').forEach((g) => {
      const track = $('.gallery__track', g);
      const slides = $$('.gallery__slide', g);
      const dots = $$('[data-go]', g);
      const play = $('.gallery__play', g);
      if (!slides.length) return;
      let index = 0; let playing = animated() && !BH.lowData; let timer; let st;
      const setActive = (i) => { index = i; slides.forEach((s, k) => s.classList.toggle('is-active', k === i)); dots.forEach((d, k) => d.classList.toggle('is-active', k === i)); };
      const go = (i) => { const s = slides[(i + slides.length) % slides.length]; track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: 'smooth' }); };
      track.addEventListener('scroll', () => {
        clearTimeout(st);
        st = setTimeout(() => {
          const c = track.scrollLeft + track.clientWidth / 2;
          let best = 0; let bestD = Infinity;
          slides.forEach((s, k) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - c); if (d < bestD) { bestD = d; best = k; } });
          setActive(best);
        }, 60);
      }, { passive: true });
      const start = () => { clearInterval(timer); if (playing) timer = every(() => { if (isVisible(g)) go(index + 1); }, 5000); };
      dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.go)); start(); }));
      play?.addEventListener('click', () => { playing = !playing; play.innerHTML = playing ? ICON.pause : ICON.play; play.setAttribute('aria-label', playing ? 'Pause' : 'Play'); start(); });
      if (play && !playing) play.innerHTML = ICON.play;
      start();
    });
  }

  function initQuotes() {
    $$('[data-quotes]').forEach((wrap) => {
      const quotes = $$('.quote', wrap);
      const dots = $$('[data-q]', wrap.parentElement);
      let i = 0; let timer;
      const show = (n) => { i = (n + quotes.length) % quotes.length; quotes.forEach((q, k) => q.classList.toggle('is-active', k === i)); dots.forEach((d, k) => d.classList.toggle('is-active', k === i)); };
      const start = () => { clearInterval(timer); if (quotes.length > 1) timer = every(() => show(i + 1), 7000); };
      dots.forEach((d) => d.addEventListener('click', () => { show(Number(d.dataset.q)); start(); }));
      start();
    });
  }

  function initFaq() {
    $$('.faq__item').forEach((item) => {
      $('.faq__q', item).addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        $('.faq__q', item).setAttribute('aria-expanded', String(open));
      });
    });
  }

  function initCta() {
    if (!rich()) return;
    $$('[data-cta]').forEach((tile) => {
      const im = $('.cta__img', tile);
      if (!im) return;
      onScroll(() => {
        const r = im.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        im.style.setProperty('--s', (1.12 - clamp((innerHeight - r.top) / (innerHeight + r.height)) * 0.12).toFixed(4));
      });
    });
  }

  async function recaptchaToken() {
    const rc = BH.site.integrations?.recaptcha;
    if (!rc?.enabled || !window.grecaptcha) return '';
    return new Promise((res) => grecaptcha.ready(() => grecaptcha.execute(rc.siteKey, { action: 'contact' }).then(res, () => res(''))));
  }

  function initContactForms() {
    $$('[data-contact]').forEach((form) => form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const st = $('.status', form);
      const data = Object.fromEntries(new FormData(form));
      if (!data.name || !data.email || !data.message) { st.className = 'status err'; st.textContent = t('fillRequired'); return; }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; st.className = 'status'; st.textContent = t('sending');
      try {
        if (BH.PREVIEW) throw new Error(t('previewForms'));
        data.token = await recaptchaToken();
        await BH.api('/api/contact', data);
        form.reset(); st.className = 'status ok'; st.textContent = t('msgThanks');
        window.gtag?.('event', 'generate_lead', { form: 'contact' });
      } catch (err) { st.className = 'status err'; st.textContent = err.message; } finally { btn.disabled = false; }
    }));
    $$('[data-subscribe]').forEach((form) => form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const st = form.parentElement.querySelector('.status');
      try {
        if (BH.PREVIEW) throw new Error(t('previewForms'));
        await BH.api('/api/subscribe', Object.fromEntries(new FormData(form)));
        form.reset(); st.className = 'status ok'; st.textContent = t('subscribed');
      } catch (err) { st.className = 'status err'; st.textContent = err.message; }
    }));
  }

  async function loadWeather() {
    if (!BH.site.integrations?.weather?.enabled || !$('.js-wx-temp')) return;
    try {
      if (!state.weather) state.weather = await BH.api('/api/weather');
      const w = state.weather;
      $$('.js-wx-temp').forEach((el) => { el.textContent = `${w.temp}°`; });
      $$('.js-wx-cond').forEach((el) => { el.textContent = el.closest('.js-weather-chip') ? `${w.city} · ${w.condition}` : w.condition; });
      $$('.js-weather-chip .wx-icon, .js-wx-icon').forEach((el) => { el.textContent = w.icon; });
      $$('.js-wx-hum').forEach((el) => { el.textContent = w.humidity; });
      $$('.js-wx-wind').forEach((el) => { el.textContent = `${w.wind} ${w.windUnit}`; });
      $$('.js-wx-days').forEach((el) => {
        el.innerHTML = (w.daily || []).map((d) => `<div class="weather__day"><span>${BH.date(d.date, { weekday: 'short' })}</span><span style="font-size:22px">${d.icon}</span><b>${d.max}°</b><span style="opacity:.7">${d.min}°</span></div>`).join('');
      });
    } catch {
      $$('.js-weather-chip').forEach((el) => el.remove());
      $$('.js-weather-card').forEach((el) => { const grid = el.parentElement; el.remove(); if (!grid.querySelector('.api-card')) grid.closest('section')?.remove(); });
      layout();
    }
  }

  async function loadApis() {
    $$('[data-api]').forEach(async (card) => {
      const body = $('.js-api-body', card);
      const meta = (BH.site.integrations?.customApis || []).find((a) => a.id === card.dataset.api) || {};
      try {
        const j = await BH.api(`/api/custom/${encodeURIComponent(card.dataset.api)}`);
        body.innerHTML = renderApiData(j.data, meta.display || {});
      } catch { body.innerHTML = '<p class="body">—</p>'; }
    });
  }

  async function loadMandiMini() {
    const card = $('[data-mandi-mini]');
    if (!card) return;
    try {
      const r = await BH.api('/api/mandi');
      const seen = new Set();
      const rows = r.records.filter((x) => !seen.has(x.commodity) && seen.add(x.commodity)).slice(0, 5);
      if (!rows.length) throw new Error('empty');
      $('.js-api-body', card).innerHTML = `<p class="muted small">${esc(r.state)}${r.updated ? ` · ${esc(r.updated)}` : ''}</p><ul class="api-list">${rows.map((x) => `<li><span>${esc(x.commodity)} <small class="muted">${esc(x.market)}</small></span><span>${BH.money(x.modal)}</span></li>`).join('')}</ul>`;
    } catch {
      card.remove();
    }
  }

  function renderApiData(data, d) {
    const limit = Number(d.limit) || 6;
    const pick = (o, k) => (k ? k.split('.').reduce((a, x) => (a == null ? a : a[x]), o) : undefined);
    const val = (v) => `${esc(d.prefix || '')}${esc(typeof v === 'object' ? JSON.stringify(v) : v)}${esc(d.suffix || '')}`;
    if (Array.isArray(data)) {
      return `<ul class="api-list">${data.slice(0, limit).map((row) => {
        if (typeof row !== 'object' || row === null) return `<li><span>${esc(row)}</span></li>`;
        const keys = Object.keys(row);
        return `<li><span>${esc(pick(row, d.labelKey) ?? row[keys[0]])}</span><span>${val(pick(row, d.valueKey) ?? row[keys[1]] ?? '')}</span></li>`;
      }).join('')}</ul>`;
    }
    if (data && typeof data === 'object') return `<ul class="api-list">${Object.entries(data).filter(([, v]) => typeof v !== 'object').slice(0, limit).map(([k, v]) => `<li><span>${esc(k)}</span><span>${val(v)}</span></li>`).join('')}</ul>`;
    return `<div class="api-big grad">${val(data)}</div>`;
  }

  // ---------- global events (bound once) ----------
  function scrollToEl(target, smooth = true) {
    const top = target === document.body ? 0 : target.getBoundingClientRect().top + scrollY - 48;
    if (state.lenis && smooth) state.lenis.scrollTo(top, { duration: 1.2 });
    else window.scrollTo({ top, behavior: smooth && animated() ? 'smooth' : 'auto' });
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    $('#menu')?.setAttribute('aria-hidden', 'true');
    $('.lang')?.classList.remove('is-open');
    state.lenis?.start();
  }

  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); BH.cart.add(add.dataset.add, 1); BH.toast(`✓ ${t('added')}`); return; }
      const lb = e.target.closest('[data-lang]');
      if (lb) { setLang(lb.dataset.lang); return; }
      if (e.target.closest('[data-lang-toggle]')) { $('.lang').classList.toggle('is-open'); return; }
      if (!e.target.closest('.lang')) $('.lang')?.classList.remove('is-open');
      if (e.target.closest('.burger')) {
        const open = document.body.classList.toggle('menu-open');
        $('#menu').setAttribute('aria-hidden', String(!open));
        $('.burger')?.setAttribute('aria-expanded', String(open));
        open ? state.lenis?.stop() : state.lenis?.start();
        return;
      }
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (href.startsWith('#')) {
        const el = href.length > 1 && document.getElementById(href.slice(1));
        if (el) { e.preventDefault(); closeMenu(); scrollToEl(el); }
        else if (state.view !== 'home') { e.preventDefault(); BH.go(`/${href}`); }
        return;
      }
      const u = new URL(href, location.href);
      if (u.origin !== location.origin || /^\/(admin|api|uploads|vendor)\b/.test(u.pathname) || /\.[a-z0-9]{2,5}$/i.test(u.pathname)) return;
      e.preventDefault();
      if (u.pathname === location.pathname && u.search === location.search) {
        if (u.hash) { const el = document.getElementById(u.hash.slice(1)); if (el) scrollToEl(el); } else scrollToEl(document.body);
        closeMenu();
        return;
      }
      BH.go(u.pathname + u.search + u.hash);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('cart', updateCartCount);
    addEventListener('storage', (e) => { if (e.key === 'bhoomi:cart') updateCartCount(); });
    history.scrollRestoration = 'manual';
    addEventListener('popstate', (e) => route({ restoreY: e.state?.y || 0, hash: location.hash }));

    const nav = $('#nav');
    const loop = (tm) => {
      state.lenis?.raf(tm);
      const y = scrollY;
      nav.classList.toggle('is-scrolled', y > (nav.classList.contains('nav--clear') ? innerHeight * 0.75 : 4));
      state.scrollers.forEach((fn) => fn(y));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    addEventListener('load', layout);
  }

  function initLenis(theme) {
    const want = theme.smoothScroll === true && state.motion === 'full' && window.Lenis && !matchMedia('(pointer: coarse)').matches;
    if (want && !state.lenis) state.lenis = new window.Lenis({ duration: 1.1, autoRaf: false });
    else if (!want && state.lenis) { state.lenis.destroy(); state.lenis = null; }
  }

  // ---------- boot ----------
  async function boot() {
    let raw;
    try { raw = await BH.api('/api/site'); } catch {
      $('#app').innerHTML = '<p style="padding:20vh 2rem;text-align:center">Could not load the site. Please check your connection and refresh.</p>';
      return;
    }
    BH.raw = raw;
    applyTheme(raw.theme);
    setLang(pickLang(raw.settings), false);
    renderChrome();
    bindGlobal();
    initLenis(raw.theme);
    route({ hash: location.hash });
    if ('serviceWorker' in navigator && !BH.PREVIEW && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Live preview from the admin panel: merge unsaved data and re-render in place.
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object' || !BH.raw) return;
    if (e.data.type === 'bhoomi:preview') {
      const y = scrollY;
      const inc = e.data.site || {};
      BH.raw = { ...BH.raw, ...inc, integrations: { ...BH.raw.integrations, ...(inc.integrations || {}) } };
      applyTheme(BH.raw.theme);
      if (e.data.lang && e.data.lang !== I18N.lang) I18N.lang = e.data.lang;
      setLang(I18N.lang, false);
      initLenis(BH.raw.theme);
      renderChrome();
      route({ restoreY: y });
      $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    }
    if (e.data.type === 'bhoomi:navigate' && e.data.path) BH.go(e.data.path);
    if (e.data.type === 'bhoomi:scrollTo') {
      if (state.view !== 'home') BH.go(`/#${e.data.id}`);
      else { const el = document.getElementById(e.data.id); if (el) scrollToEl(el); }
    }
  });

  boot();
})();
