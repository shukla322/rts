# Project Context — Return Trip Sale

## What it is
- Single-page React app simulating a reverse-logistics "return trip sale" auction over a real node network (not fixed routes).
- Operator clicks a **source sort centre (SSC)** then a **destination sort centre (DSC)** on the map — the seller's and buyer's regions.
- The returned parcel then runs through a **three-layer auction**, each layer parallel (every candidate node live at once) except the last:
  1. **Layer 1 — Adjacent LMDH boosting**: the DSC's local last-mile hubs (LMDHs) bid at full price, no discount.
  2. **Layer 2 — Nation-wide boosting**: every other sort centre nationally that's geographically closer to the parcel than to the original seller bids at a flat discount.
  3. **Layer 3 — Sequential backup**: falls back to today's original behavior — hop-by-hop "next-node boosting" back toward the SSC, discount growing with distance.
- Buying at any node ends the simulation; declining everything in Layer 3 ends it unsold.

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS (custom theme colors, no component lib)
- react-leaflet + Leaflet (map), OpenStreetMap raster tiles (key-free)
- Framer Motion (end-of-simulation modal)

## Visual theme (`Visual Theme.txt`)
- BG white `#fffdf8`, BG beige `#fef2d7`, Header purple `#580b46`, Highlight orange `#fe9c00`
- Soft pink `#f9a8d4`: sliders, highlighted-node ("RTO Product Here") dot/glow
- Magenta `#d6409f`: Layer 1/2 auction-zone circles and badges
- SSC/DSC major-node markers: highlight orange (dot + tag pill)
- Refused LMDH marker: red (`#e2534d`), reused from the old Layer-3 zone-color set
- Layer 3 zone colors by hop position: green → yellow → orange → red

## Layout (left → right)
1. **Sidebar** (`Sidebar.tsx`) — SSC/DSC selection prompt ("Click on your *Source Node*" / "Now choose your *Destination*", bold), Pricing Assumptions sliders (Product Price, Cost per Leg, Discount Margin), Logistics Costs stats (only shown once Layer 3 is active/was used — Layers 1/2 have no per-edge cost concept)
2. **Midbar** (`PricingCard.tsx`) — "Return auction" product card (image, live price per layer, Sold/Not-Sold buttons for Layer 3 only) + a permanent, always-visible **three-layer explainer**: one short fixed sentence per layer, the active layer highlighted with an orange border, each with a "Not Sold? Move to Layer N →" skip button (Layers 1–2 only)
3. **Map** (`MapStage.tsx`) — Leaflet map, all 14 major nodes always visible, LMDH cluster + auction-zone circles appear per layer, Adaptive/Stationary toggle top-right

## Node network (`data/network.ts`)
- `MAJOR_NODES`: 14 fixed Sort Centres across India (Guwahati, Kolkata, Bhubaneswar, Chennai, Hyderabad, Bangalore, Trivandrum, Mumbai, Pune, Ahmedabad, Jaipur, Delhi, Bhopal, Dehradun) — replaces the old 4 hardcoded routes entirely.
- `getLmdhsForMajor(id)`: deterministic (not random) radial offsets generate 5 LMDH minors per major — index 0 is always **red** ("Refused"), the other 4 are **magenta** (biddable in Layer 1).
- `getNetworkPath(from, to)`: the SSC↔DSC chain, built from a small hardcoded region/gateway table (`MAJOR_REGION`, `REGION_GATEWAY`) rather than a literal 91-pair lookup or a live shortest-path search — same-region pairs connect directly, cross-region pairs route via each region's gateway major and `BHO` (Bhopal) as the central relay. Used both for the on-map SSC–DSC line and as Layer 3's hop sequence (`layer3Path`).
- `data/geo.ts` — `haversineKm`, used only to decide Layer 2's qualifying set: `dist(candidate, DSC) < dist(candidate, SSC)`.

## State model (`state/useSimulation.ts`)
- `phase: 'select-ssc' | 'select-dsc' | 'layer1' | 'layer2' | 'layer3' | 'bought' | 'unsold'`
- `layer1Pending` / `layer2Pending`: ids still undecided in the current parallel layer; shrink via `NOT_SOLD` or collapse instantly via `SKIP_LAYER`
- `layer3Path`, `highlightedIndex`, `auctionIndex`: Layer 3 reuses the original single-route reducer logic verbatim, just walking `layer3Path` instead of a fixed route's city list
- Actions: `SELECT_SSC`, `SELECT_DSC`, `BUY`, `NOT_SOLD`, `SKIP_LAYER`, `RESET`
- `BUY` carries the full node (`id`, `city`, `lat`, `lng`) so the end screen and camera don't need to re-derive it
- `advanceToLayer2` / `startLayer3` are shared between the "last pending id declined" path and the explicit skip button, so both reach identical end states

## Pricing model (`data/pricing.ts`)
- Layer 1: full price, no discount (shown with a bold "Delivery within 2 days" line instead)
- Layer 2: flat `LAYER2_DISCOUNT` (15%) off via `getLayer2Price`
- Layer 3 (unchanged from the original model): `discountedPrice = totalPrice - margin * avoidedCost`, `avoidedCost = remainingEdges * costPerEdge`
- Operator-facing (end modal, Layer 3 buys only): `operatorSavings = (1 - margin) * avoidedCost`; `operatorSavingsPercent` = that as a % of the full chain's total travel cost
- All three sliders (Product Price 100–1000, Cost per Leg 10–50, Discount Margin 0–1) still live-drive Layer 3's numbers

## Map behavior (`MapStage.tsx`)
- All 14 major nodes render via `MajorNodeMarker` at all times — clickable only during `select-ssc`/`select-dsc`; SSC/DSC get an orange "SSC"/"DSC" tag pill, everything else is label-free (city names are already on the base map tiles) except a native hover `title` for discoverability
- **Adaptive mode**: camera frames exactly the relevant point set per phase — all majors while selecting, `[DSC, red LMDH, magenta LMDHs]` in Layer 1, `[DSC, ...layer2Pending]` in Layer 2 (SSC deliberately excluded so a far-away seller doesn't force a near-national zoom), the usual two-node pair in Layer 3
- **Stationary mode**: always frames the whole 14-node network
- Auction-zone circles are hidden mid-flight (`mapFlying`) to dodge a Leaflet re-projection glitch, then grow in via `requestAnimationFrame`; radii are 22,500 m (Layer 1), 150,000 m (Layer 2), 200,000 m (Layer 3 default)
- Edges: SSC↔DSC path is a **solid** line; dashed lines connect the DSC to every LMDH, drawn only while the LMDH cluster is visible (Layer 1)
- "RTO Product Here" callout (compact) marks wherever the parcel currently sits; the old "Boosting Here" callout was removed entirely — auction zones/circles and the Sold button are the only "live" indicators now
- Layer 1 and Layer 2 node markers show **only a "Sold" button** (no per-node "Not Sold" — operators instead use the "Not Sold? Move to Layer N →" button in the PricingCard, or `AuctionZone`/`NodeMarker`'s `hideNotSold` prop); Layer 3 keeps both Sold and Not Sold per node, matching the original single-auction flow

## Responsive / mobile layout
- Below Tailwind's `md` breakpoint (768px), the 3-pane desktop row (Sidebar / PricingCard / Map) becomes a single scrolling column: `App.tsx`'s wrapper switches `overflow-hidden` → `overflow-y-auto` and `flex-row` → `flex-col`; Sidebar/PricingCard drop their `w-80`/`w-[340px]`/`h-full` desktop sizing for `w-full`/natural height.
- Order on mobile is Sidebar (prompt) → **Map** → PricingCard, via `order-last md:order-none` on `PricingCard` — the map is the actual interaction, so it comes before the supplementary pricing/layer-logic reading material, while on desktop the DOM order (PricingCard, then Map) is unchanged.
- `MapStage`'s wrapper gets an explicit `h-[60vh]` on mobile (`md:h-full md:flex-1` on desktop) — Leaflet needs a real pixel height, which a `flex-1` child of an `overflow-y-auto`/auto-height column can't reliably provide.
- `useIsMobile()` (`hooks/useIsMobile.ts`, a `matchMedia('(max-width: 767px)')` hook) drives bigger touch targets in `NodeMarker`/`MajorNodeMarker`: dot + `iconSize`/`iconAnchor` scale up (20px→30px, 16px→26px) together so Leaflet's anchor math stays exact; matching `.is-mobile` CSS variants scale the dependent offsets (callout position, label/button padding).
- **Leaflet mobile gotcha fixed**: `MapContainer` is constructed with `tap: false` (cast through `as object` since `@types/leaflet`'s `MapOptions` is missing this real Leaflet option) to disable `L.Map.Tap` — its touch-start/touch-end handling (a workaround for an old mobile Safari 300ms-click-delay quirk) can swallow taps before they reach marker click handlers on modern touch browsers, which already fire `click` natively and immediately on tap. Confirmed via direct inspection of the Leaflet `Map` instance that the handler is absent once `tap:false` is set.
- Known rough edge: at the national "choose SSC/DSC" zoom, a few geographically close majors (e.g. Mumbai/Pune) can visually/functionally overlap on a narrow phone screen, especially with the larger mobile touch targets — same as any map app, pinch-zoom disambiguates; not specially handled.

## End-of-simulation modal (`EndScreen.tsx`)
- Bought: "Someone in `<city>` bought the product" / "To be delivered in 2 days." — the Layer-3-only "Valmo saves X% (₹Y)" line is omitted for Layer 1/2 buys (no avoided-transit framing applies there)
- Unsold: generic return-completed message, no savings line

## Source files
- `App.tsx` — top-level wiring (simulation state + pricing config)
- `state/useSimulation.ts` — reducer
- `data/network.ts` — major-node network, LMDH generation, SSC↔DSC path logic (replaces old `data/routes.ts`)
- `data/geo.ts` — haversine distance (Layer 2 qualification)
- `data/nodes.ts`, `data/pricing.ts` — shared hub types/colors, pricing math
- `components/Header.tsx`, `Sidebar.tsx`, `MapStage.tsx`, `MajorNodeMarker.tsx`, `NodeMarker.tsx`, `AuctionZone.tsx`, `PipelineEdges.tsx`, `PricingCard.tsx`, `EndScreen.tsx`
- `hooks/useIsMobile.ts` — `matchMedia` breakpoint hook used for mobile touch-target sizing
- `index.css` — Leaflet marker/callout/auction-zone CSS (raw, not Tailwind, since markers are built from HTML strings for Leaflet's `divIcon`)

## Source-of-truth docs (in repo root)
- `webapp_overview.md`, `changes_1.md`, `changes_2.md` — superseded iterative specs, kept for history only
- `changes_3.md` — the three-layer network rework spec this file now reflects
