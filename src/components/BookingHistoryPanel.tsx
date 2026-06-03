"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { formatINR } from "@/lib/fare";
import {
  clearBookingHistory,
  loadBookingHistory,
  saveBookingsToHistory,
} from "@/lib/booking-history";
import type { BookingStatus } from "@prisma/client";

export type HistoryBooking = {
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
  customerEmail?: string | null;
  owner: { name: string; company: string } | null;
};

const statusStyle: Record<BookingStatus, string> = {
  PENDING: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  AWAITING_OWNER: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  DECLINED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function statusLabel(status: BookingStatus) {
  return status.replace(/_/g, " ");
}

export default function BookingHistoryPanel() {
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get("email");
  const urlHandled = useRef(false);

  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<HistoryBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (opts: { email?: string; ids?: string[] }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (opts.email) params.set("email", opts.email);
      if (opts.ids?.length) params.set("ids", opts.ids.join(","));
      const res = await fetch(`/api/bookings/history?${params}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not load bookings");
      }
      const list = data.bookings ?? [];
      setBookings(list);
      setSearched(true);
      if (opts.email && list.length > 0) {
        saveBookingsToHistory(
          opts.email,
          list.map((b: HistoryBooking) => b.id)
        );
      }
    } catch (e) {
      setError((e as Error).message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlEmail?.trim() && !urlHandled.current) {
      urlHandled.current = true;
      const trimmed = urlEmail.trim();
      setEmail(trimmed);
      void fetchBookings({ email: trimmed });
      return;
    }
    const stored = loadBookingHistory();
    if (stored?.email) {
      setEmail(stored.email);
      if (stored.bookingIds.length > 0) {
        void fetchBookings({ ids: stored.bookingIds });
      }
    }
  }, [fetchBookings, urlEmail]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter the email you used when booking.");
      return;
    }
    void fetchBookings({ email: trimmed });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSearch} className="card p-6">
        <h2 className="font-head text-xl font-bold uppercase tracking-wide">
          Find your bookings
        </h2>
        <p className="mt-1 text-sm text-ink-mute">
          Enter the same email you used on the booking form.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="label">Your email</span>
            <input
              type="email"
              className="input"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary sm:mb-0.5" disabled={loading}>
            {loading ? "Loading…" : "View history"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-rose-300" role="alert">
            {error}
          </p>
        )}
      </form>

      {searched && !loading && bookings.length === 0 && !error && (
        <div className="card p-10 text-center">
          <p className="font-head text-xl font-bold uppercase">No bookings found</p>
          <p className="mt-2 text-sm text-ink-mute">
            No trips are saved for this email yet.
          </p>
          <Link href="/owners" className="btn-primary mt-6 inline-flex">
            Book a truck
          </Link>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-mute">
              {bookings.length} booking{bookings.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => {
                clearBookingHistory();
                setBookings([]);
                setSearched(false);
                setEmail("");
              }}
            >
              Clear saved device history
            </button>
          </div>
          <ul className="grid gap-4">
            {bookings.map((b) => (
              <li key={b.id}>
                <article className="card p-5 transition hover:border-accent/30">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-head text-lg font-bold uppercase text-ink">
                        {b.pickupCity} → {b.dropCity}
                      </p>
                      <p className="mt-1 font-mono text-xs text-ink-dim">
                        Ref {b.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                        statusStyle[b.status]
                      )}
                    >
                      {statusLabel(b.status)}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <HistoryField
                      label="Pickup date"
                      value={new Date(b.bookingDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    />
                    <HistoryField label="Truck" value={b.truckType} />
                    <HistoryField label="Load" value={`${b.weightTons} t · ${b.goodsType}`} />
                    <HistoryField label="Estimate" value={formatINR(b.fareEstimate)} accent />
                  </dl>
                  {b.owner && (
                    <p className="mt-3 text-xs text-ink-mute">
                      Assigned: {b.owner.name} · {b.owner.company}
                    </p>
                  )}
                  <p className="mt-3 text-[11px] text-ink-dim">
                    Booked {new Date(b.createdAt).toLocaleString("en-IN")}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HistoryField({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-bg-ring bg-bg-soft px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
        {label}
      </dt>
      <dd className={clsx("mt-0.5 font-medium", accent ? "text-accent" : "text-ink")}>
        {value}
      </dd>
    </div>
  );
}
