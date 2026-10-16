// Shop logic: pincode serviceability, server-side cart pricing, orders, Razorpay.
const crypto = require('crypto');
const db = require('./db');

const STATUSES = ['pending_payment', 'placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

function matchesPincode(pin, rules) {
  const list = String(rules || '').split(/[\s,]+/).map((r) => r.trim()).filter(Boolean);
  if (!list.length) return true; // no rules = deliver everywhere
  return list.some((r) => {
    if (r.includes('-')) {
      const [a, b] = r.split('-').map(Number);
      return Number(pin) >= a && Number(pin) <= b;
    }
    if (r.endsWith('*')) return pin.startsWith(r.slice(0, -1));
    return pin === r;
  });
}

function checkPincode(pincode) {
  const pin = String(pincode || '').trim();
  if (!/^\d{6}$/.test(pin)) return { ok: false, error: 'Enter a valid 6-digit pincode.' };
  const c = db.get().commerce;
  if (!matchesPincode(pin, c.pincodes)) return { ok: false, error: 'Sorry, we don’t deliver to this pincode yet.' };
  return { ok: true, pincode: pin, days: c.deliveryDays, fee: Number(c.deliveryFee) || 0, freeAbove: Number(c.freeDeliveryAbove) || 0, cod: !!c.cod };
}

// Price the cart from the catalogue — never trust prices sent by the browser.
function priceCart(items) {
  const data = db.get();
  const c = data.commerce;
  if (!Array.isArray(items) || !items.length) throw new Error('Your cart is empty.');
  const lines = items.slice(0, 50).map((it) => {
    const p = data.products.find((x) => x.id === it.id && x.active);
    if (!p) throw new Error('A product in your cart is no longer available.');
    const qty = Math.max(1, Math.min(50, parseInt(it.qty, 10) || 1));
    if (Number(p.stock) < qty) throw new Error(`Only ${Math.max(0, Number(p.stock))} left of ${p.name}.`);
    return { id: p.id, name: p.name, unit: p.unit, price: Number(p.price), qty, total: Number(p.price) * qty, image: p.images?.[0] || '' };
  });
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  if (subtotal < (Number(c.minOrder) || 0)) throw new Error(`Minimum order is ${c.currencySymbol}${c.minOrder}.`);
  const delivery = c.freeDeliveryAbove && subtotal >= Number(c.freeDeliveryAbove) ? 0 : Number(c.deliveryFee) || 0;
  return { lines, subtotal, delivery, total: subtotal + delivery };
}

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `BH${ymd}${crypto.randomInt(1000, 9999)}`;
}

const clean = (v, n = 200) => String(v ?? '').trim().slice(0, n);

async function createOrder(body, customer) {
  const data = db.get();
  const c = data.commerce;
  if (!c.enabled) throw new Error('The shop is closed right now.');
  const a = body.address || {};
  const address = { name: clean(a.name, 120), phone: clean(a.phone, 20), email: clean(a.email, 160), line1: clean(a.line1), line2: clean(a.line2), city: clean(a.city, 80), state: clean(a.state, 80), pincode: clean(a.pincode, 6) };
  if (!address.name || !/^[+\d\s-]{10,15}$/.test(address.phone) || !address.line1 || !address.city) throw new Error('Please complete your name, phone and address.');
  if (address.email && !/^\S+@\S+\.\S+$/.test(address.email)) throw new Error('Please enter a valid email.');
  const pin = checkPincode(address.pincode);
  if (!pin.ok) throw new Error(pin.error);

  const method = body.payment === 'razorpay' ? 'razorpay' : 'cod';
  const rz = data.integrations.razorpay;
  if (method === 'cod' && !c.cod) throw new Error('Cash on delivery is not available.');
  if (method === 'razorpay' && !(rz.enabled && rz.keyId && rz.keySecret)) throw new Error('Online payment is not available.');

  const priced = priceCart(body.items);
  const order = {
    id: crypto.randomUUID(),
    number: orderNumber(),
    createdAt: new Date().toISOString(),
    customerEmail: customer?.email || address.email || '',
    address, ...priced,
    note: clean(body.note, 500),
    payment: { method, status: method === 'cod' ? 'cod' : 'pending' },
    status: method === 'cod' ? 'placed' : 'pending_payment',
    history: [{ status: method === 'cod' ? 'placed' : 'pending_payment', at: new Date().toISOString() }],
  };

  let razorpay = null;
  if (method === 'razorpay') {
    const auth = Buffer.from(`${rz.keyId}:${rz.keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(order.total * 100), currency: 'INR', receipt: order.number }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error?.description || 'Could not start payment. Please try again.');
    order.payment.razorpayOrderId = j.id;
    razorpay = { keyId: rz.keyId, orderId: j.id, amount: j.amount, currency: j.currency };
  }

  // Reserve stock immediately; cancelling an order in admin puts it back.
  db.update((d) => {
    order.lines.forEach((l) => { const p = d.products.find((x) => x.id === l.id); if (p) p.stock = Math.max(0, Number(p.stock) - l.qty); });
    d.orders.unshift(order);
  });
  return { order: publicOrder(order), razorpay };
}

function verifyPayment(number, { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = {}) {
  const data = db.get();
  const order = data.orders.find((o) => o.number === number);
  if (!order) throw new Error('Order not found');
  const secret = data.integrations.razorpay.keySecret;
  const expected = crypto.createHmac('sha256', secret || '').update(`${oid}|${pid}`).digest('hex');
  if (!sig || oid !== order.payment.razorpayOrderId || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Payment could not be verified.');
  }
  db.update((d) => {
    const o = d.orders.find((x) => x.number === number);
    o.payment = { ...o.payment, status: 'paid', razorpayPaymentId: pid, paidAt: new Date().toISOString() };
    if (o.status === 'pending_payment') { o.status = 'placed'; o.history.push({ status: 'placed', at: new Date().toISOString() }); }
  });
  return publicOrder(db.get().orders.find((o) => o.number === number));
}

function setStatus(id, { status, note, paymentStatus }) {
  let result;
  db.update((d) => {
    const o = d.orders.find((x) => x.id === id);
    if (!o) return;
    if (status && STATUSES.includes(status) && status !== o.status) {
      if (status === 'cancelled' && o.status !== 'cancelled') {
        o.lines.forEach((l) => { const p = d.products.find((x) => x.id === l.id); if (p) p.stock = Number(p.stock) + l.qty; });
      }
      o.status = status;
      o.history.push({ status, at: new Date().toISOString(), note: clean(note, 300) });
    } else if (note) {
      o.history.push({ status: o.status, at: new Date().toISOString(), note: clean(note, 300) });
    }
    if (paymentStatus) o.payment.status = clean(paymentStatus, 20);
    result = o;
  });
  return result;
}

// What a customer may see about an order.
function publicOrder(o) {
  if (!o) return null;
  const { id, customerEmail, ...rest } = o;
  return { ...rest, payment: { method: o.payment.method, status: o.payment.status } };
}

function track(number, phone) {
  const o = db.get().orders.find((x) => x.number === String(number || '').trim().toUpperCase());
  const digits = (s) => String(s || '').replace(/\D/g, '').slice(-10);
  if (!o || digits(o.address.phone) !== digits(phone)) return null;
  return publicOrder(o);
}

module.exports = { STATUSES, checkPincode, priceCart, createOrder, verifyPayment, setStatus, publicOrder, track };
