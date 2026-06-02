import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/fare";
import { isPlaceholderEmail } from "@/lib/user-email";
import SaveBookingToHistory from "@/components/SaveBookingToHistory";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  if (!searchParams?.id) notFound();
  const booking = await prisma.booking.findUnique({
    where: { id: searchParams.id },
  });
  if (!booking) notFound();

  return (
    <section className="bg-hero">
      <SaveBookingToHistory
        bookingId={booking.id}
        email={booking.customerEmail}
      />
      <div className="container-page max-w-3xl py-20">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <path
                d="M5 12l5 5L20 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-4 font-head text-3xl font-extrabold uppercase">Booking received</h1>
          <p className="mt-2 text-ink-mute">
            Reference{" "}
            <span className="font-mono text-ink">
              {booking.id.slice(-8).toUpperCase()}
            </span>
            .
            {booking.customerEmail &&
            !isPlaceholderEmail(booking.customerEmail)
              ? " A confirmation has been sent to your email."
              : " View this trip anytime under My bookings."}
          </p>

          <dl className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <Field label="Route" value={`${booking.pickupCity} → ${booking.dropCity}`} />
            <Field label="Truck" value={booking.truckType} />
            <Field label="Load" value={`${booking.weightTons} tons`} />
            <Field
              label="Date"
              value={new Date(booking.bookingDate).toDateString()}
            />
            <Field label="Status" value={booking.status} />
            <Field
              label="Estimate"
              value={formatINR(booking.fareEstimate)}
              highlight
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-bg-ring bg-bg-soft px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
        {label}
      </dt>
      <dd
        className={
          highlight
            ? "mt-1 text-lg font-bold text-accent"
            : "mt-1 text-sm text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}
