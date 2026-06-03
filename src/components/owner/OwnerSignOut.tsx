"use client";

import { signOut } from "next-auth/react";

export default function OwnerSignOut() {
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
