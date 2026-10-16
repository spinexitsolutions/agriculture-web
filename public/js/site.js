/* Bhoomi public site — renders CMS content and drives all motion. */
(() => {
  'use strict';

  const PREVIEW = new URLSearchParams(location.search).has('preview');
  const state = { site: null, lenis: null, timers: [], observers: [], scrollers: [], layouts: [], weather: null, motion: 'full' };
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- formatting ----------
  const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s = '') => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
  const plain = (s = '') => String(s).replace(/\*/g, '');
  const url = (u = '') => (/^\s*(javascript|data|vbscript):/i.test(u) ? '#' : esc(u));
  const img = (src, alt = '', extra = '') => src
    ? `<img src="${url(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" onerror="this.classList.add('img-fallback')" ${extra}>`
    : '';
  const isExternal = (h = '') => /^https?:\/\//.test(h) && !h.startsWith(location.origin);
  const linkAttrs = (h) => `href="${url(h)}"${isExternal(h) ? ' target="_blank" rel="noopener"' : ''}`;

  // Split a headline into animatable words, keeping *emphasis*.
  function splitWords(text = '') {
    let i = 0;
    return String(text).split(/(\*[^*]+\*)/g).filter(Boolean).map((chunk) => {
      const em = /^\*.*\*$/.test(chunk);
      // Keep original whitespace so punctuation like "tomorrow," stays attached.
      return (em ? chunk.slice(1, -1) : chunk).split(/(\s+)/).map((w) => {
        if (!w) return '';
        if (/^\s+$/.test(w)) return ' ';
        const inner = em ? `<em>${esc(w)}</em>` : esc(w);
        return `<span class="split-word"><span style="--i:${i++}">${inner}</span></span>`;
      }).join('');
    }).join('');
  }

  const ICON = {
    arrow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    left: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 12H5m6-6-6 6 6 6"/></svg>',
    right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    up: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>',
    star: '<svg class="marquee__star" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M24 0c1.6 12.4 11.6 22.4 24 24-12.4 1.6-22.4 11.6-24 24C22.4 35.6 12.4 25.6 0 24 12.4 22.4 22.4 12.4 24 0Z"/></svg>',
    leaf: '<svg class="logo__mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="currentColor" opacity=".12"/><path d="M32 50V20m0 10c-8 0-14-5-14-13 8 0 14 5 14 13Zm0 8c8 0 14-5 14-13-8 0-14 5-14 13Z" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8V6.5c0-.7.5-1 1-1h2V2h-3c-2.8 0-4 2-4 4.3V8H8v3.5h2V22h4V11.5h2.8L17 8h-3Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15V9l5.8 3-5.8 3Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5Z"/></svg>',
  };

  const btn = (b, cls = '') => (b && b.label ? `<a class="btn ${cls}" data-magnetic ${linkAttrs(b.href || '#')}>${esc(b.label)}<span class="btn__icon">${ICON.arrow}</span></a>` : '');
  const head = (s, extra = '') => `
    <div class="section-head">
      <div>
        ${s.eyebrow ? `<span class="eyebrow" data-reveal>${esc(s.eyebrow)}</span>` : ''}
        ${s.title ? `<h2 class="h-lg" data-split>${splitWords(s.title)}</h2>` : ''}
      </div>
      ${extra}
    </div>`;

  // ---------- section renderers ----------
  const R = {
    hero(s, site) {
      const style = site.theme.heroStyle || 'reveal';
      const imgs = (s.images || []).filter((i) => i.src);
      const pad = (n) => String(n).padStart(2, '0');
      return `
      <section class="hero hero--${esc(style)}" id="${esc(s.id)}" data-hero style="--hero-int:${(Number(s.interval) || 6) + 1}s">
        <div class="hero__sticky">
          <div class="hero__frame">
            <div class="hero__slides">
              ${imgs.map((im, i) => `<div class="hero__slide${i === 0 ? ' is-active' : ''}">${img(im.src, im.caption, i === 0 ? 'loading="eager" fetchpriority="high"' : '')}</div>`).join('')}
            </div>
            <div class="hero__shade"></div>
          </div>
          <div class="hero__content">
            <div class="hero__top">
              ${s.eyebrow ? `<span class="eyebrow hero__eyebrow" data-reveal style="--d:.2s">${esc(s.eyebrow)}</span>` : '<span></span>'}
              ${s.showWeather && site.integrations?.weather?.enabled ? `<div class="glass hero__weather js-weather-chip" data-reveal style="--d:.5s"><span class="wx-icon">🌤️</span><div><b class="js-wx-temp">--°</b><div class="js-wx-cond">${esc(site.integrations.weather.city)}</div></div></div>` : ''}
            </div>
            <div class="hero__bottom">
              <div>
                <h1 class="hero__title" data-split>${splitWords(s.title)}</h1>
                ${s.subtitle ? `<p class="hero__sub" data-reveal style="--d:.5s">${esc(s.subtitle)}</p>` : ''}
                <div class="hero__ctas" data-reveal style="--d:.65s">
                  ${btn(s.primaryCta, 'btn--light')}
                  ${btn(s.secondaryCta, 'btn--ghost')}
                </div>
              </div>
              <div class="hero__meta" data-reveal style="--d:.8s">
                ${(s.badges || []).length ? `<div class="hero__badges">${s.badges.map((b) => `<div class="glass hero__badge"><strong>${esc(b.value)}</strong><span>${esc(b.label)}</span></div>`).join('')}</div>` : ''}
                ${imgs.length > 1 ? `
                <div class="hero__dots">${imgs.map((_, i) => `<button class="hero__dot${i === 0 ? ' is-active' : ''}" data-go="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>
                <div class="hero__counter"><span class="js-hero-cur">01</span><div class="hero__track"><span></span></div><span>${pad(imgs.length)}</span></div>` : ''}
                <div class="hero__caption js-hero-cap">${esc(imgs[0]?.caption || '')}</div>
              </div>
            </div>
          </div>
          <div class="hero__side">${esc(site.settings.tagline || '')}</div>
          <div class="hero__scroll" aria-hidden="true"></div>
        </div>
      </section>`;
    },

    marquee(s) {
      const items = (s.items || []).map((t) => `<span class="marquee__item">${esc(t)}</span>${ICON.star}`).join('');
      return `<section class="marquee" id="${esc(s.id)}" aria-label="Highlights"><div class="marquee__track" data-marquee="${Number(s.speed) || 40}"><div class="marquee__group">${items}</div></div></section>`;
    },

    about(s) {
      const words = esc(s.statement || '').split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
      return `
      <section class="section about" id="${esc(s.id)}">
        <div class="container">
          <div class="about__grid">
            <div class="about__aside">
              ${s.eyebrow ? `<span class="eyebrow" data-reveal>${esc(s.eyebrow)}</span>` : ''}
              ${s.secondaryImage ? `<div class="media about__thumb" data-reveal="clip">${img(s.secondaryImage, '', 'data-parallax="0.08"')}</div>` : ''}
            </div>
            <div>
              <p class="about__statement" data-words>${words}</p>
              <div class="about__media">
                ${s.image ? `<div class="media about__main" data-reveal="clip" data-cursor="view">${img(s.image, s.imageAlt, 'data-parallax="0.1"')}</div>` : '<div></div>'}
                <div class="about__points">
                  ${(s.points || []).map((p, i) => `<div class="about__point" data-reveal style="--d:${i * 0.1}s"><span>0${i + 1}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>`;
    },

    stats(s) {
      const items = s.items || [];
      return `
      <section class="stats" id="${esc(s.id)}">
        <div class="container">
          <div class="stats__grid" style="--n:${Math.min(items.length, 4) || 1}">
            ${items.map((it, i) => `<div class="stat" data-reveal style="--d:${i * 0.1}s"><div class="stat__value"><span data-count="${Number(it.value) || 0}">0</span>${it.suffix ? `<sup>${esc(it.suffix)}</sup>` : ''}</div><p class="stat__label">${esc(it.label)}</p></div>`).join('')}
          </div>
        </div>
      </section>`;
    },

    services(s) {
      return `
      <section class="section services" id="${esc(s.id)}">
        <div class="container">
          ${head(s)}
          <div class="services__list" data-stack>
            ${(s.items || []).map((it, i) => `
              <article class="service" style="--i:${i}">
                <div class="service__text">
                  <span class="service__tag">${esc(it.tag || String(i + 1).padStart(2, '0'))}</span>
                  <div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>
                </div>
                <div class="service__img">${img(it.image, it.title)}</div>
              </article>`).join('')}
          </div>
        </div>
      </section>`;
    },

    process(s) {
      const steps = s.steps || [];
      return `
      <section class="process" id="${esc(s.id)}" data-hscroll>
        <div class="process__pin">
          <div class="container process__head">
            <div style="display:grid;gap:18px">
              ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ''}
              <h2 class="h-md" data-split>${splitWords(s.title)}</h2>
            </div>
            <span class="step__num">${String(steps.length).padStart(2, '0')} STEPS · SCROLL →</span>
          </div>
          <div class="process__track">
            ${steps.map((st, i) => `
              <div class="step">
                <div class="step__img">${img(st.image, st.title)}${st.label ? `<span class="step__label">${esc(st.label)}</span>` : ''}</div>
                <span class="step__num">STEP ${String(i + 1).padStart(2, '0')}</span>
                <h3>${esc(st.title)}</h3>
                <p>${esc(st.text)}</p>
              </div>`).join('')}
          </div>
          <div class="container"><div class="process__bar"><span></span></div></div>
        </div>
      </section>`;
    },

    products(s, site) {
      const items = s.items || [];
      const cats = [...new Set(items.map((p) => p.category).filter(Boolean))];
      const wa = site.integrations?.whatsapp;
      const order = (p) => wa?.enabled
        ? `https://wa.me/${encodeURIComponent(wa.number)}?text=${encodeURIComponent(`Hi! I'd like to order: ${p.name} (${p.price} ${p.unit || ''})`)}`
        : '#contact';
      return `
      <section class="section products" id="${esc(s.id)}">
        <div class="container">
          ${head(s, `<div style="display:grid;gap:18px;justify-items:end">${s.subtitle ? `<p class="lead" data-reveal>${esc(s.subtitle)}</p>` : ''}${cats.length > 1 ? `<div class="filters" data-reveal><button class="chip is-active" data-filter="*">All</button>${cats.map((c) => `<button class="chip" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}</div>`)}
          <div class="products__grid">
            ${items.map((p, i) => `
              <article class="product" data-cat="${esc(p.category)}" data-reveal style="--d:${(i % 3) * 0.1}s">
                <div class="product__img">
                  ${p.badge ? `<span class="product__badge">${esc(p.badge)}</span>` : ''}
                  ${img(p.image, p.name)}
                  <a class="product__order" ${linkAttrs(order(p))}>${wa?.enabled ? 'Order on WhatsApp' : 'Enquire now'} ${ICON.arrow}</a>
                </div>
                <div class="product__info">
                  <div><h3>${esc(p.name)}</h3><span class="product__cat">${esc(p.category)}</span></div>
                  <div class="product__price">${esc(p.price)}<small>${esc(p.unit)}</small></div>
                </div>
              </article>`).join('')}
          </div>
        </div>
      </section>`;
    },

    live(s, site) {
      const apis = site.integrations?.customApis || [];
      const chosen = (s.apiIds && s.apiIds.length) ? apis.filter((a) => s.apiIds.includes(a.id)) : apis;
      const weatherOn = s.showWeather && site.integrations?.weather?.enabled;
      if (!weatherOn && !chosen.length) return '';
      return `
      <section class="section live" id="${esc(s.id)}">
        <div class="container">
          ${head(s, s.text ? `<p class="lead" data-reveal>${esc(s.text)}</p>` : '')}
          <div class="live__grid" style="${!weatherOn || !chosen.length ? 'grid-template-columns:1fr' : ''}">
            ${weatherOn ? `
            <div class="card wx js-weather-card" data-reveal>
              <div class="wx__top"><div><div class="wx__city">${esc(site.integrations.weather.city)} · now</div><div class="wx__temp js-wx-temp">--°</div><div class="wx__cond js-wx-cond">Loading conditions…</div></div><div class="wx__icon js-wx-icon">🌤️</div></div>
              <div class="wx__meta"><span>💧 <b class="js-wx-hum">--</b>% humidity</span><span>🌬️ <b class="js-wx-wind">--</b></span></div>
              <div class="wx__days js-wx-days"></div>
            </div>` : ''}
            ${chosen.length ? `<div class="api-cards">${chosen.map((a, i) => `<div class="card api-card" data-reveal style="--d:${i * 0.1}s" data-api="${esc(a.id)}"><h3>${esc(a.name)}</h3><div class="js-api-body"><div class="skeleton" style="width:70%"></div><br><div class="skeleton" style="width:50%"></div></div></div>`).join('')}</div>` : ''}
          </div>
        </div>
      </section>`;
    },

    gallery(s) {
      const cols = [[], [], []];
      const ratios = ['4/5', '1/1', '3/4', '4/3', '4/5.5'];
      (s.images || []).forEach((im, i) => cols[i % 3].push({ ...im, ar: ratios[i % ratios.length] }));
      return `
      <section class="section gallery" id="${esc(s.id)}">
        <div class="container">
          ${head(s)}
          <div class="gallery__cols">
            ${cols.map((col, ci) => `<div class="gallery__col" data-col="${ci}">${col.map((im) => `
              <figure class="gallery__item" style="margin:0;--ar:${im.ar}" data-lightbox="${url(im.src)}" data-caption="${esc(im.caption)}" data-cursor="view">
                ${img(im.src, im.caption)}${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ''}
              </figure>`).join('')}</div>`).join('')}
          </div>
        </div>
      </section>`;
    },

    testimonials(s) {
      const items = s.items || [];
      const initials = (n = '') => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
      return `
      <section class="section testimonials" id="${esc(s.id)}">
        <div class="container">
          ${s.eyebrow ? `<span class="eyebrow" data-reveal>${esc(s.eyebrow)}</span>` : ''}
          <div class="quotes" data-quotes>
            ${items.map((t, i) => `
              <figure class="quote${i === 0 ? ' is-active' : ''}" style="margin:0">
                <blockquote>${esc(t.quote)}</blockquote>
                <figcaption>${t.avatar ? img(t.avatar, t.name, 'class="avatar"') : `<span class="avatar">${esc(initials(t.name))}</span>`}<span><b>${esc(t.name)}</b><small>${esc(t.role)}</small></span></figcaption>
              </figure>`).join('')}
          </div>
          ${items.length > 1 ? `<div class="quotes__nav"><button class="round-btn" data-q="-1" aria-label="Previous">${ICON.left}</button><span class="quotes__count js-q-count">01 / ${String(items.length).padStart(2, '0')}</span><button class="round-btn" data-q="1" aria-label="Next">${ICON.right}</button></div>` : ''}
        </div>
      </section>`;
    },

    journal(s) {
      const date = (d) => { const x = new Date(d); return isNaN(x) ? esc(d) : x.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); };
      return `
      <section class="section journal" id="${esc(s.id)}">
        <div class="container">
          ${head(s)}
          <div class="journal__grid">
            ${(s.posts || []).map((p, i) => `
              <a class="post" ${linkAttrs(p.link || '#')} data-reveal style="--d:${i * 0.12}s" data-cursor="view" data-cursor-label="Read">
                <div class="media post__img">${img(p.image, p.title)}</div>
                <div style="display:grid;gap:12px"><div class="post__meta"><b>${esc(p.tag)}</b><span>${date(p.date)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></div>
              </a>`).join('')}
          </div>
        </div>
      </section>`;
    },

    faq(s) {
      return `
      <section class="section faq" id="${esc(s.id)}">
        <div class="container faq__grid">
          <div style="display:grid;gap:22px;align-content:start">
            ${s.eyebrow ? `<span class="eyebrow" data-reveal>${esc(s.eyebrow)}</span>` : ''}
            <h2 class="h-md" data-split>${splitWords(s.title)}</h2>
          </div>
          <div>
            ${(s.items || []).map((f, i) => `
              <div class="faq__item${i === 0 ? ' is-open' : ''}" data-reveal style="--d:${i * 0.06}s">
                <button class="faq__q" aria-expanded="${i === 0}">${esc(f.q)}<span class="faq__icon"></span></button>
                <div class="faq__a"><div><p>${esc(f.a)}</p></div></div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
    },

    cta(s) {
      return `
      <section class="section cta" id="${esc(s.id)}">
        <div class="cta__box" data-cta>
          ${s.image ? `<div class="media">${img(s.image, '', 'data-parallax="0.12"')}</div>` : ''}
          <div class="cta__inner">
            <h2 class="h-lg" data-split>${splitWords(s.title)}</h2>
            ${s.text ? `<p data-reveal>${esc(s.text)}</p>` : ''}
            <div data-reveal style="--d:.2s">${btn(s.button, 'btn--light')}</div>
          </div>
        </div>
      </section>`;
    },

    contact(s, site) {
      const c = site.settings.contact || {};
      const rows = [['Email', c.email && `<a class="link-u" href="mailto:${esc(c.email)}">${esc(c.email)}</a>`], ['Phone', c.phone && `<a class="link-u" href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>`], ['Visit', c.address && esc(c.address)], ['Hours', c.hours && esc(c.hours)]].filter((r) => r[1]);
      const mapSrc = (c.mapEmbed || '').match(/src="([^"]+)"/)?.[1] || (/^https:\/\//.test(c.mapEmbed || '') ? c.mapEmbed : '');
      return `
      <section class="section contact" id="${esc(s.id)}">
        <div class="container contact__grid">
          <div class="contact__info">
            ${s.eyebrow ? `<span class="eyebrow" data-reveal>${esc(s.eyebrow)}</span>` : ''}
            <h2 class="h-lg" data-split>${splitWords(s.title)}</h2>
            ${s.text ? `<p class="lead" data-reveal>${esc(s.text)}</p>` : ''}
            <dl class="contact__list" data-reveal>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
            ${mapSrc ? `<div class="map" data-reveal><iframe src="${url(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe></div>` : ''}
          </div>
          <div>
            <form class="form" data-contact data-reveal novalidate>
              <div class="field"><label for="f-name">Your name *</label><input id="f-name" name="name" required autocomplete="name"></div>
              <div class="field"><label for="f-email">Email *</label><input id="f-email" name="email" type="email" required autocomplete="email"></div>
              <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" autocomplete="tel"></div>
              <div class="field"><label for="f-subj">I'm interested in</label><select id="f-subj" name="subject"><option>Buying produce</option><option>Joining as a farmer</option><option>Bulk / business supply</option><option>Partnership</option><option>Something else</option></select></div>
              <div class="field field--full"><label for="f-msg">Message *</label><textarea id="f-msg" name="message" required></textarea></div>
              <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
              <div class="form__foot"><button class="btn" type="submit" data-magnetic>Send message<span class="btn__icon">${ICON.arrow}</span></button><span class="form__status" role="status"></span></div>
            </form>
            ${s.showNewsletter ? `
            <div class="newsletter" data-reveal>
              <h3>${fmt(s.newsletterTitle || 'Join our newsletter')}</h3>
              <form data-subscribe><input type="email" name="email" placeholder="you@example.com" required aria-label="Email"><button class="btn" type="submit">Subscribe</button></form>
              <span class="form__status" role="status"></span>
            </div>` : ''}
          </div>
        </div>
      </section>`;
    },
  };

  // ---------- chrome ----------
  function logo(settings) {
    return settings.logoImage
      ? `<img src="${url(settings.logoImage)}" alt="${esc(settings.siteName)}">`
      : `${ICON.leaf}<span>${esc(settings.logoText || settings.siteName)}</span>`;
  }

  function renderChrome(site) {
    const { settings, navigation = [] } = site;
    const ann = settings.announcement;
    $('#announcement').innerHTML = ann?.enabled && ann.text ? `<div class="announcement">${esc(ann.text)} ${ann.link ? `<a ${linkAttrs(ann.link)}>Learn more →</a>` : ''}</div>` : '';
    document.body.classList.toggle('has-announcement', !!(ann?.enabled && ann.text));
    const contactLink = navigation.find((n) => /contact/i.test(n.href)) || { href: '#contact' };

    $('#header').innerHTML = `
      <div class="container header__inner">
        <a class="logo" href="#top" aria-label="${esc(settings.siteName)} home">${logo(settings)}</a>
        <nav class="nav" aria-label="Main">${navigation.map((n) => `<a ${linkAttrs(n.href)}>${esc(n.label)}</a>`).join('')}</nav>
        <div class="header__actions">
          <a class="btn" ${linkAttrs(contactLink.href)} data-magnetic>Get in touch<span class="btn__icon">${ICON.arrow}</span></a>
          <button class="burger" aria-label="Menu" aria-expanded="false"><span></span></button>
        </div>
      </div>`;

    $('#menu').innerHTML = `
      ${navigation.map((n, i) => `<a class="menu__link" ${linkAttrs(n.href)}><span style="transition-delay:${0.25 + i * 0.06}s">${esc(n.label)}</span></a>`).join('')}
      <div class="menu__foot"><span>${esc(settings.contact?.email || '')}</span><span>${esc(settings.contact?.phone || '')}</span></div>`;

    const f = settings.footer || {};
    const social = Object.entries(settings.social || {}).filter(([k, v]) => v && ICON[k]);
    const sections = (site.sections || []).map((s) => s.type);
    $('#footer').innerHTML = `
      <div class="container">
        <div class="footer__top">
          <div><a class="logo" href="#top">${logo(settings)}</a><p>${esc(f.text)}</p>
            ${social.length ? `<div class="socials" style="margin-top:24px">${social.map(([k, v]) => `<a ${linkAttrs(v)} aria-label="${k}">${ICON[k]}</a>`).join('')}</div>` : ''}
          </div>
          <div><h4>Explore</h4><ul>${navigation.map((n) => `<li><a class="link-u" ${linkAttrs(n.href)}>${esc(n.label)}</a></li>`).join('')}</ul></div>
          <div><h4>Contact</h4><ul>
            ${settings.contact?.email ? `<li><a class="link-u" href="mailto:${esc(settings.contact.email)}">${esc(settings.contact.email)}</a></li>` : ''}
            ${settings.contact?.phone ? `<li>${esc(settings.contact.phone)}</li>` : ''}
            ${settings.contact?.hours ? `<li>${esc(settings.contact.hours)}</li>` : ''}
          </ul></div>
          <div><h4>Visit</h4><ul><li>${esc(settings.contact?.address || '')}</li></ul></div>
        </div>
        <div class="footer__big" aria-hidden="true" data-footer-big><span>${esc(f.bigText || settings.siteName)}</span></div>
        <div class="footer__bottom"><span>${esc((f.copyright || '').replace('{year}', new Date().getFullYear()))}</span><span>${sections.includes('contact') ? '<a class="link-u" href="#contact">Contact</a> · ' : ''}<a class="link-u" href="/admin">Admin</a></span></div>
      </div>`;

    const wa = site.integrations?.whatsapp;
    $('#floating').innerHTML = `
      <button class="to-top" aria-label="Back to top">${ICON.up}</button>
      ${wa?.enabled && wa.number ? `<a class="fab" href="https://wa.me/${encodeURIComponent(wa.number)}?text=${encodeURIComponent(wa.message || '')}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICON.whatsapp}</a>` : ''}
      ${PREVIEW ? '<span class="preview-badge">Live preview</span>' : ''}`;
  }

  // ---------- theme ----------
  function applyTheme(theme) {
    const vars = Object.entries(theme.colors || {}).map(([k, v]) => `--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`).join(';');
    let styleEl = $('#theme-vars');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'theme-vars'; document.head.appendChild(styleEl); }
    styleEl.textContent = `:root{${vars};--font-heading:'${theme.fonts?.heading}';--font-body:'${theme.fonts?.body}';--radius:${Number(theme.radius) || 0}px}`;

    const href = window.BHOOMI_FONTS ? BHOOMI_FONTS.fontUrl([theme.fonts?.heading, theme.fonts?.body]) : '';
    let link = $('#font-link');
    if (!link) { link = document.createElement('link'); link.id = 'font-link'; link.rel = 'stylesheet'; document.head.appendChild(link); }
    if (href && link.getAttribute('href') !== href) link.setAttribute('href', href);

    let css = $('#custom-css');
    if (PREVIEW || theme.customCss) {
      if (!css) { css = document.createElement('style'); css.id = 'custom-css'; document.head.appendChild(css); }
      css.textContent = theme.customCss || '';
    }

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.motion = reduced ? 'none' : (theme.animations || 'full');
    root.classList.toggle('no-motion', state.motion === 'none');
    document.body.classList.toggle('has-cursor', theme.customCursor !== false && state.motion !== 'none');
    document.body.classList.toggle('has-grain', !!theme.grain);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme.colors?.primary || '';
  }

  // ---------- render ----------
  function render(site) {
    state.site = site;
    teardown();
    applyTheme(site.theme);
    renderChrome(site);
    const html = (site.sections || []).filter((s) => s.enabled !== false && R[s.type]).map((s) => {
      try { return R[s.type](s, site); } catch (e) { console.error('Section failed to render', s, e); return ''; }
    }).join('');
    $('#app').innerHTML = `<div id="top"></div>${html}`;
    const first = site.sections?.find((s) => s.enabled !== false);
    const darkHero = first?.type === 'hero' && (site.theme.heroStyle || 'reveal') === 'reveal';
    $('#header').classList.toggle('header--solid', !darkHero);
    $('#app').style.paddingTop = first?.type === 'hero' ? '' : 'var(--header-h)';
    initSections();
  }

  function teardown() {
    state.timers.forEach(clearInterval);
    state.observers.forEach((o) => o.disconnect());
    state.timers = []; state.observers = []; state.scrollers = []; state.layouts = [];
  }

  // ---------- behaviours ----------
  function initSections() {
    initReveals();
    initHero();
    initMarquee();
    initWords();
    initCounters();
    initStack();
    initHScroll();
    initParallax();
    initGallery();
    initProducts();
    initQuotes();
    initFaq();
    initForms();
    initCta();
    initFooter();
    loadWeather();
    loadApis();
    layout();
    bindLinks();
  }

  function onScroll(fn) { state.scrollers.push(fn); }
  function onLayout(fn) { state.layouts.push(fn); }
  function layout() { state.layouts.forEach((fn) => fn()); }
  const animated = () => state.motion !== 'none';
  const rich = () => state.motion === 'full';

  function initReveals() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        // Hero intro is triggered by boot() once the preloader lifts.
        if (document.body.classList.contains('is-loading') && e.target.closest('.hero')) return;
        e.target.classList.add('is-in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('[data-reveal], [data-split]').forEach((el) => io.observe(el));
    state.observers.push(io);
  }

  function initHero() {
    const hero = $('[data-hero]');
    if (!hero) return;
    const sticky = $('.hero__sticky', hero);
    const slides = $$('.hero__slide', hero);
    const dots = $$('.hero__dot', hero);
    const cap = $('.js-hero-cap', hero);
    const cur = $('.js-hero-cur', hero);
    const bar = $('.hero__track span', hero);
    const sec = state.site.sections.find((s) => s.type === 'hero') || {};
    const imgs = (sec.images || []).filter((i) => i.src);
    const interval = (Number(sec.interval) || 6) * 1000;
    let index = 0;
    let timer;

    const runBar = () => {
      if (!bar) return;
      bar.style.transition = 'none'; bar.style.width = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `width ${interval}ms linear`; bar.style.width = '100%'; }));
    };
    const go = (n) => {
      if (slides.length < 2) return;
      const next = (n + slides.length) % slides.length;
      if (next === index) return;
      slides.forEach((s) => s.classList.remove('is-prev'));
      slides[index].classList.remove('is-active'); slides[index].classList.add('is-prev');
      const incoming = slides[next];
      incoming.classList.remove('is-active'); void incoming.offsetWidth; incoming.classList.add('is-active');
      dots.forEach((d, i) => d.classList.toggle('is-active', i === next));
      index = next;
      if (cap) cap.textContent = imgs[index]?.caption || '';
      if (cur) cur.textContent = String(index + 1).padStart(2, '0');
      runBar();
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(index + 1), interval); state.timers.push(timer); runBar(); };
    dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.go)); restart(); }));
    if (slides.length > 1) restart();

    // Mouse parallax on the active image.
    if (rich()) {
      hero.addEventListener('mousemove', (e) => {
        const x = (e.clientX / innerWidth - 0.5) * -24;
        const y = (e.clientY / innerHeight - 0.5) * -16;
        hero.style.setProperty('--mx', `${x}px`);
        hero.style.setProperty('--my', `${y}px`);
      });
    }

    if (hero.classList.contains('hero--reveal') && animated()) {
      onScroll(() => {
        const r = hero.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
        sticky.style.setProperty('--p', p.toFixed(4));
      });
    }
  }

  function initMarquee() {
    $$('[data-marquee]').forEach((track) => {
      const group = $('.marquee__group', track);
      if (!group || !group.children.length) return;
      // Repeat content until one group is wider than the viewport, then clone it once.
      const base = group.innerHTML;
      let guard = 0;
      while (group.scrollWidth < innerWidth * 1.2 && guard++ < 10) group.insertAdjacentHTML('beforeend', base);
      track.appendChild(group.cloneNode(true));
      let x = 0; let last = performance.now(); let dir = -1; let boost = 0; let lastY = scrollY;
      const speed = Number(track.dataset.marquee) || 40;
      onScroll(() => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const dy = scrollY - lastY; lastY = scrollY;
        if (rich() && Math.abs(dy) > 0.5) { dir = dy > 0 ? -1 : 1; boost = Math.min(600, boost + Math.abs(dy) * 4); }
        boost *= 0.92;
        if (!animated()) return;
        const w = group.scrollWidth;
        x += dir * (speed + boost) * dt;
        if (x <= -w) x += w;
        if (x > 0) x -= w;
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
        const start = innerHeight * 0.85; const end = innerHeight * 0.35;
        const p = clamp((start - r.top) / (start - end + r.height * 0.6));
        const lit = Math.round(p * words.length);
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
        const dur = 2000; const t0 = performance.now();
        const tick = (t) => {
          const k = clamp((t - t0) / dur);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))).toLocaleString('en-IN');
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    $$('[data-count]').forEach((el) => io.observe(el));
    state.observers.push(io);
  }

  function initStack() {
    $$('[data-stack]').forEach((list) => {
      const cards = $$('.service', list);
      if (!animated()) return;
      onScroll(() => {
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          const a = card.getBoundingClientRect(); const b = next.getBoundingClientRect();
          const p = clamp(1 - (b.top - a.top) / a.height);
          card.style.transform = `scale(${1 - p * 0.06})`;
          card.style.filter = `brightness(${1 - p * 0.25})`;
        });
      });
    });
  }

  function initHScroll() {
    $$('[data-hscroll]').forEach((sec) => {
      const track = $('.process__track', sec);
      const bar = $('.process__bar span', sec);
      let dist = 0;
      const mobile = () => innerWidth <= 760 || !animated();
      onLayout(() => {
        if (mobile()) { sec.style.height = ''; track.style.transform = ''; return; }
        dist = Math.max(0, track.scrollWidth - innerWidth);
        sec.style.height = `${dist + innerHeight}px`;
      });
      onScroll(() => {
        if (mobile()) return;
        const r = sec.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
        track.style.transform = `translate3d(${-p * dist}px,0,0)`;
        if (bar) bar.style.transform = `scaleX(${p})`;
        $$('.step__img img', track).forEach((im) => {
          const ir = im.parentElement.getBoundingClientRect();
          const off = (ir.left + ir.width / 2 - innerWidth / 2) / innerWidth;
          im.style.transform = `scale(1.15) translateX(${off * -6}%)`;
        });
      });
    });
  }

  function initParallax() {
    if (!rich()) return;
    const els = $$('[data-parallax]');
    onScroll(() => {
      els.forEach((el) => {
        const r = (el.parentElement || el).getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        const speed = Number(el.dataset.parallax) || 0.1;
        const off = (r.top + r.height / 2 - innerHeight / 2) * -speed;
        el.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
      });
    });
  }

  function initGallery() {
    $$('.gallery').forEach((g) => {
      const cols = $$('.gallery__col', g);
      if (rich()) {
        const speeds = [-0.08, 0.1, -0.04];
        onScroll(() => {
          const r = g.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          const p = (r.top + r.height / 2 - innerHeight / 2);
          cols.forEach((c, i) => { c.style.transform = `translate3d(0,${(p * speeds[i]).toFixed(1)}px,0)`; });
        });
      }
      $$('[data-lightbox]', g).forEach((fig) => fig.addEventListener('click', () => openLightbox(fig.dataset.lightbox, fig.dataset.caption)));
    });
  }

  function openLightbox(src, caption) {
    const lb = $('#lightbox');
    $('img', lb).src = src;
    $('.lightbox__caption', lb).textContent = caption || '';
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    state.lenis?.stop();
  }
  function closeLightbox() {
    const lb = $('#lightbox');
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    state.lenis?.start();
  }

  function initProducts() {
    $$('.products').forEach((sec) => {
      const chips = $$('[data-filter]', sec);
      chips.forEach((chip) => chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.toggle('is-active', c === chip));
        const f = chip.dataset.filter;
        $$('.product', sec).forEach((p) => {
          const show = f === '*' || p.dataset.cat === f;
          p.classList.toggle('is-hidden', !show);
          if (show) { p.classList.remove('is-in'); requestAnimationFrame(() => p.classList.add('is-in')); }
        });
        layout();
      }));
    });
  }

  function initQuotes() {
    $$('[data-quotes]').forEach((wrap) => {
      const quotes = $$('.quote', wrap);
      const count = $('.js-q-count', wrap.parentElement);
      let i = 0;
      const show = (n) => {
        i = (n + quotes.length) % quotes.length;
        quotes.forEach((q, k) => q.classList.toggle('is-active', k === i));
        if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(quotes.length).padStart(2, '0')}`;
      };
      let timer = setInterval(() => show(i + 1), 7000);
      state.timers.push(timer);
      $$('[data-q]', wrap.parentElement).forEach((b) => b.addEventListener('click', () => {
        show(i + Number(b.dataset.q));
        clearInterval(timer); timer = setInterval(() => show(i + 1), 7000); state.timers.push(timer);
      }));
    });
  }

  function initFaq() {
    $$('.faq__item').forEach((item) => {
      $('.faq__q', item).addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        $$('.faq__item', item.parentElement).forEach((x) => { x.classList.remove('is-open'); $('.faq__q', x).setAttribute('aria-expanded', 'false'); });
        item.classList.toggle('is-open', open);
        $('.faq__q', item).setAttribute('aria-expanded', String(open));
      });
    });
  }

  async function recaptchaToken() {
    const rc = state.site.integrations?.recaptcha;
    if (!rc?.enabled || !window.grecaptcha) return '';
    return new Promise((res) => grecaptcha.ready(() => grecaptcha.execute(rc.siteKey, { action: 'contact' }).then(res, () => res(''))));
  }

  function initForms() {
    $$('[data-contact]').forEach((form) => form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = $('.form__status', form);
      const data = Object.fromEntries(new FormData(form));
      if (!data.name || !data.email || !data.message) { status.className = 'form__status err'; status.textContent = 'Please fill in your name, email and message.'; return; }
      const button = $('button[type="submit"]', form);
      button.disabled = true; status.className = 'form__status'; status.textContent = 'Sending…';
      try {
        if (PREVIEW) throw new Error('Forms are disabled in preview mode.');
        data.token = await recaptchaToken();
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Something went wrong');
        form.reset(); status.className = 'form__status ok'; status.textContent = 'Thank you! We will get back to you within a day. 🌱';
        window.gtag?.('event', 'generate_lead');
      } catch (err) {
        status.className = 'form__status err'; status.textContent = err.message;
      } finally { button.disabled = false; }
    }));
    $$('[data-subscribe]').forEach((form) => form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.parentElement.querySelector('.form__status');
      try {
        if (PREVIEW) throw new Error('Forms are disabled in preview mode.');
        const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        form.reset(); status.className = 'form__status ok'; status.textContent = 'You are subscribed. See you next season!';
      } catch (err) { status.className = 'form__status err'; status.textContent = err.message; }
    }));
  }

  function initCta() {
    $$('[data-cta]').forEach((box) => {
      if (!animated()) return;
      onScroll(() => {
        const r = box.getBoundingClientRect();
        const p = clamp((innerHeight - r.top) / (innerHeight * 0.9));
        box.style.setProperty('--p', p.toFixed(4));
      });
    });
  }

  function initFooter() {
    const big = $('[data-footer-big] span');
    if (!big) return;
    onScroll(() => {
      const r = $('#footer').getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / r.height);
      big.style.setProperty('--fy', `${(1 - p) * 40}%`);
    });
  }

  async function loadWeather() {
    if (!state.site.integrations?.weather?.enabled || !$('.js-wx-temp')) return;
    try {
      if (!state.weather) {
        const r = await fetch('/api/weather');
        if (!r.ok) throw new Error((await r.json()).error);
        state.weather = await r.json();
      }
      const w = state.weather;
      $$('.js-wx-temp').forEach((el) => { el.textContent = `${w.temp}${w.unit}`; });
      $$('.js-wx-cond').forEach((el) => { el.textContent = el.closest('.js-weather-chip') ? `${w.city} · ${w.condition}` : w.condition; });
      $$('.js-weather-chip .wx-icon, .js-wx-icon').forEach((el) => { el.textContent = w.icon; });
      $$('.js-wx-hum').forEach((el) => { el.textContent = w.humidity; });
      $$('.js-wx-wind').forEach((el) => { el.textContent = `${w.wind} ${w.windUnit}`; });
      $$('.js-wx-days').forEach((el) => {
        el.innerHTML = (w.daily || []).map((d) => `<div class="wx__day"><span>${new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</span><span style="font-size:22px">${d.icon}</span><b>${d.max}°</b><span style="opacity:.6">${d.min}°${d.rain != null ? ` · ${d.rain}%` : ''}</span></div>`).join('');
      });
    } catch (e) {
      // Hide weather UI for visitors when the provider is unreachable.
      $$('.js-weather-chip').forEach((el) => el.remove());
      $$('.js-weather-card').forEach((el) => {
        const grid = el.parentElement; el.remove();
        if (!grid.children.length) grid.closest('section')?.remove();
        else grid.style.gridTemplateColumns = '1fr';
      });
      layout();
    }
  }

  async function loadApis() {
    $$('[data-api]').forEach(async (card) => {
      const body = $('.js-api-body', card);
      const meta = (state.site.integrations?.customApis || []).find((a) => a.id === card.dataset.api) || {};
      const d = meta.display || {};
      try {
        const r = await fetch(`/api/custom/${encodeURIComponent(card.dataset.api)}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        body.innerHTML = renderApiData(j.data, d);
      } catch (e) {
        body.innerHTML = `<p class="muted">Data is not available right now.</p>`;
      }
    });
  }

  function renderApiData(data, d) {
    const limit = Number(d.limit) || 6;
    const pre = d.prefix || ''; const suf = d.suffix || '';
    const pick = (o, k) => (k ? k.split('.').reduce((a, x) => (a == null ? a : a[x]), o) : undefined);
    const val = (v) => `${esc(pre)}${esc(typeof v === 'object' ? JSON.stringify(v) : v)}${esc(suf)}`;
    if (Array.isArray(data)) {
      return `<ul class="api-list">${data.slice(0, limit).map((row) => {
        if (typeof row !== 'object' || row === null) return `<li><span>${esc(row)}</span></li>`;
        const keys = Object.keys(row);
        const label = pick(row, d.labelKey) ?? row[keys[0]];
        const value = pick(row, d.valueKey) ?? row[keys[1]] ?? '';
        return `<li><span>${esc(label)}</span><span>${val(value)}</span></li>`;
      }).join('')}</ul>`;
    }
    if (data && typeof data === 'object') {
      return `<ul class="api-list">${Object.entries(data).filter(([, v]) => typeof v !== 'object').slice(0, limit).map(([k, v]) => `<li><span>${esc(k)}</span><span>${val(v)}</span></li>`).join('')}</ul>`;
    }
    return `<div class="wx__temp" style="font-size:64px;color:var(--primary)">${val(data)}</div>`;
  }

  // ---------- global (bound once) ----------
  function bindLinks() {
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2 && id !== '#') return;
      const target = id === '#top' || id === '#' ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      scrollToEl(target);
    }));
    $$('[data-magnetic]').forEach((el) => {
      if (!rich() || !matchMedia('(hover: hover)').matches) return;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  function scrollToEl(target) {
    if (state.lenis) state.lenis.scrollTo(target, { offset: target === document.body ? 0 : -60, duration: 1.6 });
    else window.scrollTo({ top: target === document.body ? 0 : target.getBoundingClientRect().top + scrollY - 60, behavior: animated() ? 'smooth' : 'auto' });
  }

  function bindGlobal() {
    // Header + menu
    document.addEventListener('click', (e) => {
      if (e.target.closest('.burger')) {
        const open = document.body.classList.toggle('menu-open');
        $('#menu').setAttribute('aria-hidden', String(!open));
        $('.burger')?.setAttribute('aria-expanded', String(open));
        open ? state.lenis?.stop() : state.lenis?.start();
      }
      if (e.target.closest('.menu__link')) { document.body.classList.remove('menu-open'); state.lenis?.start(); }
      if (e.target.closest('.to-top')) scrollToEl(document.body);
      if (e.target.closest('.lightbox__close') || e.target.id === 'lightbox') closeLightbox();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeLightbox(); document.body.classList.remove('menu-open'); state.lenis?.start(); } });

    // Cursor
    const cursor = $('.cursor'); const dot = $('.cursor__dot'); const ring = $('.cursor__ring'); const label = $('.cursor__label');
    let mx = innerWidth / 2; let my = innerHeight / 2; let rx = mx; let ry = my;
    addEventListener('mousemove', (e) => {
      if (!cursor.classList.contains('is-active')) { rx = e.clientX; ry = e.clientY; cursor.classList.add('is-active'); }
      mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('[data-cursor="view"]');
      cursor.classList.toggle('is-view', !!view);
      label.textContent = view ? (view.dataset.cursorLabel || 'View') : '';
      cursor.classList.toggle('is-hover', !view && !!e.target.closest('a, button, input, textarea, select'));
    });

    // Header state
    const header = $('#header'); const progress = $('.scroll-progress span'); const toTop = () => $('.to-top');
    let lastY = scrollY;
    const ann = () => { const a = $('.announcement'); root.style.setProperty('--ann-h', `${a ? Math.max(0, a.offsetHeight - scrollY) : 0}px`); };

    // Single animation loop for everything scroll-linked.
    const loop = (t) => {
      state.lenis?.raf(t);
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      if (!document.body.classList.contains('menu-open')) {
        header.classList.toggle('is-scrolled', y > (header.classList.contains('header--solid') ? 10 : innerHeight * 0.6));
        header.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
        if (y < lastY - 2) header.classList.remove('is-hidden');
      }
      lastY = y;
      ann();
      toTop()?.classList.toggle('is-visible', y > innerHeight * 1.5);
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      state.scrollers.forEach((fn) => fn(y));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    addEventListener('load', layout);
  }

  function initLenis(theme) {
    const want = theme.smoothScroll !== false && state.motion === 'full' && window.Lenis && !matchMedia('(pointer: coarse)').matches;
    if (want && !state.lenis) {
      state.lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), autoRaf: false });
    } else if (!want && state.lenis) {
      state.lenis.destroy(); state.lenis = null;
    }
  }

  // ---------- preloader ----------
  function preloader(name) {
    const el = $('#preloader');
    return new Promise((resolve) => {
      if (!el) return resolve();
      $('#preloader-word').innerHTML = [...name].map((ch, i) => `<span style="animation-delay:${i * 0.06}s">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
      const count = $('#preloader-count'); const bar = $('#preloader-bar');
      let n = 0; let loaded = false;
      const heroImg = $('.hero__slide img');
      if (!heroImg || heroImg.complete) loaded = true;
      else { heroImg.addEventListener('load', () => { loaded = true; }); heroImg.addEventListener('error', () => { loaded = true; }); }
      setTimeout(() => { loaded = true; }, 3500);
      const tick = setInterval(() => {
        n = Math.min(loaded ? 100 : 90, n + (loaded ? 6 : Math.random() * 7));
        count.textContent = Math.floor(n); bar.style.width = `${n}%`;
        if (n >= 100) {
          clearInterval(tick);
          setTimeout(() => { el.classList.add('is-done'); resolve(); setTimeout(() => el.remove(), 1200); }, 250);
        }
      }, 60);
    });
  }

  // ---------- boot ----------
  async function boot() {
    let site;
    try {
      site = await fetch('/api/site').then((r) => r.json());
    } catch (e) {
      $('#app').innerHTML = '<p style="padding:20vh 2rem;text-align:center">Could not load the site. Please refresh.</p>';
      return;
    }
    render(site);
    initLenis(site.theme);
    bindGlobal();
    const usePreloader = site.theme.preloader !== false && !PREVIEW && state.motion !== 'none' && !sessionStorageSeen();
    if (usePreloader) await preloader(site.settings.siteName || 'Bhoomi');
    else $('#preloader')?.remove();
    document.body.classList.remove('is-loading');
    setTimeout(() => $$('.hero [data-reveal], .hero [data-split]').forEach((el) => el.classList.add('is-in')), usePreloader ? 300 : 50);
    layout();
  }

  function sessionStorageSeen() {
    try {
      if (sessionStorage.getItem('bhoomi:seen')) return true;
      sessionStorage.setItem('bhoomi:seen', '1');
    } catch { /* storage unavailable */ }
    return false;
  }

  // Live preview from the admin panel.
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'bhoomi:preview' && state.site) {
      const y = scrollY;
      const next = { ...state.site, ...e.data.site, integrations: { ...state.site.integrations, ...(e.data.site.integrations || {}) } };
      render(next);
      initLenis(next.theme);
      $$('[data-reveal], [data-split]').forEach((el) => el.classList.add('is-in'));
      $('#preloader')?.remove();
      document.body.classList.remove('is-loading');
      requestAnimationFrame(() => { layout(); window.scrollTo(0, y); });
    }
    if (e.data.type === 'bhoomi:scrollTo') {
      const el = document.getElementById(e.data.id);
      if (el) scrollToEl(el);
    }
  });

  boot();
})();
