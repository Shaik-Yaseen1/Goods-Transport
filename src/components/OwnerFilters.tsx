"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TRUCKS, TRUCK_ORDER } from "@/lib/fare";
import clsx from "clsx";

const CITIES = ["Mumbai", "Pune", "Bengaluru", "Chennai", "Delhi", "Hyderabad"];

export default function OwnerFilters({
  cities = CITIES,
}: {
  cities?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const city = params.get("city");
  const truckType = params.get("truckType");

  function setParam(key: "city" | "truckType", value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="card flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex-1">
        <div className="label">Filter by city</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParam("city", null)}
            className={clsx("chip", !city && "chip-accent")}
          >
            All cities
          </button>
          {cities.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setParam("city", c)}
              className={clsx(
                "chip",
                city?.toLowerCase() === c.toLowerCase() && "chip-accent"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 lg:max-w-md">
        <div className="label">Filter by truck type</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParam("truckType", null)}
            className={clsx("chip", !truckType && "chip-accent")}
          >
            All trucks
          </button>
          {TRUCK_ORDER.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setParam("truckType", t)}
              className={clsx("chip", truckType === t && "chip-accent")}
            >
              {TRUCKS[t].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
