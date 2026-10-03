// Bascule le schéma Prisma de SQLite (développement local) vers PostgreSQL (production Render).
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../prisma/schema.prisma", import.meta.url);
const src = readFileSync(file, "utf8");
const out = src.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
if (out === src && !src.includes('provider = "postgresql"')) {
  console.error("Impossible de basculer le schéma vers PostgreSQL.");
  process.exit(1);
}
writeFileSync(file, out);
console.log("Prisma : provider = postgresql");
