import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const originsRaw = process.env.CORS_ORIGINS ?? "http://localhost:3000";

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: Number(process.env.PORT ?? "3001"),
  CORS_ORIGINS: originsRaw.split(",").map((s) => s.trim()),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: required("BETTER_AUTH_URL"),
  MIGRATE_PASSWORD: required("MIGRATE_PASSWORD"),
} as const;
