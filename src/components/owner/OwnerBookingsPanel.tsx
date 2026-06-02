"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import clsx from "clsx";
import { formatINR } from "@/lib/fare";
import { formatIndianMobile } from "@/lib/phone";
import type { BookingStatus } from "@prisma/client";

export type OwnerBookingRow = {
  id: string;
  pickupCity: string;
  dropCity: string;
  goodsType: string;
  weightTons: number;
  truckType: string;
  fareEstimate: number;
  bookingDate: string;
  status: BookingStatus;
  createdAt: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
};

const statusStyle: Record<BookingStatus, string> = {
  PENDING: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  AWAITING_OWNER: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  DECLINED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function OwnerBookingsPanel() {
  const router = useRouter();
  const [bookings, setBookings] = useState<OwnerBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setBookings(data.bookings ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/owner/bookings/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(action === "accept" ? "Booking accepted" : "Booking declined");
      router.refresh();
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = bookings.filter((b) => b.status === "AWAITING_OWNER");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting your response" value={pending.length} accent />
        <Stat
          label="Confirmed"
          value={bookings.filter((b) => b.status === "CONFIRMED").length}
        />
        <Stat
          label="Declined"
          value={bookings.filter((b) => b.status === "DECLINED").length}
        />
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-mute">Loading requests…</div>
      ) : pending.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-head text-xl font-bold uppercase">No pending requests</p>
          <p className="mt-2 text-sm text-ink-mute">
            New customer bookings assigned to you will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {pending.map((b) => (
            <li key={b.id}>
              <article className="card border-accent/20 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="heading-eyebrow">New request</span>
                    <h3 className="mt-2 font-head text-2xl font-bold uppercase">
                      {b.pickupCity} → {b.dropCity}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-ink-dim">
                      Ref {b.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase",
                      statusStyle[b.status]
                    )}
                  >
                    Needs response
                  </span>
                </div>

                <RouteAndCustomer booking={b} className="mt-5" />

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Mini
                    label="Pickup date"
                    value={new Date(b.bookingDate).toLocaleDateString("en-IN")}
                  />
                  <Mini label="Truck" value={b.truckType} />
                  <Mini label="Load" value={`${b.weightTons} t · ${b.goodsType}`} />
                  <Mini label="Estimate" value={formatINR(b.fareEstimate)} accent />
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busyId === b.id}
                    onClick={() => respond(b.id, "accept")}
                  >
                    {busyId === b.id ? "…" : "Accept"}
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={busyId === b.id}
                    onClick={() => respond(b.id, "decline")}
                  >
                    Decline
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {bookings.some((b) => b.status !== "AWAITING_OWNER") && (
        <div>
          <h2 className="font-head text-lg font-bold uppercase tracking-wide">
            Past requests
          </h2>
          <ul className="mt-4 space-y-3">
            {bookings
              .filter((b) => b.status !== "AWAITING_OWNER")
              .map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-bg-ring bg-bg-soft/60 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-medium text-ink">
                      {b.pickupCity} → {b.dropCity}
                    </span>
                    <span
                      className={clsx(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        statusStyle[b.status]
                      )}
                    >
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                  {b.status === "CONFIRMED" && (
                    <p className="mt-1 text-xs text-ink-dim">
                      {b.customerName ?? "—"}
                      {b.customerPhone
                        ? ` · ${formatIndianMobile(b.customerPhone)}`
                        : ""}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RouteAndCustomer({
  booking: b,
  className,
}: {
  booking: OwnerBookingRow;
  className?: string;
}) {
  return (
    <div className={clsx("grid gap-4 sm:grid-cols-2", className)}>
      <div className="rounded-xl border border-bg-ring bg-bg-soft p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
          Route
        </p>
        <p className="mt-2 text-sm text-ink">
          <span className="text-ink-mute">Pickup:</span> {b.pickupCity}
        </p>
        <p className="text-sm text-ink">
          <span className="text-ink-mute">Drop:</span> {b.dropCity}
        </p>
      </div>
      <div className="rounded-xl border border-bg-ring bg-bg-soft p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
          Customer
        </p>
        <p className="mt-2 font-semibold text-ink">{b.customerName ?? "—"}</p>
        {b.customerPhone && (
          <a
            href={`tel:+91${b.customerPhone}`}
            className="mt-1 block text-sm text-accent hover:underline"
          >
            {formatIndianMobile(b.customerPhone)}
          </a>
        )}
        <p className="text-sm text-ink-mute">{b.customerEmail}</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
        {label}
      </div>
      <div
        className={clsx(
          "mt-2 font-head text-3xl font-bold",
          accent ? "text-accent" : "text-ink"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase text-ink-mute">{label}</dt>
      <dd className={clsx("mt-0.5 font-medium", accent ? "text-accent" : "text-ink")}>
        {value}
      </dd>
    </div>
  );
}
