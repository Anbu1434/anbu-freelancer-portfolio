"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSyncExternalStore } from "react";
import { isMuted, playSound, setMuted, subscribeMuted } from "@/lib/sound";

/** Mutes or unmutes the UI sounds; the choice is remembered in this browser. */
export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);

  function toggle() {
    setMuted(!muted);
    if (muted) playSound("toggle");
  }

  return (
    <button type="button" onClick={toggle} className="icon-btn bg-white" aria-pressed={!muted} aria-label="Sound effects" data-silent>
      {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
    </button>
  );
}
