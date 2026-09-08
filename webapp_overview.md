# Return Order Auction In Logistics Pipeline

## Overview

This is just one single page of an interactive web-app where the user's choice defines the next step.
There are a total of 5 nodes, spread across the India map (would need to use leaflet library for this to make it interactive with zoom-in/zoom-out and visually pleasing) -

1. LMDH - Last Mile Delivery Hub (initial location of the returned product) at Guwahati
2. DSC - Destination Sort Center at Kolkata
3. IGH - Intermediate Gateway Hub 1 at Bhopal
4. SSC - Source Sort Center at Mumbai
5. FMH - FM Hub / Origin at Goa
   These will be displayed on the webapp as a simple node-edges structure, where, based on the current location of the returned product, some clickable actions will be present under those nodes, and the node will be highlighted.

## Simulation Process

1. At the initial location (Last Mile Delivery Hub) - a "Run Simulation" button will be present on the top, which disappears (doesn't affect height of the rest of the elements, just disappears) on clicking. Further, this triggers a "zone" at a certain radius around the next node, which is the DSC in this case, colored in light translucent green. The highlight does NOT shift to the next node.
2. At this point, where the LMDH is highlighted but the auction is triggerred at the DSC, the user is provided with a clickable button under the DSC which says "view auction", clicking this opens a pop-up in the middle of the screen. The Top of the pop-up is an e-commerce-like product description, one image placeholder, one title, and two prices: "Original Price - 269", below that: "Sale Price - 169" - this sale price changes based on the node. Below this the user is prompted with two options - Buy or Skip, one below the other - and below that, "Delivery Time = within 2 days". "Buy" is a universal signal to end the simulation and just display some sort of "Product Bought, Will arrive in 2 days" message. If the user clicks "Skip", then the cycle essentially continues, just with a different color for the Auction Circle - Light Yellow, Translucent again. The highlight shifts to DSC node right now.
3. Since the user pressed skip on the DSC auction, the user now gets the same clickable "view auction" under the IGH node, exactly same popup with a somewhat higher price, say 209. Same permutaion again, Product bought and simulation close on buying, simulation continue with "Light Orange" auction circle on SSC if skipped as well as IGH node highlighted.
4. If skipped on IGH, View Auction opens under SSC a popup with 239 price, same repeatition. Next auction circle happens around FMH with a red circle, marking the last possible auction.

## Overall Color Theme

Follow Visual Theme.txt
Auction Circles:-

- DSC -> light green
- IGH -> light yellow
- SSC -> light orange
- FMH -> red
