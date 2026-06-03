import { Suspense } from "react";
import BookingHistoryPanel from "@/components/BookingHistoryPanel";

export const metadata = {
  title: "My Bookings · Heavy Hulk",
};

export default function HistoryPage() {
  return (
    <section className="bg-hero">
      <div className="container-page py-14">
        <div className="mb-8 flex flex-col gap-3">
          <span className="heading-eyebrow w-fit">History</span>
          <h1 className="font-head text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
            Your booking history
          </h1>
          <p className="max-w-2xl text-ink-mute">
            Search by the email you used when booking.
          </p>
        </div>
        <Suspense
          fallback={<div className="card p-8 text-ink-mute">Loading history…</div>}
        >
          <BookingHistoryPanel />
        </Suspense>
      </div>
    </section>
  );
}
