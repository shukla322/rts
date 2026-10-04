# changes_4.md — From Simulation to Dashboard

> Spec for Claude Code. Read `project_context.md` first (it describes the current three-layer simulation). This file describes the next rework. `changes_3.md` and earlier are history only.

## 0. Goal and principles

The prototype currently answers "what happens to **one** parcel?". It should answer "**how is the Return-to-Sale system performing, and why?**" while keeping the existing simulation as the core interaction.

Principles:
1. **Keep it simple.** Plain React state and context, no router, no state library, no backend. Prefer a few polished screens over many half-built ones.
2. **One run = one record.** Every simulation produces a `RunRecord`. Dashboard, KPIs, node stats, seller stats and the baseline comparison are all *derived* from the list of records. Nothing is computed or stored twice.
3. **Show the reasoning.** Every decision (why a node qualified, why it got a boost badge, how a price was computed) is captured in a decision trace and shown in the UI.
4. **Be honest about data.** There is no real Valmo data. All history is synthetic, seeded, and labelled as illustrative. Every assumed number lives in one file and is visible in the UI. Never present a generated figure as a measured one.
5. **Do not break what works.** See section 11 (invariants).

## 1. Information architecture

Three top-level screens, switched by `activeTab: 'home' | 'dashboard' | 'sellers'` held in `App.tsx` (a tab bar in the header). **Simulation state must survive tab switches** (lift state into `App`/context; do not unmount-and-reset the simulation reducer).

| Screen | Purpose |
|---|---|
| **Home** | The simulation (existing three panes) plus a KPI strip and a baseline-vs-Return-to-Sale comparison |
| **Dashboard** | Full KPIs, funnel, breakdowns, live returns table with decision traces |
| **Sellers** | Contract and review details per seller, with contract terms that affect the simulation |

## 2. Data model (`src/data/types.ts`)

```ts
type CategoryId = 'audio' | 'sarees' | 'footwear' | 'decor';

interface Category { id: CategoryId; name: string; }

interface Product {
  id: string; name: string; categoryId: CategoryId;
  price: number;            // INR, illustrative. Replaces the Product Price slider
  sellerId: string; image: string;
}

interface Seller {
  id: string; name: string;                  // fictional names only
  rating: number; reviewCount: number;
  rtoRate: number;                           // synthetic, 0..1
  returnReasonMix: Record<string, number>;   // synthetic, sums to 1
  reviews: { stars: number; text: string }[];// clearly synthetic
  contract: {
    signedOn: string;                        // ISO date
    termMonths: number;
    resaleDiscountCap: number;               // max discount % Valmo may offer on a resale (0..1)
    returnWindowDays: number;
  };
}

type BoostReason =
  | 'CART_OVERLAP'          // (a) users here already have this type of product in their carts
  | 'HIGH_ORDER_FREQUENCY'  // (b) this category is ordered often here
  | 'HIGH_DENSITY'          // (c) region has high order density: plentiful buyers, sells fast
  | 'LOW_DENSITY'           // (d) region has low order density: little local competition, parcel is valuable
  | 'NEARER_TO_BUYER';      // fallback: qualifies geographically but no demand signal fired

interface NodeDemandProfile {          // per major node
  regionOrderDensity: number;          // 0..1, one value per node
  byCategory: Record<CategoryId, { cartOverlap: number; orderFrequency: number }>; // 0..1
}

type Layer = 1 | 2 | 3;

interface TraceStep {
  layer: Layer;
  nodeId: string;
  event: 'qualified' | 'bid' | 'declined' | 'bought' | 'skipped';
  reason?: BoostReason;      // Layer 2 only
  price?: number;
  note: string;              // human-readable, shown in the UI
}

interface RunRecord {
  id: string; createdAt: number;
  source: 'seeded' | 'live';
  productId: string; categoryId: CategoryId; sellerId: string;
  sscId: string; dscId: string;
  outcome: 'sold' | 'unsold';
  soldLayer?: Layer; soldNodeId?: string;
  listPrice: number; pricePaid?: number; discountPct?: number;
  boostReason?: BoostReason;               // set when sold in Layer 2
  baseline: { legs: number; km: number; cost: number };
  actual:   { legs: number; km: number; cost: number };
  avoided:  { legs: number; km: number; cost: number };  // baseline - actual
  timeToResaleDays?: number;
  trace: TraceStep[];
}
```

## 3. Seed data (`src/data/catalog.ts`, `sellers.ts`, `demand.ts`)

- **Categories and products** (illustrative, 2 products each, price in INR):
  - Audio Devices: Headphones (the existing product, keep its image), Earbuds
  - Sarees: two products
  - Footwear: two products
  - Home Decor: two products
- **Sellers:** about 6 fictional sellers, each owning products across one or two categories. Give distinct caps (e.g. some 10%, some 25%) so the cap is visibly consequential.
- **Demand profiles:** deterministic values per major node, per category (see section 5). They must vary enough that different categories produce different Layer 2 badges for the same DSC. Tune by eye, and keep values readable in a table.
- **Reproducibility:** use a seeded PRNG (e.g. mulberry32) in `src/utils/rng.ts`. Same seed gives the same history on every load. Do not use `Math.random()` for anything that appears in the dashboard.

## 4. Seeded history and the run store

**`src/state/runStore.tsx`**: React context + `useReducer`.
- On mount: `generateHistory(seed, count ≈ 300)` fills the store with `source: 'seeded'` records spread over the previous 30 days.
- Live simulation end: dispatch `ADD_RUN` with a `source: 'live'` record. Memory only, so a refresh resets everything (intended).
- Selectors (pure functions in `src/data/selectors.ts`): `kpis(runs, filter)`, `funnel(runs)`, `byCategory(runs)`, `byBoostReason(runs)`, `nodeStats(runs, nodeId)`, `sellerStats(runs, sellerId)`. All UI reads go through these.

**`generateHistory`** reuses the same engine as live runs, a pure function `evaluateRun(params, decisions)` that builds baseline / actual / avoided / trace. For seeded runs, `decisions` come from a **buyer-acceptance model** instead of an operator:
- Probability a node buys is a function of its demand profile for the category (cart overlap, order frequency, density), with a per-layer base rate and the price discount. The coefficients live in `src/data/assumptions.ts`.
- This means seeded history is *consistent with the demand profiles*, so boost-reason breakdowns on the dashboard are meaningful, not random.

## 5. Layer 2: categorical boosting

Layer 2 qualification is unchanged: every major node with `dist(node, DSC) < dist(node, SSC)` (haversine) bids, in parallel, at the discount. **New:** each qualifying node is annotated with a `BoostReason` explaining why it is prioritised for *this product's category*.

`getBoostReasons(node, categoryId)` returns every reason that fires, plus a `primary` chosen by priority a > b > c > d:

| Priority | Reason | Fires when (thresholds in `assumptions.ts`) | Meaning |
|---|---|---|---|
| a | `CART_OVERLAP` | `cartOverlap[cat] >= T_CART` | Buyers here already have this type of product in carts |
| b | `HIGH_ORDER_FREQUENCY` | `orderFrequency[cat] >= T_FREQ` | This category is ordered often here |
| c | `HIGH_DENSITY` | `regionOrderDensity >= T_HIGH` | Plentiful buyers, parcel sells **fast** |
| d | `LOW_DENSITY` | `regionOrderDensity <= T_LOW` | Little local competition, parcel is **valuable** to nearby buyers |
| fallback | `NEARER_TO_BUYER` | none of the above | Qualifies on geography only |

Notes:
- (c) and (d) are mutually exclusive by construction. (a) or (b) can co-fire with either.
- **Layer 2 stays fully parallel for v1** (every qualifying node live at once, as today), with a reason badge on each node. Expose `LAYER2_MODE: 'parallel' | 'waves'` in `assumptions.ts` and implement only `'parallel'`. Priority waves (a, then b, then c/d) are a possible future extension and not required now.
- Show the badge on each Layer 2 node marker / its label, and add a compact **"Layer 2 bidders" list** to the PricingCard layer explainer: node name, badge, and whether it is still pending. Badge colours should sit inside the existing theme (magenta family plus orange accents). Add a small legend explaining each badge.
- The winning node's primary reason is stored in `RunRecord.boostReason`.

## 6. Pricing and the seller-contract link

- Product price now comes from the selected `Product`. **Remove the Product Price slider.** Keep Cost per Leg and Discount Margin sliders.
- `effectiveLayer2Discount = min(LAYER2_DISCOUNT, seller.contract.resaleDiscountCap)`.
- Layer 3's discount (`margin * avoidedCost` as a fraction of price) is clamped to the same cap.
- Layer 1 remains full price, no discount.
- When a cap clamps the discount, say so in the UI (e.g. "Discount capped at 10% by seller contract") and in the trace note.

## 7. Baseline vs Return-to-Sale

Define in one place (`src/data/baseline.ts`) and reuse everywhere:
- **Baseline:** the parcel travels the full `getNetworkPath(SSC, DSC)` back to the seller. `legs` = number of edges, `km` = summed haversine along the path, `cost = legs * costPerLeg`.
- **Actual** (Return-to-Sale):
  - Layer 1 buy: `legs = 0`, `km` = DSC to that LMDH
  - Layer 2 buy: `legs = 1`, `km` = DSC to that node
  - Layer 3 buy: legs and km walked along `layer3Path` to the buying hop
  - Unsold: same as baseline (avoided = 0)
- **Avoided** = baseline - actual.
- `timeToResaleDays` is an assumption table by layer (Layer 1 is "within 2 days", matching current copy).

Where it appears (on **Home**, not the dashboard tab):
1. In the end-of-simulation modal: this parcel, baseline vs actual, side by side.
2. A compact, collapsible **cumulative comparison panel** under the KPI strip: "Today (everything returns to the seller)" vs "With Return-to-Sale", covering cost per RTO, km in reverse transit, % resold, avoided cost. It aggregates all runs (seeded + live) and updates after each live run.

The existing Layer-3-only "Valmo saves X% (₹Y)" line may stay, but should now read from `avoided`.

## 8. Home screen changes

Layout (top to bottom): Header with tab bar → **KPI strip** → collapsible baseline comparison panel → the existing 3-pane row.

- **KPI strip (4–5 tiles):** returns in window, % resold, km avoided, cost saved, average time to resale. Each shows a small delta vs baseline where meaningful. Mark the strip as "includes illustrative seeded history" with a tooltip.
- **Product picker** in the Sidebar before SSC/DSC selection: category chips, then product cards (name, price, seller). The selected product drives the PricingCard image, price and seller. Changing product mid-run is disabled; use RESET.
- Keep the mobile ordering rule: Sidebar → Map → PricingCard. The KPI strip and comparison panel go above them and must stack cleanly on narrow screens (horizontal scroll or 2-column grid for tiles).

## 9. Node popup (replaces the "sidebar stats" idea)

Clicking a **major node** opens a popup (a React modal or a styled Leaflet `Popup`; on mobile a bottom-sheet-style modal is acceptable):

- Node name; orders handled; inbound and outbound RTO counts; resale conversion %; average discount given; demand profile for each category (cart overlap, order frequency, density); recent runs touching this node.
- Stats come from `nodeStats(runs, nodeId)` so they change as live runs are added. Static counts (e.g. orders handled) come from the seed.
- **Selection conflict:** node clicks currently select SSC/DSC. During `select-ssc`/`select-dsc` the popup shows a primary button, **"Use as source" / "Use as destination"**. Outside those phases, the popup is stats-only. Clicking a node during selection must not auto-select anymore.
- Popups for LMDH (minor) nodes are out of scope for now.

## 10. Dashboard tab

Sections, in order:
1. **Full KPI grid**: all Home-strip KPIs plus average discount, resale revenue recovered, conversion per layer.
2. **Layer funnel** (returns → Layer 1 → Layer 2 → Layer 3 → unsold). Clicking a layer filters the rest of the page.
3. **Breakdowns**: by category, by region/node, by boost reason (e.g. "share of Audio resales won via CART_OVERLAP"), by seller. Simple bar or stacked-bar charts. Prefer hand-rolled SVG or a lightweight chart lib. If you add a dependency, pick one and keep it small.
4. **Live returns table**: columns for time, product, category, seller, SSC → DSC, outcome, layer, price, discount, boost reason, km avoided, with a `seeded` / `your run` tag. Sortable and filterable by category and layer. Expanding a row shows the **decision trace** as a readable timeline built from `TraceStep.note`.
5. **Replay** button on each row: prefill the same product, SSC and DSC, switch to Home and start at Layer 1. This is a re-run for the operator, not an animation of the record.
6. **Assumptions drawer** (collapsible): every constant from `assumptions.ts` (discount, thresholds, base buy rates, delivery days, seed, history size), shown read-only, labelled "illustrative assumptions, not measured Valmo data".

## 11. Sellers tab

- A list of seller cards: name, rating, review count, RTO rate, return-reason mix (small bar), contract summary (signed on, term, **resale discount cap**, return window), and a few synthetic reviews.
- Derived stats from `sellerStats(runs, sellerId)`: returns handled, resale rate, average discount.
- Label review text and ratings as synthetic.
- Stretch (only if time allows): make the cap editable on the card so changes flow into the simulation immediately.

## 12. Invariants: do not break

- Layer 3's reducer logic (`useSimulation.ts`) and the `SELECT_SSC` / `SELECT_DSC` / `BUY` / `NOT_SOLD` / `SKIP_LAYER` / `RESET` action semantics. Extend rather than rewrite. `BUY` must keep carrying the full node.
- `getNetworkPath`, `getLmdhsForMajor` determinism, and the layer qualification rule.
- Mobile layout rules: `md` breakpoint column layout, `order-last md:order-none` on PricingCard, `h-[60vh]` map wrapper, `useIsMobile()` touch targets, `MapContainer tap: false`.
- Theme colours and the existing Adaptive/Stationary camera behaviour.
- Layers 1 and 2 show only a "Sold" button on markers. Layer 3 shows Sold and Not Sold.

## 13. Suggested file layout

```
src/
  data/ types.ts catalog.ts sellers.ts demand.ts assumptions.ts baseline.ts selectors.ts
  state/ useSimulation.ts (extend) runStore.tsx
  utils/ rng.ts
  engine/ evaluateRun.ts generateHistory.ts boostReasons.ts
  components/
    Header.tsx (add tab bar)  KpiStrip.tsx  BaselineComparison.tsx  ProductPicker.tsx  NodePopup.tsx
    BoostBadge.tsx  Layer2Bidders.tsx
    dashboard/ Dashboard.tsx KpiGrid.tsx Funnel.tsx Breakdowns.tsx ReturnsTable.tsx TraceTimeline.tsx AssumptionsDrawer.tsx
    sellers/ Sellers.tsx SellerCard.tsx
```

## 14. Build order (each step leaves the app working)

1. **Data layer:** types, catalog, sellers, demand, assumptions, rng, `evaluateRun`, `generateHistory`, run store, selectors. No UI yet. Verify with a quick script or test that history is deterministic.
2. **Record live runs:** emit a `RunRecord` (with trace) at the end of every simulation; add `ADD_RUN`.
3. **Tabs + Dashboard:** tab bar, KPI grid, returns table with trace expansion, replay.
4. **Home context:** KPI strip, baseline comparison (end modal + cumulative panel).
5. **Products and categories:** product picker, seller-cap pricing, remove Product Price slider.
6. **Layer 2 boost reasons:** badges, bidders list, legend, `boostReason` in records, breakdown chart.
7. **Node popup** with the "Use as source/destination" flow.
8. **Sellers tab.**
9. **Polish:** mobile pass on every new screen, empty and loading states, assumptions drawer.

Stopping after step 4 still yields a coherent product.

## 15. Acceptance checks

- Reloading the page resets live runs but regenerates the identical seeded history.
- Completing a live run adds exactly one row to the returns table, updates the KPI strip and the cumulative comparison, and its decision trace explains each layer's outcome.
- Choosing a different category changes the Layer 2 badges for the same SSC/DSC pair.
- A seller with a low discount cap visibly limits Layer 2 and Layer 3 prices, with an on-screen explanation.
- Clicking a major node during selection shows the popup with a working "Use as source/destination" button, and no node is selected by the click alone.
- Every number on the Dashboard can be traced to records or to a constant shown in the assumptions drawer.
- The app is usable at 375px width, with no horizontal page scroll outside intentional table or tile scrollers.

## 16. Open decisions (defaults chosen, revisit if needed)

- Layer 2 is parallel with badges (not waves) for v1.
- "Replay" means re-run the same setup, not animate a stored trace.
- Seller cap editing is a stretch goal, read-only by default.
- LMDH popups are out of scope.
