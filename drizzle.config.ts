import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined. Please set it in .env.local or your environment.");
}

const isRemoteOrSsl =
  connectionString.includes("supabase.com") ||
  connectionString.includes("pooler.supabase.com") ||
  connectionString.includes("sslmode=require") ||
  connectionString.includes("sslmode=no-verify") ||
  process.env.NODE_ENV === "production";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: connectionString,
    ssl: isRemoteOrSsl ? { rejectUnauthorized: false } : undefined,
  },
});
