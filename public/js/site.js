/* Bhoomi public site — renders CMS content with an Apple-inspired layout. */
(() => {
  'use strict';

  const PREVIEW = new URLSearchParams(location.search).has('preview');
  const state = { site: null, lenis: null, timers: [], observers: [], scrollers: [], layouts: [], weather: null, motion: 'full' };
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // ---------- formatting ----------
  const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s = '') => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
  const url = (u = '') => (/^\s*(javascript|data|vbscript):/i.test(u) ? '#' : esc(u));
  const img = (src, alt = '', extra = '') => (src
    ? `<img src="${url(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" onerror="this.classList.add('img-fallback');this.parentElement.classList.add('ph')" ${extra}>`
    : '');
  const isExternal = (h = '') => /^https?:\/\//.test(h) && !h.startsWith(location.origin);
  const linkAttrs = (h) => `href="${url(h)}"${isExternal(h) ? ' target="_blank" rel="noopener"' : ''}`;
  const pad = (n) => String(n).padStart(2, '0');

  const ICON = {
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    left: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8V6.5c0-.7.5-1 1-1h2V2h-3c-2.8 0-4 2-4 4.3V8H8v3.5h2V22h4V11.5h2.8L17 8h-3Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15V9l5.8 3-5.8 3Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5Z"/></svg>',
  };

  const button = (b, cls = '') => (b && b.label ? `<a class="btn ${cls}" ${linkAttrs(b.href || '#')}>${esc(b.label)}</a>` : '');
  const textLink = (b) => (b && b.label ? `<a class="link" ${linkAttrs(b.href || '#')}>${esc(b.label)}</a>` : '');
  const head = (s, { center = true, extra = '' } = {}) => `
    <div class="head${center ? ' center' : ' head--split'}" data-reveal>
      <div>
        ${s.eyebrow ? `<span class="kicker">${esc(s.eyebrow)}</span>` : ''}
        ${s.title ? `<h2 class="h2">${fmt(s.title)}</h2>` : ''}
        ${center && s.subtitle ? `<p class="sub">${esc(s.subtitle)}</p>` : ''}
      </div>
      ${extra}
    </div>`;

  // ---------- section renderers ----------
  const R = {
    hero(s, site) {
      const style = site.theme.heroStyle || 'reveal';
      const imgs = (s.images || []).filter((i) => i.src);
      const weather = s.showWeather && site.integrations?.weather?.enabled;
      const slides = imgs.map((im, i) => `<div class="hero__slide${i === 0 ? ' is-active' : ''}">${img(im.src, im.caption, i === 0 ? 'loading="eager" fetchpriority="high"' : '')}</div>`).join('');
      const overlay = `
        <div class="hero__overlay">
          <div>${weather ? `<span class="glass wx-chip js-weather-chip"><span class="wx-icon">⛅</span><b class="js-wx-temp">--°</b><span class="js-wx-cond">${esc(site.integrations.weather.city)}</span></span>` : `<span class="hero__cap js-hero-cap">${esc(imgs[0]?.caption || '')}</span>`}</div>
          ${imgs.length > 1 ? `<div class="pager">${imgs.map((_, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-go="${i}" aria-label="Photo ${i + 1}"></button>`).join('')}</div>` : ''}
        </div>`;
      const facts = (s.badges || []).length ? `<div class="hero__facts">${s.badges.map((b) => `<div class="hero__fact"><strong>${esc(b.value)}</strong><span>${esc(b.label)}</span></div>`).join('')}</div>` : '';
      const intro = `
        <div class="hero__intro">
          ${s.eyebrow ? `<span class="kicker" data-reveal>${esc(s.eyebrow)}</span>` : ''}
          <h1 class="h1 hero__title" data-reveal style="--d:.08s">${fmt(s.title)}</h1>
          ${s.subtitle ? `<p class="sub hero__sub" data-reveal style="--d:.16s">${esc(s.subtitle)}</p>` : ''}
          <div class="ctas" data-reveal style="--d:.24s">${button(s.primaryCta)}${style === 'minimal' ? button(s.secondaryCta, 'btn--ghost') : textLink(s.secondaryCta)}</div>
          ${style !== 'reveal' ? `<div data-reveal style="--d:.32s">${facts}</div>` : ''}
        </div>`;

      if (style === 'split') {
        return `<section class="hero hero--split" id="${esc(s.id)}" data-hero>
          <div class="hero__grid">${intro}<div class="hero__frame" data-reveal style="--d:.2s"><div class="hero__slides">${slides}</div>${overlay}</div></div>
        </section>`;
      }
      if (style === 'minimal') {
        return `<section class="hero hero--minimal" id="${esc(s.id)}" data-hero>
          <div class="hero__media"><div class="hero__slides">${slides}</div></div>${intro}${overlay}
        </section>`;
      }
      return `<section class="hero hero--reveal" id="${esc(s.id)}" data-hero>
        ${intro}
        <div class="hero__stage" data-stage>
          <div class="hero__pin"><div class="hero__media"><div class="hero__slides">${slides}</div>${overlay}</div></div>
        </div>
        ${facts ? `<div class="wrap" data-reveal style="padding-bottom:clamp(40px,6vw,80px)">${facts}</div>` : ''}
      </section>`;
    },

    marquee(s) {
      const items = (s.items || []).map((t) => `<span class="strip__item">${esc(t)}</span>`).join('');
      return `<section class="strip" id="${esc(s.id)}" aria-label="What we grow"><div class="strip__track" data-strip="${Number(s.speed) || 40}"><div class="strip__group">${items}</div></div></section>`;
    },

    about(s) {
      const words = esc(s.statement || '').split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
      const pts = s.points || [];
      return `
      <section class="section" id="${esc(s.id)}">
        <div class="wrap">
          <div class="center">${s.eyebrow ? `<span class="kicker" data-reveal>${esc(s.eyebrow)}</span>` : ''}</div>
          <p class="statement" data-words>${words}</p>
          ${s.image || s.secondaryImage ? `
          <div class="about__media" style="${s.image && s.secondaryImage ? '' : 'grid-template-columns:1fr'}">
            ${s.image ? `<div class="tile-img" data-reveal>${img(s.image, s.imageAlt, 'data-parallax="0.06"')}</div>` : ''}
            ${s.secondaryImage ? `<div class="tile-img" data-reveal style="--d:.12s">${img(s.secondaryImage, '')}</div>` : ''}
          </div>` : ''}
          ${pts.length ? `<div class="points" style="--n:${Math.min(pts.length, 3)}">${pts.map((p, i) => `
            <div class="point" data-reveal style="--d:${i * 0.1}s"><div class="point__icon">${i + 1}</div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`).join('')}</div>` : ''}
        </div>
      </section>`;
    },

    stats(s) {
      const items = s.items || [];
      return `
      <section class="section section--tight section--surface" id="${esc(s.id)}">
        <div class="wrap">
          <div class="stats__grid" style="--n:${Math.min(items.length, 4) || 1}">
            ${items.map((it, i) => `<div class="stat" data-reveal style="--d:${i * 0.08}s"><div class="stat__value grad"><span data-count="${Number(it.value) || 0}">0</span>${esc(it.suffix || '')}</div><p class="stat__label">${esc(it.label)}</p></div>`).join('')}
          </div>
        </div>
      </section>`;
    },

    services(s) {
      const pattern = ['xl', 'sm', 'sm', 'wide'];
      return `
      <section class="section" id="${esc(s.id)}">
        <div class="wrap">
          ${head(s)}
          <div class="bento">
            ${(s.items || []).map((it, i) => {
              const size = pattern[i % pattern.length];
              const dark = size === 'wide' && i % 8 === 3;
              return `
              <article class="tile tile--${size}${dark ? ' tile--dark' : ''}" data-reveal style="--d:${(i % 2) * 0.1}s">
                <div class="tile__text">
                  ${it.tag ? `<span class="tile__tag">${esc(it.tag)}</span>` : ''}
                  <h3 class="h3">${fmt(it.title)}</h3>
                  ${it.text ? `<p>${esc(it.text)}</p>` : ''}
                  ${it.link ? `<a class="link" ${linkAttrs(it.link)}>Learn more</a>` : ''}
                </div>
                ${it.image ? `<div class="tile__img">${img(it.image, it.title)}</div>` : ''}
              </article>`;
            }).join('')}
          </div>
        </div>
      </section>`;
    },

    process(s) {
      const steps = s.steps || [];
      return `
      <section class="section section--dark" id="${esc(s.id)}">
        <div class="wrap">
          ${head(s)}
          <div class="story" data-story>
            <div class="story__steps">
              ${steps.map((st, i) => `
                <div class="story__step${i === 0 ? ' is-active' : ''}" data-step="${i}">
                  ${st.image ? `<div class="story__inline">${img(st.image, st.title)}</div>` : ''}
                  ${st.label ? `<span class="story__label">${esc(st.label)}</span>` : ''}
                  <h3>${fmt(st.title)}</h3>
                  <p>${esc(st.text)}</p>
                </div>`).join('')}
            </div>
            <div class="story__visual">
              ${steps.map((st, i) => `<div class="story__img${i === 0 ? ' is-active' : ''}">${img(st.image, st.title)}</div>`).join('')}
              <span class="story__count js-story-count">01 / ${pad(steps.length)}</span>
            </div>
          </div>
        </div>
      </section>`;
    },

    products(s, site) {
      const items = s.items || [];
      const cats = [...new Set(items.map((p) => p.category).filter(Boolean))];
      const wa = site.integrations?.whatsapp;
      const order = (p) => (wa?.enabled
        ? `https://wa.me/${encodeURIComponent(wa.number)}?text=${encodeURIComponent(`Hi! I'd like to order: ${p.name} (${p.price} ${p.unit || ''})`)}`
        : '#contact');
      const filter = cats.length > 1 ? `<div class="segmented" role="tablist"><button class="is-active" data-filter="*">All</button>${cats.map((c) => `<button data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : '';
      return `
      <section class="section" id="${esc(s.id)}" data-shelf-section>
        <div class="wrap">
          ${head(s, { center: false, extra: `<div class="head__aside">${s.subtitle ? `<p class="body">${esc(s.subtitle)}</p>` : ''}${filter}</div>` })}
        </div>
        <div class="shelf" data-shelf>
          ${items.map((p, i) => `
            <article class="card" data-cat="${esc(p.category)}" data-reveal style="--d:${Math.min(i, 4) * 0.07}s">
              <span class="card__badge">${esc(p.badge || '')}</span>
              <h3>${esc(p.name)}</h3>
              <span class="card__cat">${esc(p.category)}</span>
              <div class="card__img">${img(p.image, p.name)}</div>
              <div class="card__foot">
                <span class="card__price">${esc(p.price)} <small>${esc(p.unit)}</small></span>
                <a class="btn btn--sm" ${linkAttrs(order(p))}>${wa?.enabled ? 'Buy' : 'Enquire'}</a>
              </div>
            </article>`).join('')}
        </div>
        <div class="wrap"><div class="paddles"><button class="paddle" data-dir="-1" aria-label="Previous">${ICON.left}</button><button class="paddle" data-dir="1" aria-label="Next">${ICON.right}</button></div></div>
      </section>`;
    },

    live(s, site) {
      const apis = site.integrations?.customApis || [];
      const chosen = (s.apiIds && s.apiIds.length) ? apis.filter((a) => s.apiIds.includes(a.id)) : apis;
      const weatherOn = s.showWeather && site.integrations?.weather?.enabled;
      if (!weatherOn && !chosen.length) return '';
      const single = !weatherOn || !chosen.length;
      return `
      <section class="section" id="${esc(s.id)}">
        <div class="wrap">
          ${head({ ...s, subtitle: s.text })}
          <div class="live__grid" style="${single ? 'grid-template-columns:1fr' : ''}">
            ${weatherOn ? `
            <div class="weather js-weather-card" data-reveal>
              <div class="weather__top"><div><div class="weather__city">${esc(site.integrations.weather.city)}</div><div class="weather__temp js-wx-temp">--°</div><div class="weather__cond js-wx-cond">Loading…</div></div><div class="weather__icon js-wx-icon">⛅</div></div>
              <div class="weather__meta"><span>Humidity <b class="js-wx-hum">--</b>%</span><span>Wind <b class="js-wx-wind">--</b></span></div>
              <div class="weather__days js-wx-days"></div>
            </div>` : ''}
            ${chosen.length ? `<div class="api-cards">${chosen.map((a, i) => `<div class="api-card" data-reveal style="--d:${i * 0.1}s" data-api="${esc(a.id)}"><h3>${esc(a.name)}</h3><div class="js-api-body"><div class="skeleton" style="width:70%"></div><div class="skeleton" style="width:50%"></div></div></div>`).join('')}</div>` : ''}
          </div>
        </div>
      </section>`;
    },

    gallery(s) {
      const imgs = (s.images || []).filter((i) => i.src);
      return `
      <section class="section" id="${esc(s.id)}" data-gallery>
        <div class="wrap">${head(s)}</div>
        <div class="gallery__track" data-reveal>
          ${imgs.map((im, i) => `<figure class="gallery__slide${i === 0 ? ' is-active' : ''}">${img(im.src, im.caption)}${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ''}</figure>`).join('')}
        </div>
        ${imgs.length > 1 ? `<div class="gallery__controls"><div class="pager">${imgs.map((_, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-go="${i}" aria-label="Photo ${i + 1}"></button>`).join('')}</div><button class="gallery__play" aria-label="Pause">${ICON.pause}</button></div>` : ''}
      </section>`;
    },

    testimonials(s) {
      const items = s.items || [];
      const initials = (n = '') => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
      return `
      <section class="section section--surface" id="${esc(s.id)}">
        <div class="wrap">
          ${s.eyebrow ? `<div class="center" style="margin-bottom:28px"><span class="kicker" data-reveal>${esc(s.eyebrow)}</span></div>` : ''}
          <div class="quotes" data-quotes data-reveal>
            ${items.map((t, i) => `
              <figure class="quote${i === 0 ? ' is-active' : ''}">
                <blockquote>${esc(t.quote)}</blockquote>
                <figcaption>${t.avatar ? img(t.avatar, t.name, 'class="avatar"') : `<span class="avatar">${esc(initials(t.name))}</span>`}<span><b>${esc(t.name)}</b><small>${esc(t.role)}</small></span></figcaption>
              </figure>`).join('')}
          </div>
          ${items.length > 1 ? `<div class="quotes__pager"><div class="pager">${items.map((_, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-q="${i}" aria-label="Testimonial ${i + 1}"></button>`).join('')}</div></div>` : ''}
        </div>
      </section>`;
    },

    journal(s) {
      const date = (d) => { const x = new Date(d); return isNaN(x) ? esc(d) : x.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }); };
      return `
      <section class="section" id="${esc(s.id)}">
        <div class="wrap">
          ${head(s, { center: false })}
          <div class="posts">
            ${(s.posts || []).map((p, i) => `
              <a class="post" ${linkAttrs(p.link || '#')} data-reveal style="--d:${i * 0.1}s">
                <div class="post__img">${img(p.image, p.title)}</div>
                <div class="post__body">${p.tag ? `<span class="post__tag">${esc(p.tag)}</span>` : ''}<h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><time>${date(p.date)}</time></div>
              </a>`).join('')}
          </div>
        </div>
      </section>`;
    },

    faq(s) {
      return `
      <section class="section" id="${esc(s.id)}">
        <div class="wrap wrap--text">
          ${head(s)}
          <div class="faq__list" data-reveal>
            ${(s.items || []).map((f) => `
              <div class="faq__item">
                <button class="faq__q" aria-expanded="false">${esc(f.q)}<span class="faq__plus"></span></button>
                <div class="faq__a"><div><p>${esc(f.a)}</p></div></div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
    },

    cta(s) {
      return `
      <section class="section section--tight" id="${esc(s.id)}">
        <div class="wrap">
          <div class="cta__tile" data-reveal data-cta>
            <div class="cta__text">
              <h2 class="h2">${fmt(s.title)}</h2>
              ${s.text ? `<p class="sub">${esc(s.text)}</p>` : ''}
              <div class="ctas">${button(s.button)}</div>
            </div>
            ${s.image ? `<div class="cta__img">${img(s.image, '')}</div>` : ''}
          </div>
        </div>
      </section>`;
    },

    contact(s, site) {
      const c = site.settings.contact || {};
      const rows = [
        ['Email', c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`],
        ['Phone', c.phone && `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>`],
        ['Visit', c.address && esc(c.address)],
        ['Hours', c.hours && esc(c.hours)],
      ].filter((r) => r[1]);
      const mapSrc = (c.mapEmbed || '').match(/src="([^"]+)"/)?.[1] || (/^https:\/\//.test(c.mapEmbed || '') ? c.mapEmbed : '');
      return `
      <section class="section" id="${esc(s.id)}">
        <div class="wrap contact__grid">
          <div class="contact__info" data-reveal>
            <div>${s.eyebrow ? `<span class="kicker">${esc(s.eyebrow)}</span>` : ''}<h2 class="h2">${fmt(s.title)}</h2></div>
            ${s.text ? `<p class="sub">${esc(s.text)}</p>` : ''}
            <dl class="info">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
            ${mapSrc ? `<div class="map"><iframe src="${url(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe></div>` : ''}
          </div>
          <div data-reveal style="--d:.1s">
            <form class="form" data-contact novalidate>
              <div class="fl"><input id="f-name" name="name" placeholder=" " required autocomplete="name"><label for="f-name">Name</label></div>
              <div class="fl"><input id="f-email" name="email" type="email" placeholder=" " required autocomplete="email"><label for="f-email">Email</label></div>
              <div class="fl"><input id="f-phone" name="phone" placeholder=" " autocomplete="tel"><label for="f-phone">Phone (optional)</label></div>
              <div class="fl fl--select"><select id="f-subj" name="subject"><option>Buying produce</option><option>Joining as a farmer</option><option>Bulk / business supply</option><option>Partnership</option><option>Something else</option></select><label for="f-subj">Topic</label></div>
              <div class="fl fl--full"><textarea id="f-msg" name="message" placeholder=" " required></textarea><label for="f-msg">Message</label></div>
              <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
              <div class="form__foot"><button class="btn" type="submit">Send message</button><span class="status" role="status"></span></div>
            </form>
            ${s.showNewsletter ? `
            <div class="newsletter">
              <h3>${esc((s.newsletterTitle || 'Join our newsletter').replace(/\*/g, ''))}</h3>
              <form data-subscribe><input type="email" name="email" placeholder="Email address" required aria-label="Email"><button class="btn" type="submit">Subscribe</button></form>
              <span class="status" role="status"></span>
            </div>` : ''}
          </div>
        </div>
      </section>`;
    },
  };

  // ---------- chrome ----------
  const logo = (st) => (st.logoImage ? `<img src="${url(st.logoImage)}" alt="${esc(st.siteName)}">` : `${ICON.leaf}<span>${esc(st.logoText || st.siteName)}</span>`);

  function renderChrome(site) {
    const { settings, navigation = [] } = site;
    const ann = settings.announcement;
    const contact = navigation.find((n) => /contact/i.test(n.href)) || { href: '#contact' };

    $('#nav').innerHTML = `
      <div class="nav__inner">
        <a class="logo" href="#top" aria-label="${esc(settings.siteName)} home">${logo(settings)}</a>
        <nav class="nav__links" aria-label="Main">${navigation.map((n) => `<a ${linkAttrs(n.href)}>${esc(n.label)}</a>`).join('')}</nav>
        <div class="nav__right"><a class="btn" ${linkAttrs(contact.href)}>Get in touch</a><button class="burger" aria-label="Menu" aria-expanded="false"><span></span></button></div>
      </div>`;

    $('#menu').innerHTML = `${navigation.map((n, i) => `<a ${linkAttrs(n.href)} style="--d:${0.05 + i * 0.04}s">${esc(n.label)}</a>`).join('')}
      <div class="menu__foot"><span>${esc(settings.contact?.email || '')}</span><span>${esc(settings.contact?.phone || '')}</span></div>`;

    const showRibbon = !!(ann?.enabled && ann.text);
    $('#ribbon').innerHTML = showRibbon ? `<div class="ribbon">${esc(ann.text)}${ann.link ? `<a class="link" ${linkAttrs(ann.link)}>Learn more</a>` : ''}</div>` : '';
    document.body.classList.toggle('no-ribbon', !showRibbon);

    const f = settings.footer || {};
    const social = Object.entries(settings.social || {}).filter(([k, v]) => v && ICON[k]);
    $('#footer').innerHTML = `
      <div class="footer__inner">
        ${f.text ? `<p class="footer__note">${esc(f.text)}</p>` : ''}
        <div class="footer__cols">
          <div><a class="logo" href="#top">${logo(settings)}</a><p>${esc(settings.tagline || '')}</p>${social.length ? `<div class="socials">${social.map(([k, v]) => `<a ${linkAttrs(v)} aria-label="${k}">${ICON[k]}</a>`).join('')}</div>` : ''}</div>
          <div><h4>Explore</h4><ul>${navigation.map((n) => `<li><a ${linkAttrs(n.href)}>${esc(n.label)}</a></li>`).join('')}</ul></div>
          <div><h4>Contact</h4><ul>
            ${settings.contact?.email ? `<li><a href="mailto:${esc(settings.contact.email)}">${esc(settings.contact.email)}</a></li>` : ''}
            ${settings.contact?.phone ? `<li>${esc(settings.contact.phone)}</li>` : ''}
            ${settings.contact?.hours ? `<li>${esc(settings.contact.hours)}</li>` : ''}
          </ul></div>
          <div><h4>Visit</h4><ul><li>${esc(settings.contact?.address || '')}</li></ul></div>
        </div>
        <div class="footer__bottom"><span>${esc((f.copyright || '').replace('{year}', new Date().getFullYear()))}</span><a href="/admin">Admin</a></div>
      </div>`;

    const wa = site.integrations?.whatsapp;
    $('#floating').innerHTML = `
      ${wa?.enabled && wa.number ? `<a class="fab" href="https://wa.me/${encodeURIComponent(wa.number)}?text=${encodeURIComponent(wa.message || '')}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICON.whatsapp}</a>` : ''}
      ${PREVIEW ? '<span class="preview-badge">Live preview</span>' : ''}`;
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
    if (PREVIEW || theme.customCss) {
      if (!css) { css = document.createElement('style'); css.id = 'custom-css'; document.head.appendChild(css); }
      css.textContent = theme.customCss || '';
    }

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.motion = reduced ? 'none' : (theme.animations || 'full');
    root.classList.toggle('no-motion', state.motion === 'none');
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme.colors?.bg || '';
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
    const immersive = first?.type === 'hero' && site.theme.heroStyle === 'minimal';
    $('#nav').classList.toggle('nav--clear', immersive);
    document.body.classList.toggle('has-clear-nav', immersive);
    $('#app').style.paddingTop = first?.type === 'hero' || $('.ribbon') ? '' : 'var(--nav-h)';
    initSections();
  }

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
  const every = (fn, ms) => { const t = setInterval(fn, ms); state.timers.push(t); return t; };

  function initSections() {
    initReveals();
    initHero();
    initStrip();
    initWords();
    initCounters();
    initParallax();
    initStory();
    initShelf();
    initGallery();
    initQuotes();
    initFaq();
    initForms();
    initCta();
    loadWeather();
    loadApis();
    bindLinks();
    layout();
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
    const sec = state.site.sections.find((s) => s.type === 'hero') || {};
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
    if (slides.length > 1) restart();

    const stage = $('[data-stage]', hero);
    if (stage) {
      const pin = $('.hero__pin', stage);
      if (!animated()) { pin.style.setProperty('--p', 1); return; }
      onScroll(() => {
        const r = stage.getBoundingClientRect();
        const travel = Math.max(1, r.height - (innerHeight - parseFloat(getComputedStyle(root).getPropertyValue('--nav-h') || 48)));
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
        const t0 = performance.now(); const dur = 1600;
        const tick = (t) => { const k = clamp((t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN'); if (k < 1) requestAnimationFrame(tick); };
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
        const mid = innerHeight * 0.5;
        let idx = 0;
        steps.forEach((st, i) => { if (st.getBoundingClientRect().top < mid) idx = i; });
        if (idx === active) return;
        active = idx;
        steps.forEach((st, i) => st.classList.toggle('is-active', i === idx));
        imgs.forEach((im, i) => im.classList.toggle('is-active', i === idx));
        if (count) count.textContent = `${pad(idx + 1)} / ${pad(steps.length)}`;
      });
    });
  }

  function initShelf() {
    $$('[data-shelf-section]').forEach((sec) => {
      const shelf = $('[data-shelf]', sec);
      const [prev, next] = $$('.paddle', sec);
      const update = () => {
        prev.disabled = shelf.scrollLeft < 8;
        next.disabled = shelf.scrollLeft + shelf.clientWidth >= shelf.scrollWidth - 8;
      };
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
        shelf.scrollTo({ left: 0 });
        update();
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
      let index = 0; let playing = animated(); let timer;
      const setActive = (i) => {
        index = i;
        slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
        dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
      };
      const go = (i) => {
        const s = slides[(i + slides.length) % slides.length];
        track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: 'smooth' });
      };
      let st;
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
      play?.addEventListener('click', () => {
        playing = !playing; play.innerHTML = playing ? ICON.pause : ICON.play; play.setAttribute('aria-label', playing ? 'Pause' : 'Play'); start();
      });
      if (play && !playing) play.innerHTML = ICON.play;
      start();
    });
  }
  const isVisible = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

  function initQuotes() {
    $$('[data-quotes]').forEach((wrap) => {
      const quotes = $$('.quote', wrap);
      const dots = $$('[data-q]', wrap.parentElement);
      let i = 0; let timer;
      const show = (n) => {
        i = (n + quotes.length) % quotes.length;
        quotes.forEach((q, k) => q.classList.toggle('is-active', k === i));
        dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
      };
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
        const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
        im.style.setProperty('--s', (1.12 - p * 0.12).toFixed(4));
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
      const status = $('.status', form);
      const data = Object.fromEntries(new FormData(form));
      if (!data.name || !data.email || !data.message) { status.className = 'status err'; status.textContent = 'Please add your name, email and a message.'; return; }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; status.className = 'status'; status.textContent = 'Sending…';
      try {
        if (PREVIEW) throw new Error('Forms are disabled in preview mode.');
        data.token = await recaptchaToken();
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Something went wrong');
        form.reset(); status.className = 'status ok'; status.textContent = 'Thanks. We’ll reply within a day.';
        window.gtag?.('event', 'generate_lead');
      } catch (err) { status.className = 'status err'; status.textContent = err.message; } finally { btn.disabled = false; }
    }));
    $$('[data-subscribe]').forEach((form) => form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.parentElement.querySelector('.status');
      try {
        if (PREVIEW) throw new Error('Forms are disabled in preview mode.');
        const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        form.reset(); status.className = 'status ok'; status.textContent = 'You’re subscribed.';
      } catch (err) { status.className = 'status err'; status.textContent = err.message; }
    }));
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
      $$('.js-wx-temp').forEach((el) => { el.textContent = `${w.temp}°`; });
      $$('.js-wx-cond').forEach((el) => { el.textContent = el.closest('.js-weather-chip') ? `${w.city} · ${w.condition}` : w.condition; });
      $$('.js-weather-chip .wx-icon, .js-wx-icon').forEach((el) => { el.textContent = w.icon; });
      $$('.js-wx-hum').forEach((el) => { el.textContent = w.humidity; });
      $$('.js-wx-wind').forEach((el) => { el.textContent = `${w.wind} ${w.windUnit}`; });
      $$('.js-wx-days').forEach((el) => {
        el.innerHTML = (w.daily || []).map((d) => `<div class="weather__day"><span>${new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</span><span style="font-size:22px">${d.icon}</span><b>${d.max}°</b><span style="opacity:.7">${d.min}°</span></div>`).join('');
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
      try {
        const r = await fetch(`/api/custom/${encodeURIComponent(card.dataset.api)}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        body.innerHTML = renderApiData(j.data, meta.display || {});
      } catch {
        body.innerHTML = '<p class="body">Data isn’t available right now.</p>';
      }
    });
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
    if (data && typeof data === 'object') {
      return `<ul class="api-list">${Object.entries(data).filter(([, v]) => typeof v !== 'object').slice(0, limit).map(([k, v]) => `<li><span>${esc(k)}</span><span>${val(v)}</span></li>`).join('')}</ul>`;
    }
    return `<div class="api-big grad">${val(data)}</div>`;
  }

  // ---------- links & global ----------
  function bindLinks() {
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' || id === '#' ? document.body : (id.length > 1 && document.querySelector(id));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToEl(target);
    }));
  }

  function scrollToEl(target) {
    const top = target === document.body ? 0 : target.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 48) + 1;
    if (state.lenis) state.lenis.scrollTo(top, { duration: 1.2 });
    else window.scrollTo({ top, behavior: animated() ? 'smooth' : 'auto' });
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    $('#menu').setAttribute('aria-hidden', 'true');
    state.lenis?.start();
  }

  function bindGlobal() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.burger')) {
        const open = document.body.classList.toggle('menu-open');
        $('#menu').setAttribute('aria-hidden', String(!open));
        $('.burger')?.setAttribute('aria-expanded', String(open));
        open ? state.lenis?.stop() : state.lenis?.start();
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

    const nav = $('#nav');
    const loop = (t) => {
      state.lenis?.raf(t);
      const y = scrollY;
      const clearUntil = nav.classList.contains('nav--clear') ? innerHeight * 0.75 : 4;
      nav.classList.toggle('is-scrolled', y > clearUntil);
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
    let site;
    try { site = await fetch('/api/site').then((r) => r.json()); } catch {
      $('#app').innerHTML = '<p style="padding:20vh 2rem;text-align:center">Could not load the site. Please refresh.</p>';
      return;
    }
    render(site);
    initLenis(site.theme);
    bindGlobal();
  }

  // Live preview from the admin panel.
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'bhoomi:preview' && state.site) {
      const y = scrollY;
      const next = { ...state.site, ...e.data.site, integrations: { ...state.site.integrations, ...(e.data.site.integrations || {}) } };
      render(next);
      initLenis(next.theme);
      $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      requestAnimationFrame(() => { layout(); window.scrollTo(0, y); });
    }
    if (e.data.type === 'bhoomi:scrollTo') {
      const el = document.getElementById(e.data.id);
      if (el) scrollToEl(el);
    }
  });

  boot();
})();
