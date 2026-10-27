const test = require("node:test");
const assert = require("node:assert");
const L = require("../docs/logic.js");
const W = require("../model/weights.json");

const safe = { first_time_customer: 0, pincode_tier_3: 0, order_value_k: 0.8, address_quality: 0.95, late_night_order: 0, past_rto_count: 0, discount_pct: 0, phone_verified: 1 };
const risky = { first_time_customer: 1, pincode_tier_3: 1, order_value_k: 3.5, address_quality: 0.3, late_night_order: 1, past_rto_count: 2, discount_pct: 50, phone_verified: 0 };

test("scores are probabilities and risky > safe", () => {
  const a = L.scoreOrder(safe, W), b = L.scoreOrder(risky, W);
  assert.ok(a > 0 && a < 1 && b > 0 && b < 1);
  assert.ok(b > a);
  assert.strictEqual(L.riskBand(a), "low");
  assert.strictEqual(L.riskBand(b), "high");
});

test("explanations add back up to the score", () => {
  const p = L.scoreOrder(risky, W);
  const sum = L.explain(risky, W).reduce((s, e) => s + e.contribution, 0);
  const base = W.intercept + Object.keys(W.coef).reduce((s, k) => s + W.coef[k] * W.means[k], 0);
  assert.ok(Math.abs(L.sigmoid(base + sum) - p) < 1e-9);
});

test("missing feature throws", () => {
  assert.throws(() => L.scoreOrder({}, W), /Missing or invalid/);
});

test("roi maths", () => {
  const r = L.roi({ orders: 10000, codShare: 0.5, rtoRate: 0.2, costPerRto: 150, aov: 1000, grossMargin: 0.5, rtoReduction: 0.25, feePerOrder: 2, platformFee: 1000 });
  assert.strictEqual(r.codOrders, 5000);
  assert.strictEqual(r.rtosBefore, 1000);
  assert.strictEqual(r.rtosAvoided, 250);
  assert.strictEqual(r.savings, 250 * 650);
  assert.strictEqual(r.cost, 11000);
  assert.strictEqual(r.net, 162500 - 11000);
  assert.throws(() => L.roi({ orders: -1 }), /Invalid input/);
});

test("plan picker and utm parse", () => {
  assert.strictEqual(L.pickPlan(1000).id, "starter");
  assert.strictEqual(L.pickPlan(9000).id, "growth");
  assert.strictEqual(L.pickPlan(90000).id, "scale");
  assert.deepStrictEqual(L.parseUtm("?utm_source=linkedin&utm_campaign=rto+audit&x=1"), { utm_source: "linkedin", utm_campaign: "rto audit" });
});
