import Link from "next/link";
import type { Owner } from "@prisma/client";

export default function OwnerCard({ owner }: { owner: Owner }) {
  const initials = owner.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="card flex h-full flex-col p-6 transition hover:border-accent/40">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 font-head text-lg font-bold text-accent">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-head text-xl font-bold uppercase tracking-wide">
            {owner.name}
          </h3>
          <p className="truncate text-sm text-ink-mute">{owner.company}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-bg-soft px-2 py-1 text-xs font-semibold text-amber-300">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01z" />
          </svg>
          {owner.rating.toFixed(1)}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Field label="Base city" value={owner.baseCity} />
        <Field label="Fleet" value={`${owner.fleet} trucks`} />
        <Field
          label="Phone"
          value={<a href={`tel:${owner.phone}`} className="hover:text-accent">{owner.phone}</a>}
        />
        <Field
          label="Email"
          value={
            <a
              href={`mailto:${owner.email}`}
              className="truncate text-ink hover:text-accent"
            >
              {owner.email}
            </a>
          }
        />
      </dl>

      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
          Truck classes
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {owner.truckTypes.map((t) => (
            <span key={t} className="chip-accent">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
          Specializations
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {owner.specializations.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Link
          href={{
            pathname: "/book",
            query: {
              ownerId: owner.id,
              pickupCity: owner.baseCity,
              truckType: owner.truckTypes[0],
            },
          }}
          className="btn-primary w-full"
        >
          Request quote
        </Link>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
        {label}
      </div>
      <div className="mt-0.5 truncate text-ink">{value}</div>
    </div>
  );
}
