"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Children, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { PageTitle } from "@/components/ui/page-title";

type ReviewCarouselProps = {
  title: string;
  titleId: string;
  /** The feedback summary: first column beside the carousel on desktop, under the card deck on mobile. */
  lead: ReactNode;
  children: ReactNode;
};

type TrackState = { scrollable: boolean; atStart: boolean; atEnd: boolean; first: number; visible: number };

const idle: TrackState = { scrollable: false, atStart: true, atEnd: true, first: 0, visible: 0 };

const DESKTOP = "(min-width: 64rem)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Scroll distance per card, as a share of the pinned stage's height. */
const STEP = 0.5;
/** Extra scroll (in steps) the finished deck stays pinned before the section releases. */
const HOLD = 0.15;
/** Covered cards shrink and dim per card stacked on top of them, up to MAX_DEPTH cards deep. */
const SCALE_STEP = 0.05;
const SHADE_STEP = 0.07;
const MAX_DEPTH = 3;
/** Incoming cards grow from this scale to 1 as they land. */
const ENTER_SCALE = 0.94;
/** Incoming cards start this far below the current card, tucked behind the feedback panel, and fade in over this share of their step. */
const ENTER_GAP = 20;
const FADE_IN = 0.2;
/** Share of the remaining distance covered each frame; smooths coarse scroll input without lagging. */
const SMOOTHING = 0.2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** 100svh in px: stays put while mobile browser bars show and hide, unlike innerHeight. */
function smallViewportHeight() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Below 1024px the section pins while the reviews deal onto a deck (see `.review-pin` in globals.css).
 * The wrapper is made tall enough for one scroll step per card plus a short hold; while it scrolls past,
 * the sticky stage stays put and scroll progress drives every card. Each card's step is spent entirely on
 * visible motion: the incoming card starts right under the current one, tucked behind the feedback panel,
 * fades in as soon as its step begins, then slides up over the current card and grows to full size, while
 * the cards beneath ease back in scale and shade. Only once the last card has landed (plus a short hold)
 * does the wrapper run out and release the page.
 *
 * The stage holds the heading, the deck and the feedback panel, so the pinned screen is the section's own
 * content. It is only as tall as that content and pins centred in the space under the header, so any
 * leftover screen splits into an even margin above and below rather than one blank block. The hold after
 * the last card is at least that lower margin, so the next section only comes into view once every card
 * has landed; then it rises to its usual gap and the page scrolls on. If the content is taller than the
 * screen, the stage pins bottom-aligned instead, letting the heading scroll out of view while the deck and
 * panel stay fully visible.
 *
 * Pinning is switched on here (data-ready) only when motion is allowed, there is more than one review,
 * and the stage fits the viewport; otherwise the reviews stay a plain list.
 */
function usePinnedStack(pinRef: RefObject<HTMLDivElement | null>, count: number) {
  useEffect(() => {
    const pin = pinRef.current;
    const stage = pin?.firstElementChild as HTMLElement | null;
    const deck = stage?.querySelector<HTMLElement>(".review-stack");
    if (!pin || !stage || !deck) return;

    const desktop = window.matchMedia(DESKTOP);
    const reduced = window.matchMedia(REDUCED_MOTION);
    const cards = () => Array.from(deck.children) as HTMLElement[];
    let frame = 0;
    let disposed = false;
    let step = 0;
    let enterFrom: number[] = [];
    let target = 0;
    let current = 0;

    const reset = () => {
      pin.removeAttribute("data-ready");
      pin.style.height = "";
      stage.style.removeProperty("top");
      for (const card of cards()) {
        card.style.transform = "";
        card.style.opacity = "";
        card.style.removeProperty("--shade");
      }
    };

    const render = () => {
      const list = cards();
      // progress[i]: 0 → 1 across card i's own step; card 0 is in place from the start.
      const progress = list.map((_, index) => (index === 0 ? 1 : clamp(current - (index - 1), 0, 1)));
      const eased = progress.map(smoothstep);
      list.forEach((card, index) => {
        const arrive = eased[index];
        const depth = Math.min(MAX_DEPTH, eased.slice(index + 1).reduce((total, value) => total + value, 0));
        const scale = (ENTER_SCALE + (1 - ENTER_SCALE) * arrive) * (1 - depth * SCALE_STEP);
        const offset = (1 - arrive) * (enterFrom[index] ?? 0);
        card.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
        // Fades in quickly at the start of its step, so the card is visible from the first bit of scroll.
        card.style.opacity = index === 0 ? "" : smoothstep(clamp(progress[index] / FADE_IN, 0, 1)).toFixed(3);
        card.style.setProperty("--shade", (depth * SHADE_STEP).toFixed(3));
      });
    };

    const readTarget = () => {
      // How far the page has scrolled since the stage pinned under the header, in cards.
      const scrolled = stage.getBoundingClientRect().top - pin.getBoundingClientRect().top;
      target = clamp(scrolled / step, 0, count - 1);
    };

    const tick = () => {
      frame = 0;
      current += (target - current) * SMOOTHING;
      if (Math.abs(target - current) < 0.001) current = target;
      render();
      if (current !== target) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      readTarget();
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", onScroll);
      reset();
      if (desktop.matches || reduced.matches || count < 2) return;

      pin.setAttribute("data-ready", "");
      const header = parseFloat(getComputedStyle(stage).top);
      const screen = smallViewportHeight() - header;
      const height = stage.getBoundingClientRect().height;
      const spare = screen - height;
      // Taller than the screen: pin bottom-aligned. Only the heading may go out of view — if the deck
      // itself would be cut off (landscape phones), keep the plain list instead.
      if (-spare > deck.getBoundingClientRect().top - stage.getBoundingClientRect().top) return reset();
      stage.style.setProperty("top", `${header + (spare > 0 ? spare / 2 : spare)}px`);

      step = screen * STEP;
      const hold = Math.max(step * HOLD, spare / 2);
      pin.style.height = `${height + step * (count - 1) + hold}px`;
      // Each incoming card starts one gap below the current card, behind the feedback panel.
      // (Measured before any transform is applied; all cards share the deck row's bottom edge.)
      const list = cards();
      const bottom = list[0].getBoundingClientRect().bottom;
      enterFrom = list.map((card) => bottom + ENTER_GAP - card.getBoundingClientRect().top);

      readTarget();
      current = target;
      render();
      window.addEventListener("scroll", onScroll, { passive: true });
    };

    sync();
    // Card heights change once the web fonts arrive; re-measure then.
    document.fonts?.ready.then(sync);
    desktop.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      reset();
    };
  }, [pinRef, count]);
}

/**
 * From 1024px the reviews become a scroll-snap track (2 per view, 3 from 1536px) beside the lead panel.
 * Controls appear only when there are more reviews than fit; below 1024px the section pins and the cards
 * stack on scroll (usePinnedStack).
 */
export function ReviewCarousel({ title, titleId, lead, children }: ReviewCarouselProps) {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const trackId = useId();
  const [state, setState] = useState<TrackState>(idle);
  const slides = Children.toArray(children);
  usePinnedStack(pinRef, slides.length);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const slide = track?.firstElementChild as HTMLElement | null;
    // Below lg the track is the stacked deck, not a scroller.
    if (!track || !slide || !window.matchMedia(DESKTOP).matches) return setState(idle);

    const step = slide.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    const max = track.scrollWidth - track.clientWidth;
    setState({
      scrollable: max > 1,
      atStart: track.scrollLeft <= 1,
      atEnd: track.scrollLeft >= max - 1,
      first: Math.round(track.scrollLeft / step),
      visible: Math.max(1, Math.round(track.clientWidth / step)),
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    track.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [measure]);

  function go(direction: -1 | 1) {
    const track = trackRef.current;
    const slide = track?.firstElementChild as HTMLElement | null;
    if (!track || !slide) return;

    const step = slide.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    const reduced = window.matchMedia(REDUCED_MOTION).matches;
    track.scrollBy({ left: direction * step, behavior: reduced ? "auto" : "smooth" });
  }

  const last = Math.min(slides.length, state.first + state.visible);

  const controls = state.scrollable && (
    <div className="flex items-center gap-3">
      <p className="meta" aria-live="polite">
        {state.first + 1}–{last} of {slides.length}
      </p>
      <button type="button" className="icon-btn disabled:cursor-not-allowed disabled:opacity-40" onClick={() => go(-1)} disabled={state.atStart} aria-controls={trackId} aria-label="Previous review">
        <ArrowLeft aria-hidden="true" />
      </button>
      <button type="button" className="icon-btn disabled:cursor-not-allowed disabled:opacity-40" onClick={() => go(1)} disabled={state.atEnd} aria-controls={trackId} aria-label="Next review">
        <ArrowRight aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile: tall wrapper + sticky stage. Desktop: both are plain blocks. */}
      <div ref={pinRef} className="review-pin">
        <div className="review-pin-stage">
          <PageTitle as="h2" id={titleId} action={controls}>
            {title}
          </PageTitle>

          <div className="mt-6 grid gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
            <div className="grid max-lg:hidden">{lead}</div>
            {/* Below lg: the card deck. From lg: a scroll-snap row, where the negative margin + padding
                leave room for the cards' hard shadow inside the scroll box. */}
            <ul
              ref={trackRef}
              id={trackId}
              aria-label={title}
              tabIndex={state.scrollable ? 0 : undefined}
              className="review-stack flex flex-col gap-5 lg:-mb-2 lg:-mr-2 lg:flex-row lg:snap-x lg:snap-mandatory lg:gap-5 lg:overflow-x-auto lg:overscroll-x-contain lg:pb-2 lg:pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {slides.map((slide, index) => (
                <li
                  key={index}
                  style={{ "--i": index } as CSSProperties}
                  className="flex lg:w-[calc((100%-1.25rem)/2)] lg:shrink-0 lg:snap-start 2xl:w-[calc((100%-2.5rem)/3)] [&>*]:w-full"
                >
                  {slide}
                </li>
              ))}
            </ul>
          </div>
          {/* Mobile: the feedback panel sits in the pinned stage under the deck (above the incoming cards). */}
          <div className="review-lead mt-5 grid lg:hidden">{lead}</div>
        </div>
      </div>
    </>
  );
}
