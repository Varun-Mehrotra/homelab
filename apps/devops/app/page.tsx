import { Footer } from "@/components/footer";
import { HeroVisual } from "@/components/hero-visual";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import {
  SITE_CONFIG,
  audienceCards,
  faqItems,
  outcomeCards,
  painSignals,
  processSteps,
  serviceCards,
} from "@/lib/site";

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="hero-section mx-auto grid w-full max-w-6xl gap-14 px-5 py-18 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-28">
          <Reveal className="lg:col-span-6 lg:pr-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">AI-assisted internal tooling</p>
            <h1 className="mt-5 max-w-xl text-balance font-heading text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.6rem] lg:leading-[1.02]">
              AI-assisted internal tooling for DevOps and platform teams
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              We build bespoke internal systems that reduce operational toil, speed up engineering workflows, and help
              teams scale output without adding headcount linearly.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={SITE_CONFIG.primaryCtaHref}
                className="cta-button cta-button-primary px-6"
              >
                {SITE_CONFIG.primaryCtaLabel}
              </a>
              <a
                href={SITE_CONFIG.secondaryCtaHref}
                className="cta-button cta-button-secondary px-6"
              >
                See example use cases
              </a>
            </div>
          </Reveal>

          <div className="lg:col-span-6 lg:pl-6">
            <HeroVisual />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading title="Built for engineering teams where operational complexity is already real">
              <p>
                Best fit for SaaS teams, platform-heavy engineering orgs, and infra-heavy startups already dealing with
                Kubernetes, CI/CD, cloud workflows, or internal developer platform concerns.
              </p>
            </SectionHeading>
          </Reveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {audienceCards.map((card, index) => (
              <Reveal
                key={card.title}
                delay={index * 0.08}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
              >
                <h3 className="text-xl font-semibold text-slate-950">{card.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{card.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-24">
          <Reveal className="lg:col-span-5">
            <SectionHeading title="Most engineering teams are not short on tools. They are short on leverage.">
              <p>
                Platform and DevOps teams rarely need more dashboards. They need internal workflows that make existing
                knowledge, context, and operating steps usable when the work is repetitive, noisy, or time-sensitive.
              </p>
              <p className="mt-4">
                That often means reducing Slack dependency, speeding up triage, and turning scattered docs or tribal
                knowledge into systems engineers can actually work through.
              </p>
            </SectionHeading>
          </Reveal>

          <div className="grid gap-4 lg:col-span-7">
            {painSignals.map((signal, index) => (
              <Reveal
                key={signal}
                delay={index * 0.05}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]"
              >
                <p className="text-base leading-7 text-slate-700">{signal}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="services" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading eyebrow="Services" title="What we build" />
          </Reveal>

          <div id="use-cases" className="mt-10 grid gap-6 lg:grid-cols-2">
            {serviceCards.map((service, index) => (
              <Reveal
                key={service.title}
                delay={index * 0.08}
                className="rounded-[1.9rem] border border-slate-200 bg-white p-8 shadow-[0_20px_48px_rgba(15,23,42,0.05)]"
              >
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{service.title}</h3>
                <p className="mt-4 text-base leading-7 text-slate-600">{service.description}</p>
                <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
                  {service.examples.map((example) => (
                    <li key={example} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading eyebrow="Outcomes" title="What this should improve">
              <p>
                Exact outcomes depend on the workflow and team maturity. Engagements start by identifying one
                high-friction workflow worth solving first.
              </p>
            </SectionHeading>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {outcomeCards.map((outcome, index) => (
              <Reveal
                key={outcome}
                delay={index * 0.05}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.03)]"
              >
                <p className="text-lg font-medium leading-7 text-slate-900">{outcome}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="process" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading eyebrow="Process" title="How engagements work" />
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {processSteps.map((step, index) => (
              <Reveal
                key={step.title}
                delay={index * 0.08}
                className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{step.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 rounded-[1.6rem] border border-blue-100 bg-blue-50/70 px-6 py-5">
            <p className="text-sm font-medium text-slate-700">
              Human-in-the-loop by default. No black-box &quot;let AI run production&quot; nonsense.
            </p>
          </Reveal>
        </section>

        <section id="faq" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading eyebrow="FAQ" title="Common questions" />
          </Reveal>

          <div className="mt-10 grid gap-4">
            {faqItems.map((item, index) => (
              <Reveal
                key={item.question}
                delay={index * 0.04}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)]"
              >
                <h3 className="text-lg font-semibold text-slate-950">{item.question}</h3>
                <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">{item.answer}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="contact" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal className="rounded-[2rem] border border-slate-200 bg-slate-950 px-8 py-10 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">Reach out</p>
            <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Find the workflow that should not still be manual
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              If your engineering team is still spending expensive time on repetitive operational work, there is
              probably a narrower and more practical automation opportunity than a generic AI rollout.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={SITE_CONFIG.primaryCtaHref}
                className="cta-button bg-white px-6 text-slate-950 shadow-[0_14px_28px_rgba(15,23,42,0.16)] hover:bg-slate-100"
              >
                {SITE_CONFIG.primaryCtaLabel}
              </a>
              <p className="text-sm text-slate-300">
                Best fit for teams with real platform, infrastructure, or release complexity.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
              <a href={`mailto:${SITE_CONFIG.email}`} className="transition hover:text-white">
                {SITE_CONFIG.email}
              </a>
              <a href={SITE_CONFIG.linkedinHref} className="transition hover:text-white">
                LinkedIn
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
