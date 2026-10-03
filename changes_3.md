# Logical changes

The idea is to add 2 layers above the current sale logic.

## FUNDAMENTAL CHANGES

### Routing

**What happens now -**
The `operator` (person who opens the prototype) gets to select a "route". All the 5 nodes of this route are hardcoded for each route.
**What we want -**

- `12-15 Nodes (Sort Centres, Major Nodes)` spread across the India map.
- `5-6 Nodes (Last-mile delivery hub, Minor Nodes)` assigned to each Sort centre at some variable short radial distance to the sort centre itself, but not visible initially.
- Instead of choosing a route, user chooses the Source sort centre - SSC (the Seller's region, where the order is shipped FROM) and the Destination sort centre - DSC (the Buyer's region, where the order is to be delivered). The operator chooses these by `clicking` on the source node first, and the destination node next. These actions must be prompted on the left panel so that the operator understands what to do to proceed.
- ONLY when both nodes have been chosen, the LMDH's assigned to the DSC show up on the map as nodes attached to the DSC at a short distance, out of which, one node is marked in red (so as to show that the parcel was refused from that node) and the other node marked in magenta.
- Simultaneously, the path from the SSC to the DSC (either shortest path, or a hardcoded path for each permutation) will also by displayed.
  This is the fundamental setup for the initialization phase for the operator. Apart from these basic things, the operator will then be shown the different variables they could choose from like per-leg-cost, etc.

### Logical

**What happens now-**
`Next-node-boosting` only. This was the primary logic that the operator could see. The parcel was boosted on a radius around the next node in it's return journey, and the operator was prompted to select buy/not-buy for the same.
**What we want -**
`THREE LAYER ALGORITHM`

1. **Adjacent LMDH boosting**

- Reminder: One LMDH would be red, the other would be magenta. The parcel must be boosted on a small radius around each of these LMDH's, while the parcel is at the DSC.
- NO DISCOUNTS: in this first layer, no discounts would be provided. In the 2nd-from-the-left sidebar, the parcel (earphones) is displayed with a certain discount. Now, for this layer specifically, it is to be displayed with no discount as it is, with a bold "Delivery within 2 days" text under it.
- Buy / Not-buy logic can be same for now.

2. **Nation-wide boosting**

- In the Sort Centres for which distance from DSC is less than distance from SSC (a new order from the seller would take longer than this parcel being shipped from the DSC), the parcel is boosted at a larger radius.
- SMALL DISCOUNTS: Keep it a constant of 15% for now.

3. **Backup Logic - Same as now**

- If the operator continues to "Not-Buy" on both of the above two layers, the prototype does the same thing it does now == travel back to the seller with `Next-Node boosting`.
