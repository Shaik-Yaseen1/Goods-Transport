"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import clsx from "clsx";
import { formatINR } from "@/lib/fare";
import type { BookingStatus, Owner } from "@prisma/client";

type BookingRow = {
  id: string;
  pickupCity: string;
  dropCity: string;
  weightTons: number;
  distanceKm: number;
  truckType: string;
  goodsType: string;
  fareEstimate: number;
  status: BookingStatus;
  bookingDate: string;
  customerName: string | null;
  customerEmail: string | null;
  ownerId: string | null;
  owner: { id: string; name: string; company: string } | null;
};

const NEXT: Partial<Record<BookingStatus, BookingStatus>> = {
  PENDING: "CONFIRMED",
  AWAITING_OWNER: "CANCELLED",
  CONFIRMED: "CANCELLED",
  DECLINED: "PENDING",
  CANCELLED: "PENDING",
};

const statusStyle: Record<BookingStatus, string> = {
  PENDING: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  AWAITING_OWNER: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  DECLINED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function AdminBookingsTable({
  bookings,
  owners,
}: {
  bookings: BookingRow[];
  owners: Owner[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<"" | BookingStatus>("");

  const filtered = filter ? bookings.filter((b) => b.status === filter) : bookings;

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Failed to update");
    }
  }

  function cycleStatus(b: BookingRow) {
    const next = NEXT[b.status];
    if (!next) return;
    start(async () => {
      try {
        await patch(b.id, { status: next });
        toast.success(`Booking marked ${next.toLowerCase()}`);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function assignOwner(b: BookingRow, ownerId: string) {
    start(async () => {
      try {
        const body: Record<string, unknown> = { ownerId: ownerId || null };
        if (ownerId) body.status = "AWAITING_OWNER";
        await patch(b.id, body);
        toast.success(ownerId ? "Owner assigned — awaiting their response" : "Owner cleared");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bg-ring px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["", "AWAITING_OWNER", "PENDING", "CONFIRMED", "DECLINED", "CANCELLED"] as const).map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setFilter(s)}
              className={clsx(
                "chip",
                filter === s && "chip-accent"
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-mute">{filtered.length} record(s)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-bg-soft/60 text-left text-[11px] uppercase tracking-wider text-ink-mute">
              <Th>Route</Th>
              <Th>Customer</Th>
              <Th>Load</Th>
              <Th>Truck</Th>
              <Th>Fare</Th>
              <Th>Owner</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-ring">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-bg-soft/40">
                <Td>
                  <div className="font-medium text-ink">
                    {b.pickupCity} → {b.dropCity}
                  </div>
                  <div className="text-xs text-ink-dim">
                    {new Date(b.bookingDate).toLocaleDateString()} · {b.distanceKm} km
                  </div>
                </Td>
                <Td>
                  <div className="text-ink">{b.customerName ?? "—"}</div>
                  <div className="text-xs text-ink-dim">{b.customerEmail ?? ""}</div>
                </Td>
                <Td>
                  <div>{b.weightTons} t</div>
                  <div className="text-xs text-ink-dim">{b.goodsType}</div>
                </Td>
                <Td>
                  <span className="chip">{b.truckType}</span>
                </Td>
                <Td>
                  <span className="font-semibold text-accent">
                    {formatINR(b.fareEstimate)}
                  </span>
                </Td>
                <Td>
                  <select
                    className="select max-w-[180px] text-xs"
                    value={b.ownerId ?? ""}
                    onChange={(e) => assignOwner(b, e.target.value)}
                    disabled={pending}
                  >
                    <option value="">Unassigned</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} · {o.company}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <span
                    className={clsx(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                      statusStyle[b.status]
                    )}
                  >
                    {b.status}
                  </span>
                </Td>
                <Td>
                  {NEXT[b.status] && (
                    <button
                      type="button"
                      onClick={() => cycleStatus(b)}
                      className="btn-ghost text-xs"
                      disabled={pending}
                    >
                      → {NEXT[b.status]}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-ink-mute">
                  No bookings to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
