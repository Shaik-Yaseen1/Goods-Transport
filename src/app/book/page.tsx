import { Suspense } from "react";
import BookingForm from "@/components/BookingForm";

export const metadata = {
  title: "Book a Truck · Heavy Hulk",
};

export default function BookPage() {
  return (
    <section className="bg-hero">
      <div className="container-page py-14">
        <div className="mb-10 flex flex-col gap-3">
          <span className="heading-eyebrow w-fit">Booking</span>
          <h1 className="font-head text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
            Move heavy loads, the easy way.
          </h1>
          <p className="max-w-2xl text-ink-mute">
            Tell us about your shipment. The fare estimate updates as you type and you’ll get a
            confirmation email the moment you book.
          </p>
        </div>
        <Suspense
          fallback={<div className="card p-8 text-ink-mute">Loading form…</div>}
        >
          <BookingForm />
        </Suspense>
      </div>
    </section>
  );
}
