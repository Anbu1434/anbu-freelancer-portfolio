"use client";

import { useEffect } from "react";
import { playSound } from "@/lib/sound";

const TOGGLE = '.chip, input[type="checkbox"], input[type="radio"], [aria-pressed], [role="switch"], [role="tab"]';
const INTERACTIVE = 'a, button, [role="button"], summary, label, select';

/**
 * Plays a click on links, buttons and toggles. Listens to `click`, not `pointerdown`, so starting a
 * scroll on a touch screen stays silent; capture phase so components that stop propagation still sound.
 */
export function ClickSounds() {
  useEffect(() => {
    let lastPlayed = 0;

    function onClick(event: MouseEvent) {
      // Clicking a label also clicks its input; one press, one sound.
      if (event.timeStamp - lastPlayed < 50 || !(event.target instanceof Element)) return;
      const target = event.target.closest(`${TOGGLE}, ${INTERACTIVE}`);
      if (!target || target.matches(":disabled, [aria-disabled='true']") || target.closest("[data-silent]")) return;
      lastPlayed = event.timeStamp;
      playSound(target.matches(TOGGLE) || target.querySelector(":scope > input[type='checkbox'], :scope > input[type='radio']") ? "toggle" : "tap");
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
