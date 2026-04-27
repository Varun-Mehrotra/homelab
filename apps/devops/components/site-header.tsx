import { SITE_CONFIG } from "@/lib/site";

const navItems = [
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[rgba(248,250,252,0.84)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-slate-950 uppercase">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[0.7rem] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            WG
          </span>
          <span>{SITE_CONFIG.brandName}</span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <a
            href={SITE_CONFIG.linkedinHref}
            aria-label="LinkedIn"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center justify-center bg-transparent text-[#2563A6] transition hover:text-[#0A66C2] md:inline-flex"
          >
            <span className="inline-flex items-center justify-center bg-transparent text-[0.9rem] font-extrabold leading-none tracking-[-0.06em]">
              in
            </span>
          </a>

          <a
            href={SITE_CONFIG.primaryCtaHref}
            className="cta-button cta-button-primary px-5"
          >
            Book a Call
          </a>
        </div>
      </div>
    </header>
  );
}
