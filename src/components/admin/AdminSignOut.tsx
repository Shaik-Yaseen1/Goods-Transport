"use client";

import { signOut } from "next-auth/react";

export default function AdminSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="btn-ghost"
    >
      Sign out
    </button>
  );
}
