// MongoDB has been removed from the Next.js layer. All persistence is handled
// through Postgres via lib/pg.ts. This stub exists only to surface a clear
// error if any legacy code still imports the old client.

throw new Error(
  "lib/db.ts no longer exports a MongoDB client — import sql from '@/lib/pg' instead.",
);

export {};
