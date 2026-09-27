import type { ObjectId } from "mongodb";
import { collections, getDb } from "@/lib/db/client";
import { toObjectId } from "@/lib/db/ordered-repo";

type AdminDoc = { _id?: ObjectId; email: string; passwordHash: string; sessionVersion: number };
export type Admin = { id: string; email: string; passwordHash: string; sessionVersion: number };

async function collection() {
  return (await getDb()).collection<AdminDoc>(collections.admins);
}

function toAdmin(doc: AdminDoc & { _id: ObjectId }): Admin {
  return { id: String(doc._id), email: doc.email, passwordHash: doc.passwordHash, sessionVersion: doc.sessionVersion };
}

export async function findAdminByEmail(email: string) {
  const doc = await (await collection()).findOne({ email: email.trim().toLowerCase() });
  return doc ? toAdmin(doc) : null;
}

export async function findAdminById(id: string) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await collection()).findOne({ _id });
  return doc ? toAdmin(doc) : null;
}

/** Creates the admin, or resets the password of an existing one (signing out all sessions). */
export async function upsertAdmin(email: string, passwordHash: string) {
  const doc = await (await collection()).findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { $set: { passwordHash }, $inc: { sessionVersion: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) throw new Error("Failed to save admin.");
  return toAdmin(doc);
}

export async function updatePassword(id: string, passwordHash: string) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await collection()).findOneAndUpdate(
    { _id },
    { $set: { passwordHash }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after" },
  );
  return doc ? doc.sessionVersion : null;
}
