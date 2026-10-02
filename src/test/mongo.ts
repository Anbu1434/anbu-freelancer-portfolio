import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { closeDb, ensureIndexes, getDb } from "@/lib/db/client";

/** Starts one in-memory MongoDB per test file and empties it before each test. */
export function setupTestDb() {
  let server: MongoMemoryServer;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    process.env.MONGODB_URI = server.getUri();
    process.env.MONGODB_DB = "test";
  });

  beforeEach(async () => {
    await (await getDb()).dropDatabase();
    await ensureIndexes();
  });

  afterAll(async () => {
    await closeDb();
    await server.stop();
  });
}
