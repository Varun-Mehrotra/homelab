# AGENTS.md

This file captures the current working context for the `homelab` repository so future agents can get productive quickly without re-discovering the same repo and infrastructure details.

## Repository Overview

- Repo name: `homelab`
- Primary purpose: personal homelab infrastructure and app deployments on a small k3s cluster
- Main infrastructure model:
  - Kubernetes via `k3s`
  - Flux-managed manifests under `flux/`
  - Traefik ingress
  - MetalLB for LAN ingress IPs
  - Container images published to `ghcr.io`

## Cluster Facts

These were either documented in `README.md` or confirmed live with `kubectl`.

- Cluster type: `k3s`
- Control plane:
  - `pi-node-1`
  - IP: `10.88.111.37`
- Worker:
  - `pi-node-2`
  - IP: `10.88.111.34`
- Current node architecture:
  - `linux/arm64`
- Observed Kubernetes version:
  - `v1.33.4+k3s1`
- Container runtime:
  - `containerd://2.0.5-k3s2`

Important implication:

- App images must support `linux/arm64` to run on this cluster.
- A prior `devops` deployment failure was caused by an image manifest mismatch, not by Kubernetes version incompatibility.

## Repo Layout

Top-level directories currently in active use:

- `apps/`
  - deployable applications
- `flux/`
  - Flux-managed Kubernetes manifests, organized by namespace
- `supabase/`
  - schema and seed data for Supabase-backed apps

Current app folders:

- `apps/chelseas-plate`
  - Next.js app
  - has tests
- `apps/vicinity`
  - Next.js app
  - has tests
- `apps/devops`
  - Next.js marketing site
  - currently no test suite
- `apps/osrs-flip-recommender`
  - Python app

## Flux Layout

Flux manifests are organized by namespace under `flux/<namespace>/`.

Current managed namespaces in `flux/kustomization.yaml`:

- `flux-system`
- `devops`
- `chelseas-plate`
- `default`
- `kube-system`
- `metallb-system`
- `vicinity`
- `freshrss`
- `ntfy`
- `osrs-flips`

Common namespace manifest shape for app workloads:

- `namespace.yaml`
- `deployment.yaml`
- `service.yaml`
- `ingress.yaml`
- `kustomization.yaml`

## Deployment Conventions

### Container Registry

- Registry: `ghcr.io`
- Current GitHub repo remote:
  - `https://github.com/Varun-Mehrotra/homelab.git`
- Existing image naming convention:
  - `ghcr.io/varun-mehrotra/<app-name>:latest`

### Image Pull Secret

Many namespaces rely on a manually created secret named:

- `ghcr-creds`

This secret must exist in the target namespace before image pulls can succeed.

### Ingress Pattern

Apps exposed through Traefik generally use:

- `ingressClassName: traefik`
- Traefik TLS annotations
- `webguru.ca` subdomains

Examples:

- `chelseas-plate.webguru.ca`
- `devops.webguru.ca`

## CI/CD Conventions

Workflow files live under `.github/workflows/`.

Current workflows:

- `.github/workflows/chelseas-plate.yml`
- `.github/workflows/vicinity.yml`
- `.github/workflows/devops.yml`

Observed pattern for Next.js apps:

- trigger on PRs to `main`, pushes to `main`, and `workflow_dispatch`
- scope workflow by app-specific paths
- run a Node 22 install/build step
- build and publish Docker images to GHCR on pushes to `main`

### Image Platform Requirement

Because the cluster nodes are `arm64`, deployable images must include:

- `linux/arm64`

For `devops`, the GitHub workflow now publishes only:

- `linux/arm64`

Note:

- `devops` originally failed with `no match for platform in manifest` until `arm64` image output was added.

## App Notes

### `apps/devops`

Purpose:

- single-page marketing site for WebGuru’s AI-assisted internal tooling offering for DevOps, platform engineering, and SRE teams

Tech stack:

- Next.js
- TypeScript
- Tailwind CSS v4
- Framer Motion

Key files:

- `apps/devops/app/page.tsx`
- `apps/devops/app/layout.tsx`
- `apps/devops/app/globals.css`
- `apps/devops/lib/site.ts`
- `apps/devops/components/`
- `apps/devops/Dockerfile`

Branding defaults currently configured:

- brand name: `WebGuru`
- email: `info@webguru.ca`
- LinkedIn: `https://www.linkedin.com/company/webguru-canada`
- primary CTA: `https://calendly.com/webguru-ca/webguru-ai-enablement-intro-call`

Current known placeholder still worth reviewing:

- `githubHref` in `apps/devops/lib/site.ts` is still a generic `https://github.com/` placeholder unless updated later.

Ingress:

- host: `devops.webguru.ca`

Deployment namespace:

- `devops`

Image:

- `ghcr.io/varun-mehrotra/devops:latest`

CI behavior:

- workflow file: `.github/workflows/devops.yml`
- currently runs install + build
- currently does not run tests because no test suite exists yet

### `apps/chelseas-plate`

Purpose:

- allergy-aware restaurant/menu browsing app using live McDonald’s Canada data

Tech stack:

- Next.js
- TypeScript
- Supabase
- Vitest

Related directories:

- `supabase/chelseas-plate`
- `flux/chelseas-plate`

Ingress:

- `chelseas-plate.webguru.ca`

### `apps/vicinity`

Purpose:

- location/event-related Next.js app

Tech stack:

- Next.js
- TypeScript
- Supabase
- Vitest

Related directories:

- `supabase/vicinity`
- `flux/vicinity`

## Manual Secrets and External Requirements

This repo does not fully bootstrap secrets automatically. Several workloads require manual secret creation before Flux reconciliation succeeds.

Documented required secrets from `README.md`:

- `chelseas-plate/ghcr-creds`
- `chelseas-plate/chelseas-plate-secrets`
- `default/ghcr-creds`
- `vicinity/ghcr-creds`
- `vicinity/vicinity-secrets`
- `freshrss/freshrss-bootstrap`
- `ntfy/ntfy-auth`
- `osrs-flips/ghcr-creds`
- `osrs-flips/osrs-recommender-secrets`

Observed additional namespace requirement:

- `devops/ghcr-creds`

Expected secret contents, based on repo docs:

- `ghcr-creds`
  - Docker auth for `ghcr.io`
- `chelseas-plate-secrets`
  - `supabase-url`
  - `supabase-anon-key`
  - `supabase-service-role-key`
- `vicinity-secrets`
  - `supabase-url`
  - `supabase-anon-key`
  - `supabase-service-role-key`
- `freshrss-bootstrap`
  - `FRESHRSS_INSTALL`
  - `FRESHRSS_USER`
- `ntfy-auth`
  - `NTFY_AUTH_USERS`
  - `NTFY_AUTH_ACCESS`
  - `NTFY_AUTH_TOKENS`
- `osrs-recommender-secrets`
  - `NTFY_TOKEN`

## Operational Notes

### Useful Validation Commands

Check pods in a namespace:

```sh
kubectl get pods -n <namespace> -o wide
```

Inspect recent failure reasons:

```sh
kubectl get events -n <namespace> --sort-by=.lastTimestamp | tail -n 40
```

Inspect deployment state:

```sh
kubectl get deployment <name> -n <namespace> -o yaml
```

Check cluster architecture:

```sh
kubectl get nodes -o wide -L kubernetes.io/arch,kubernetes.io/os
```

### Known `devops` Deployment Failure Pattern

If `devops` fails to pull with:

- `no match for platform in manifest`

then the likely fix is:

- rebuild and publish an image including `linux/arm64`

This is not a Kubernetes API version compatibility problem.

## Working Style Notes For Future Agents

- Prefer matching existing app and Flux patterns instead of inventing new deployment structure.
- For file search, `rg` is effective in this repo.
- This repo may have unrelated uncommitted changes; do not revert them unless explicitly asked.
- For Kubernetes debugging here, check live pod events before assuming app/runtime problems.
- For new deployable web apps, remember:
  - add `apps/<name>`
  - add `flux/<name>`
  - register namespace in `flux/kustomization.yaml`
  - add a GitHub workflow for CI/CD
  - ensure Docker output includes `linux/arm64` if the app will run on the Raspberry Pi cluster
