import { MongoClient, type Db } from "mongodb";

export const collections = {
  settings: "settings",
  projects: "projects",
  services: "services",
  processSteps: "processSteps",
  experience: "experience",
  stackGroups: "stackGroups",
  testimonials: "testimonials",
  inquiries: "inquiries",
  admins: "admins",
} as const;

// Reused across hot reloads in dev and across calls in one serverless instance.
const globalForMongo = globalThis as unknown as { mongoClient?: Promise<MongoClient> };

function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  // ignoreUndefined: optional fields left undefined are omitted instead of stored as null.
  globalForMongo.mongoClient ??= new MongoClient(uri, { ignoreUndefined: true }).connect();
  return globalForMongo.mongoClient;
}

export async function getDb(): Promise<Db> {
  return (await getClient()).db(process.env.MONGODB_DB || "portfolio");
}

export async function closeDb() {
  const client = globalForMongo.mongoClient;
  globalForMongo.mongoClient = undefined;
  if (client) await (await client).close();
}

/** Called by the seed and admin scripts, and by tests. Safe to run repeatedly. */
export async function ensureIndexes() {
  const db = await getDb();
  await db.collection(collections.projects).createIndex({ slug: 1 }, { unique: true });
  await db.collection(collections.admins).createIndex({ email: 1 }, { unique: true });
  await db.collection(collections.inquiries).createIndex({ status: 1, createdAt: -1 });
}
