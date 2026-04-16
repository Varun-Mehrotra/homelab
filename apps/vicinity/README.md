# Vicinity

Vicinity is a Toronto/GTA event discovery MVP for travelers and locals who want to rediscover the city.

## Run locally

```sh
cd apps/vicinity
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment

Vicinity reads from Supabase when these variables are set:

```sh
export SUPABASE_URL='https://<project-ref>.supabase.co'
export SUPABASE_ANON_KEY='<anon-key>'
export SUPABASE_SERVICE_ROLE_KEY='<service-role-key>'
```

If Supabase is not configured, the app falls back to bundled sample Toronto/GTA events for browsing. Creating events still requires Supabase.

## Tests

```sh
cd apps/vicinity
npm test
```

## Build and publish

```sh
docker build -t ghcr.io/varun-mehrotra/vicinity:latest ./apps/vicinity
docker push ghcr.io/varun-mehrotra/vicinity:latest
```

## Supabase

Apply the schema and optional seed data:

```sh
psql "$SUPABASE_DB_URL" -f supabase/vicinity/migrations/001_schema.sql
psql "$SUPABASE_DB_URL" -f supabase/vicinity/seed.sql
```
