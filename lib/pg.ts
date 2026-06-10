import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Invalid/Missing environment variable: "DATABASE_URL"');
}

const globalForPostgres = globalThis as unknown as {
  operonSql?: postgres.Sql;
};

const sql = globalForPostgres.operonSql ?? postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  transform: postgres.camel,
});

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.operonSql = sql;
}

export default sql;
