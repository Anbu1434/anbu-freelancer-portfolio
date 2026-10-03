"use client";

import { useEffect, useRef } from "react";

/** Two taps closer than this in time and distance count as a double tap. */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;
const MAX_POPS = 6;
/** Colour variants in globals.css (.service-pop[data-tone]). */
const TONES = 7;
const SKIP = 'a, button, [role="button"], label, summary, select, input, textarea, [contenteditable="true"], dialog, .chip';

/**
 * Easter egg: double-tap (or double-click) anywhere on the page and the next service name pops out
 * at that spot as a tilted tag, floats up and fades. Controls and form fields keep their own behaviour.
 */
export function ServicePop({ services }: { services: string[] }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || services.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let next = 0;
    let tone = 0;
    let last = { time: 0, x: 0, y: 0 };

    function pop(x: number, y: number) {
      if (!layer) return;
      while (layer.childElementCount >= MAX_POPS) layer.firstElementChild?.remove();

      const tag = document.createElement("span");
      tag.className = "service-pop";
      tag.dataset.tone = String(tone);
      tone = (tone + 1) % TONES;
      tag.textContent = services[next];
      next = (next + 1) % services.length;
      layer.append(tag);

      // Centre on the tap, but keep the whole tag on screen.
      const { width, height } = tag.getBoundingClientRect();
      const left = Math.min(Math.max(x - width / 2, 8), window.innerWidth - width - 8);
      const top = Math.min(Math.max(y - height / 2, 8), window.innerHeight - height - 8);
      tag.style.left = `${left}px`;
      tag.style.top = `${top}px`;

      const tilt = Math.random() * 10 - 5;
      const frames = reduceMotion.matches
        ? [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }]
        : [
            { opacity: 0, transform: `translateY(0) scale(0.4) rotate(${tilt * 3}deg)` },
            { opacity: 1, transform: `translateY(-6px) scale(1.12) rotate(${tilt}deg)`, offset: 0.18 },
            { opacity: 1, transform: `translateY(-14px) scale(1) rotate(${tilt}deg)`, offset: 0.35 },
            { opacity: 1, transform: `translateY(-34px) scale(1) rotate(${tilt}deg)`, offset: 0.75 },
            { opacity: 0, transform: `translateY(-52px) scale(0.92) rotate(${tilt}deg)` },
          ];
      tag.animate(frames, { duration: 1100, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "forwards" }).finished.then(
        () => tag.remove(),
        () => tag.remove(),
      );
    }

    function onPointerUp(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest(SKIP)) return;

      const now = event.timeStamp;
      const near = Math.hypot(event.clientX - last.x, event.clientY - last.y) < DOUBLE_TAP_PX;
      if (now - last.time < DOUBLE_TAP_MS && near) {
        last = { time: 0, x: 0, y: 0 };
        pop(event.clientX, event.clientY);
      } else {
        last = { time: now, x: event.clientX, y: event.clientY };
      }
    }

    document.addEventListener("pointerup", onPointerUp, { passive: true });
    return () => document.removeEventListener("pointerup", onPointerUp);
  }, [services]);

  return <div ref={layerRef} className="service-pop-layer" aria-hidden="true" />;
}
