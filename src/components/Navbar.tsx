"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
// import UserAuthNav from "./UserAuthNav"; // customer login disabled
import clsx from "clsx";

const links = [
  { href: "/", label: "Home" },
  { href: "/owners", label: "Owners" },
  { href: "/history", label: "My Bookings" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-bg-ring/70 bg-bg/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-ink-mute hover:bg-bg-soft hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {/* <UserAuthNav /> */}
          <Link href="/owners" className="btn-primary hidden sm:inline-flex">
            Book now
          </Link>
        </div>
      </div>
    </header>
  );
}
