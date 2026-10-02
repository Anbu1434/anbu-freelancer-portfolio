import { describe, expect, it } from "vitest";
import { getPath, setPath } from "@/lib/admin/paths";

describe("paths", () => {
  it("reads nested values", () => {
    expect(getPath({ social: { github: "g" } }, "social.github")).toBe("g");
    expect(getPath({}, "social.github")).toBeUndefined();
  });

  it("sets nested values without mutating the source", () => {
    const source = { social: { github: "g", fiverr: "f" }, name: "n" };
    const next = setPath(source, "social.github", "h");
    expect(next).toEqual({ social: { github: "h", fiverr: "f" }, name: "n" });
    expect(source.social.github).toBe("g");
  });

  it("creates missing parents", () => {
    expect(setPath({}, "hero.roles", "r")).toEqual({ hero: { roles: "r" } });
  });
});
