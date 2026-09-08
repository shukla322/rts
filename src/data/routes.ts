import type { HubNode, NodeId } from './nodes'

export type RouteId = 'A' | 'B' | 'C' | 'D'

export interface Route {
  id: RouteId
  cities: HubNode[]
}

const ROLE_IDS: NodeId[] = ['LMDH', 'DSC', 'IGH', 'SSC', 'FMH']
const ROLE_NAMES: Record<NodeId, string> = {
  LMDH: 'Last Mile Delivery Hub',
  DSC: 'Destination Sort Center',
  IGH: 'Intermediate Gateway Hub',
  SSC: 'Source Sort Center',
  FMH: 'FM Hub / Origin',
}

function makeRoute(id: RouteId, cities: [string, number, number][]): Route {
  return {
    id,
    cities: cities.map(([city, lat, lng], i) => ({
      id: ROLE_IDS[i],
      name: ROLE_NAMES[ROLE_IDS[i]],
      city,
      lat,
      lng,
    })),
  }
}

export const ROUTES: Route[] = [
  makeRoute('A', [
    ['Guwahati', 26.1445, 91.7362],
    ['Patna', 25.5941, 85.1376],
    ['Lucknow', 26.8467, 80.9462],
    ['Delhi', 28.7041, 77.1025],
    ['Jaipur', 26.9124, 75.7873],
  ]),
  makeRoute('B', [
    ['Trivandrum', 8.5241, 76.9366],
    ['Bangalore', 12.9716, 77.5946],
    ['Mumbai', 19.076, 72.8777],
    ['Ahmedabad', 23.0225, 72.5714],
    ['Jaipur', 26.9124, 75.7873],
  ]),
  makeRoute('C', [
    ['Chennai', 13.0827, 80.2707],
    ['Hyderabad', 17.385, 78.4867],
    ['Bhubaneswar', 20.2961, 85.8245],
    ['Kolkata', 22.5726, 88.3639],
    ['Guwahati', 26.1445, 91.7362],
  ]),
  makeRoute('D', [
    ['Dehradun', 30.3165, 78.0322],
    ['Delhi', 28.7041, 77.1025],
    ['Bhopal', 23.2599, 77.4126],
    ['Pune', 18.5204, 73.8567],
    ['Mangalore', 12.9141, 74.856],
  ]),
]

export function getRoute(id: RouteId): Route {
  const route = ROUTES.find((r) => r.id === id)
  if (!route) throw new Error(`Unknown route ${id}`)
  return route
}
