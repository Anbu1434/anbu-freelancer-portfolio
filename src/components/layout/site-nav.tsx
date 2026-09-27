"use client";

import { BriefcaseBusiness, CodeXml, FileText, House, Layers, Send, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StartProjectButton } from "@/components/inquiry/start-project-button";
import { Availability } from "@/components/ui/availability";
import { navigation, siteConfig } from "@/content/site";
import { cn } from "@/lib/cn";

const icons: Record<string, LucideIcon> = {
  "/": House,
  "/work": BriefcaseBusiness,
  "/services": Layers,
  "/about": UserRound,
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-3">
      <span aria-hidden="true" className="grid size-10 place-items-center border-2 border-ink bg-paper text-ink shadow-hard-sm">
        <CodeXml className="size-5" />
      </span>
      <span className="title text-xl">{siteConfig.brand}</span>
    </Link>
  );
}

/** Sidebar on desktop; sticky top bar with a full-screen menu below 1024px. */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const mobileRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    const header = mobileRef.current;
    if (!open || !header) return;

    // Make the page inert and trap focus inside the menu while it is open.
    const page = document.getElementById("page");
    page?.setAttribute("inert", "");
    document.documentElement.style.overflow = "hidden";
    header.querySelector<HTMLElement>("#site-menu a")?.focus();

    const focusable = () =>
      Array.from(header.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")).filter(
        (element) => element.getClientRects().length > 0,
      );

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    const desktop = window.matchMedia("(min-width: 64rem)");
    const onBreakpoint = (event: MediaQueryListEvent) => event.matches && setOpen(false);

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      page?.removeAttribute("inert");
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 hidden h-dvh flex-col self-start px-5 py-7 text-on-frame lg:flex">
        <Logo />
        <nav aria-label="Primary" className="mt-12">
          <ul className="grid gap-1.5">
            {navigation.map((item) => {
              const Icon = icons[item.href];
              return (
                <li key={item.href}>
                  <Link href={item.href} className="side-link" aria-current={isActive(pathname, item.href) ? "page" : undefined}>
                    <Icon aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto grid gap-1.5">
          <p className="meta px-3.5 pb-3">
            <Availability long />
          </p>
          <StartProjectButton variant="accent" size="sm" icon={<Send />} className="mb-2">
            Start project
          </StartProjectButton>
          {siteConfig.resumeUrl && (
            <a href={siteConfig.resumeUrl} target="_blank" rel="noopener noreferrer" className="side-link">
              <FileText aria-hidden="true" />
              Resume
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <a href={`mailto:${siteConfig.email}`} className="side-link">
            <Send aria-hidden="true" />
            Email me
          </a>
        </div>
      </header>

      <header ref={mobileRef} className="sticky top-0 z-40 bg-frame text-on-frame lg:hidden">
        <div className="flex h-header items-center justify-between gap-4 px-2 sm:px-4">
          <Logo onClick={close} />
          <button
            ref={toggleRef}
            type="button"
            className="btn btn-secondary btn-sm min-w-[5.5rem] shadow-hard-sm"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        <div id="site-menu" className="site-menu" data-open={open ? "true" : "false"}>
          <div className="flex h-full flex-col gap-8 overflow-y-auto px-2 pb-8 pt-4 sm:px-4">
            <nav aria-label="Mobile">
              <ul className="grid gap-3">
                {navigation.map((item) => {
                  const Icon = icons[item.href];
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "title flex items-center gap-4 border-2 border-ink p-4 text-[clamp(1.5rem,7vw,2.25rem)] shadow-hard-sm",
                          active ? "bg-accent text-ink" : "bg-paper text-ink",
                        )}
                      >
                        <Icon aria-hidden="true" className="size-7 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <StartProjectButton variant="accent" icon={<Send />} onClick={close} className="shadow-hard-sm">
              Start project
            </StartProjectButton>
            <div className="meta mt-auto grid gap-3 px-1">
              <Availability long />
              <a href={`mailto:${siteConfig.email}`} className="self-start font-semibold normal-case underline underline-offset-4">
                {siteConfig.email}
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
