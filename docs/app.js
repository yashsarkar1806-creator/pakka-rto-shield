(function () {
  "use strict";
  var L = window.PakkaLogic, W = window.PAKKA_WEIGHTS, M = window.PAKKA_METRICS;
  window.dataLayer = window.dataLayer || [];
  function track(event, params) { window.dataLayer.push(Object.assign({ event: event }, params || {})); }
  var inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  var num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  var $ = function (id) { return document.getElementById(id); };
  // Storage can be blocked (private mode, file:// origins); the page should still work without it.
  function store(kind) { try { var s = window[kind]; s.getItem("x"); return s; } catch (e) { var m = {}; return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); } }; } }
  var session = store("sessionStorage"), local = store("localStorage");

  // [label when the flag is on, label when it is off]; numeric features use one label.
  var LABELS = { first_time_customer: ["First-time customer", "Returning customer"], pincode_tier_3: ["Tier-3/rural pincode", "Metro or tier-1/2 pincode"],
    order_value_k: "Order value", address_quality: "Address quality", late_night_order: ["Late-night order", "Daytime order"],
    past_rto_count: "Past RTOs on this phone", discount_pct: "Discount depth", phone_verified: ["Phone confirmed", "Phone not confirmed"] };
  function label(k, v) { var l = LABELS[k]; return Array.isArray(l) ? l[v ? 0 : 1] : l; }

  $("rows").textContent = num.format(M.rows);
  $("auc").textContent = M.holdout_auc.toFixed(2);

  var utm = L.parseUtm(location.search);
  if (Object.keys(utm).length) { session.setItem("pakka_utm", JSON.stringify(utm)); track("utm_captured", utm); }

  // ---- order scoring demo
  var orderForm = $("orderForm");
  function readOrder() {
    var o = {};
    Array.prototype.forEach.call(orderForm.elements, function (el) {
      if (!el.name) return;
      o[el.name] = el.type === "checkbox" ? (el.checked ? 1 : 0) : Number(el.value);
    });
    return o;
  }
  var scoredOnce = false;
  function renderScore() {
    var o = readOrder();
    $("ovOut").textContent = inr.format(o.order_value_k * 1000);
    $("aqOut").textContent = o.address_quality.toFixed(2);
    $("prOut").textContent = o.past_rto_count;
    $("dpOut").textContent = o.discount_pct + "%";
    var p = L.scoreOrder(o, W), rec = L.recommendedAction(p);
    $("riskPct").textContent = Math.round(p * 100) + "%";
    $("band").textContent = rec.band; $("band").className = "pill " + rec.band;
    $("action").textContent = rec.action;
    var fill = $("gaugeFill");
    fill.style.width = Math.round(p * 100) + "%";
    fill.style.background = rec.band === "high" ? "var(--bad)" : rec.band === "medium" ? "var(--mid)" : "var(--ok)";
    $("why").innerHTML = "";
    L.explain(o, W).filter(function (e) { return Math.abs(e.contribution) > 0.01; }).slice(0, 4).forEach(function (e) {
      var li = document.createElement("li");
      li.className = e.contribution > 0 ? "up" : "down";
      li.textContent = label(e.feature, o[e.feature]) + (e.contribution > 0 ? " raises" : " lowers") + " risk vs a typical order (" + (e.contribution > 0 ? "+" : "") + e.contribution.toFixed(2) + " log-odds)";
      $("why").appendChild(li);
    });
    if (scoredOnce) track("demo_order_scored", { risk: Math.round(p * 100), band: rec.band });
    scoredOnce = true;
  }
  orderForm.addEventListener("input", renderScore);
  renderScore();

  // ---- ROI + pricing
  var roiForm = $("roiForm");
  function renderPlans(active) {
    $("plans").innerHTML = "";
    L.PLANS.forEach(function (pl) {
      var d = document.createElement("div");
      d.className = "plan" + (pl.id === active ? " active" : "");
      d.innerHTML = "<h3>" + pl.name + "</h3><div class='price'>" + (pl.platformFee ? inr.format(pl.platformFee) + "/mo" : "Free platform") +
        "</div><p>+ " + inr.format(pl.feePerOrder).replace(/\.00$/, "") + " per COD order scored</p><p class='muted'>" +
        (isFinite(pl.maxCod) ? "Up to " + num.format(pl.maxCod) + " COD orders a month" : "Unlimited COD orders, API access and a dedicated CSM") + "</p>";
      $("plans").appendChild(d);
    });
  }
  function renderRoi() {
    var f = roiForm.elements, pct = function (n) { return Number(f[n].value) / 100; };
    var orders = Number(f.orders.value), codShare = pct("codShare");
    var plan = L.pickPlan(orders * codShare);
    var r;
    try {
      r = L.roi({ orders: orders, codShare: codShare, rtoRate: pct("rtoRate"), costPerRto: Number(f.costPerRto.value),
        aov: Number(f.aov.value), grossMargin: pct("grossMargin"), rtoReduction: pct("rtoReduction"),
        feePerOrder: plan.feePerOrder, platformFee: plan.platformFee });
    } catch (e) { $("rNet").textContent = "Check inputs"; return; }
    $("planName").textContent = plan.name;
    $("rCod").textContent = num.format(r.codOrders);
    $("rBefore").textContent = num.format(r.rtosBefore);
    $("rAvoid").textContent = num.format(r.rtosAvoided);
    $("rSave").textContent = inr.format(r.savings);
    $("rCost").textContent = inr.format(r.cost);
    $("rNet").textContent = inr.format(r.net);
    $("rNet").style.color = r.net >= 0 ? "var(--ok)" : "var(--bad)";
    $("rRoi").textContent = r.roiMultiple === null ? "-" : r.roiMultiple.toFixed(1) + "x";
    renderPlans(plan.id);
    return r;
  }
  roiForm.addEventListener("input", renderRoi);
  roiForm.addEventListener("change", function () { var r = renderRoi(); if (r) track("roi_calculated", { net_inr: Math.round(r.net) }); });
  renderRoi();

  // ---- waitlist
  $("waitForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var entry = { email: fd.get("email"), platform: fd.get("platform"), ts: new Date().toISOString(),
      utm: JSON.parse(session.getItem("pakka_utm") || "{}") };
    var list = JSON.parse(local.getItem("pakka_waitlist") || "[]");
    list.push(entry); local.setItem("pakka_waitlist", JSON.stringify(list));
    track("waitlist_signup", { platform: entry.platform, utm_source: entry.utm.utm_source || "(direct)" });
    $("waitMsg").textContent = "Thanks! You're on the demo waitlist (saved in this browser only).";
    e.target.reset();
  });

  document.querySelectorAll("[data-track]").forEach(function (a) {
    a.addEventListener("click", function () { track("cta_click", { cta: a.getAttribute("data-track") }); });
  });
})();
