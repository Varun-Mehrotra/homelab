export const SITE_CONFIG = {
  brandName: "WebGuru",
  descriptor: "AI-assisted internal tooling for DevOps, platform engineering, and SRE teams",
  email: "info@webguru.ca",
  primaryCtaLabel: "Book a discovery call",
  primaryCtaHref: "https://calendly.com/webguru-ca/webguru-ai-enablement-intro-call",
  secondaryCtaLabel: "Explore use cases",
  secondaryCtaHref: "#use-cases",
  githubHref: "https://github.com/",
  linkedinHref: "https://www.linkedin.com/company/webguru-canada",
} as const;

export const audienceCards = [
  {
    title: "Platform Engineering",
    body: "Internal platform teams carrying enablement, release paths, and support load for the rest of engineering.",
  },
  {
    title: "SRE / Infrastructure",
    body: "Teams handling incidents, noisy operations, reliability work, and too many recurring manual workflows.",
  },
  {
    title: "Engineering Leadership",
    body: "Leaders under pressure to improve throughput without growing headcount in lockstep with complexity.",
  },
] as const;

export const painSignals = [
  "The same platform questions keep getting answered in Slack.",
  "Deploy failures still require manual log spelunking and handoffs.",
  "Runbooks exist, but they are hard to use during an incident.",
  "Institutional knowledge lives in senior engineers more than in systems.",
  "Self-service breaks down and platform teams become the bottleneck.",
] as const;

export const serviceCards = [
  {
    title: "Incident triage tooling",
    description:
      "AI-assisted systems that gather context, summarize likely causes, and support faster first-response workflows. The goal is better signal and cleaner handoffs, not blind automation.",
    examples: ["Context assembly from logs, alerts, and runbooks", "Suggested first-response paths for responders", "Incident brief generation for escalation and follow-through"],
  },
  {
    title: "Deployment and release workflow helpers",
    description:
      "Internal tools that reduce manual release steps, speed up failed deploy diagnosis, and support rollback or verification flows. These are designed around your delivery process rather than generic release dashboards.",
    examples: ["Failed deploy triage assistants", "Release verification checklists with system context", "Rollback and dependency sanity checks"],
  },
  {
    title: "Internal infra knowledge systems",
    description:
      "Assistants built around docs, runbooks, repo context, and platform workflows so engineers can self-serve better. Useful knowledge becomes easier to reach when the pressure is on.",
    examples: ["Runbook-aware Q&A interfaces", "Internal docs retrieval with workflow context", "Repo and platform guidance for common support requests"],
  },
  {
    title: "Repetitive ops workflow automation",
    description:
      "Bespoke internal automations for recurring platform and DevOps tasks that still consume expensive human time. Human-in-the-loop review stays in place where judgment matters.",
    examples: ["Routine environment checks and summaries", "Support workflow intake and routing helpers", "Operational task preparation before a human approves execution"],
  },
] as const;

export const outcomeCards = [
  "Less repetitive support work for platform teams",
  "Faster triage on failed deploys and incidents",
  "Better self-service for engineers",
  "Less tribal knowledge dependency",
  "Higher leverage from existing engineering headcount",
  "Clearer internal workflows and handoffs",
] as const;

export const processSteps = [
  {
    title: "Discovery and workflow audit",
    body: "We identify the internal workflow where engineering time is being lost repeatedly.",
  },
  {
    title: "Scoped pilot",
    body: "We define a focused build around one high-friction use case with clear boundaries and success criteria.",
  },
  {
    title: "Build and handoff",
    body: "We implement the solution, document it clearly, and leave your team with something usable and maintainable.",
  },
] as const;

export const faqItems = [
  {
    question: "What kinds of teams is this a fit for?",
    answer:
      "The best fit is an engineering team already dealing with real platform, infrastructure, release, or reliability complexity. SaaS teams, platform-heavy orgs, and infra-heavy startups tend to benefit most.",
  },
  {
    question: "Do you replace DevOps or platform engineers?",
    answer:
      "No. The point is to give those teams better leverage by reducing repetitive operational work, improving self-service, and making internal workflows easier to use.",
  },
  {
    question: "What does AI-assisted actually mean here?",
    answer:
      "It means AI is used where it helps with context gathering, summarization, retrieval, or guided workflow support. Human review stays in the loop where operational judgment or production risk matters.",
  },
  {
    question: "Do you work inside existing tooling and infrastructure?",
    answer:
      "Yes. Most engagements are shaped around the systems teams already use, whether that includes Kubernetes, CI/CD pipelines, cloud platforms, internal docs, incident tooling, or existing platform surfaces.",
  },
  {
    question: "How big is a typical first engagement?",
    answer:
      "A first engagement is usually a scoped pilot around one high-friction workflow. The goal is to prove value on a narrow operational problem before expanding the footprint.",
  },
  {
    question: "Can you help if we are still early in platform maturity?",
    answer:
      "Yes, as long as there is a real workflow bottleneck worth solving. Early teams often benefit from tightening one repeated operational process before investing in broader internal platform work.",
  },
] as const;
