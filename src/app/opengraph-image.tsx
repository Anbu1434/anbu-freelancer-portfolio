import { ImageResponse } from "next/og";
import { availabilityLabels, hero, siteConfig } from "@/content/site";

export const alt = `${siteConfig.brand} — ${siteConfig.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#faf6ef",
          color: "#111111",
          border: "12px solid #111111",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, letterSpacing: 2 }}>
          <span>{siteConfig.brand}</span>
          <span>{availabilityLabels[siteConfig.availability].long.toUpperCase()}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            fontSize: 128,
            fontWeight: 700,
            lineHeight: 0.92,
            letterSpacing: -4,
            textTransform: "uppercase",
          }}
        >
          {hero.lines.map((line, index) => (
            <span
              key={line}
              style={index === hero.accentLine ? { background: "#ff6b4a", padding: "0 12px", marginLeft: 120 } : {}}
            >
              {line}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 2 }}>
          {hero.roles.toUpperCase()} — {siteConfig.location.toUpperCase()}
        </div>
      </div>
    ),
    { ...size },
  );
}
