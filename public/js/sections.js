/* Home page section renderers (one per CMS section type). */
(function () {
  'use strict';
  const { esc, fmt, img, linkAttrs, ICON, head, t } = window.BH;
  const BH = window.BH;
  const url = BH.url;

  const button = (b, cls = '') => (b && b.label ? `<a class="btn ${cls}" ${linkAttrs(b.href || '#')}>${esc(b.label)}</a>` : '');
  const textLink = (b) => (b && b.label ? `<a class="link" ${linkAttrs(b.href || '#')}>${esc(b.label)}</a>` : '');

  BH.sections = {
    hero(s, site) {
      const style = site.theme.heroStyle || 'reveal';
      const imgs = (s.images || []).filter((i) => i.src);
      const weather = s.showWeather && site.integrations?.weather?.enabled;
      const slides = imgs.map((im, i) => `<div class="hero__slide${i === 0 ? ' is-active' : ''}">${img(im.src, im.caption, { eager: i === 0 })}</div>`).join('');
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
      const items = (s.items || []).map((x) => `<span class="strip__item">${esc(x)}</span>`).join('');
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
            ${s.image ? `<div class="tile-img" data-reveal>${img(s.image, s.imageAlt, { sizes: '(max-width: 800px) 100vw, 60vw', extra: 'data-parallax="0.06"' })}</div>` : ''}
            ${s.secondaryImage ? `<div class="tile-img" data-reveal style="--d:.12s">${img(s.secondaryImage, '', { sizes: '(max-width: 800px) 100vw, 35vw' })}</div>` : ''}
          </div>` : ''}
          ${pts.length ? `<div class="points" style="--n:${Math.min(pts.length, 3)}">${pts.map((p, i) => `
            <div class="point" data-reveal style="--d:${i * 0.1}s"><div class="point__icon">${i + 1}</div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`).join('')}</div>` : ''}
          <div class="center" style="margin-top:48px" data-reveal><a class="link" href="/about">${t('learnMore')}</a></div>
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
              const href = it.slug && it.content ? `/services/${it.slug}` : it.link;
              return `
              <article class="tile tile--${size}${size === 'wide' && i % 8 === 3 ? ' tile--dark' : ''}" data-reveal style="--d:${(i % 2) * 0.1}s">
                ${href ? `<a class="card__link" ${linkAttrs(href)} aria-label="${esc(it.title)}"></a>` : ''}
                <div class="tile__text">
                  ${it.tag ? `<span class="tile__tag">${esc(it.tag)}</span>` : ''}
                  <h3 class="h3">${fmt(it.title)}</h3>
                  ${it.text ? `<p>${esc(it.text)}</p>` : ''}
                  ${href ? `<span class="link">${t('learnMore')}</span>` : ''}
                </div>
                ${it.image ? `<div class="tile__img">${img(it.image, it.title, { sizes: size === 'sm' ? '(max-width: 900px) 100vw, 40vw' : '(max-width: 900px) 100vw, 60vw' })}</div>` : ''}
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
                <div class="story__step${i === 0 ? ' is-active' : ''}">
                  ${st.image ? `<div class="story__inline">${img(st.image, st.title, { sizes: '100vw' })}</div>` : ''}
                  ${st.label ? `<span class="story__label">${esc(st.label)}</span>` : ''}
                  <h3>${fmt(st.title)}</h3>
                  <p>${esc(st.text)}</p>
                </div>`).join('')}
            </div>
            <div class="story__visual">
              ${steps.map((st, i) => `<div class="story__img${i === 0 ? ' is-active' : ''}">${img(st.image, st.title, { sizes: '50vw' })}</div>`).join('')}
              <span class="story__count js-story-count">01 / ${BH.pad(steps.length)}</span>
            </div>
          </div>
        </div>
      </section>`;
    },

    products(s, site) {
      let items = site.products || [];
      if (s.source !== 'all') items = items.filter((p) => p.featured);
      items = items.slice(0, Number(s.limit) || 8);
      const cats = [...new Set(items.map((p) => p.category).filter(Boolean))];
      const filter = cats.length > 1 ? `<div class="segmented" role="tablist"><button class="is-active" data-filter="*">${t('all')}</button>${cats.map((c) => `<button data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : '';
      return `
      <section class="section" id="${esc(s.id)}" data-shelf-section>
        <div class="wrap">
          ${head(s, { center: false, extra: `<div class="head__aside">${s.subtitle ? `<p class="body">${esc(s.subtitle)}</p>` : ''}${filter}</div>` })}
        </div>
        <div class="shelf" data-shelf>${items.map((p, i) => BH.productCard(p, i)).join('')}</div>
        <div class="wrap"><div class="paddles"><a class="link" href="/products" style="margin-right:auto">${t('viewAll')}</a><button class="paddle" data-dir="-1" aria-label="Previous">${ICON.left}</button><button class="paddle" data-dir="1" aria-label="Next">${ICON.right}</button></div></div>
      </section>`;
    },

    live(s, site) {
      const apis = site.integrations?.customApis || [];
      const chosen = (s.apiIds && s.apiIds.length) ? apis.filter((a) => s.apiIds.includes(a.id)) : apis;
      const weatherOn = s.showWeather && site.integrations?.weather?.enabled;
      const mandiOn = site.integrations?.mandi?.enabled;
      if (!weatherOn && !chosen.length && !mandiOn) return '';
      return `
      <section class="section" id="${esc(s.id)}">
        <div class="wrap">
          ${head({ ...s, subtitle: s.text })}
          <div class="live__grid">
            ${weatherOn ? `
            <div class="weather js-weather-card" data-reveal>
              <div class="weather__top"><div><div class="weather__city">${esc(site.integrations.weather.city)}</div><div class="weather__temp js-wx-temp">--°</div><div class="weather__cond js-wx-cond">${t('loading')}</div></div><div class="weather__icon js-wx-icon">⛅</div></div>
              <div class="weather__meta"><span>💧 <b class="js-wx-hum">--</b>%</span><span>🌬 <b class="js-wx-wind">--</b></span></div>
              <div class="weather__days js-wx-days"></div>
            </div>` : ''}
            <div class="api-cards">
              ${mandiOn ? `<div class="api-card" data-reveal data-mandi-mini><h3>${esc(BH.plain(t('mandiTitle')))}</h3><div class="js-api-body"><div class="skeleton" style="width:70%"></div><div class="skeleton" style="width:50%"></div></div><a class="link" href="/mandi" style="margin-top:12px">${t('viewAll')}</a></div>` : ''}
              ${chosen.map((a, i) => `<div class="api-card" data-reveal style="--d:${i * 0.1}s" data-api="${esc(a.id)}"><h3>${esc(a.name)}</h3><div class="js-api-body"><div class="skeleton" style="width:70%"></div><div class="skeleton" style="width:50%"></div></div></div>`).join('')}
            </div>
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
          ${imgs.map((im, i) => `<figure class="gallery__slide${i === 0 ? ' is-active' : ''}">${img(im.src, im.caption, { sizes: '86vw' })}${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ''}</figure>`).join('')}
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
            ${items.map((q, i) => `
              <figure class="quote${i === 0 ? ' is-active' : ''}">
                <blockquote>${esc(q.quote)}</blockquote>
                <figcaption>${q.avatar ? img(q.avatar, q.name, { extra: 'class="avatar"' }) : `<span class="avatar">${esc(initials(q.name))}</span>`}<span><b>${esc(q.name)}</b><small>${esc(q.role)}</small></span></figcaption>
              </figure>`).join('')}
          </div>
          ${items.length > 1 ? `<div class="quotes__pager"><div class="pager">${items.map((_, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-q="${i}" aria-label="Testimonial ${i + 1}"></button>`).join('')}</div></div>` : ''}
        </div>
      </section>`;
    },

    journal(s, site) {
      const posts = (site.posts || []).slice(0, Number(s.limit) || 3);
      if (!posts.length) return '';
      return `
      <section class="section" id="${esc(s.id)}">
        <div class="wrap">
          ${head(s, { center: false, extra: `<a class="link" href="/blog">${t('allPosts')}</a>` })}
          <div class="posts">${posts.map((p, i) => BH.postCard(p, i)).join('')}</div>
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
            ${s.image ? `<div class="cta__img">${img(s.image, '', { sizes: '100vw' })}</div>` : ''}
          </div>
        </div>
      </section>`;
    },

    contact(s, site) {
      return BH.contactBlock(s, site);
    },
  };

  BH.postCard = (p, i = 0) => `
    <a class="post" href="/blog/${esc(p.slug)}" data-reveal style="--d:${(i % 3) * 0.1}s">
      <div class="post__img">${img(p.cover, p.title, { sizes: '(max-width: 900px) 100vw, 33vw' })}</div>
      <div class="post__body">${p.category ? `<span class="post__tag">${esc(p.category)}</span>` : ''}<h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><time>${BH.date(p.date)}</time></div>
    </a>`;

  // Contact block is used on the home page and the /contact page.
  BH.contactBlock = (s, site) => {
    const c = site.settings.contact || {};
    const rows = [
      [t('email'), c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`],
      [t('phone'), c.phone && `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>`],
      ['📍', c.address && esc(c.address)],
      ['⏰', c.hours && esc(c.hours)],
    ].filter((r) => r[1]);
    const mapSrc = (c.mapEmbed || '').match(/src="([^"]+)"/)?.[1] || (/^https:\/\//.test(c.mapEmbed || '') ? c.mapEmbed : '');
    const f = BH.field;
    return `
      <section class="section" id="${esc(s.id || 'contact')}">
        <div class="wrap contact__grid">
          <div class="contact__info" data-reveal>
            <div>${s.eyebrow ? `<span class="kicker">${esc(s.eyebrow)}</span>` : ''}<h2 class="h2">${fmt(s.title || t('contactTitle'))}</h2></div>
            ${s.text ? `<p class="sub">${esc(s.text)}</p>` : ''}
            <dl class="info">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
            ${mapSrc ? `<div class="map"><iframe src="${url(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe></div>` : ''}
          </div>
          <div data-reveal style="--d:.1s">
            <form class="form" data-contact novalidate>
              ${f('name', t('name'), { required: true })}
              ${f('email', t('email'), { type: 'email', required: true })}
              ${f('phone', t('phone'), { type: 'tel' })}
              ${f('subject', t('topic'), { options: [t('topicBuying'), t('topicFarmer'), t('topicBulk'), t('topicPartner'), t('topicOther')] })}
              ${f('message', t('message'), { type: 'textarea', required: true, full: true })}
              <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
              <div class="form__foot"><button class="btn" type="submit">${t('sendMessage')}</button><span class="status" role="status"></span></div>
            </form>
            ${s.showNewsletter !== false ? `
            <div class="newsletter">
              <h3>${esc(BH.plain(s.newsletterTitle || 'Seasonal letters from the farm'))}</h3>
              <form data-subscribe><input type="email" name="email" placeholder="${esc(t('emailAddress'))}" required aria-label="${esc(t('emailAddress'))}"><button class="btn" type="submit">${t('subscribe')}</button></form>
              <span class="status" role="status"></span>
            </div>` : ''}
          </div>
        </div>
      </section>`;
  };
})();
