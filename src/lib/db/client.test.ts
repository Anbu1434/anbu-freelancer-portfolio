import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/lib/db/client";

let server: MongoMemoryServer;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
});

afterAll(async () => {
  await closeDb();
  await server.stop();
});

describe("getDb", () => {
  it("recovers after a failed first connection instead of caching the failure", async () => {
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500";
    await expect(getDb()).rejects.toThrow();
    process.env.MONGODB_URI = server.getUri();
    await expect((await getDb()).command({ ping: 1 })).resolves.toMatchObject({ ok: 1 });
  });
});
