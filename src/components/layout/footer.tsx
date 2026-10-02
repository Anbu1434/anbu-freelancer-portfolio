import { getSiteConfig } from "@/lib/content";

export async function Footer() {
  const site = await getSiteConfig();

  return (
    <footer className="meta flex flex-col gap-2 border-t-2 border-ink px-4 py-5 sm:flex-row sm:justify-between sm:px-6 lg:px-10">
      <p>
        © {site.year} {site.name} · {site.brand}
      </p>
      <p>Built with {site.builtWith}</p>
    </footer>
  );
}
