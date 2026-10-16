/* Route views: each returns { title, html, init? }. */
(function () {
  'use strict';
  const BH = window.BH;
  const { esc, fmt, img, t, $, $$, money, field: f } = BH;
  const V = BH.views;

  const pageHero = ({ kicker, title, sub, cover, small }) => `
    <section class="page-hero${small ? ' page-hero--small' : ''}">
      <div class="wrap center">
        ${kicker ? `<span class="kicker" data-reveal>${esc(kicker)}</span>` : ''}
        <h1 class="${small ? 'h2' : 'h1'}" data-reveal style="--d:.06s">${fmt(title)}</h1>
        ${sub ? `<p class="sub page-hero__sub" data-reveal style="--d:.12s">${esc(sub)}</p>` : ''}
      </div>
      ${cover ? `<div class="wrap"><div class="page-hero__cover" data-reveal style="--d:.18s">${img(cover, '', { eager: true, sizes: '100vw' })}</div></div>` : ''}
    </section>`;
  const crumbs = (items) => `<nav class="crumbs wrap" aria-label="Breadcrumb">${items.map(([l, h], i) => (h && i < items.length - 1 ? `<a href="${h}">${esc(l)}</a>` : `<span>${esc(l)}</span>`)).join('<i>›</i>')}</nav>`;
  const status = '<span class="status" role="status"></span>';
  const site = () => BH.site;

  // ---------- home ----------
  V.home = () => {
    const s = site();
    const html = (s.sections || []).filter((x) => x.enabled !== false && BH.sections[x.type]).map((x) => {
      try { return BH.sections[x.type](x, s); } catch (e) { console.error('Section failed', x, e); return ''; }
    }).join('');
    return { title: s.settings.seo?.title || s.settings.siteName, html, home: true };
  };

  // ---------- shop ----------
  V.products = () => {
    const ps = site().products;
    const cats = [...new Set(ps.map((p) => p.category).filter(Boolean))];
    return {
      title: t('shop'),
      html: `${pageHero({ kicker: t('shop'), title: t('shopTitle'), sub: t('shopSub'), small: true })}
        <section class="section section--flush">
          <div class="wrap">
            <div class="toolbar" data-reveal>
              <label class="search">${BH.ICON.search}<input type="search" placeholder="${esc(t('searchProducts'))}" data-q></label>
              ${cats.length > 1 ? `<div class="segmented">${['*', ...cats].map((c, i) => `<button class="${i ? '' : 'is-active'}" data-cat="${esc(c)}">${esc(c === '*' ? t('all') : c)}</button>`).join('')}</div>` : ''}
              <select class="select" data-sort aria-label="Sort"><option value="">${t('sortFeatured')}</option><option value="low">${t('sortLow')}</option><option value="high">${t('sortHigh')}</option></select>
            </div>
            <div class="grid-cards" data-grid></div>
            <p class="empty" data-empty hidden>${t('noResults')}</p>
            ${freeDeliveryNote()}
          </div>
        </section>`,
      init(root) {
        let cat = '*';
        const q = $('[data-q]', root); const sort = $('[data-sort]', root); const grid = $('[data-grid]', root);
        const draw = () => {
          const term = q.value.trim().toLowerCase();
          let list = ps.filter((p) => (cat === '*' || p.category === cat) && (!term || `${p.name} ${p.category} ${p.summary}`.toLowerCase().includes(term)));
          if (sort.value === 'low') list = [...list].sort((a, b) => a.price - b.price);
          if (sort.value === 'high') list = [...list].sort((a, b) => b.price - a.price);
          if (!sort.value) list = [...list].sort((a, b) => (Number(b.stock) > 0) - (Number(a.stock) > 0) || (b.featured === true) - (a.featured === true));
          grid.innerHTML = list.map((p, i) => BH.productCard(p, i)).join('');
          $$('[data-reveal]', grid).forEach((el) => el.classList.add('is-in'));
          $('[data-empty]', root).hidden = !!list.length;
        };
        $$('[data-cat]', root).forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; $$('[data-cat]', root).forEach((x) => x.classList.toggle('is-active', x === b)); draw(); }));
        q.addEventListener('input', draw); sort.addEventListener('change', draw);
        draw();
      },
    };
  };

  const freeDeliveryNote = () => {
    const c = site().commerce;
    return c.freeDeliveryAbove ? `<p class="note center">🚚 ${esc(t('freeAbove', { amt: money(c.freeDeliveryAbove) }))} · ${esc(c.deliveryDays || '')}</p>` : '';
  };

  const pincodeChecker = () => `
    <form class="pin" data-pin>
      <input name="pincode" inputmode="numeric" maxlength="6" pattern="\\d{6}" placeholder="${esc(t('pincode'))}" aria-label="${esc(t('pincode'))}" value="${esc(localStorage.getItem('bhoomi:pin') || '')}">
      <button class="btn btn--ghost btn--sm" type="submit">${t('check')}</button>
      <span class="status" role="status"></span>
    </form>`;
  const bindPincode = (root) => $$('[data-pin]', root).forEach((form) => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = $('.status', form); const pin = form.pincode.value.trim();
    try {
      const r = await BH.api('/api/pincode', { pincode: pin });
      if (!r.ok) throw new Error(r.error);
      try { localStorage.setItem('bhoomi:pin', pin); } catch { /* ignore */ }
      st.className = 'status ok'; st.textContent = `✓ ${t('deliversIn', { d: r.days })}`;
    } catch (err) { st.className = 'status err'; st.textContent = err.message || t('notServiceable'); }
  }));

  V.product = ({ slug }) => {
    const p = site().products.find((x) => x.slug === slug);
    if (!p) return V.notfound();
    const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    const out = Number(p.stock) <= 0;
    const related = site().products.filter((x) => x.id !== p.id && x.category === p.category).concat(site().products.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, 4);
    const imgs = (p.images || []).filter(Boolean);
    return {
      title: p.name,
      html: `${crumbs([[t('home'), '/'], [t('shop'), '/products'], [p.name]])}
        <section class="section section--flush">
          <div class="wrap pdp">
            <div class="pdp__gallery" data-reveal>
              <div class="pdp__main">${img(imgs[0], p.name, { eager: true, sizes: '(max-width: 900px) 100vw, 55vw' })}</div>
              ${imgs.length > 1 ? `<div class="pdp__thumbs">${imgs.map((src, i) => `<button class="${i ? '' : 'is-active'}" data-src="${BH.url(src)}">${img(src, '', { sizes: '96px' })}</button>`).join('')}</div>` : ''}
            </div>
            <div class="pdp__info" data-reveal style="--d:.08s">
              <span class="kicker">${esc(p.category)}${p.badge ? ` · ${esc(p.badge)}` : ''}</span>
              <h1 class="h2">${esc(p.name)}</h1>
              <p class="sub">${esc(p.summary || '')}</p>
              <div class="pdp__price"><b>${money(p.price)}</b><span class="muted"> / ${esc(p.unit)}</span>${off ? ` <s class="muted">${t('mrp')} ${money(p.mrp)}</s> <span class="pill">${t('off', { n: off })}</span>` : ''}</div>
              <p class="pdp__stock ${out ? 'err' : 'ok'}">${out ? t('outOfStock') : Number(p.stock) <= 10 ? t('onlyLeft', { n: p.stock }) : `✓ ${t('inStock')}`}</p>
              ${out ? '' : `
              <div class="pdp__buy">
                <div class="stepper" data-stepper><button type="button" data-d="-1" aria-label="-">−</button><input type="number" min="1" max="${Math.min(50, Number(p.stock))}" value="1" aria-label="${esc(t('qty'))}"><button type="button" data-d="1" aria-label="+">+</button></div>
                <button class="btn btn--lg" data-add-qty="${esc(p.id)}">${t('addToCart')}</button>
                <button class="btn btn--ghost btn--lg" data-buy="${esc(p.id)}">${t('buyNow')}</button>
              </div>`}
              <div class="pdp__box"><b>${t('checkDelivery')}</b>${pincodeChecker()}${freeDeliveryNote()}</div>
              <div class="prose">${BH.md(p.description || '')}</div>
            </div>
          </div>
        </section>
        ${related.length ? `<section class="section section--tight"><div class="wrap"><h2 class="h3" style="margin-bottom:28px">${t('related')}</h2><div class="grid-cards">${related.map((r, i) => BH.productCard(r, i)).join('')}</div></div></section>` : ''}`,
      init(root) {
        bindPincode(root);
        $$('.pdp__thumbs button', root).forEach((b) => b.addEventListener('click', () => {
          $$('.pdp__thumbs button', root).forEach((x) => x.classList.toggle('is-active', x === b));
          $('.pdp__main', root).innerHTML = img(b.dataset.src, p.name, { eager: true, sizes: '(max-width: 900px) 100vw, 55vw' });
        }));
        const input = $('[data-stepper] input', root);
        $$('[data-stepper] button', root).forEach((b) => b.addEventListener('click', () => { input.value = BH.clamp(Number(input.value) + Number(b.dataset.d), 1, Number(input.max) || 50); }));
        $('[data-add-qty]', root)?.addEventListener('click', () => { BH.cart.add(p.id, Number(input.value) || 1); BH.toast(`✓ ${t('added')}`); });
        $('[data-buy]', root)?.addEventListener('click', () => { BH.cart.add(p.id, Number(input.value) || 1); BH.go('/checkout'); });
      },
    };
  };

  // ---------- cart & checkout ----------
  const summary = (lines, { showItems = false } = {}) => {
    const c = site().commerce;
    const tot = BH.totals(lines);
    const need = c.freeDeliveryAbove && tot.subtotal < c.freeDeliveryAbove ? c.freeDeliveryAbove - tot.subtotal : 0;
    return `
      <aside class="summary">
        ${showItems ? `<ul class="summary__items">${lines.map((l) => `<li><span>${l.qty} × ${esc(l.product.name)}</span><span>${money(l.product.price * l.qty)}</span></li>`).join('')}</ul>` : ''}
        <dl>
          <div><dt>${t('subtotal')}</dt><dd>${money(tot.subtotal)}</dd></div>
          <div><dt>${t('delivery')}</dt><dd>${tot.delivery ? money(tot.delivery) : t('free')}</dd></div>
          <div class="summary__total"><dt>${t('total')}</dt><dd>${money(tot.total)}</dd></div>
        </dl>
        ${need ? `<p class="note">${esc(t('addMore', { amt: money(need) }))}</p><div class="meter"><span style="width:${Math.round((tot.subtotal / c.freeDeliveryAbove) * 100)}%"></span></div>` : ''}
        ${c.minOrder && tot.subtotal < c.minOrder ? `<p class="status err">${esc(t('minOrder', { amt: money(c.minOrder) }))}</p>` : ''}
      </aside>`;
  };

  V.cart = () => ({
    title: t('yourCart'),
    html: `<section class="section section--flush"><div class="wrap" data-cart></div></section>`,
    init(root) {
      const box = $('[data-cart]', root);
      const draw = () => {
        const lines = BH.cart.lines();
        if (!lines.length) {
          box.innerHTML = `<div class="empty-state"><h1 class="h2">${t('emptyCart')}</h1><a class="btn" href="/products">${t('continueShopping')}</a></div>`;
          return;
        }
        const c = site().commerce;
        const tot = BH.totals(lines);
        box.innerHTML = `
          <h1 class="h2" style="margin-bottom:32px">${t('yourCart')}</h1>
          <div class="cart">
            <ul class="lines">
              ${lines.map((l) => `
                <li class="line">
                  <a class="line__img" href="/products/${esc(l.product.slug)}">${img(l.product.images?.[0], l.product.name, { sizes: '120px' })}</a>
                  <div class="line__info"><a href="/products/${esc(l.product.slug)}"><b>${esc(l.product.name)}</b></a><span class="muted">${esc(l.product.unit)} · ${money(l.product.price)}</span>
                    <div class="stepper stepper--sm"><button data-id="${esc(l.id)}" data-d="-1" aria-label="-">−</button><input value="${l.qty}" readonly aria-label="${esc(t('qty'))}"><button data-id="${esc(l.id)}" data-d="1" aria-label="+">+</button></div>
                  </div>
                  <div class="line__end"><b>${money(l.product.price * l.qty)}</b><button class="link link--plain" data-rm="${esc(l.id)}">${t('remove')}</button></div>
                </li>`).join('')}
            </ul>
            <div>
              ${summary(lines)}
              <a class="btn btn--lg btn--block${c.minOrder && tot.subtotal < c.minOrder ? ' is-disabled' : ''}" href="/checkout">${t('checkout')}</a>
              <a class="link" href="/products" style="margin-top:14px">${t('continueShopping')}</a>
            </div>
          </div>`;
        $$('[data-d]', box).forEach((b) => b.addEventListener('click', () => { const l = lines.find((x) => x.id === b.dataset.id); BH.cart.set(l.id, l.qty + Number(b.dataset.d)); draw(); }));
        $$('[data-rm]', box).forEach((b) => b.addEventListener('click', () => { BH.cart.remove(b.dataset.rm); draw(); }));
      };
      draw();
    },
  });

  const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
  BH.STATES = STATES;

  let rzpLoading;
  const loadRazorpay = () => rzpLoading || (rzpLoading = new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = res; s.onerror = () => { rzpLoading = null; rej(new Error('Could not load payment window.')); };
    document.head.appendChild(s);
  }));

  BH.payOnline = async (order, rz, address) => {
    await loadRazorpay();
    return new Promise((resolve, reject) => {
      const r = new window.Razorpay({
        key: rz.keyId, order_id: rz.orderId, amount: rz.amount, currency: rz.currency,
        name: site().settings.siteName, description: `${t('orderNumber')} ${order.number}`,
        prefill: { name: address.name, email: address.email, contact: address.phone },
        theme: { color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#1f7a3a' },
        handler: async (resp) => { try { resolve((await BH.api(`/api/orders/${order.number}/verify`, resp)).order); } catch (e) { reject(e); } },
        modal: { ondismiss: () => reject(new Error(t('paymentFailed'))) },
      });
      r.open();
    });
  };

  V.checkout = () => ({
    title: t('checkout'),
    html: `<section class="section section--flush"><div class="wrap" data-co></div></section>`,
    async init(root) {
      const box = $('[data-co]', root);
      const lines = BH.cart.lines();
      if (!lines.length) { BH.go('/cart', true); return; }
      const c = site().commerce;
      let me = null;
      try { me = (await BH.api('/api/account/me')).customer; } catch { /* guest */ }
      const a = me?.address || {};
      const pay = [c.online && ['razorpay', t('online')], c.cod && ['cod', t('cod')]].filter(Boolean);
      box.innerHTML = `
        <h1 class="h2" style="margin-bottom:32px">${t('checkout')}</h1>
        <form class="cart" data-order novalidate>
          <div class="stack-lg">
            <fieldset><legend>${t('contactDetails')}</legend><div class="form">
              ${f('name', t('name'), { required: true, value: a.name || me?.name })}
              ${f('phone', t('phone'), { type: 'tel', required: true, value: a.phone || me?.phone, attrs: 'inputmode="tel" autocomplete="tel"' })}
              ${f('email', t('email'), { type: 'email', full: true, value: me?.email })}
            </div></fieldset>
            <fieldset><legend>${t('deliveryAddress')}</legend><div class="form">
              ${f('line1', t('address1'), { required: true, full: true, value: a.line1 })}
              ${f('line2', t('address2'), { full: true, value: a.line2 })}
              ${f('city', t('city'), { required: true, value: a.city })}
              ${f('pincode', t('pincode'), { required: true, value: a.pincode || localStorage.getItem('bhoomi:pin') || '', attrs: 'inputmode="numeric" maxlength="6"' })}
              ${f('state', t('state'), { options: STATES, value: a.state || 'Maharashtra', full: true })}
              <span class="status fl--full" data-pinstatus role="status"></span>
            </div></fieldset>
            <fieldset><legend>${t('payment')}</legend>
              <div class="choices">${pay.map(([v, l], i) => `<label class="choice"><input type="radio" name="payment" value="${v}"${i ? '' : ' checked'}><span>${esc(l)}</span></label>`).join('')}</div>
            </fieldset>
            ${f('note', t('orderNote'), { type: 'textarea', full: true })}
            ${c.orderNote ? `<p class="note">${esc(c.orderNote)}</p>` : ''}
          </div>
          <div>
            ${summary(lines, { showItems: true })}
            <button class="btn btn--lg btn--block" type="submit">${t('placeOrder')}</button>
            ${status}
          </div>
        </form>`;
      const form = $('[data-order]', box);
      const pinStatus = $('[data-pinstatus]', box);
      const checkPin = async () => {
        const v = form.pincode.value.trim();
        if (!/^\d{6}$/.test(v)) { pinStatus.textContent = ''; return true; }
        const r = await BH.api('/api/pincode', { pincode: v }).catch(() => ({ ok: false }));
        pinStatus.className = `status fl--full ${r.ok ? 'ok' : 'err'}`;
        pinStatus.textContent = r.ok ? `✓ ${t('deliversIn', { d: r.days })}` : (r.error || t('notServiceable'));
        return r.ok;
      };
      form.pincode.addEventListener('change', checkPin);
      if (form.pincode.value) checkPin();
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const st = $(':scope > div:last-child .status', form);
        if ([...form.querySelectorAll('[required]')].some((el) => !el.value.trim())) { st.className = 'status err'; st.textContent = t('fillRequired'); return; }
        const btn = $('button[type="submit"]', form);
        btn.disabled = true; st.className = 'status'; st.textContent = t('sending');
        const d = Object.fromEntries(new FormData(form));
        const address = { name: d.name, phone: d.phone, email: d.email, line1: d.line1, line2: d.line2, city: d.city, state: d.state, pincode: d.pincode };
        try {
          if (BH.PREVIEW) throw new Error(t('previewForms'));
          const r = await BH.api('/api/orders', { items: BH.cart.items(), address, payment: d.payment, note: d.note });
          try { sessionStorage.setItem(`bhoomi:order:${r.order.number}`, JSON.stringify({ phone: d.phone, rz: r.razorpay, address })); } catch { /* ignore */ }
          BH.cart.clear();
          if (me) BH.api('/api/account/me', { address }, 'PATCH').catch(() => {});
          window.gtag?.('event', 'purchase', { transaction_id: r.order.number, value: r.order.total, currency: 'INR' });
          if (r.razorpay) { try { await BH.payOnline(r.order, r.razorpay, address); } catch (err) { BH.toast(err.message); } }
          BH.go(`/order/${r.order.number}`);
        } catch (err) { st.className = 'status err'; st.textContent = err.message; btn.disabled = false; }
      });
    },
  });

  const STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
  const timeline = (o) => {
    if (o.status === 'cancelled') return `<p class="pill pill--err">${t('st_cancelled')}</p>`;
    const at = STEPS.indexOf(o.status);
    return `<ol class="timeline">${STEPS.map((s, i) => {
      const h = o.history.filter((x) => x.status === s).pop();
      return `<li class="${i <= at ? 'done' : ''}${i === at ? ' now' : ''}"><span class="dot">${i <= at ? BH.ICON.check : ''}</span><b>${t(`st_${s}`)}</b>${h ? `<small>${BH.date(h.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${h.note ? ` · ${esc(h.note)}` : ''}</small>` : ''}</li>`;
    }).join('')}</ol>`;
  };
  const orderView = (o, { fresh } = {}) => `
    <div class="order">
      ${fresh ? `<div class="center" style="margin-bottom:40px"><div class="big-check">${BH.ICON.check}</div><h1 class="h2">${t('orderPlaced')}</h1></div>` : ''}
      <div class="order__head"><div><span class="muted">${t('orderNumber')}</span><h2 class="h3">${esc(o.number)}</h2></div><span class="pill">${t(`st_${o.status}`)}</span></div>
      ${o.status === 'pending_payment' ? `<p class="status err">${t('paymentFailed')}</p><button class="btn" data-retry>${t('retryPayment')}</button>` : timeline(o)}
      <div class="order__grid">
        <ul class="summary__items">${o.lines.map((l) => `<li><span>${l.qty} × ${esc(l.name)} <small class="muted">${esc(l.unit)}</small></span><span>${money(l.total)}</span></li>`).join('')}</ul>
        <dl class="summary"><div><dt>${t('subtotal')}</dt><dd>${money(o.subtotal)}</dd></div><div><dt>${t('delivery')}</dt><dd>${o.delivery ? money(o.delivery) : t('free')}</dd></div><div class="summary__total"><dt>${t('total')}</dt><dd>${money(o.total)}</dd></div><div><dt>${t('payment')}</dt><dd>${o.payment.method === 'cod' ? t('cod') : t('online')}</dd></div></dl>
        <p class="muted">${esc(o.address.name)}<br>${esc(o.address.line1)}${o.address.line2 ? `, ${esc(o.address.line2)}` : ''}<br>${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.pincode)}</p>
      </div>
    </div>`;

  V.order = ({ number }) => ({
    title: `${t('orderNumber')} ${number}`,
    html: `<section class="section section--flush"><div class="wrap wrap--text" data-o><p class="center muted">${t('loading')}</p></div></section>`,
    async init(root) {
      const box = $('[data-o]', root);
      let saved = {};
      try { saved = JSON.parse(sessionStorage.getItem(`bhoomi:order:${number}`)) || {}; } catch { /* ignore */ }
      if (!saved.phone) { BH.go(`/track?number=${encodeURIComponent(number)}`, true); return; }
      try {
        const { order } = await BH.api('/api/orders/track', { number, phone: saved.phone });
        box.innerHTML = orderView(order, { fresh: Date.now() - new Date(order.createdAt) < 30 * 60 * 1000 });
        $('[data-retry]', box)?.addEventListener('click', async () => {
          try { await BH.payOnline(order, saved.rz, saved.address || order.address); V.order({ number }).init(root); } catch (e) { BH.toast(e.message); }
        });
      } catch (e) { box.innerHTML = `<p class="status err center">${esc(e.message)}</p>`; }
    },
  });

  V.track = () => ({
    title: t('trackTitle'),
    html: `${pageHero({ title: t('trackTitle'), small: true })}
      <section class="section section--flush"><div class="wrap wrap--text">
        <form class="form" data-track>${f('number', t('orderNumber'), { required: true, value: new URLSearchParams(location.search).get('number') || '' })}${f('phone', t('phone'), { type: 'tel', required: true })}
          <div class="form__foot"><button class="btn" type="submit">${t('track')}</button>${status}</div></form>
        <div data-result style="margin-top:48px"></div>
      </div></section>`,
    init(root) {
      const form = $('[data-track]', root);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const st = $('.status', form);
        try {
          const { order } = await BH.api('/api/orders/track', { number: form.number.value, phone: form.phone.value });
          try { sessionStorage.setItem(`bhoomi:order:${order.number}`, JSON.stringify({ phone: form.phone.value })); } catch { /* ignore */ }
          st.textContent = '';
          $('[data-result]', root).innerHTML = orderView(order);
        } catch (err) { st.className = 'status err'; st.textContent = err.message; }
      });
    },
  });

  // ---------- account ----------
  V.account = () => ({
    title: t('account'),
    html: `<section class="section section--flush"><div class="wrap wrap--text" data-acc><p class="center muted">${t('loading')}</p></div></section>`,
    async init(root) {
      const box = $('[data-acc]', root);
      const authForms = (mode = 'in') => {
        box.innerHTML = `
          <div class="auth">
            <h1 class="h2 center">${mode === 'in' ? t('welcomeBack') : t('signUp')}</h1>
            <form class="form form--single" data-auth>
              ${mode === 'up' ? f('name', t('name'), { required: true }) + f('phone', t('phone'), { type: 'tel' }) : ''}
              ${f('email', t('email'), { type: 'email', required: true, attrs: 'autocomplete="email"' })}
              ${f('password', t('password'), { type: 'password', required: true, attrs: `autocomplete="${mode === 'in' ? 'current' : 'new'}-password" minlength="8"` })}
              <div class="form__foot"><button class="btn btn--block btn--lg" type="submit">${mode === 'in' ? t('signIn') : t('signUp')}</button>${status}</div>
            </form>
            <p class="center muted">${mode === 'in' ? t('newHere') : t('haveAccount')} <button class="link" data-switch>${mode === 'in' ? t('signUp') : t('signIn')}</button></p>
            <p class="center"><a class="link" href="/track">${t('trackOrder')}</a></p>
          </div>`;
        $('[data-switch]', box).addEventListener('click', () => authForms(mode === 'in' ? 'up' : 'in'));
        $('[data-auth]', box).addEventListener('submit', async (e) => {
          e.preventDefault();
          const st = $('.status', e.target);
          try {
            await BH.api(`/api/account/${mode === 'in' ? 'login' : 'register'}`, Object.fromEntries(new FormData(e.target)));
            V.account().init(root);
          } catch (err) { st.className = 'status err'; st.textContent = err.message; }
        });
      };
      try {
        const { customer, orders } = await BH.api('/api/account/me');
        box.innerHTML = `
          <div class="order__head"><div><span class="muted">${esc(customer.email)}</span><h1 class="h2">${esc(t('hello', { name: customer.name.split(' ')[0] }))}</h1></div><button class="btn btn--ghost btn--sm" data-out>${t('signOut')}</button></div>
          <h2 class="h3" style="margin:40px 0 18px">${t('yourOrders')}</h2>
          ${orders.length ? `<ul class="orders">${orders.map((o) => `<li><a href="/order/${esc(o.number)}" data-phone="${esc(o.address.phone)}"><div><b>${esc(o.number)}</b><small class="muted">${BH.date(o.createdAt)} · ${o.lines.length} ${t('items')}</small></div><span class="pill">${t(`st_${o.status}`)}</span><b>${money(o.total)}</b></a></li>`).join('')}</ul>` : `<p class="muted">${t('noOrders')}</p>`}`;
        $$('[data-phone]', box).forEach((a) => a.addEventListener('click', () => { try { sessionStorage.setItem(`bhoomi:order:${a.getAttribute('href').split('/').pop()}`, JSON.stringify({ phone: a.dataset.phone })); } catch { /* ignore */ } }));
        $('[data-out]', box).addEventListener('click', async () => { await BH.api('/api/account/logout', {}); authForms(); });
      } catch { authForms(); }
    },
  });

  // ---------- blog ----------
  V.blog = () => {
    const posts = site().posts;
    const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))];
    return {
      title: t('journal'),
      html: `${pageHero({ kicker: t('journal'), title: t('journalTitle'), small: true })}
        <section class="section section--flush"><div class="wrap">
          <div class="toolbar" data-reveal>
            <label class="search">${BH.ICON.search}<input type="search" placeholder="${esc(t('searchPosts'))}" data-q value="${esc(new URLSearchParams(location.search).get('q') || '')}"></label>
            ${cats.length > 1 ? `<div class="segmented">${['*', ...cats].map((c, i) => `<button class="${i ? '' : 'is-active'}" data-cat="${esc(c)}">${esc(c === '*' ? t('all') : c)}</button>`).join('')}</div>` : ''}
          </div>
          <div class="posts" data-grid></div><p class="empty" data-empty hidden>${t('noResults')}</p>
        </div></section>`,
      init(root) {
        let cat = new URLSearchParams(location.search).get('category') || '*';
        const q = $('[data-q]', root);
        const draw = () => {
          const term = q.value.trim().toLowerCase();
          const list = posts.filter((p) => (cat === '*' || p.category === cat) && (!term || `${p.title} ${p.excerpt} ${p.content} ${(p.tags || []).join(' ')}`.toLowerCase().includes(term)));
          $('[data-grid]', root).innerHTML = list.map((p, i) => BH.postCard(p, i)).join('');
          $$('[data-grid] [data-reveal]', root).forEach((el) => el.classList.add('is-in'));
          $('[data-empty]', root).hidden = !!list.length;
          $$('[data-cat]', root).forEach((x) => x.classList.toggle('is-active', x.dataset.cat === cat));
        };
        $$('[data-cat]', root).forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; draw(); }));
        q.addEventListener('input', draw);
        draw();
      },
    };
  };

  V.post = ({ slug }) => {
    const p = site().posts.find((x) => x.slug === slug);
    if (!p) return V.notfound();
    const more = site().posts.filter((x) => x.id !== p.id).slice(0, 3);
    return {
      title: p.title,
      html: `${crumbs([[t('home'), '/'], [t('journal'), '/blog'], [p.title]])}
        <article class="section section--flush">
          <header class="wrap wrap--text center article__head">
            ${p.category ? `<a class="kicker" href="/blog?category=${encodeURIComponent(p.category)}">${esc(p.category)}</a>` : ''}
            <h1 class="h2">${esc(p.title)}</h1>
            <p class="muted">${p.author ? esc(t('by', { a: p.author })) + ' · ' : ''}${BH.date(p.date)} · ${t('minRead', { n: BH.readMins(p.content) })}</p>
          </header>
          ${p.cover ? `<div class="wrap"><div class="page-hero__cover">${img(p.cover, p.title, { eager: true, sizes: '100vw' })}</div></div>` : ''}
          <div class="wrap wrap--text prose prose--lg">${BH.md(p.content)}</div>
          ${(p.tags || []).length ? `<div class="wrap wrap--text tags">${p.tags.map((tg) => `<a class="pill" href="/blog?q=${encodeURIComponent(tg)}">#${esc(tg)}</a>`).join('')}</div>` : ''}
        </article>
        ${more.length ? `<section class="section section--tight section--surface"><div class="wrap"><h2 class="h3" style="margin-bottom:28px">${t('morePosts')}</h2><div class="posts">${more.map((x, i) => BH.postCard(x, i)).join('')}</div></div></section>` : ''}`,
    };
  };

  // ---------- services ----------
  V.service = ({ slug }) => {
    const all = site().sections.filter((x) => x.type === 'services').flatMap((x) => x.items || []);
    const s = all.find((x) => x.slug === slug);
    if (!s) return V.notfound();
    return {
      title: s.title,
      html: `${pageHero({ kicker: s.tag, title: s.title, sub: s.text, cover: s.image })}
        <section class="section section--flush"><div class="wrap wrap--text prose prose--lg">${BH.md(s.content || '')}</div>
          <div class="wrap center" style="margin-top:56px"><div class="ctas"><a class="btn btn--lg" href="/farmers">${t('register')}</a><a class="link" href="/contact">${t('getInTouch')}</a></div></div></section>
        <section class="section section--tight section--surface"><div class="wrap"><div class="mini-grid">${all.filter((x) => x.slug !== slug && x.content).map((x) => `<a class="mini" href="/services/${esc(x.slug)}"><span class="tile__tag">${esc(x.tag || '')}</span><b>${esc(x.title)}</b><span class="link">${t('learnMore')}</span></a>`).join('')}</div></div></section>`,
    };
  };

  // ---------- generic CMS page (+ about / farmers / careers extras) ----------
  V.page = ({ slug }) => {
    const p = site().pages.find((x) => x.slug === slug);
    if (!p) return V.notfound();
    const legal = !p.cover && p.showInFooter;
    let extra = '';
    if (slug === 'about') extra = teamBlock();
    if (slug === 'farmers') extra = farmerForms();
    if (slug === 'careers') extra = jobsBlock();
    return {
      title: p.title,
      html: `${pageHero({ title: p.title, sub: p.subtitle, cover: p.cover, small: legal })}
        ${p.content ? `<section class="section section--flush"><div class="wrap wrap--text prose${legal ? '' : ' prose--lg'}">${BH.md(p.content)}</div></section>` : ''}
        ${extra}`,
      init(root) {
        $$('[data-lead]', root).forEach((form) => BH.bindLead(form, form.dataset.lead));
        $$('[data-tabs]', root).forEach(bindTabs);
        $$('[data-apply]', root).forEach((b) => b.addEventListener('click', () => {
          const sel = $('[name="role"]', root); if (sel) sel.value = b.dataset.apply;
          $('#apply', root)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));
      },
    };
  };

  const bindTabs = (box) => {
    const tabs = $$('[data-tab]', box);
    tabs.forEach((tb) => tb.addEventListener('click', () => {
      tabs.forEach((x) => x.classList.toggle('is-active', x === tb));
      $$('[data-panel]', box).forEach((p) => { p.hidden = p.dataset.panel !== tb.dataset.tab; });
    }));
  };

  const teamBlock = () => {
    const team = site().team || [];
    if (!team.length) return '';
    const initials = (n = '') => n.replace(/^Dr\.?\s*/, '').split(/\s+/).map((x) => x[0]).slice(0, 2).join('');
    return `<section class="section section--surface"><div class="wrap">${BH.head({ title: t('team') })}
      <div class="team">${team.map((m, i) => `<div class="member" data-reveal style="--d:${i * 0.06}s"><div class="member__photo">${m.photo ? img(m.photo, m.name, { sizes: '240px' }) : `<span>${esc(initials(m.name))}</span>`}</div><b>${esc(m.name)}</b><span class="muted">${esc(m.role)}</span>${m.bio ? `<p>${esc(m.bio)}</p>` : ''}</div>`).join('')}</div></div></section>`;
  };

  const farmerForms = () => {
    const langs = [['hi', 'हिन्दी'], ['mr', 'मराठी'], ['ta', 'தமிழ்'], ['en', 'English']];
    const base = () => `${f('name', t('name'), { required: true })}${f('phone', t('phone'), { type: 'tel', required: true, attrs: 'inputmode="tel"' })}${f('village', t('village'))}${f('district', t('district'))}`;
    const foot = `<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><div class="form__foot"><button class="btn btn--lg" type="submit">${t('submit')}</button>${status}</div>`;
    return `
      <section class="section section--surface" id="forms"><div class="wrap wrap--narrow">
        ${BH.head({ title: t('farmerForms') })}
        <div data-tabs>
          <div class="segmented segmented--lg center-x" role="tablist">
            <button class="is-active" data-tab="reg">${t('register')}</button><button data-tab="soil">${t('soilTest')}</button><button data-tab="call">${t('callback')}</button>
          </div>
          <form class="form panel" data-panel="reg" data-lead="farmer-registration" novalidate>${base()}${f('state', t('state'), { options: STATES, value: 'Maharashtra' })}${f('land', t('land'), { type: 'number', attrs: 'min="0" step="0.5"' })}${f('crops', t('crops'), { full: true })}${f('preferredLanguage', t('language_pref'), { options: langs, full: true })}${foot}</form>
          <form class="form panel" data-panel="soil" data-lead="soil-test" hidden novalidate>${base()}${f('land', t('land'), { type: 'number', attrs: 'min="0" step="0.5"' })}${f('crops', t('crops'))}${f('date', t('preferredDate'), { type: 'date', full: true })}${foot}</form>
          <form class="form panel" data-panel="call" data-lead="callback" hidden novalidate>${f('name', t('name'), { required: true })}${f('phone', t('phone'), { type: 'tel', required: true })}${f('time', t('preferredTime'), { options: [t('morning'), t('afternoon'), t('evening')] })}${f('preferredLanguage', t('language_pref'), { options: langs })}${f('message', t('message'), { type: 'textarea', full: true })}${foot}</form>
        </div>
      </div></section>`;
  };

  const jobsBlock = () => {
    const jobs = site().jobs || [];
    return `
      <section class="section section--surface"><div class="wrap wrap--text">
        ${BH.head({ title: t('openRoles') })}
        ${jobs.length ? `<div class="faq__list">${jobs.map((j) => `
          <div class="faq__item"><button class="faq__q" aria-expanded="false"><span>${esc(j.title)}<small class="muted job-meta">${esc(j.location)} · ${esc(j.type)}</small></span><span class="faq__plus"></span></button>
            <div class="faq__a"><div><div class="prose">${BH.md(j.description)}</div><p style="margin:16px 0 28px"><button class="btn btn--sm" data-apply="${esc(j.title)}">${t('apply')}</button></p></div></div></div>`).join('')}</div>` : `<p class="center muted">${t('noRoles')}</p>`}
        <form class="form" id="apply" data-lead="job-application" style="margin-top:64px" novalidate>
          <h3 class="h3 fl--full">${t('applyFor')}</h3>
          ${f('name', t('name'), { required: true })}${f('email', t('email'), { type: 'email', required: true })}${f('phone', t('phone'), { type: 'tel' })}
          ${f('role', t('role'), { options: [...jobs.map((j) => j.title), t('topicOther')] })}
          ${f('resume', t('resume'), { type: 'url', full: true })}${f('message', t('coverNote'), { type: 'textarea', full: true })}
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="form__foot"><button class="btn btn--lg" type="submit">${t('apply')}</button>${status}</div>
        </form>
      </div></section>`;
  };

  // ---------- contact & bulk ----------
  V.contact = () => {
    const s = site().sections.find((x) => x.type === 'contact') || {};
    return { title: t('getInTouch'), html: `<div class="page-top"></div>${BH.contactBlock({ ...s, id: 'contact-page' }, site())}
      <section class="section section--tight"><div class="wrap"><div class="mini-grid">
        <a class="mini" href="/farmers"><span class="tile__tag">${t('fFarmers')}</span><b>${t('register')}</b><span class="link">${t('learnMore')}</span></a>
        <a class="mini" href="/bulk"><span class="tile__tag">${t('bulk')}</span><b>${t('requestQuote')}</b><span class="link">${t('learnMore')}</span></a>
        <a class="mini" href="/track"><span class="tile__tag">${t('shop')}</span><b>${t('trackOrder')}</b><span class="link">${t('learnMore')}</span></a>
      </div></div></section>` };
  };

  V.bulk = () => ({
    title: t('bulkTitle'),
    html: `${pageHero({ kicker: t('bulk'), title: t('bulkTitle'), sub: t('bulkSub'), small: true })}
      <section class="section section--flush"><div class="wrap wrap--narrow">
        <form class="form" data-lead="bulk-quote" novalidate>
          ${f('company', t('company'), { required: true })}${f('name', t('name'), { required: true })}
          ${f('phone', t('phone'), { type: 'tel', required: true })}${f('email', t('email'), { type: 'email' })}
          ${f('products', t('productsNeeded'), { full: true, required: true })}
          ${f('quantity', t('quantity'))}${f('frequency', t('frequency'), { options: [t('weekly'), t('monthly'), t('oneTime')] })}
          ${f('city', t('city'))}${f('state', t('state'), { options: STATES, value: 'Maharashtra' })}
          ${f('message', t('message'), { type: 'textarea', full: true })}
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="form__foot"><button class="btn btn--lg" type="submit">${t('requestQuote')}</button>${status}</div>
        </form>
      </div></section>`,
    init(root) { BH.bindLead($('[data-lead]', root), 'bulk-quote'); },
  });

  // ---------- mandi prices ----------
  V.mandi = () => {
    const cfg = site().integrations?.mandi || {};
    const params = new URLSearchParams(location.search);
    const state = params.get('state') || cfg.defaultState || 'Maharashtra';
    return {
      title: BH.plain(t('mandiTitle')),
      html: `${pageHero({ title: t('mandiTitle'), sub: t('mandiSub'), small: true })}
        <section class="section section--flush"><div class="wrap">
          ${cfg.enabled ? `
          <div class="toolbar" data-reveal>
            <select class="select" data-state aria-label="${esc(t('state'))}">${STATES.map((s) => `<option${s === state ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select>
            <select class="select" data-district aria-label="${esc(t('district'))}"><option value="">${t('allDistricts')}</option></select>
            <label class="search">${BH.ICON.search}<input type="search" placeholder="${esc(t('searchCommodity'))}" data-q value="${esc(params.get('commodity') || '')}"></label>
          </div>
          <p class="muted small" data-updated></p>
          <div data-table><div class="skeleton" style="width:100%;height:44px"></div><div class="skeleton" style="width:100%;height:44px"></div><div class="skeleton" style="width:100%;height:44px"></div></div>
          <p class="note">${esc(t('source'))}</p>` : `<p class="empty">${t('mandiOff')}</p>`}
        </div></section>`,
      init(root) {
        if (!cfg.enabled) return;
        const sState = $('[data-state]', root); const sDist = $('[data-district]', root); const q = $('[data-q]', root);
        let data = null;
        const draw = () => {
          const term = q.value.trim().toLowerCase();
          const rows = data.records.filter((r) => (!sDist.value || r.district === sDist.value) && (!term || `${r.commodity} ${r.variety}`.toLowerCase().includes(term)));
          $('[data-updated]', root).textContent = data.updated ? t('updated', { d: data.updated }) : '';
          $('[data-table]', root).innerHTML = rows.length ? `
            <div class="table-wrap"><table class="table">
              <thead><tr><th>${t('commodity')}</th><th>${t('market')}</th><th class="num">${t('minPrice')}</th><th class="num">${t('maxPrice')}</th><th class="num">${t('modalPrice')}</th></tr></thead>
              <tbody>${rows.map((r) => `<tr><td><b>${esc(r.commodity)}</b><small class="muted">${esc(r.variety || '')}</small></td><td>${esc(r.market)}<small class="muted">${esc(r.district)}</small></td><td class="num">${money(r.min)}</td><td class="num">${money(r.max)}</td><td class="num"><b>${money(r.modal)}</b></td></tr>`).join('')}</tbody>
            </table></div><p class="muted small">${t('perQuintal')}</p>` : `<p class="empty">${t('noResults')}</p>`;
        };
        const load = async () => {
          $('[data-table]', root).innerHTML = '<div class="skeleton" style="width:100%;height:44px"></div><div class="skeleton" style="width:100%;height:44px"></div>';
          try {
            data = await BH.api(`/api/mandi?state=${encodeURIComponent(sState.value)}`);
            sDist.innerHTML = `<option value="">${t('allDistricts')}</option>${data.districts.map((d) => `<option>${esc(d)}</option>`).join('')}`;
            draw();
          } catch { $('[data-table]', root).innerHTML = `<p class="empty">${t('mandiErr')}</p>`; }
        };
        sState.addEventListener('change', () => { history.replaceState(null, '', `/mandi?state=${encodeURIComponent(sState.value)}`); load(); });
        sDist.addEventListener('change', draw); q.addEventListener('input', () => data && draw());
        load();
      },
    };
  };

  // ---------- advisory ----------
  V.advisory = () => {
    const { crops = [], advisories = [], schemes = [] } = site();
    const months = t('months');
    const now = new Date().getMonth() + 1;
    const seasons = [...new Set(crops.map((c) => c.season).filter(Boolean))];
    return {
      title: BH.plain(t('calendar')),
      html: `${pageHero({ title: t('advisoryTitle'), sub: t('advisorySub'), small: true })}
        <section class="section section--flush"><div class="wrap" data-tabs>
          <div class="segmented segmented--lg center-x" role="tablist"><button class="is-active" data-tab="cal">${t('calendar')}</button><button data-tab="adv">${t('advisories')}</button><button data-tab="sch">${t('schemes')}</button></div>
          <div class="panel" data-panel="cal">
            ${seasons.length > 1 ? `<div class="segmented" data-season style="margin-bottom:20px">${['*', ...seasons].map((s, i) => `<button class="${i ? '' : 'is-active'}" data-s="${esc(s)}">${esc(s === '*' ? t('all') : s)}</button>`).join('')}</div>` : ''}
            <div class="cal-legend"><span><i class="sow"></i>${t('sowing')}</span><span><i class="har"></i>${t('harvest')}</span></div>
            <div class="table-wrap"><div class="cal" style="--now:${now}">
              <div class="cal__row cal__row--head"><span></span>${months.map((m, i) => `<span class="${i + 1 === now ? 'is-now' : ''}">${esc(m)}</span>`).join('')}</div>
              ${crops.map((c) => `<div class="cal__row" data-season-row="${esc(c.season)}"><span class="cal__crop"><b>${esc(c.crop)}</b><small class="muted">${esc(c.season)}</small></span>${months.map((_, i) => {
                const m = i + 1; const cls = (c.sow || []).includes(m) ? 'sow' : (c.harvest || []).includes(m) ? 'har' : '';
                return `<span class="cal__cell ${cls}${m === now ? ' is-now' : ''}"></span>`;
              }).join('')}${c.notes ? `<small class="cal__note muted">${esc(c.notes)}</small>` : ''}</div>`).join('')}
            </div></div>
          </div>
          <div class="panel" data-panel="adv" hidden><div class="adv-grid">${advisories.map((a) => `
            <article class="adv"><div class="adv__meta"><span class="pill${/high/i.test(a.severity) ? ' pill--err' : ''}">${esc(a.severity || 'Info')}</span><span class="muted small">${BH.date(a.date)}</span></div>
              <h3>${esc(a.title)}</h3><p class="muted small">${esc(a.crop)} · ${esc(a.region)}</p><div class="prose">${BH.md(a.content)}</div></article>`).join('') || `<p class="empty">${t('noResults')}</p>`}</div></div>
          <div class="panel" data-panel="sch" hidden><div class="adv-grid">${schemes.map((s) => `
            <article class="adv"><h3>${esc(s.name)}</h3><p>${esc(s.summary)}</p>${s.eligibility ? `<p class="small"><b>${t('eligibility')}:</b> <span class="muted">${esc(s.eligibility)}</span></p>` : ''}${s.link ? `<a class="link" href="${BH.url(s.link)}" target="_blank" rel="noopener">${t('visitPortal')}</a>` : ''}</article>`).join('')}</div><p class="note">${t('schemeNote')}</p></div>
          <div class="center" style="margin-top:56px"><a class="btn btn--lg" href="/farmers">${t('soilTest')}</a></div>
        </div></section>`,
      init(root) {
        $$('[data-tabs]', root).forEach(bindTabs);
        $$('[data-season] button', root).forEach((b) => b.addEventListener('click', () => {
          $$('[data-season] button', root).forEach((x) => x.classList.toggle('is-active', x === b));
          $$('[data-season-row]', root).forEach((r) => { r.hidden = b.dataset.s !== '*' && r.dataset.seasonRow !== b.dataset.s; });
        }));
      },
    };
  };

  V.notfound = () => ({
    title: t('notFound'), status: 404,
    html: `<section class="section"><div class="wrap center empty-state"><span class="kicker">404</span><h1 class="h2">${t('notFound')}</h1><p class="sub" style="margin:16px auto 32px;max-width:30ch">${t('notFoundText')}</p><a class="btn" href="/">${t('goHome')}</a></div></section>`,
  });
})();
