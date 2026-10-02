"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Delay between cards that enter the viewport together, so they arrive one by one. */
const STAGGER_MS = 110;

/**
 * Fades [data-reveal] elements in as they enter the viewport, staggering cards that enter together.
 * Content stays visible without JS, and anything already on screen is never hidden.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])"));
    const reveal = (element: HTMLElement) => element.setAttribute("data-revealed", "");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(reveal);
      return;
    }

    const pending = elements.filter((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight) {
        reveal(element);
        return false;
      }
      return true;
    });

    document.documentElement.setAttribute("data-reveal-ready", "");

    const timers = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          // Top-to-bottom, then left-to-right, so a two-column row reads in order.
          .sort((a, b) => {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            return ra.top - rb.top || ra.left - rb.left;
          });

        entering.forEach((element, index) => {
          observer.unobserve(element);
          const delay = index * STAGGER_MS;
          element.style.transitionDelay = `${delay}ms`;
          reveal(element);
          // Drop the delay once the entrance is over so hover transitions stay instant.
          const timer = window.setTimeout(() => {
            element.style.transitionDelay = "";
            timers.delete(timer);
          }, delay + 800);
          timers.add(timer);
        });
      },
      // On small screens wait until a card is properly in view, so each entrance is actually seen.
      { rootMargin: window.matchMedia("(max-width: 63.99rem)").matches ? "0px 0px -12% 0px" : "0px 0px -8% 0px" },
    );

    pending.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname]);

  return null;
}
