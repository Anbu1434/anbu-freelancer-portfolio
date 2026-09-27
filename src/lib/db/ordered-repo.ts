import { ObjectId, type Document, type Filter } from "mongodb";
import { getDb } from "@/lib/db/client";

export type Stored<T> = T & { id: string; sortOrder: number; createdAt: string; updatedAt: string };

export function toObjectId(id: string) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null;
}

export function toStored<T>(doc: Document): Stored<T> {
  const { _id, createdAt, updatedAt, ...rest } = doc;
  return {
    ...(rest as T & { sortOrder: number }),
    id: String(_id),
    createdAt: (createdAt as Date).toISOString(),
    updatedAt: (updatedAt as Date).toISOString(),
  };
}

/** CRUD plus manual ordering for a collection whose documents carry a numeric `sortOrder`. */
export function createOrderedRepo<T extends object>(name: string) {
  const collection = async () => (await getDb()).collection(name);

  return {
    async list(filter: Filter<Document> = {}) {
      const docs = await (await collection()).find(filter).sort({ sortOrder: 1 }).toArray();
      return docs.map((doc) => toStored<T>(doc));
    },

    async get(id: string) {
      const _id = toObjectId(id);
      if (!_id) return null;
      const doc = await (await collection()).findOne({ _id });
      return doc ? toStored<T>(doc) : null;
    },

    async findOne(filter: Filter<Document>) {
      const doc = await (await collection()).findOne(filter);
      return doc ? toStored<T>(doc) : null;
    },

    async count() {
      return (await collection()).countDocuments();
    },

    async create(data: T) {
      const col = await collection();
      const last = await col.find().sort({ sortOrder: -1 }).limit(1).next();
      const now = new Date();
      const result = await col.insertOne({
        ...data,
        sortOrder: last ? (last.sortOrder as number) + 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
      return String(result.insertedId);
    },

    /** Replaces the document so cleared optional fields are removed, keeping order and createdAt. */
    async update(id: string, data: T) {
      const _id = toObjectId(id);
      if (!_id) return null;
      const col = await collection();
      const existing = await col.findOne({ _id });
      if (!existing) return null;
      const replacement = { ...data, sortOrder: existing.sortOrder, createdAt: existing.createdAt, updatedAt: new Date() };
      await col.replaceOne({ _id }, replacement);
      return { before: toStored<T>(existing), after: toStored<T>({ _id, ...replacement }) };
    },

    async patch(id: string, fields: Partial<T>) {
      const _id = toObjectId(id);
      if (!_id) return false;
      const result = await (await collection()).updateOne({ _id }, { $set: { ...fields, updatedAt: new Date() } });
      return result.matchedCount === 1;
    },

    async remove(id: string) {
      const _id = toObjectId(id);
      if (!_id) return null;
      const doc = await (await collection()).findOneAndDelete({ _id });
      return doc ? toStored<T>(doc) : null;
    },

    /** Swaps sortOrder with the neighbouring document. Returns false at either end. */
    async move(id: string, direction: "up" | "down") {
      const _id = toObjectId(id);
      if (!_id) return false;
      const col = await collection();
      const doc = await col.findOne({ _id });
      if (!doc) return false;
      const neighbour = await col
        .find(direction === "up" ? { sortOrder: { $lt: doc.sortOrder } } : { sortOrder: { $gt: doc.sortOrder } })
        .sort({ sortOrder: direction === "up" ? -1 : 1 })
        .limit(1)
        .next();
      if (!neighbour) return false;
      await col.bulkWrite([
        { updateOne: { filter: { _id: doc._id }, update: { $set: { sortOrder: neighbour.sortOrder } } } },
        { updateOne: { filter: { _id: neighbour._id }, update: { $set: { sortOrder: doc.sortOrder } } } },
      ]);
      return true;
    },
  };
}

export type OrderedRepo<T extends object> = ReturnType<typeof createOrderedRepo<T>>;
