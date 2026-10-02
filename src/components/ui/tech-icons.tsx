import type { CSSProperties } from "react";
import {
  siDjango,
  siDocker,
  siGit,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPython,
  siReact,
  siTypescript,
  siVercel,
} from "simple-icons";

type Mark = { path: string; hex: string };

/**
 * Brand marks keyed by the technology names entered in the admin stack editor. simple-icons omits
 * trademark-restricted logos (AWS is one), so a name missing here renders as a
 * wordmark tile rather than a mystery glyph.
 */
const marks: Record<string, Mark> = {
  React: siReact,
  "Next.js": siNextdotjs,
  TypeScript: siTypescript,
  Python: siPython,
  Django: siDjango,
  "Node.js": siNodedotjs,
  PostgreSQL: siPostgresql,
  MySQL: siMysql,
  MongoDB: siMongodb,
  Docker: siDocker,
  Git: siGit,
  Vercel: siVercel,
};

export function hasMark(name: string) {
  return name in marks;
}

/** Brand colour for `name`, exposed as the `--brand` custom property the tile tints with on hover. */
export function brandStyle(name: string): CSSProperties {
  const hex = marks[name]?.hex;
  return hex ? ({ "--brand": `#${hex}` } as CSSProperties) : {};
}

/**
 * The brand mark, or the name set as a wordmark when no mark is available.
 * The mark is decorative — the tile's caption carries the name — while the
 * wordmark is the accessible name for its tile, so it stays readable.
 */
export function TechIcon({ name }: { name: string }) {
  const mark = marks[name];

  if (!mark) {
    return <span className="font-mono text-base font-bold tracking-tight">{name}</span>;
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={mark.path} />
    </svg>
  );
}
