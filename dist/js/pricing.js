// Cart pricing shared by the browser and the payment server (server/index.mjs),
// so the amount charged is worked out from the same rules the customer sees.
import { ANNUAL_MONTHS_PAID, MILESTONES, MILESTONE_MIN } from './data.js';

// Milestone amounts for a gross (GST-inclusive) project value.
export function milestoneSchedule(gross, upfront = 0) {
  let left = gross;
  return MILESTONES.map(([label, pct], i) => {
    const amount = i === MILESTONES.length - 1 ? left : Math.round(gross * pct / 100);
    left -= amount;
    return { label, pct, amount: amount + (i === 0 ? upfront : 0) };
  });
}

// Resolve a cart line into display info and a price.
export function lineInfo(item, cat) {
  if (item.type === 'package') {
    const s = cat.services.find(s => s.id === item.ref); const t = s?.tiers.find(t => t.name === item.tier);
    if (!s || !t) return null;
    return { title: `${s.name} — ${t.name}`, unit: t.price, billing: s.billing, kind: 'Service' };
  }
  if (item.type === 'addon') {
    const a = cat.addons.find(a => a.id === item.ref); if (!a) return null;
    return { title: a.name, unit: a.price, billing: a.billing, kind: 'Add-on' };
  }
  if (item.type === 'product') {
    const p = cat.products.find(p => p.id === item.ref); if (!p) return null;
    return { title: p.name, unit: p.price, billing: 'once', kind: 'Download' };
  }
  if (item.type === 'plan') {
    const p = cat.plans.find(p => p.id === item.ref); if (!p) return null;
    const annual = item.cycle === 'year';
    return { title: `${p.name} plan (${annual ? 'annual' : 'monthly'})`, unit: annual ? p.price * ANNUAL_MONTHS_PAID : p.price, billing: annual ? 'year' : 'month', kind: 'Membership' };
  }
  return null;
}

// Totals with member discount on one-time services, optional coupon and GST.
// A membership plan in the cart sets the discount; otherwise memberPlanId does.
export function priceCart(items, { catalog: cat, gstPct, memberPlanId = 'free', couponCode }) {
  const lines = items.map(i => ({ ...i, info: lineInfo(i, cat) })).filter(l => l.info);
  const planInCart = lines.find(l => l.type === 'plan');
  const memberPlan = cat.plans.find(p => p.id === (planInCart?.ref || memberPlanId));
  const memberPct = memberPlan?.discount || 0;
  let subtotal = 0, memberOff = 0;
  for (const l of lines) {
    l.total = l.info.unit * l.qty;
    subtotal += l.total;
    if (memberPct && l.type === 'package' && l.info.billing === 'once') memberOff += Math.round(l.total * memberPct / 100);
  }
  const coupon = couponCode ? cat.coupons.find(c => c.code === couponCode.trim().toUpperCase() && c.active !== false) : null;
  const couponOff = coupon ? Math.round((subtotal - memberOff) * coupon.pct / 100) : 0;
  const taxable = subtotal - memberOff - couponOff;
  const gst = Math.round(taxable * gstPct / 100);
  const total = taxable + gst;
  // One-time service packages can be paid in milestones; everything else is paid upfront.
  const projSub = lines.filter(l => l.type === 'package' && l.info.billing === 'once').reduce((s, l) => s + l.total, 0);
  let milestones = null;
  if (projSub >= MILESTONE_MIN) {
    const projNet = projSub - memberOff - (couponOff ? Math.round(couponOff * (projSub - memberOff) / (subtotal - memberOff)) : 0);
    const projGross = Math.round(projNet * (1 + gstPct / 100));
    milestones = milestoneSchedule(projGross, total - projGross);
  }
  return { lines, subtotal, memberPct, memberOff, coupon, couponOff, taxable, gstPct, gst, total, milestones };
}

// What is charged now: the whole total, or the first milestone on a milestone plan.
export const amountDue = (q, payPlan) => payPlan === 'milestone' && q.milestones ? q.milestones[0].amount : q.total;
