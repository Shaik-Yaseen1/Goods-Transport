import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient, TruckType } from "@prisma/client";
import bcrypt from "bcryptjs";

/** `tsx prisma/seed.ts` does not load `.env` automatically — read it here. */
function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@heavyhulk.in";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe!2026";
  const ownerPassword = process.env.OWNER_PASSWORD ?? "1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: "Heavy Hulk Admin" },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Heavy Hulk Admin",
      role: "ADMIN",
    },
  });

  // Remove legacy admin rows from before rebrand / email changes
  await prisma.user.deleteMany({
    where: { role: "ADMIN", email: { not: adminEmail } },
  });

  const owner = {
    name: "Rajesh Kulkarni",
    company: "Sahyadri Logistics Pvt. Ltd.",
    phone: "+91 98203 41122",
    email: "rajesh@sahyadrilogistics.in",
    baseCity: "Mumbai",
    fleet: 42,
    rating: 4.8,
    specializations: ["Containers", "Port Drayage", "Steel Coils"],
    truckTypes: ["HEAVY", "TRAILER"] as TruckType[],
  };

  await prisma.owner.deleteMany({
    where: { email: { not: owner.email } },
  });

  const owners = [owner];

  for (const o of owners) {
    await prisma.owner.upsert({
      where: { email: o.email },
      update: {
        name: o.name,
        company: o.company,
        phone: o.phone,
        baseCity: o.baseCity,
        fleet: o.fleet,
        rating: o.rating,
        passwordHash: ownerPasswordHash,
        specializations: { set: o.specializations },
        truckTypes: { set: o.truckTypes },
      },
      create: { ...o, passwordHash: ownerPasswordHash },
    });
  }

  console.log(
    `Seeded ${owners.length} owner(s) and admin (${adminEmail}). Fleet login: ${owners[0].email}`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
