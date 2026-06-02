import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-bg-ring/70 bg-bg-soft/40">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-ink-mute">
            Heavy load transport, booked in minutes. Pan-India fleet of medium trucks,
            heavy carriers and multi-axle trailers.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink">Services</h4>
          <ul className="space-y-2 text-sm text-ink-mute">
            <li>Medium load (1 – 5t)</li>
            <li>Heavy load (5 – 15t)</li>
            <li>Trailer / ODC (15 – 40t)</li>
            <li>Port drayage</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink">Coverage</h4>
          <ul className="space-y-2 text-sm text-ink-mute">
            <li>Mumbai · Pune · Ahmedabad</li>
            <li>Delhi · Jaipur · Lucknow</li>
            <li>Bengaluru · Chennai · Hyderabad</li>
            <li>Kolkata · Nagpur · Indore</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink">Contact</h4>
          <ul className="space-y-2 text-sm text-ink-mute">
            <li>1800-HEAVYHAUL</li>
            <li>ops@heavyhulk.in</li>
            <li>Mumbai, India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-bg-ring/70 py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-ink-dim sm:flex-row">
          <p>© {new Date().getFullYear()} Heavy Hulk Logistics Pvt. Ltd. All rights reserved.</p>
          <p>GST · MSME · IBA registered carriers</p>
        </div>
      </div>
    </footer>
  );
}
