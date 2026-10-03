import { execSync } from "node:child_process";

export default function setup() {
  const env = { ...process.env, DATABASE_URL: "file:./test.db" };
  execSync("npx prisma db push --force-reset --skip-generate --accept-data-loss", { env, stdio: "ignore" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "ignore" });
}
