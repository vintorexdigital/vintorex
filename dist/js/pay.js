// Razorpay Checkout. The payment server (server/index.mjs) prices each order and
// verifies each payment; on static hosting there is no server and checkout stays
// in demo mode.
import { BUSINESS } from './data.js';
import { toast } from './ui.js';

let status = { enabled: false };
export const live = () => status.enabled;

// Asked once at start-up. Static hosting answers 404, which keeps demo mode.
export async function load() {
  try {
    const res = await fetch('/api/payments', { signal: AbortSignal.timeout(3000) });
    if (res.ok) status = await res.json();
  } catch { /* no payment server */ }
}

async function post(path, body) {
  const res = await fetch('/api/payments/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Payment failed. Please try again.');
  return data;
}

// Prices the cart (or the next instalment) on the server and opens a Razorpay order.
export const createOrder = body => post('order', body);

let script;
const loadCheckout = () => script ||= new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = resolve;
  s.onerror = () => { script = null; s.remove(); reject(new Error('Razorpay could not be loaded. Check your connection and try again.')); };
  document.head.append(s);
});

// Opens the Razorpay window for a server-created order. Resolves with the server's
// verification ({ paymentId, memberToken?, balanceToken? }), or null if the customer
// closes the window. A failed attempt keeps the window open so they can retry.
export async function pay(order, { name, email, phone, description }) {
  await loadCheckout();
  const response = await new Promise(resolve => {
    const rzp = new window.Razorpay({
      key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
      name: BUSINESS.name, description, image: new URL('images/vintorex-logo.png', location.href).href,
      prefill: { name, email, contact: phone },
      theme: { color: '#4b2bd6' },
      handler: resolve,
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on('payment.failed', e => toast(e.error?.description || 'Payment failed. Try again or use another method.', 'err'));
    rzp.open();
  });
  if (!response) return null;
  try {
    return await post('verify', { ...response, ticket: order.ticket });
  } catch (err) {
    const e = new Error(`We received payment ${response.razorpay_payment_id} but could not confirm it (${err.message}). Please contact us with this reference before paying again.`);
    e.paymentId = response.razorpay_payment_id;
    throw e;
  }
}
