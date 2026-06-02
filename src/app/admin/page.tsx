import Link from "next/link";
import AdminSignOut from "@/components/admin/AdminSignOut";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Heavy Hulk",
};

export default function AdminPage() {
  return (
    <section>
      <div className="container-page py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="heading-eyebrow">Admin</span>
            <h1 className="mt-2 font-head text-4xl font-extrabold uppercase">
              Operations Dashboard
            </h1>
            <p className="text-sm text-ink-mute">
              Authentication is currently under development.
            </p>
          </div>

          <AdminSignOut />
        </div>

        <div className="mt-8 card p-6">
          <h2 className="text-xl font-bold">Coming Soon</h2>
          <p className="mt-2 text-ink-mute">
            Admin authentication, booking management, owner management,
            analytics, and reporting features are currently being implemented.
          </p>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="rounded-lg bg-accent px-4 py-2 text-white"
          >
            Go to Home
          </Link>

          <Link
            href="/admin/login"
            className="rounded-lg border px-4 py-2"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </section>
  );
}
