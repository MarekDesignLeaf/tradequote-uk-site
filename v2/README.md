# TradeQuote UK V2 | Interactive preview
Release: experimental preview built 24 October 2026. No advertising, subscriptions or checkout.

**Open evaluation UI:** https://marekdesignleaf.github.io/tradequote-uk-site/v2/

## What it does
An original responsive, browser-only estimating tool for UK fencing and patio work.

* Multi-run fence estimating with separate runs, panel widths, gate openings, posts, postmix, fittings and labour stages.
* Patio dimensions, slabs and cutting allowance, MOT/sand tonnage, joints, geotextile, digging volume and indicative skip quantities.
* Editable cost rates and supplier quote source/date, labour productivity, team size and crew days.
* Separate direct cost, overhead, contingency, gross profit, real margin, discount and optional VAT.
* Deterministic what-if sensitivity for higher materials, labour and disposal costs and schedule extension.
* Manual pre-quote verification checklist and print/copy lock until basic user attestations and price evidence are entered.
* Scope changes recorded as pending vs approved variations. Only approved changes affect the customer draft totals and profit.
* Internal purchase sheet CSV, print-to-PDF customer quote without private costing, JSON project import/export, no registration.
* Optional completed-job accounting: user-entered actual expenditure/hours, archived outcomes and a median ratio summary after >=3 complete examples of the same trade.
* No remote storage, cookies, tracking pixels, payment links, supplier APIs or customer messaging in this preview.

## Evidence and tests
- `node tests.cjs`: 24 deterministic engine tests passed using JavaScript evaluation on 24 Oct 2026.
- `node tests-learning.cjs`: 7 history/learning tests passed.
- UI inline JavaScript compiled with a syntax check. Essential script references and controls checked.
- Changes for approved variations, VAT and extra-cost stress reconcile arithmetically across displayed and customer-facing draft totals.
- **Not yet confirmed:** real browser visual/UI regression, keyboard accessibility, mobile export/PDF, real supplier prices, UK VAT exceptions, actual completed garden jobs, any measurable customer time saving or commercial willingness to pay.

## Reproducible checks
Requires Node.js >=18:
```
node tests.cjs
node tests-learning.cjs
```
To run this UI locally: save `index.html`, `engine.js` and `learning.js` in the same directory and open `index.html` in a modern browser. GitHub Pages serves these three files in the same folder.

## Customer safety
This is not ready for commercial release. Default prices, productivity rates, densities and scope assumptions are illustrative only. Estimate quantities must be checked against drawings, ground investigation and actual materials, delivery, disposal, permissions and installation methods. Slab and soil/skip quantities are estimates, not engineering design or waste-haulage guarantees. The optional VAT checkbox is not tax guidance.

The trader must verify every customer's quote before issuance. Client quote printing/copying remains blocked until checklist and supplier-source fields are completed, but those checks rely on user honesty and are not independently verified. An exported internal CSV may contain cost prices; do not forward that to the customer.

## Marketing and business gate
The existing AI VENTURE `MARKETING_GATE.md` remains in force: no new prospect outreach or paid product launch. This development preview does **not** demonstrate an exclusive feature, field accuracy, competitive advantage or validated willingness to pay. Existing live basic calculator remains untouched at the website root.

## Sources and separation
Canonical internal source: private `MarekDesignLeaf/ai-venture/product/v2/`.
Public preview source: `MarekDesignLeaf/tradequote-uk-site/v2/`. No private ledger, Gmail records, bank details, customer database or other company files are published. Maintain separation of AI VENTURE from DesignLeaf, PILOOP and ABCDayZ.

Developer note: Remote Desktop Commander access was unavailable on 24 October because the service reported a monthly usage limit. The V2 files were created and tested via connected GitHub without pretending the local PC was updated. The PC and private GitHub may be out of sync; resynchronise safely with a reviewed fast-forward, never force overwrite unpushed PC changes.
