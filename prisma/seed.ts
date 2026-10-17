import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { seedDemo } from "./seed-demo";

try {
  process.loadEnvFile(".env");
} catch {
  // no .env file: rely on the real environment
}

const db = new PrismaClient();

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and set it before seeding.`);
  }
  return value;
}

async function main() {
  const adminEmail = required("ADMIN_EMAIL").trim().toLowerCase();
  const adminPassword = required("ADMIN_PASSWORD");
  if (adminPassword.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");

  await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hashPassword(adminPassword), active: true, role: "ADMIN" },
    create: { email: adminEmail, name: "إدارة المدرسة", role: "ADMIN", passwordHash: hashPassword(adminPassword) },
  });
  console.log(`Admin account ready: ${adminEmail}`);

  if (process.env.SEED_DEMO === "false") {
    console.log("SEED_DEMO=false - demo data skipped.");
    return;
  }
  if ((await db.student.count()) > 0) {
    console.log("Demo data already present - run `npm run db:reset` to rebuild it.");
    return;
  }
  const demoPassword = required("DEMO_PASSWORD");
  if (demoPassword.length < 10) throw new Error("DEMO_PASSWORD must be at least 10 characters.");
  await seedDemo(db, hashPassword(demoPassword));
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
