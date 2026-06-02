/** Fallback when route is unknown or cities are not set yet. */
export const DEFAULT_ESTIMATE_DISTANCE_KM = 250;

/** Typical one-way road distance (km) for common hub pairs. */
const ROUTE_KM: Record<string, number> = {
  "ahmedabad|mumbai": 530,
  "bengaluru|chennai": 345,
  "bengaluru|hyderabad": 570,
  "bengaluru|mumbai": 980,
  "chennai|hyderabad": 630,
  "chennai|kadapa": 260,
  "chennai|mumbai": 1330,
  "delhi|jaipur": 280,
  "delhi|mumbai": 1420,
  "hyderabad|kadapa": 210,
  "hyderabad|mumbai": 710,
  "hyderabad|pune": 560,
  "kadapa|mumbai": 1020,
  "kadapa|pune": 780,
  "mumbai|pune": 150,
  "mumbai|surat": 290,
  "nagpur|pune": 680,
  "pune|surat": 300,
};

function routeKey(a: string, b: string) {
  return [a.trim().toLowerCase(), b.trim().toLowerCase()].sort().join("|");
}

/**
 * Estimates one-way distance from pickup and drop city names.
 * Used when the customer does not enter distance manually.
 */
export function estimateDistanceKm(pickup: string, drop: string): number {
  const a = pickup.trim().toLowerCase();
  const b = drop.trim().toLowerCase();
  if (a.length < 2 || b.length < 2) return DEFAULT_ESTIMATE_DISTANCE_KM;
  if (a === b) return 25;
  return ROUTE_KM[routeKey(a, b)] ?? DEFAULT_ESTIMATE_DISTANCE_KM;
}
