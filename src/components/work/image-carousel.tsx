"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const INTERVAL_MS = 4000;

type Props = { images: { src: string; alt: string }[]; sizes: string; preload?: boolean };

/**
 * Crossfades through the images on its own. It pauses while the pointer or keyboard focus
 * is on the surrounding card, while scrolled out of view, and never runs for reduced motion.
 */
export function ImageCarousel({ images, sizes, preload }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Only the first image loads up front; the rest mount once it has loaded, so they never compete with LCP.
  const [rotating, setRotating] = useState(false);
  const count = images.length;

  function onFirstLoad() {
    if (count > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setRotating(true);
  }

  useEffect(() => {
    const element = root.current;
    if (!rotating || !element) return;

    const card = element.closest("article") ?? element;
    let paused = false;
    let visible = true;
    const pause = () => (paused = true);
    const resume = () => (paused = card.matches(":hover, :focus-within"));
    card.addEventListener("pointerenter", pause);
    card.addEventListener("pointerleave", resume);
    card.addEventListener("focusin", pause);
    card.addEventListener("focusout", resume);

    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    observer.observe(element);

    const timer = window.setInterval(() => {
      if (!paused && visible && !document.hidden) setActive((index) => (index + 1) % count);
    }, INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      card.removeEventListener("pointerenter", pause);
      card.removeEventListener("pointerleave", resume);
      card.removeEventListener("focusin", pause);
      card.removeEventListener("focusout", resume);
    };
  }, [rotating, count]);

  return (
    <div ref={root} className="absolute inset-0">
      {/* Images drift with scroll (.parallax); the dots stay put so they never clip. */}
      <div className="parallax absolute inset-0">
        {(rotating ? images : images.slice(0, 1)).map((image, index) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            preload={preload && index === 0}
            onLoad={index === 0 ? onFirstLoad : undefined}
            aria-hidden={index !== active}
            className={cn("object-cover transition-opacity duration-700 ease-brutal", index === active ? "opacity-100" : "opacity-0")}
          />
        ))}
      </div>
      {rotating && (
        <div aria-hidden="true" className="absolute bottom-3 left-3 flex gap-1.5">
          {images.map((image, index) => (
            <span
              key={image.src}
              className={cn("h-2 border-2 border-ink transition-[width,background-color] duration-300", index === active ? "w-6 bg-accent" : "w-2 bg-paper")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
