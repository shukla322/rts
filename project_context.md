# Project Context — Return Trip Sale

Single-page prototype for Meesho/Valmo: "Return-to-sale (RTS) Prototype". It simulates what happens to a returned parcel (instead of shipping it back to the seller, auction it to nearby buyers in layers) and shows the system-level picture on a dashboard. Built as a pitch/demo tool, not a production system. This file reflects the code as it is now; `changes_1.md` to `changes_4.md` are the historical specs.

## 1. What it does

**The simulation (Home tab).** The operator picks a source sort centre (SSC, the seller's region) and a destination sort centre (DSC, where the return lands), plus a product. The parcel then runs a three-layer auction:
1. **Layer 1, adjacent LMDH boosting.** The DSC's 4 biddable last-mile hubs offer the product at full price, no discount ("Delivery within 2 days").
2. **Layer 2, nation-wide boosting.** Every other sort centre closer to the parcel (DSC) than to the seller (SSC) bids at once, at a flat 15% off (capped by the seller contract). Bidders are shown as a ranked **Priority list** with a boost-reason badge and a likelihood percentage.
3. **Layer 3, sequential backup.** Hop-by-hop "next-node boosting" back toward the SSC, discount growing with the avoided distance.

Selling at any node ends the run. Declining all of Layer 3 ends it unsold (the parcel completes the trip to the seller).

**The dashboard.** Every finished run produces one `RunRecord`; the Home KPI strip, Dashboard, RTS History, node popup and Sellers stats are all derived from the list of records (300 generated history runs plus the operator's live runs).

**Rules from the user that apply everywhere**
- **No disclaimers in the UI.** Never show "seeded", "synthetic", "illustrative", "not measured" or similar warnings (headers, tooltips, tags, subtitles). The numbers are meant to look hopeful; it is a prototype of what the product looks like at scale.
- **UI copy the user specified is literal.** "Speedy Delivery; No discount", "Flat 15% off at nearby Sort Centres", "Discount proportional to remaining distance", "Not Sold? Move to Layer N →", the tab names, "Choose source & destination", etc. Do not paraphrase while restyling.
- Fix clutter by removing or shrinking, not by restyling.

## 2. Stack and tooling
- React 18 + TypeScript + Vite; Tailwind CSS with custom theme tokens (no component library); react-leaflet + Leaflet with OpenStreetMap raster tiles; Framer Motion (modals).
- No router, no state library, no backend. Live runs are in memory only; a refresh resets them.
- Windows dev machine, no Python. For multi-line edits use the Edit/Write tools; shell `node -e` with template literals gets mangled by backticks.
- Useful verification setup: headless Edge (`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`) driven by `puppeteer-core` installed in the temp dir (not in the repo). TS data-layer scripts run via `esbuild --bundle --platform=node`.
- Checks that should always pass: `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`, no horizontal page scroll at 375px.

## 3. Screens and layout

Tab bar in the header; `activeTab` and all simulation state live in `App.tsx`, so the simulation survives tab switches (Home remounts, the reducer does not). Tabs: **Home**, **Dashboard**, **RTS History**, **Sellers**.

**Header** (`Header.tsx`): Meesho logo (`public/products/meeshologo.png`) at the left, title "Return-to-sale (RTS) Prototype" centred, tab nav at the right. One 52px row from `lg` (1024px) up; below that the nav drops to a second row (about 84px).

**Home** (top to bottom): `KpiStrip` (5 tiles; one scrolling row on phones), then the three-column row:

| Left sidebar (30vw, `lg:min-w-[400px]`) | Map (rest, about 40%) | Right panel (30vw) |
|---|---|---|
| `Sidebar.tsx`: set up a return | `MapStage.tsx`: display-only | `PricingCard.tsx`: the live auction and every action |

- **Left sidebar**, three numbered steps: 1 *Choose source & destination* (two dropdowns side by side, "or", a preset-route dropdown; after the run starts it collapses to "Guwahati → Delhi · Reset"), 2 *Choose product* (category chips + product rows; locked after the run starts, Reset to change), 3 *Pricing assumptions* (Cost per Leg 10 to 50, Discount Margin 0 to 1). A *Logistics Costs* section appears only in Layer 3. Preset routes are `PRESET_ROUTES` in `Sidebar.tsx`.
- **Right panel**:
  - Top block: eyebrow ("Live auction" / "Return auction · ..."), then **`PhonePreview`**, the buyer's phone (176 x 230px wireframe, cropped at the bottom with a fade): product photo, name, live price (pops when it changes), struck list price, green discount chip, delivery line for the current layer, a faded "Buy now". Details (title, seller and cap, cap `Notice`, hint) sit beside the phone when the block is at least 340px wide (`useElementWidth`; Tailwind container queries are not available) and below it otherwise (tablets, phones). Nothing in the phone is clickable.
  - "How it works": three `LayerCard`s, the live one highlighted (it scrolls into view on desktop, not on phones).
    - **Layer 1:** a compact **Sold** button at the right of the title line (sells to the first hub still in `layer1Pending`), plus "Not Sold? Move to Layer 2 →".
    - **Layer 2:** `Layer2Bidders`, the "Layer 2 bidders · Priority list" (rank, city, boost badge, likelihood %, and a **Sold** button per bidder while bidding; a status label otherwise), a badge legend, plus "Not Sold? Move to Layer 3 →".
    - **Layer 3:** "Offered at <city>" with **Sold** / **Not Sold** inside the block.
- **Map** is display-only for the auction: no Sold / Not Sold buttons on any marker. Every major node still opens the stats popup on click.
- **Mobile (below `md`, 768px):** one scrolling column in DOM order Sidebar, Map, PricingCard (the DOM order is already that, no `order-*` classes). `MapStage`'s wrapper is `h-[60vh]` on mobile (Leaflet needs a real pixel height) and `md:h-full md:flex-1` on desktop.

**Dashboard** (`components/dashboard/`): KPI grid, clickable layer funnel (waterfall: unsold parcels move down a layer; clicking a layer filters the breakdowns), breakdowns (category / seller / destination node / Layer-2 boost reason, div bars with a "View as table" disclosure), assumptions drawer (every constant plus the demand table).

**RTS History** (`components/history/`): sortable, filterable returns table (own layer and category filters), expandable decision trace per row (`TraceTimeline`), **Replay** (refills product, SSC and DSC, jumps to Home, starts at Layer 1), "your run" tag on live runs.

**Sellers** (`components/sellers/`): cards with rating, return-reason mix, contract terms (including the resale discount cap), reviews, and stats derived from the run history. Cap editing (spec stretch goal) is not built; caps are read-only.

**Modals** (`ui/Modal`): `NodePopup` (node stats; in the select phases a "Use as source/destination" button calling the same `SELECT_SSC`/`SELECT_DSC` actions; a sheet on phones) and `EndScreen` (who bought it, price, delivery days, this parcel's baseline vs Return-to-Sale table, and in Layer 3 a "Valmo saves X% (₹Y)" line derived from the record).

## 4. Visual theme (`Visual Theme.txt`)
- Page white `#fffdf8` (`bg-white`); beige `#f9f6e7` (`bg-beige`; the file says `#f9f6e79`, 7 hex digits, read as `#f9f6e7`); header magenta `#783965` (`header-purple`, also the main text colour); highlight orange `#fd9b08`; slight highlight light orange `#fff3d7` (`light-orange`: selected/active states); numerical highlight vivid red `#ef4a59` (`num-red`: headline numbers, prices; also the refused-hub marker and the red Layer 3 zone).
- Map accents (not in the theme file): soft pink `#f9a8d4` (sliders, active-hop dot glow), magenta `#d6409f` (Layer 1 circles), Layer 3 zone colours by hop green, yellow, orange, red.
- The "RTO Product Here" callout is orange like the SSC/DSC tag pills.
- **Boost reasons share one colour per reason**, in priority order (`BOOST_REASON_META` in `engine/boostReasons.ts`), used for the Layer 2 circle, map pill, bidders list, legend and chart: Cart magenta `#d6409f` > Frequency orange `#fd9b08` > Density teal `#2f9e93` > Sparse blue `#5b6fd6`; Nearer-to-buyer fallback neutral `#cfc4b0`. Red is avoided because it already means refused/unsold.

## 5. UI kit (`src/components/ui/`): build every screen from these
Use these instead of one-off class strings (import from `./ui` or `../ui`).

| Component | Use it for |
|---|---|
| `Card` (`tone`: surface / muted / highlight, `pad`), `CardHeader` | Every container. highlight = the active/selected item |
| `Section` (`title`, `step`) | A titled block in a side panel (label above, card below) |
| `Eyebrow` | The small uppercase label |
| `PageShell`, `PageHeader` | Every full-page tab |
| `Stat` (`size` sm/md, `quiet`) | Every metric tile (KPI strip, Dashboard grid, popup, seller cards, logistics costs); value is vivid red unless `quiet` |
| `Button` (`variant`: primary / success / danger / outline / ghost; `size`: sm / md / lg; `full`) | Every button. success = Sold, danger = Not Sold, primary = main action (glow ring only on md/lg) |
| `Select` (`label`, `placeholder`, `options`, `size`) | Every dropdown |
| `Chip`, `Tag` | Selectable pill / read-only label |
| `Segmented` (`tone` dark/light, `size`) | Header navigation and the map's Adaptive/Stationary toggle |
| `Disclosure` (`variant` card/inline) | Assumptions drawer, badge legend, chart tables |
| `Notice` | Short inline message (discount cap, "already your source") |
| `PhoneFrame` | Wireframe phone, cropped with a fade (used by `PhonePreview`) |
| `Modal` | The one dialog shell |

- **Type scale** (`tailwind.config.js`): `text-caption` (11px: labels, hints), `text-body` (13px: default UI text), then Tailwind's `text-sm` / `text-lg` / `text-xl` / `text-2xl` for titles and numbers. No `text-[Npx]` in components.
- **Colours** come from theme tokens. Hex values outside the config live only in `chartColors.ts`, `boostReasons.ts`, and the map CSS.

## 6. Node network (`data/network.ts`)
- `MAJOR_NODES`: 14 sort centres (Guwahati, Kolkata, Bhubaneswar, Chennai, Hyderabad, Bangalore, Trivandrum, Mumbai, Pune, Ahmedabad, Jaipur, Delhi, Bhopal, Dehradun).
- `getLmdhsForMajor(id)`: 5 deterministic LMDH hubs per major, index 0 always **red** ("Refused"), the other 4 **magenta** (biddable in Layer 1). Default is a radial ring; coastal Mumbai, Chennai, Bhubaneswar and Trivandrum use hand-picked land-side offsets (`COASTAL_LMDH_OFFSETS`) so no hub is in the sea. If you edit them keep hubs on land and at least about 41 km apart.
- `getNetworkPath(from, to)`: SSC to DSC chain from a small region/gateway table (`MAJOR_REGION`, `REGION_GATEWAY`, Bhopal as the central relay), used for the on-map line, Layer 3's hop sequence, and the baseline route.
- `qualifyingLayer2Majors(ssc, dsc)`: majors with `dist(node, DSC) < dist(node, SSC)` (haversine, `data/geo.ts`). `majorIdOfNode("BOM-LMDH-2")` returns `"BOM"`.

## 7. State and data

**Simulation reducer** (`state/useSimulation.ts`). `phase`: `select-ssc` | `select-dsc` | `layer1` | `layer2` | `layer3` | `bought` | `unsold`. Actions: `SELECT_SSC`, `SELECT_DSC`, `SELECT_ROUTE` (select phases only), `REPLAY` (any phase), `BUY` (carries the full node), `NOT_SOLD`, `SKIP_LAYER`, `RESET`. Layer 3 reuses the original single-route logic over `layer3Path`. Do not break these semantics.

**Run store** (`state/runStore.tsx`): context + reducer; history generated on mount, `ADD_RUN` for live runs. `App.tsx` records exactly one run on the `bought` / `unsold` transition (`evaluateRun`) and keeps the last one for the end modal.

**Records and selectors**
- `data/types.ts` (`RunRecord`, `TraceStep`, `BoostReason`...), `catalog.ts` (4 categories, 8 products; default Wireless Headphones with the original photo, others use SVGs in `public/products/`), `sellers.ts` (6 sellers, caps 10 to 25%), `demand.ts` (per-node, per-category demand profiles), `assumptions.ts` (every assumed constant plus `ASSUMPTION_ROWS` for the drawer), `baseline.ts`, `selectors.ts` (`kpis`, `funnel`, `byCategory`, `byNode`, `bySeller`, `byBoostReason`, `nodeStats`, `sellerStats`).
- `engine/evaluateRun.ts`: pure, `(params, {soldLayer, soldNodeId})` to a full record (baseline, actual, avoided, price, trace). `engine/generateHistory.ts`: `generateSetups` (random part) and `generateHistory`, using mulberry32 and a buyer-acceptance model. `engine/boostReasons.ts`: reasons, bidders and priority.
- **Baseline vs actual:** baseline = full `getNetworkPath` back to the seller; actual by sold layer (L1 0 legs, L2 1 leg, L3 legs walked, unsold = baseline); avoided = baseline minus actual.

**Pricing** (`data/pricing.ts`). Price comes from the selected product. Layer 1 full price. Layer 2 `effectiveLayer2Discount = min(15%, seller cap)`. Layer 3 `discountedPrice = price - margin * remainingEdges * costPerEdge`, clamped to the cap (`getPricingForNode(..., discountCap)` returns `capped`). Capped prices show a `Notice` and a trace note.

**Layer 2 priority.** `priority = 0.4 * exp(-km / 800) + 0.6 * reasonScore` (`getBidderPriority`, `getLayer2PriorityList`; weights and reason scores in `assumptions.ts`). Reason priority: Cart overlap > High order frequency > High density > Low density ("Sparse") > Nearer-to-buyer. **`getLayer2Bidders` must stay unsorted:** the history model draws random numbers per bidder in that order. Traces list bidders in priority order ("Priority #N (X% likelihood)").

**Tuned history (do not break casually).** The history is tuned so the funnel reads exactly **76 / 55 / 47** sold in Layers 1 / 2 / 3 (122 unsold of 300): `BUY_BASE_RATE` = 0.068 / 0.035 / 0.1 and `HISTORY_SEED` = 13673 in `assumptions.ts`. Changing the rates, history size or the order of random draws in `generateSetups` changes those counts; re-scan for a seed that restores them. Timestamps are anchored to today's midnight, so the same history regenerates identically on reload.

## 8. Map behaviour (`MapStage.tsx`)
- All 14 majors render via `MajorNodeMarker` (SSC/DSC get orange "SSC"/"DSC" tag pills; the others are label-free because the base map already names cities). Layer 1 hubs (`NodeMarker`) show an "LMDH <city> Hub n" label; the red hub shows "Refused". Layer 2 bidders show their boost pill; Layer 3 path nodes carry the "RTO Product Here" callout on the active hop.
- Edges: the SSC to DSC path is a solid line; dashed lines join the DSC to every LMDH in Layer 1.
- Auction-zone circles: Layer 1 magenta 22.5 km, Layer 2 150 km coloured by boost reason, Layer 3 200 km zone colour by hop. They are hidden while the map is flying (`mapFlying`, a Leaflet re-projection workaround) and grow in via `requestAnimationFrame`.
- **Camera (`MapFocus`).** Adaptive: all majors while selecting (padding 12), `[DSC, hubs]` in Layer 1, `[DSC, ...layer2Pending]` in Layer 2 (SSC excluded so a far seller does not force a national zoom; padding 36), the two-hop pair in Layer 3 (padding 150, `maxZoom: 6` so each hop frames loosely). Stationary: always all 14 nodes. `MapContainer` uses `zoomSnap={0.25}` so fitted views land snugly.
- `NodeMarker` has no action props (`showActions`, `onSold`, `onNotSold`, `hideNotSold` were removed); `MapStage` takes `state`, `categoryId`, `onUseAsSource`, `onUseAsDestination`.
- **Leaflet mobile gotcha, do not revert:** `MapContainer` is built with `tap: false` (cast `as object`, since `@types/leaflet` lacks the option). Otherwise Leaflet's own touch "tap" handler swallows taps before they reach marker click handlers on modern touch devices. `useIsMobile()` scales marker dots and touch targets together with `iconSize`/`iconAnchor` so anchor math stays exact. Known rough edge: close majors (Mumbai/Pune) overlap on a narrow phone at the national zoom; pinch-zoom disambiguates.
- Marker HTML is built from strings for Leaflet `divIcon`, so its styles are raw CSS in `index.css`, not Tailwind.

## 9. Source layout
```
src/
  App.tsx                  wiring: tabs, sim state, product, sliders, run recording
  components/
    Header, KpiStrip, Sidebar, ProductPicker, MapStage, MajorNodeMarker, NodeMarker,
    AuctionZone, PipelineEdges, PricingCard (PhonePreview, LayerCard), Layer2Bidders,
    BoostBadge, NodePopup, EndScreen
    ui/         shared kit (section 5)
    dashboard/  Dashboard, KpiGrid, Funnel, Breakdowns, AssumptionsDrawer, chartColors
    history/    History, ReturnsTable, TraceTimeline
    sellers/    Sellers, SellerCard
  data/         types, catalog, sellers, demand, assumptions, baseline, selectors, network, geo, nodes, pricing
  engine/       evaluateRun, generateHistory, boostReasons
  state/        useSimulation, runStore
  hooks/        useIsMobile, useElementWidth
  utils/        rng, format
  index.css     Leaflet marker, callout and zone CSS
```

## 10. Historical specs in the repo root
`webapp_overview.md`, `changes_1.md`, `changes_2.md` (old single-route version, superseded); `changes_3.md` (the three-layer network rework, still describes the simulation core); `changes_4.md` (the dashboard rework, implemented, with the deviations above: dropdown selection instead of map clicks, popup instead of sidebar stats, no seller-cap editing).
