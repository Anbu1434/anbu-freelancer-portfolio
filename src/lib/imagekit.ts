import { createHmac, randomUUID } from "node:crypto";
import type { ImageRef } from "@/lib/db/schemas";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

/** Short-lived signature that lets the admin's browser upload straight to ImageKit. */
export function getUploadAuth(now = Date.now()) {
  const token = randomUUID();
  const expire = Math.floor(now / 1000) + 600;
  const signature = createHmac("sha1", env("IMAGEKIT_PRIVATE_KEY")).update(token + expire).digest("hex");
  return { token, expire, signature, publicKey: env("IMAGEKIT_PUBLIC_KEY") };
}

/** Best effort: a failed delete leaves an orphaned file, never a failed save. */
export async function deleteImage(fileId: string) {
  try {
    const auth = Buffer.from(`${env("IMAGEKIT_PRIVATE_KEY")}:`).toString("base64");
    const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!response.ok && response.status !== 404) console.error("[imagekit] Delete failed", fileId, response.status);
  } catch (error) {
    console.error("[imagekit] Delete failed", fileId, error);
  }
}

export async function deleteReplacedImages(before: (ImageRef | undefined)[], after: (ImageRef | undefined)[]) {
  const kept = new Set(after.filter(Boolean).map((image) => image!.fileId));
  const removed = before.filter((image): image is ImageRef => Boolean(image) && !kept.has(image!.fileId));
  await Promise.all(removed.map((image) => deleteImage(image.fileId)));
}
