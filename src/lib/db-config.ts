/** Resolve Postgres URL from common deploy env names (Vercel Postgres, Neon, etc.). */
export function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    undefined
  );
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Localhost DB URLs cannot work on Vercel — treat as demo mode. */
function isLocalDatabaseUrl(url: string): boolean {
  try {
    return isLocalHost(new URL(url.replace(/^postgres(ql)?:\/\//, "http://")).hostname);
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * Demo mode — no Postgres required (ideal for Vercel without Storage/Neon).
 * Set USE_DEMO_DATA=true to force demo; USE_DEMO_DATA=false to require Postgres.
 */
export function isDemoDataMode(): boolean {
  if (process.env.USE_DEMO_DATA === "true") return true;
  if (process.env.USE_DEMO_DATA === "false") return false;
  const url = resolveDatabaseUrl();
  if (!url) return true;
  if (process.env.VERCEL && isLocalDatabaseUrl(url)) return true;
  return false;
}

/** Canonical site URL for metadata, emails, and NextAuth. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXTAUTH_URL?.trim();
  if (fromEnv) {
    try {
      const parsed = new URL(fromEnv);
      if (!process.env.VERCEL || !isLocalHost(parsed.hostname)) {
        return parsed.origin;
      }
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  return "http://localhost:3000";
}

export function syncDatabaseEnv(): void {
  if (isDemoDataMode()) return;
  const url = resolveDatabaseUrl();
  if (url && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }
}
