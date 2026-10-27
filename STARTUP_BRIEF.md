# Pakka: startup brief

> **Fictional startup concept** written by Yash Sarkar as a marketing portfolio piece. Pakka is not a real company.
> Numbers marked *assumption* are planning inputs for the concept, not market research findings or results.

**One-liner:** Pakka scores every cash-on-delivery (COD) order for return-to-origin (RTO) risk at checkout and
runs the right fix automatically (WhatsApp confirmation, a prepaid nudge, or a hold) so Indian D2C brands stop
paying to ship parcels that come back.

"Pakka" is Hindi/Urdu slang for *confirmed* or *for sure*, which is exactly what the product makes a COD order.

---

## 1. Problem

Many Indian online shoppers still choose COD, and a COD order can be refused at the door or be undeliverable
(wrong address, unreachable phone, impulse order). When that happens the parcel travels back to the warehouse: an
RTO. The brand pays forward and reverse shipping, the stock is locked up for days, and the sale is lost.

For a small D2C brand this shows up as:

* **Margin leak:** every RTO costs logistics plus lost contribution margin.
* **Blunt fixes:** turning COD off or adding a COD fee also cuts good orders and conversion.
* **Manual work:** CX teams calling customers one by one to "confirm" orders, with no prioritisation.

## 2. Target customer

**Beachhead ICP:** Indian D2C brands on Shopify or WooCommerce doing roughly 1,000 to 20,000 orders a month,
with a high COD share (*assumption:* more than 40%), in fashion, beauty and personal care, and home.

**Buyer:** founder or head of growth. **User:** ops / CX lead. **Influencer:** the brand's performance-marketing
agency, which sees RTOs wreck its "real" ROAS.

| Persona | Job to be done | What they say |
|---|---|---|
| Founder of a 5,000-orders-a-month apparel brand | Protect margin without killing COD conversion | "I can't turn off COD, but I'm paying to ship returns." |
| Ops/CX lead | Spend calling time only on risky orders | "We call everyone, and it still doesn't help." |
| Growth lead | Report delivered revenue, not placed revenue | "Our ROAS looks great until RTOs come in." |

## 3. Positioning

**For** Indian D2C brands that rely on COD, **Pakka is** an RTO-prevention layer **that** decides, order by order,
whether to ship, confirm, nudge to prepaid, or hold. **Unlike** switching COD off or calling every customer,
Pakka keeps good COD orders flowing and spends friction only where the risk is.

**Message pillars**

1. *Keep COD, lose the returns.* Don't trade conversion for margin.
2. *Explainable scores.* Every order shows why it was flagged, so ops trusts it.
3. *Pays for itself.* Priced per COD order scored, so cost tracks value.

**Brand voice:** plain-spoken, numbers-first, a little Indian-English warmth ("pakka promise").

## 4. Product (MVP scope)

1. **Risk score** at order creation from order, address and history signals (see the [live demo](https://yashsarkar1806-creator.github.io/pakka-rto-shield/)).
2. **Playbooks** by band: low ships as normal; medium gets a WhatsApp confirmation plus a prepaid-switch offer;
   high is held until confirmed and auto-cancelled after 24 hours.
3. **Address fixer:** flags incomplete addresses (no house number or landmark, pincode mismatch) and asks the shopper to fix them in the same WhatsApp thread.
4. **Outcome loop:** delivery and RTO outcomes from the courier feed retrain each brand's model weekly.
5. **Dashboard:** RTO rate, prepaid share, delivered revenue and money saved.

## 5. Go-to-market

**Motion:** product-led on the Shopify App Store, with agency and logistics partnerships for distribution.

| Phase | Channel | Tactic | Success signal |
|---|---|---|---|
| 0-3 months | Founder-led sales | 20 design-partner brands get a free "RTO audit": upload 90 days of orders, get a leak report | 10 pilots live |
| 0-6 months | Shopify App Store | Listing optimised for "COD", "RTO", "order confirmation"; free Starter tier | Install-to-activation above 40% (*target*) |
| 3-9 months | Agency partners | Rev-share for D2C performance agencies; co-branded "delivered ROAS" report | 5 agencies referring monthly |
| 3-12 months | Content & community | Monthly "State of COD" benchmark built from anonymised, opted-in pilot data; LinkedIn founder posts; D2C WhatsApp communities | Waitlist and demo requests from organic |
| 6-12 months | Logistics partners | Integrations with shipping aggregators, listed in their app marketplaces | 20% of new installs via partners |

**Launch hook:** the free RTO audit. It's the lead magnet, the sales demo and the source of the case studies.

## 6. Pricing (concept)

Usage-based, so the price grows with the value delivered. All prices are illustrative, in INR, excluding GST.

| Plan | Platform fee | Per COD order scored | Fits |
|---|---|---|---|
| Starter | Free | ₹4 | Up to 1,500 COD orders a month |
| Growth | ₹4,999 / month | ₹2.50 | Up to 15,000 COD orders a month |
| Scale | ₹19,999 / month | ₹1.50 | Unlimited, API, dedicated CSM |

WhatsApp conversation charges are passed through at cost. The [ROI calculator](https://yashsarkar1806-creator.github.io/pakka-rto-shield/#roi) picks the
plan automatically and shows net monthly gain.

## 7. Key metrics

| Layer | Metric |
|---|---|
| North star | **Money saved per brand per month** (RTO costs avoided plus margin recovered) |
| Customer outcome | COD RTO rate, prepaid share, confirmation reply rate, delivered-revenue ROAS |
| Product | Model AUC and lift on each brand's holdout; share of high-risk orders actioned |
| Growth | Installs, install-to-activation, time to first saving, trial-to-paid, logo churn, net revenue retention |
| Unit economics | CAC by channel, payback months, gross margin after WhatsApp costs |

## 8. Risks and how to test them

| Risk | Test |
|---|---|
| Brands don't trust a black-box score | Show per-order reasons (built into the demo) and run shadow mode for two weeks before acting |
| Too much friction lowers conversion | A/B test playbooks per band; hold-out group that ships with no action |
| Data access (couriers, platforms) | Start with Shopify order data plus courier status webhooks; add aggregators later |
| WhatsApp costs eat margin | Only message medium and high bands; measure cost per RTO avoided |
| Privacy | Use phone and address only for delivery-risk scoring, and sign data-processing agreements |

## 9. 90-day plan

* **Weeks 1-4:** 20 RTO audits, interview each brand's ops lead, ship the Shopify app in shadow mode.
* **Weeks 5-8:** Turn on playbooks for 10 pilots with a 10% hold-out group; weekly results email.
* **Weeks 9-12:** Publish 2 pilot case studies (with permission), launch the App Store listing and the agency partner programme.

## 10. About the demo model

The [live demo](https://yashsarkar1806-creator.github.io/pakka-rto-shield/#demo) uses a logistic-regression model trained by
[`model/train_model.py`](model/train_model.py) on **20,000 synthetic COD orders** (`data/synthetic_cod_orders.csv`).
The data-generating rules are assumptions written for the demo, so the holdout metrics in
[`model/metrics.json`](model/metrics.json) show that the pipeline works, not how a real model would perform.
