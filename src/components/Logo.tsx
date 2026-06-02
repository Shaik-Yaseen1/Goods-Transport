import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg" ? "h-10 w-10 text-xl" : size === "sm" ? "h-7 w-7 text-sm" : "h-9 w-9 text-base";
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span
        className={`${dim} relative inline-flex items-center justify-center rounded-xl bg-accent text-bg shadow-glow`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2">
          <path
            d="M2 7h11v8H2zM13 10h5l3 3v2h-8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="17" r="1.6" fill="currentColor" />
          <circle cx="17" cy="17" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <span
        className={`font-head font-extrabold uppercase tracking-[0.06em] ${text} text-ink`}
      >
        Heavy <span className="text-accent">Hulk</span>
      </span>
    </Link>
  );
}
