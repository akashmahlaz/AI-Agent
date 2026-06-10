// MongoDB has been removed from the Next.js layer. All persistence is handled
// through Postgres via lib/pg.ts. This stub exists only to surface a clear
// error if any legacy code still imports the old collection getters.

throw new Error(
  "lib/db-collections.ts no longer exists — query Postgres directly via sql from '@/lib/pg' (or import the typed service modules under lib/services/*).",
);

export {};
