import { Reveal } from "@/components/reveal";

const cards = [
  {
    label: "Failed deployment diagnosis",
    title: "Checkout service deploy failed after migration step",
    body: "Recent schema drift detected. Error cluster points to a stale environment variable in the verification job.",
    tone: "blue",
  },
  {
    label: "Runbook assistant",
    title: "Suggested first response",
    body: "Confirm deploy artifact hash, compare rollout state, then check payment queue drain before rollback.",
    tone: "slate",
  },
  {
    label: "Incident context panel",
    title: "Signal gathered automatically",
    body: "Alerts, recent deploys, service ownership, and the matching runbook are pulled into one responder view.",
    tone: "blue",
  },
  {
    label: "Internal platform Q&A",
    title: "How do I request a new preview environment?",
    body: "Use the release helper, select repository, and attach the service profile. Approval still routes to platform.",
    tone: "slate",
  },
] as const;

export function HeroVisual() {
  return (
    <div className="relative mx-auto grid max-w-xl gap-4 lg:mx-0">
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[linear-gradient(180deg,rgba(37,99,235,0.04),rgba(255,255,255,0))]" />
      {cards.map((card, index) => {
        const toneClass =
          card.tone === "blue"
            ? "border-blue-100 bg-white/95 shadow-[0_18px_60px_rgba(37,99,235,0.08)]"
            : "border-slate-200 bg-slate-50/90 shadow-[0_18px_60px_rgba(15,23,42,0.06)]";

        return (
          <Reveal
            key={card.title}
            delay={index * 0.08}
            className={`rounded-[1.75rem] border p-5 ${toneClass} ${index % 2 === 0 ? "lg:translate-x-0" : "lg:translate-x-8"}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-950">{card.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{card.body}</p>
          </Reveal>
        );
      })}
    </div>
  );
}
