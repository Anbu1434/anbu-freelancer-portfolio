import { siteConfig } from "@/content/site";

export function Footer() {
  return (
    <footer className="meta flex flex-col gap-2 border-t-2 border-ink px-4 py-5 sm:flex-row sm:justify-between sm:px-6 lg:px-10">
      <p>
        © {siteConfig.year} {siteConfig.name} · {siteConfig.brand}
      </p>
      <p>Built with {siteConfig.builtWith}</p>
    </footer>
  );
}
