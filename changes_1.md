## Layout Changes

1. Left Sidebar with four different route options (Displayed only LMDH->FMH locations) -
   - Guwahati (LMDH) --> Patna --> Lucknow --> Delhi --> Jaipur (FMH)
   - Trivandram --> Bangalore --> Mumbai --> Ahmedabad --> Jaipur
   - Chennai --> Hyderabad --> Bhuvaneshwar --> Kolkata --> Guwahati
   - Dehradun --> Delhi --> Bhopal --> Pune --> Mangalore
2. Top Left of the remaining Container (page minus sidebar and header) has the map (with run simulation on top) with the nodes mentioned above. Increase Radius of the Auction zone, Below each node, instead of the usual "View-Auction" button, Two Buttons - "Sold" (in a green box) and "Not Sold" (in a light red box), doing the same function as Buy/Skip.
   Also, is it possible to only show india on the map? Make it less colorful and a little more simple?
3. Product Details show up like they are right now, but without the Buy/Skip, More Horizontal (Image Adjacent to the Title, above the pricing - typical e-commerce),and on the top half of a seperate card on the right side of the map, with a dynamic pricing formula which is calculated as follows -

- Discounted Price = Total Price - Discount
- Dicount = 0.6 \* Avoided Travel Cost
- Avoided Travel Cost = Remaining Edges \* Cost Per Edge
- Cost Per Edge = INR 30
  Delivery Time is still at 2-3 days.
  The bottom half of this card shows this exact Pricing Strategy, but consolidated into something like "Discount = margin\*avoided cost" (something along those lines)

4. On clicking "Sold", you would get a pop-up saying how much percentage of money you saved along with the current "Product Bought, 2 days" stuff.
