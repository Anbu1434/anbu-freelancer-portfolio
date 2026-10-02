import { hashPassword } from "@/lib/auth/password";
import { upsertAdmin } from "@/lib/db/admins";
import { closeDb, ensureIndexes } from "@/lib/db/client";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !email.includes("@")) throw new Error("Set ADMIN_EMAIL in .env.local.");
  if (password.length < 12) throw new Error("Set ADMIN_PASSWORD (at least 12 characters) in .env.local.");

  await ensureIndexes();
  const admin = await upsertAdmin(email, await hashPassword(password));
  console.log(`Admin ready: ${admin.email}. Existing sessions were signed out.`);
  console.log("You can now remove ADMIN_PASSWORD from .env.local.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
