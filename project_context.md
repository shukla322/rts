# Project Context — Return Trip Sale

## What it is
- Single-page React app simulating a reverse-logistics "return trip sale" auction.
- A returned product travels backward through 5 fixed hub roles: **LMDH → DSC → IGH → SSC → FMH**.
- At each hub after the first, the product is auctioned to a local buyer at a discount; if unsold, it moves to the next hub.

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS (custom theme colors, no component lib)
- react-leaflet + Leaflet (map), OpenStreetMap raster tiles (key-free)
- Framer Motion (end-of-simulation modal)

## Visual theme (`Visual Theme.txt`)
- BG white `#fffdf8`, BG beige `#fef2d7`, Header purple `#580b46`, Highlight orange `#fe9c00`
- Soft pink `#f9a8d4` used for: active route dropdown, sliders, highlighted-node dot/glow, RTO callout
- Auction zone colors by hop: DSC=green, IGH=yellow, SSC=orange, FMH=red

## Layout (left → right)
1. **Sidebar** (`Sidebar.tsx`) — route dropdown (4 fixed routes A–D), Pricing Assumptions sliders (Product Price, Cost per Leg, Discount Margin), Logistics Costs stats (avg. reverse logistics price, current amount spent)
2. **Midbar** (`PricingCard.tsx`) — "Return auction" product card (image, live discounted price, Sold/Not Sold buttons pinned to bottom) + "Discount Pricing Logic" formula explainer
3. **Map** (`MapStage.tsx`) — Leaflet map with route polyline, node markers, pulsing auction-zone circle; Adaptive/Stationary toggle top-right

## State model (`state/useSimulation.ts`)
- Single reducer: `idle → auction-live → bought | unsold`
- `highlightedIndex`: node the shipment currently sits at
- `auctionIndex`: node with the live auction (always `highlightedIndex + 1` while live)
- Actions: `SELECT_ROUTE`, `RUN_SIMULATION`, `SOLD`, `NOT_SOLD`, `RESET`

## Pricing model (`data/pricing.ts`)
- `discountedPrice = totalPrice - margin * avoidedCost`
- `avoidedCost = remainingEdges * costPerEdge`
- Buyer-facing: `percentSaved` (% of total price)
- Operator-facing (shown in end modal): `operatorSavings = (1 - margin) * avoidedCost`; `operatorSavingsPercent` = that as a % of the **full route's** total travel cost (`lastIndex * costPerEdge`), not just the avoided portion
- All three sliders (Product Price 100–1000, Cost per Leg 10–50, Discount Margin 0–1) live-drive every price shown

## Map behavior (`MapStage.tsx`)
- **Adaptive mode** (default): camera auto-slides (`flyToBounds`) to frame exactly the two relevant nodes — `[highlightedIndex, auctionIndex]` while live, `[0,1]` at idle, last two nodes when unsold at the end
- **Stationary mode**: camera fixed on the whole route, never auto-moves
- Auction-zone circle is hidden while the camera is mid-flight (`mapFlying` state) to avoid a Leaflet rendering glitch (Path geometry changing concurrently with a zoom animation renders clipped until `moveend`), then grows in from radius 0 → 200,000m via `requestAnimationFrame` once settled
- Node markers use a fixed-size anchor box with absolutely-positioned label/actions/callouts (`hub-marker-info`, `hub-marker-callout`, `hub-marker-auction-callout`) so Leaflet's `iconAnchor` never drifts off the true geo point regardless of label width
- "RTO Product Here" callout on the highlighted node; "Auction Here" callout (zone-colored) on the live auction node; both shrink to a compact size in Stationary mode

## End-of-simulation modal (`EndScreen.tsx`)
- Bought: "Someone in `<city>` bought the product" / "To be delivered in 2 days." / "Valmo saves `<X>`% (₹`<Y>`) off the original Reverse Logistics Costs."
- Unsold: generic return-completed message, no savings line

## Source files
- `App.tsx` — top-level state wiring (simulation + pricing config)
- `state/useSimulation.ts` — reducer
- `data/routes.ts`, `data/nodes.ts`, `data/pricing.ts` — static route/hub data, pricing math
- `components/Header.tsx`, `Sidebar.tsx`, `RunSimulationButton.tsx`, `MapStage.tsx`, `NodeMarker.tsx`, `AuctionZone.tsx`, `PipelineEdges.tsx`, `PricingCard.tsx`, `EndScreen.tsx`
- `index.css` — Leaflet marker/callout/auction-zone CSS (raw, not Tailwind, since markers are built from HTML strings for Leaflet's `divIcon`)

## Source-of-truth docs (in repo root)
- `webapp_overview.md` — original spec
- `changes_1.md`, `changes_2.md` — iterative revision specs (superseded by this file for current state)
