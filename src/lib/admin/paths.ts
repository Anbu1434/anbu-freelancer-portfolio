type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj => typeof value === "object" && value !== null && !Array.isArray(value);

/** Reads a dotted path such as "social.github". */
export function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (isObj(value) ? value[key] : undefined), source);
}

/** Immutable set of a dotted path; missing parents are created. */
export function setPath<T extends Obj>(source: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  if (rest.length === 0) return { ...source, [head]: value };
  const child = isObj(source[head]) ? (source[head] as Obj) : {};
  return { ...source, [head]: setPath(child, rest.join("."), value) };
}
