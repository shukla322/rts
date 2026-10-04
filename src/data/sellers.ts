import type { Seller } from './types'

// Fictional sellers. Ratings, reviews, RTO rates and return-reason mixes are
// synthetic. Resale discount caps are deliberately varied so the cap is
// visibly consequential in Layer 2 and Layer 3 pricing.
export const SELLERS: Seller[] = [
  {
    id: 's-audionest',
    name: 'AudioNest Electronics',
    rating: 4.2,
    reviewCount: 1840,
    rtoRate: 0.18,
    returnReasonMix: { 'Not as described': 0.34, 'Defective / not working': 0.28, 'Changed mind': 0.22, 'Wrong item': 0.16 },
    reviews: [
      { stars: 5, text: 'Sound quality is great for the price.' },
      { stars: 4, text: 'Battery lasts a full day. Packaging could be better.' },
      { stars: 2, text: 'Left earbud stopped working in a week.' },
    ],
    contract: { signedOn: '2024-01-15', termMonths: 24, resaleDiscountCap: 0.25, returnWindowDays: 7 },
  },
  {
    id: 's-silkroute',
    name: 'Silk Route Weaves',
    rating: 4.5,
    reviewCount: 2310,
    rtoRate: 0.31,
    returnReasonMix: { 'Colour differs from photo': 0.38, 'Not as described': 0.22, 'Damaged in transit': 0.14, 'Changed mind': 0.26 },
    reviews: [
      { stars: 5, text: 'Beautiful fabric, exactly like the listing.' },
      { stars: 3, text: 'Colour is a shade darker than shown.' },
      { stars: 4, text: 'Lovely drape. Delivery took a while.' },
    ],
    contract: { signedOn: '2023-09-01', termMonths: 12, resaleDiscountCap: 0.1, returnWindowDays: 10 },
  },
  {
    id: 's-tarang',
    name: 'Tarang Textiles',
    rating: 4.1,
    reviewCount: 960,
    rtoRate: 0.27,
    returnReasonMix: { 'Colour differs from photo': 0.3, 'Quality below expectation': 0.3, 'Changed mind': 0.28, 'Wrong item': 0.12 },
    reviews: [
      { stars: 4, text: 'Soft cotton, good everyday saree.' },
      { stars: 3, text: 'Border is thinner than I expected.' },
      { stars: 5, text: 'Great value, would buy again.' },
    ],
    contract: { signedOn: '2024-03-20', termMonths: 18, resaleDiscountCap: 0.2, returnWindowDays: 7 },
  },
  {
    id: 's-strideco',
    name: 'StrideCo Footwear',
    rating: 3.9,
    reviewCount: 3120,
    rtoRate: 0.36,
    returnReasonMix: { 'Size / fit': 0.52, 'Not as described': 0.14, 'Changed mind': 0.2, 'Defective': 0.14 },
    reviews: [
      { stars: 4, text: 'Comfortable, runs half a size small.' },
      { stars: 2, text: 'Sole came off after two weeks.' },
      { stars: 5, text: 'Light and grippy. Very happy.' },
    ],
    contract: { signedOn: '2023-11-10', termMonths: 12, resaleDiscountCap: 0.15, returnWindowDays: 14 },
  },
  {
    id: 's-urbansoles',
    name: 'Urban Soles',
    rating: 4.0,
    reviewCount: 1275,
    rtoRate: 0.29,
    returnReasonMix: { 'Size / fit': 0.46, 'Quality below expectation': 0.2, 'Changed mind': 0.24, 'Damaged in transit': 0.1 },
    reviews: [
      { stars: 4, text: 'Leather feels premium after a few wears.' },
      { stars: 3, text: 'Strap is a bit stiff at first.' },
      { stars: 4, text: 'Good looking and sturdy.' },
    ],
    contract: { signedOn: '2024-02-05', termMonths: 12, resaleDiscountCap: 0.12, returnWindowDays: 10 },
  },
  {
    id: 's-hearth',
    name: 'Hearth & Home Decor',
    rating: 4.3,
    reviewCount: 780,
    rtoRate: 0.15,
    returnReasonMix: { 'Damaged in transit': 0.42, 'Not as described': 0.24, 'Changed mind': 0.24, 'Wrong item': 0.1 },
    reviews: [
      { stars: 5, text: 'Looks lovely on the shelf.' },
      { stars: 2, text: 'Arrived with a chip on the rim.' },
      { stars: 4, text: 'Nice finish, a little smaller than imagined.' },
    ],
    contract: { signedOn: '2024-05-12', termMonths: 24, resaleDiscountCap: 0.25, returnWindowDays: 7 },
  },
]

export function getSeller(id: string): Seller {
  const seller = SELLERS.find((s) => s.id === id)
  if (!seller) throw new Error(`Unknown seller ${id}`)
  return seller
}
