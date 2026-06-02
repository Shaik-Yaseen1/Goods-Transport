"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setBusy(false);
    if (!res || res.error) {
      toast.error("Invalid email or password.");
      return;
    }
    toast.success("Welcome back, admin.");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <section className="bg-hero">
      <div className="container-page grid min-h-[80vh] place-items-center py-14">
        <form
          onSubmit={onSubmit}
          className="card w-full max-w-md p-8"
        >
          <span className="heading-eyebrow">Admin sign-in</span>
          <h1 className="mt-3 font-head text-3xl font-extrabold uppercase">
            Operations console
          </h1>
          <p className="mt-1 text-sm text-ink-mute">
            Manage bookings, fleet owners and fare rules.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          <button className="btn-primary mt-6 w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="mt-4 text-center text-xs text-ink-dim">
            Use <span className="font-mono">ADMIN_EMAIL</span> and{" "}
            <span className="font-mono">ADMIN_PASSWORD</span> from your{" "}
            <span className="font-mono">.env</span> file. After changing them, run{" "}
            <span className="font-mono">npm run db:seed</span> to sync the database.
          </p>
        </form>
      </div>
    </section>
  );
}
