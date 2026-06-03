"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import { useSession } from "next-auth/react";
import { toast } from "sonner";
import clsx from "clsx";
import { TRUCKS, TRUCK_ORDER, calculateFare, formatINR } from "@/lib/fare";
import { estimateDistanceKm } from "@/lib/route-distance";
import { getIndianMobileError, normalizeIndianMobile } from "@/lib/phone";
import { GOODS_OPTIONS, POPULAR_CITIES } from "@/lib/constants";
import CityCombobox from "@/components/CityCombobox";
import PhoneInput from "@/components/PhoneInput";
import type { GoodsType, TruckType } from "@prisma/client";

type FormState = {
  pickupCity: string;
  dropCity: string;
  goodsType: GoodsType;
  weightTons: string;
  truckType: TruckType;
  bookingDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function BookingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const prefilledOwnerId = params.get("ownerId") ?? undefined;
  const prefilledCity = params.get("pickupCity") ?? "";
  const prefilledTruck = (params.get("truckType") as TruckType | null) ?? null;

  const [form, setForm] = useState<FormState>({
    pickupCity: prefilledCity,
    dropCity: "",
    goodsType: "CONSTRUCTION",
    weightTons: "5",
    truckType: prefilledTruck && TRUCKS[prefilledTruck] ? prefilledTruck : "HEAVY",
    bookingDate: todayISO(),
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const weightNum = Number(form.weightTons) || 0;
  const estimatedKm = useMemo(
    () => estimateDistanceKm(form.pickupCity, form.dropCity),
    [form.pickupCity, form.dropCity]
  );

  const fare = useMemo(
    () =>
      calculateFare({
        truckType: form.truckType,
        distanceKm: estimatedKm,
        weightTons: weightNum,
      }),
    [form.truckType, estimatedKm, weightNum]
  );

  const truckMeta = TRUCKS[form.truckType];
  const weightInRange =
    weightNum >= truckMeta.minTons && weightNum <= truckMeta.maxTons;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (weightNum < 1) {
      toast.error("Weight must be at least 1 ton");
      return;
    }
    if (form.pickupCity.trim().length < 2) {
      toast.error("Choose a pickup city (min. 2 characters).");
      return;
    }
    if (form.dropCity.trim().length < 2) {
      toast.error("Choose a drop city (min. 2 characters).");
      return;
    }
    if (form.customerName.trim().length < 2) {
      toast.error("Enter your full name.");
      return;
    }
    if (!form.customerEmail.trim()) {
      toast.error("Email is required.");
      return;
    }
    const phoneErr = getIndianMobileError(form.customerPhone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }
    setPhoneError(null);
    const mobile = normalizeIndianMobile(form.customerPhone);
    if (!weightInRange) {
      toast.error(
        `${truckMeta.label} truck supports ${truckMeta.minTons}–${truckMeta.maxTons} tons`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCity: form.pickupCity,
          dropCity: form.dropCity,
          goodsType: form.goodsType,
          weightTons: weightNum,
          truckType: form.truckType,
          bookingDate: new Date(form.bookingDate).toISOString(),
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: mobile,
          ownerId: prefilledOwnerId ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const phoneIssue = data?.issues?.customerPhone?.[0];
        if (phoneIssue) {
          setPhoneError(phoneIssue);
          return;
        }
        const fieldErr =
          data?.issues &&
          (Object.values(data.issues).flat() as string[]).join(", ");
        throw new Error(fieldErr || data?.error || "Booking failed");
      }
      toast.success("Booking received — confirmation on its way.");
      router.push(`/book/success?id=${data.booking.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="card p-6 lg:p-8">
        <h2 className="font-head text-2xl font-bold uppercase tracking-wide">Shipment details</h2>
        <p className="mt-1 text-sm text-ink-mute">
          Fill the load details — fare updates live on the right.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <CityCombobox
                label="Pickup city"
                value={form.pickupCity}
                onChange={(v) => set("pickupCity", v)}
                cities={POPULAR_CITIES}
                required
              />
              <div
                className="hidden items-center justify-center pb-2 text-accent/90 sm:flex"
                title="Route"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                  <path
                    d="M5 12h14m0 0l-4-4m4 4l-4 4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <CityCombobox
                label="Drop city"
                value={form.dropCity}
                onChange={(v) => set("dropCity", v)}
                cities={POPULAR_CITIES}
                required
              />
            </div>
            {form.pickupCity.trim() &&
              form.dropCity.trim() &&
              form.pickupCity.trim().toLowerCase() ===
                form.dropCity.trim().toLowerCase() && (
                <p className="mt-2 text-xs text-amber-300/95">
                  Pickup and drop are the same — confirm if you really mean a local move.
                </p>
              )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Goods type</label>
              <select
                className="select"
                value={form.goodsType}
                onChange={(e) => set("goodsType", e.target.value as GoodsType)}
              >
                {GOODS_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pickup date</label>
              <input
                type="date"
                className="input"
                required
                min={todayISO()}
                value={form.bookingDate}
                onChange={(e) => set("bookingDate", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Weight (tons)</label>
              <input
                type="number"
                className="input"
                required
                min={1}
                step={0.1}
                value={form.weightTons}
                onChange={(e) => set("weightTons", e.target.value)}
              />
              {weightNum > 0 && weightNum < 1 ? (
                <p className="mt-1 text-xs text-rose-300">Minimum 1 ton.</p>
              ) : !weightInRange && weightNum >= 1 ? (
                <p className="mt-1 text-xs text-amber-300">
                  {truckMeta.label} supports {truckMeta.minTons}–{truckMeta.maxTons}t. Pick another truck.
                </p>
              ) : (
                <p className="mt-1 text-xs text-ink-dim">
                  {truckMeta.label} range: {truckMeta.minTons}–{truckMeta.maxTons} tons.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-head text-lg font-bold uppercase tracking-wide">Truck type</h3>
          <p className="mt-1 text-sm text-ink-mute">
            Pick the class that fits your load. Rates include base + per km × weight.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {TRUCK_ORDER.map((t) => {
              const meta = TRUCKS[t];
              const active = form.truckType === t;
              const fits = weightNum >= meta.minTons && weightNum <= meta.maxTons;
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => set("truckType", t)}
                  className={clsx(
                    "rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-accent/70 bg-accent/10 shadow-glow"
                      : "border-bg-ring bg-bg-soft hover:border-accent/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-head text-lg font-bold uppercase">{meta.label}</span>
                    {fits && weightNum > 0 && (
                      <span className="chip-accent">fits load</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-mute">{meta.blurb}</p>
                  <p className="mt-3 text-sm">
                    <span className="text-accent">₹{meta.pkm}</span>
                    <span className="text-ink-mute">/km</span>
                    <span className="text-ink-dim"> · </span>
                    <span className="text-accent">₹{meta.base.toLocaleString("en-IN")}</span>
                    <span className="text-ink-mute"> base</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Your name (required)</label>
            <input
              className="input"
              required
              placeholder="Full name"
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email (required)</label>
            <input
              className="input"
              type="email"
              required
              placeholder="you@company.com"
              value={form.customerEmail}
              onChange={(e) => set("customerEmail", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Mobile number (required)</label>
            <PhoneInput
              value={form.customerPhone}
              onChange={(v) => {
                set("customerPhone", v);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={() => {
                if (form.customerPhone.trim()) {
                  setPhoneError(getIndianMobileError(form.customerPhone));
                }
              }}
              error={!!phoneError}
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? "booking-phone-error" : undefined}
            />
            {phoneError && (
              <p
                id="booking-phone-error"
                className="mt-2 text-sm text-rose-300"
                role="alert"
              >
                {phoneError}
              </p>
            )}
            {!phoneError && (
              <p className="mt-1 text-xs text-ink-dim">
                10-digit number starting with 6, 7, 8, or 9
              </p>
            )}
          </div>
        </div>
      </div>

      <aside className="card sticky top-20 h-fit p-6 lg:p-8">
        <span className="heading-eyebrow">Live fare estimate</span>
        <div className="mt-4">
          <div className="font-head text-5xl font-extrabold text-ink">
            {formatINR(fare.total)}
          </div>
          <p className="mt-1 text-xs text-ink-mute">
            Based on ~{estimatedKm} km route estimate · GST & tolls included.
          </p>
        </div>

        <dl className="mt-6 space-y-2 text-sm">
          <Row label={`Base (${truckMeta.label})`} value={formatINR(fare.base)} />
          <Row
            label={`Distance × pkm × weight (~${estimatedKm} × ₹${truckMeta.pkm} × ${weightNum || 0}t)`}
            value={formatINR(Math.max(0, fare.freight - fare.base))}
          />
          <Row label="GST (18%)" value={formatINR(fare.gst)} />
          <Row
            label={`Toll + fuel (~${estimatedKm} km)`}
            value={formatINR(fare.tolls)}
          />
          <div className="my-2 border-t border-bg-ring" />
          <Row strong label="Total estimate" value={formatINR(fare.total)} />
        </dl>

        {prefilledOwnerId && (
          <p className="mt-5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
            Quote will be routed to your selected owner.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 btn-primary w-full text-base"
        >
          {submitting ? "Booking…" : "Confirm booking"}
        </button>
      </aside>
    </form>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={clsx("text-ink-mute", strong && "font-semibold text-ink")}>
        {label}
      </dt>
      <dd
        className={clsx(
          "tabular-nums",
          strong ? "text-lg font-bold text-accent" : "text-ink"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
