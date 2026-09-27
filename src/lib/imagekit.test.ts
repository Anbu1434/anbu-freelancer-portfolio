import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteReplacedImages, getUploadAuth } from "@/lib/imagekit";

beforeEach(() => {
  vi.stubEnv("IMAGEKIT_PRIVATE_KEY", "private_test");
  vi.stubEnv("IMAGEKIT_PUBLIC_KEY", "public_test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getUploadAuth", () => {
  it("signs token + expire with the private key and expires within 10 minutes", () => {
    const auth = getUploadAuth(1_000_000);
    expect(auth.publicKey).toBe("public_test");
    expect(auth.expire).toBe(1000 + 600);
    expect(auth.signature).toBe(createHmac("sha1", "private_test").update(auth.token + auth.expire).digest("hex"));
  });
});

describe("deleteReplacedImages", () => {
  it("deletes only files that are no longer referenced", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const keep = { url: "u1", fileId: "keep", alt: "" };
    const old = { url: "u2", fileId: "old", alt: "" };

    await deleteReplacedImages([keep, old, undefined], [keep, undefined]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.imagekit.io/v1/files/old");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("never throws when ImageKit is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(deleteReplacedImages([{ url: "u", fileId: "f", alt: "" }], [])).resolves.toBeUndefined();
  });
});
