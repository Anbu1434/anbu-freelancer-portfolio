import { closeDb, ensureIndexes } from "@/lib/db/client";
import { seedDatabase } from "./seed-core";

async function main() {
  await ensureIndexes();
  const report = await seedDatabase();
  for (const [collection, state] of Object.entries(report)) console.log(`${collection.padEnd(14)} ${state}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
