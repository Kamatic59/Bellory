import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getRequiredEnv } from "@/lib/server/env";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const connection = postgres(getRequiredEnv("DATABASE_URL"), {
    max: 10,
    prepare: false,
  });

  return drizzle(connection, { schema });
}

export function getDb() {
  cachedDb ??= createDatabase();
  return cachedDb;
}
