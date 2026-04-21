import { SITE_CONFIG } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-slate-950">{SITE_CONFIG.brandName}</p>
          <p>{SITE_CONFIG.descriptor}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a className="transition hover:text-slate-950" href={`mailto:${SITE_CONFIG.email}`}>
            {SITE_CONFIG.email}
          </a>
          <a className="transition hover:text-slate-950" href={SITE_CONFIG.linkedinHref}>
            LinkedIn
          </a>
          <a className="transition hover:text-slate-950" href={SITE_CONFIG.githubHref}>
            GitHub
          </a>
          <span>© 2026 {SITE_CONFIG.brandName}</span>
        </div>
      </div>
    </footer>
  );
}
