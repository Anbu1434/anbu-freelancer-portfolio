"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageFolder } from "@/components/admin/field-configs";
import type { ImageRef } from "@/lib/db/schemas";

const MAX_BYTES = 5 * 1024 * 1024;

type Props = { id: string; folder: ImageFolder; value: ImageRef | undefined; onChange: (value: ImageRef | undefined) => void };

/** Uploads straight from the browser to ImageKit using a short-lived signature from our server. */
export function ImageField({ id, folder, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > MAX_BYTES) return setError("Images must be 5 MB or smaller.");

    setUploading(true);
    try {
      const authResponse = await fetch("/api/admin/imagekit-auth", { cache: "no-store" });
      if (!authResponse.ok) throw new Error("Your session expired. Sign in again to upload.");
      const auth = (await authResponse.json()) as { token: string; expire: number; signature: string; publicKey: string };

      const body = new FormData();
      body.append("file", file);
      body.append("fileName", file.name);
      body.append("folder", `/portfolio/${folder}`);
      body.append("useUniqueFileName", "true");
      body.append("publicKey", auth.publicKey);
      body.append("signature", auth.signature);
      body.append("expire", String(auth.expire));
      body.append("token", auth.token);

      const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; fileId?: string; message?: string };
      if (!response.ok || !data.url || !data.fileId) throw new Error(data.message ?? "Upload failed.");
      onChange({ url: data.url, fileId: data.fileId, alt: value?.alt ?? "" });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-3">
      {value && (
        <div className="flex flex-wrap items-start gap-4">
          <span className="relative block h-28 w-40 overflow-hidden border-2 border-ink bg-paper-muted">
            <Image src={value.url} alt="" fill sizes="160px" className="object-cover" />
          </span>
          <div className="grid min-w-56 flex-1 gap-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">Alt text</span>
              <input
                className="field"
                value={value.alt}
                maxLength={200}
                onChange={(event) => onChange({ ...value, alt: event.target.value })}
                placeholder="Describe the image for screen readers"
              />
            </label>
            <button type="button" className="btn btn-secondary btn-sm justify-self-start" onClick={() => onChange(undefined)}>
              Remove image
            </button>
          </div>
        </div>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
        className="text-sm"
      />
      {uploading && <p className="meta" role="status">Uploading…</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
