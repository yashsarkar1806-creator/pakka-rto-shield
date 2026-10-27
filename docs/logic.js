/* Pakka core logic: RTO-risk scoring, playbook actions and ROI maths.
 * Works in the browser (window.PakkaLogic) and in Node (module.exports) so it can be unit-tested. */
(function (root) {
  "use strict";

  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

  /** Probability (0-1) that a COD order is returned to origin, from the logistic weights. */
  function scoreOrder(order, weights) {
    var z = weights.intercept;
    Object.keys(weights.coef).forEach(function (k) {
      var v = Number(order[k]);
      if (!isFinite(v)) throw new Error("Missing or invalid feature: " + k);
      z += weights.coef[k] * v;
    });
    return sigmoid(z);
  }

  /** Per-feature contribution to the log-odds versus a typical (average) order, biggest first, for the "why" panel. */
  function explain(order, weights) {
    var means = weights.means || {};
    return Object.keys(weights.coef).map(function (k) {
      return { feature: k, contribution: weights.coef[k] * (Number(order[k]) - (means[k] || 0)) };
    }).sort(function (a, b) { return Math.abs(b.contribution) - Math.abs(a.contribution); });
  }

  function riskBand(p) {
    if (p >= 0.45) return "high";
    if (p >= 0.25) return "medium";
    return "low";
  }

  /** The playbook a brand would run for each band. */
  function recommendedAction(p) {
    var band = riskBand(p);
    if (band === "high") return { band: band, action: "Hold shipment, send WhatsApp confirmation, offer a prepaid discount; cancel if unconfirmed in 24h." };
    if (band === "medium") return { band: band, action: "Ship after WhatsApp confirmation and push a small prepaid-switch incentive." };
    return { band: band, action: "Ship as normal." };
  }

  /**
   * Monthly ROI of using Pakka.
   * inputs: orders, codShare (0-1), rtoRate (0-1), costPerRto (INR, forward + reverse shipping + handling),
   *         grossMargin (0-1), aov (INR), rtoReduction (0-1, assumed relative cut in RTOs), feePerOrder (INR, per COD order scored),
   *         platformFee (INR per month)
   */
  function roi(i) {
    ["orders", "codShare", "rtoRate", "costPerRto", "aov", "grossMargin", "rtoReduction", "feePerOrder", "platformFee"].forEach(function (k) {
      if (!isFinite(Number(i[k])) || Number(i[k]) < 0) throw new Error("Invalid input: " + k);
    });
    var codOrders = i.orders * i.codShare;
    var rtosBefore = codOrders * i.rtoRate;
    var rtosAvoided = rtosBefore * i.rtoReduction;
    // An avoided RTO saves the logistics cost and, when the order is now delivered, earns the margin.
    var savings = rtosAvoided * (i.costPerRto + i.aov * i.grossMargin);
    var cost = codOrders * i.feePerOrder + i.platformFee;
    var net = savings - cost;
    return {
      codOrders: codOrders,
      rtosBefore: rtosBefore,
      rtosAvoided: rtosAvoided,
      savings: savings,
      cost: cost,
      net: net,
      roiMultiple: cost > 0 ? savings / cost : null,
    };
  }

  /** Pick the cheapest plan that covers the brand's monthly COD orders. */
  var PLANS = [
    { id: "starter", name: "Starter", maxCod: 1500, platformFee: 0, feePerOrder: 4 },
    { id: "growth", name: "Growth", maxCod: 15000, platformFee: 4999, feePerOrder: 2.5 },
    { id: "scale", name: "Scale", maxCod: Infinity, platformFee: 19999, feePerOrder: 1.5 },
  ];
  function pickPlan(codOrders) {
    for (var j = 0; j < PLANS.length; j++) if (codOrders <= PLANS[j].maxCod) return PLANS[j];
    return PLANS[PLANS.length - 1];
  }

  /** Read utm_* parameters from a query string. */
  function parseUtm(search) {
    var out = {};
    (search || "").replace(/^\?/, "").split("&").forEach(function (pair) {
      if (!pair) return;
      var kv = pair.split("=");
      var k = decodeURIComponent(kv[0] || "");
      if (/^utm_(source|medium|campaign|content|term)$/.test(k)) out[k] = decodeURIComponent((kv[1] || "").replace(/\+/g, " "));
    });
    return out;
  }

  var api = { sigmoid: sigmoid, scoreOrder: scoreOrder, explain: explain, riskBand: riskBand,
    recommendedAction: recommendedAction, roi: roi, PLANS: PLANS, pickPlan: pickPlan, parseUtm: parseUtm };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PakkaLogic = api;
})(this);
