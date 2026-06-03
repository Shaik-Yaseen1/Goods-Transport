import type { TruckType } from "@prisma/client";

export type TruckMeta = {
  key: TruckType;
  label: string;
  blurb: string;
  minTons: number;
  maxTons: number;
  pkm: number;
  base: number;
};

export const TRUCKS: Record<TruckType, TruckMeta> = {
  MEDIUM: {
    key: "MEDIUM",
    label: "Medium",
    blurb: "1 – 5 tons · 14ft / 17ft trucks",
    minTons: 1,
    maxTons: 5,
    pkm: 18,
    base: 2000,
  },
  HEAVY: {
    key: "HEAVY",
    label: "Heavy",
    blurb: "5 – 15 tons · 22ft / 24ft trucks",
    minTons: 5,
    maxTons: 15,
    pkm: 28,
    base: 4500,
  },
  TRAILER: {
    key: "TRAILER",
    label: "Trailer",
    blurb: "15 – 40 tons · multi-axle trailers",
    minTons: 15,
    maxTons: 40,
    pkm: 45,
    base: 8000,
  },
};

export const TRUCK_ORDER: TruckType[] = ["MEDIUM", "HEAVY", "TRAILER"];

/**
 * Live fare calculator.
 *
 * total = (base + distance × pkm × weight_multiplier) × 1.18 + distance × 4.5
 *
 * - The 1.18 multiplier rolls 18% GST into the freight charge.
 * - The distance × 4.5 component covers per-km toll + fuel surcharge.
 */
export function calculateFare(input: {
  truckType: TruckType;
  distanceKm: number;
  weightTons: number;
}): {
  base: number;
  freight: number;
  gst: number;
  tolls: number;
  total: number;
} {
  const meta = TRUCKS[input.truckType];
  const distance = Math.max(0, input.distanceKm || 0);
  const weight = Math.max(0, input.weightTons || 0);

  const freightPre = meta.base + distance * meta.pkm * weight;
  const withGst = freightPre * 1.18;
  const tolls = distance * 4.5;
  const total = withGst + tolls;

  return {
    base: meta.base,
    freight: round2(freightPre),
    gst: round2(withGst - freightPre),
    tolls: round2(tolls),
    total: round2(total),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
