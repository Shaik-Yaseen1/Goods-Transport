import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
// import { formatINR } from "@/lib/fare";
// import AdminBookingsTable from "@/components/admin/AdminBookingsTable";
// import AdminOwnersPanel from "@/components/admin/AdminOwnersPanel";
import AdminSignOut from "@/components/admin/AdminSignOut";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Heavy Hulk" };

type Tab = "bookings" | "owners";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login?callbackUrl=/admin");
  }

  const tab: Tab = searchParams.tab === "owners" ? "owners" : "bookings";

  const [bookings, owners, stats] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, company: true } },
      },
    }),
    prisma.owner.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { fareEstimate: true },
    }),
  ]);

  const totalRevenue = stats.reduce(
    (acc, s) => acc + (s._sum.fareEstimate ?? 0),
    0
  );
  const counts = {
    AWAITING_OWNER:
      stats.find((s) => s.status === "AWAITING_OWNER")?._count._all ?? 0,
    PENDING: stats.find((s) => s.status === "PENDING")?._count._all ?? 0,
    CONFIRMED: stats.find((s) => s.status === "CONFIRMED")?._count._all ?? 0,
    CANCELLED:
      (stats.find((s) => s.status === "CANCELLED")?._count._all ?? 0) +
      (stats.find((s) => s.status === "DECLINED")?._count._all ?? 0),
  };

  return (
    <section>
      <div className="container-page py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="heading-eyebrow">Admin</span>
            <h1 className="mt-2 font-head text-4xl font-extrabold uppercase">
              Operations dashboard
            </h1>
            <p className="text-sm text-ink-mute">
              Signed in as <span className="text-ink">{session.user?.email}</span>
            </p>
          </div>
          <AdminSignOut />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total bookings" value={bookings.length.toString()} />
          <Stat label="Awaiting owner" value={counts.AWAITING_OWNER.toString()} accent />
          <Stat label="Confirmed" value={counts.CONFIRMED.toString()} />
          <Stat label="Gross fare" value={formatINR(totalRevenue)} />
        </div>

        <div className="mt-10 flex gap-2 border-b border-bg-ring">
          <TabLink href="/admin?tab=bookings" active={tab === "bookings"}>
            Bookings
          </TabLink>
          <TabLink href="/admin?tab=owners" active={tab === "owners"}>
            Fleet Owners
          </TabLink>
        </div>

        <div className="mt-6">
          {tab === "bookings" ? (
            <AdminBookingsTable bookings={JSON.parse(JSON.stringify(bookings))} owners={JSON.parse(JSON.stringify(owners))} />
          ) : (
            <AdminOwnersPanel owners={JSON.parse(JSON.stringify(owners))} />
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
        {label}
      </div>
      <div
        className={`mt-2 font-head text-3xl font-bold tabular-nums ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-ink-mute hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
