"use client";

import { useEffect, useRef } from "react";

type Mode = "default" | "hover" | "label" | "text" | "disabled";

const TEXT_FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea, [contenteditable="true"]';
const INTERACTIVE = 'a, button, [role="button"], label, summary, select, .chip';
const DARK_SURFACE = ".text-on-frame, .bg-ink, .bg-frame, .btn-primary";
const LIGHT_SURFACE = ".bg-paper, .bg-paper-muted, .bg-white, .bg-tint, .bg-accent, .bg-accent-soft, .side-link[aria-current='page']";

/** Classic pointer silhouette; the tip sits at (3, 2), which the CSS offsets onto the hotspot. */
const ARROW_PATH = "M3 2v21.5l5.6-5.3 3.9 8.6 4.3-1.9-3.9-8.4H20.5Z";

/** The page itself is charcoal, so anything not on a light surface gets the light cursor. */
function onDarkSurface(target: Element | null) {
  const surface = target?.closest(`${DARK_SURFACE}, ${LIGHT_SURFACE}`);
  return !surface || surface.matches(DARK_SURFACE);
}

/**
 * Brutalist arrow cursor for mouse pointers: an ink arrow with a hard tomato shadow that sits exactly
 * on the pointer, tilts and lifts over interactive elements and presses into its shadow on click.
 * Over [data-cursor] elements a tag ("View ↗", "Open ↗") trails beside it. Text fields get the native I-beam;
 * touch and pen input keep the native behaviour.
 */
export function ContextCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const arrow = arrowRef.current;
    const tag = tagRef.current;
    const label = labelRef.current;
    if (!root || !arrow || !tag || !label || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const html = document.documentElement;
    html.setAttribute("data-custom-cursor", "");

    let frame = 0;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    let placed = false;

    const setVisible = (visible: boolean) => root.setAttribute("data-visible", String(visible));

    function update(target: Element | null) {
      if (!root || !label) return;
      let mode: Mode = "default";
      const labelled = target?.closest<HTMLElement>("[data-cursor]");

      if (target?.closest(TEXT_FIELD)) mode = "text";
      else if (labelled) {
        mode = "label";
        label.textContent = labelled.dataset.cursor ?? "";
      } else {
        const interactive = target?.closest(INTERACTIVE);
        if (interactive) mode = interactive.matches(":disabled, [aria-disabled='true']") ? "disabled" : "hover";
      }

      root.setAttribute("data-mode", mode);
      root.setAttribute("data-tone", onDarkSurface(target) ? "light" : "dark");
    }

    // The tag trails the arrow a little; the arrow itself never lags.
    function tick() {
      if (!tag) return;
      const ease = reduceMotion.matches ? 1 : 0.25;
      tx += (mx - tx) * ease;
      ty += (my - ty) * ease;
      tag.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      frame = Math.abs(mx - tx) + Math.abs(my - ty) > 0.1 ? requestAnimationFrame(tick) : 0;
    }

    function onPointerMove(event: PointerEvent) {
      if (!arrow) return;
      if (event.pointerType !== "mouse") return setVisible(false);

      mx = event.clientX;
      my = event.clientY;
      if (!placed) {
        tx = mx;
        ty = my;
        placed = true;
      }

      arrow.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      update(event.target instanceof Element ? event.target : null);
      setVisible(true);
      if (!frame) frame = requestAnimationFrame(tick);
    }

    // Content scrolls under a still pointer; re-read what it's over.
    const onScroll = () => placed && update(document.elementFromPoint(mx, my));
    const onDown = () => root.setAttribute("data-pressed", "true");
    const onUp = () => root.setAttribute("data-pressed", "false");
    const onOut = (event: MouseEvent) => !event.relatedTarget && setVisible(false);
    const onBlur = () => setVisible(false);

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onBlur);

    return () => {
      cancelAnimationFrame(frame);
      html.removeAttribute("data-custom-cursor");
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <div ref={rootRef} className="cursor" data-visible="false" data-mode="default" data-tone="dark" data-pressed="false" aria-hidden="true">
      <div ref={tagRef} className="cursor-pos">
        <span ref={labelRef} className="cursor-tag" />
      </div>
      <div ref={arrowRef} className="cursor-pos">
        <svg className="cursor-arrow" viewBox="0 0 28 30" width="28" height="30">
          <path className="cursor-arrow-shadow" d={ARROW_PATH} />
          <path className="cursor-arrow-body" d={ARROW_PATH} />
        </svg>
      </div>
    </div>
  );
}
