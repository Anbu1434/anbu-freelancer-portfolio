"use client";

import {
  BriefcaseBusiness,
  Cpu,
  Footprints,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Settings,
  UserRound,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/(panel)/actions";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/admin/services", label: "Services", icon: Layers },
  { href: "/admin/process", label: "Process", icon: Waypoints },
  { href: "/admin/experience", label: "Experience", icon: Footprints },
  { href: "/admin/stack", label: "Tech stack", icon: Cpu },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/account", label: "Account", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ email, newInquiries }: { email: string; newInquiries: number }) {
  const pathname = usePathname();

  return (
    <header className="px-2 py-4 text-on-frame sm:px-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:self-start lg:px-5 lg:py-7">
      <p className="title text-xl">Admin</p>
      <p className="meta mt-1 truncate">{email}</p>
      <nav aria-label="Admin" className="mt-6 lg:mt-10">
        <ul className="flex gap-1.5 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href} className="shrink-0">
              <Link href={href} className="side-link" aria-current={isActive(pathname, href) ? "page" : undefined}>
                <Icon aria-hidden="true" />
                {label}
                {href === "/admin/inquiries" && newInquiries > 0 && (
                  <span className="ml-auto border-2 border-ink bg-accent px-1.5 font-mono text-xs font-bold text-ink">{newInquiries}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-4 flex gap-2 lg:mt-auto lg:grid">
        <Link href="/" className="side-link" target="_blank">
          View site ↗
        </Link>
        <form action={logout}>
          <button type="submit" className="side-link w-full">
            <LogOut aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
