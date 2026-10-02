import type { ObjectId } from "mongodb";
import { collections, getDb } from "@/lib/db/client";
import { toObjectId } from "@/lib/db/ordered-repo";
import type { InquiryStatus } from "@/lib/db/schemas";
import type { InquiryValues } from "@/lib/inquiry";

type ReplyDoc = { subject: string; body: string; sentAt: Date; delivered: boolean };
type InquiryDoc = InquiryValues & {
  _id?: ObjectId;
  status: InquiryStatus;
  emailFailed: boolean;
  replies: ReplyDoc[];
  createdAt: Date;
};

export type InquiryReply = Omit<ReplyDoc, "sentAt"> & { sentAt: string };
export type Inquiry = InquiryValues & {
  id: string;
  status: InquiryStatus;
  emailFailed: boolean;
  replies: InquiryReply[];
  createdAt: string;
};

async function collection() {
  return (await getDb()).collection<InquiryDoc>(collections.inquiries);
}

function toInquiry(doc: InquiryDoc & { _id: ObjectId }): Inquiry {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    services: doc.services,
    businessDetails: doc.businessDetails,
    status: doc.status,
    emailFailed: doc.emailFailed,
    replies: doc.replies.map((reply) => ({ ...reply, sentAt: reply.sentAt.toISOString() })),
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createInquiry(values: InquiryValues) {
  const result = await (await collection()).insertOne({
    ...values,
    status: "new",
    emailFailed: false,
    replies: [],
    createdAt: new Date(),
  });
  return String(result.insertedId);
}

export async function listInquiries(status?: InquiryStatus) {
  const docs = await (await collection()).find(status ? { status } : {}).sort({ createdAt: -1, _id: -1 }).toArray();
  return docs.map(toInquiry);
}

export async function getInquiry(id: string) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await collection()).findOne({ _id });
  return doc ? toInquiry(doc) : null;
}

export async function countInquiries(status?: InquiryStatus) {
  return (await collection()).countDocuments(status ? { status } : {});
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const _id = toObjectId(id);
  if (!_id) return false;
  return (await (await collection()).updateOne({ _id }, { $set: { status } })).matchedCount === 1;
}

export async function markEmailFailed(id: string) {
  const _id = toObjectId(id);
  if (_id) await (await collection()).updateOne({ _id }, { $set: { emailFailed: true } });
}

export async function addReply(id: string, reply: { subject: string; body: string; delivered: boolean }) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const result = await (await collection()).updateOne(
    { _id },
    {
      $push: { replies: { ...reply, sentAt: new Date() } },
      ...(reply.delivered && { $set: { status: "replied" as const } }),
    },
  );
  return result.matchedCount === 1;
}
