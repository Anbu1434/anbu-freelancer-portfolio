import { Card, type CardTone } from "@/components/ui/card";
import { brandStyle, hasMark, TechIcon } from "@/components/ui/tech-icons";
import type { StackGroup } from "@/types/content";

/** One stack group rendered as a grid of brand-logo tiles. */
export function TechCard({ group, tone }: { group: StackGroup; tone?: CardTone }) {
  return (
    <Card tone={tone} className="p-5" data-reveal>
      <h3 className="meta font-bold">{group.label}</h3>
      <ul className="mt-4 grid grid-cols-3 gap-3 xl:grid-cols-2">
        {group.items.map((item) => (
          <li key={item} className="tech-item">
            <span className="tech-tile" style={brandStyle(item)}>
              <TechIcon name={item} />
            </span>
            {/* A wordmark tile already reads as its own label. */}
            {hasMark(item) && (
              <span className="mt-2 block text-center font-mono text-[0.6875rem] font-bold leading-tight [overflow-wrap:anywhere]">
                {item}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
