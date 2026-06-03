import Link from "next/link";
import { getHomeStats } from "@/lib/data";
import { TRUCKS, TRUCK_ORDER } from "@/lib/fare";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { ownerCount, bookingCount, cities } = await getHomeStats();

  return (
    <>
      <section className="bg-hero relative overflow-hidden border-b border-bg-ring/60">
        <div className="absolute inset-0 -z-0 bg-dots opacity-40" />
        <div className="container-page relative grid gap-12 py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div>
            <span className="heading-eyebrow">Pan-India · Heavy load specialists</span>
            <h1 className="mt-5 font-head text-5xl font-extrabold uppercase leading-[1.02] tracking-tight md:text-7xl">
              Move <span className="text-accent">heavy</span>.
              <br />
              Move <span className="text-accent">fast</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-mute">
              Heavy Hulk connects shippers with verified medium-truck, heavy-load and trailer fleet
              owners across India. Live fare estimate. Same-day confirmation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/owners" className="btn-primary text-base">
                Book a truck
              </Link>
              <Link href="/owners" className="btn-ghost text-base">
                Browse owners
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-4">
              <Stat value={ownerCount.toString()} label="Verified owners" />
              <Stat value={bookingCount.toString()} label="Bookings handled" />
              <Stat value={cities.length.toString()} label="Operating cities" />
            </dl>
          </div>

          <div className="relative">
            <div className="card relative overflow-hidden p-6">
              <span className="heading-eyebrow">Fare reference</span>
              <p className="mt-2 text-sm text-ink-mute">
                Indicative rates — exact estimate updates live on the booking page.
              </p>
              <div className="mt-5 space-y-3">
                {TRUCK_ORDER.map((t) => {
                  const m = TRUCKS[t];
                  return (
                    <div
                      key={t}
                      className="flex items-center justify-between rounded-xl border border-bg-ring bg-bg-soft px-4 py-3"
                    >
                      <div>
                        <div className="font-head text-lg font-bold uppercase tracking-wide">
                          {m.label}
                        </div>
                        <div className="text-xs text-ink-mute">{m.blurb}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-accent">
                          ₹{m.pkm}
                          <span className="text-ink-mute">/km</span>
                        </div>
                        <div className="font-mono text-xs text-ink-dim">
                          + ₹{m.base.toLocaleString("en-IN")} base
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 text-[11px] text-ink-dim">
                Final fare = (base + km × pkm × weight) × 1.18 GST + ₹4.5/km toll & fuel.
              </p>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 -z-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            title="Live fare engine"
            body="Transparent pricing using a base + distance × pkm × weight formula. GST and toll surcharge included up front."
          />
          <Feature
            title="Verified fleet"
            body="Every owner is IBA / GST registered with traceable fleet records, ratings and specialization tags."
          />
          <Feature
            title="One-click ops"
            body="Admin console to confirm, assign and track each load. Customers get instant email confirmations."
          />
        </div>
      </section>

      <section className="border-t border-bg-ring/70 bg-bg-soft/40">
        <div className="container-page grid gap-8 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <span className="heading-eyebrow">How it works</span>
            <h2 className="mt-3 font-head text-4xl font-extrabold uppercase tracking-tight">
              From quote to wheels-rolling in three steps.
            </h2>
            <ol className="mt-6 space-y-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="font-head grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent text-lg font-bold">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="font-head text-lg font-semibold uppercase tracking-wide">
                      {s.title}
                    </p>
                    <p className="text-sm text-ink-mute">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Link href="/owners" className="btn-primary">
                Start a booking
              </Link>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-head text-xl font-bold uppercase">Coverage hubs</h3>
            <p className="mt-1 text-sm text-ink-mute">
              Active hubs powering most long-haul routes today.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {["Mumbai", "Pune", "Bengaluru", "Chennai", "Delhi", "Hyderabad"].map(
                (c) => (
                  <div
                    key={c}
                    className="rounded-xl border border-bg-ring bg-bg-soft px-3 py-2 text-ink"
                  >
                    {c}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const steps = [
  {
    title: "Tell us the load",
    body: "Pickup, drop, weight, distance, goods type and date. Two minutes max.",
  },
  {
    title: "Pick a truck class",
    body: "Medium, Heavy or Trailer — fare estimate updates instantly as you type.",
  },
  {
    title: "We dispatch + confirm",
    body: "We assign a verified owner from our network and send an email confirmation.",
  },
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-head text-3xl font-extrabold text-accent">{value}</div>
      <div className="text-xs text-ink-mute">{label}</div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="mt-4 font-head text-xl font-bold uppercase tracking-wide">{title}</h3>
      <p className="mt-2 text-sm text-ink-mute">{body}</p>
    </div>
  );
}
