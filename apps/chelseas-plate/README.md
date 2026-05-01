# Chelsea's Plate

Chelsea's Plate is a simple restaurant allergy navigator for eating out. Users pick a restaurant, search the menu, and exclude allergens to quickly see which dishes still fit their needs.

The current seed data is a live-generated McDonald's Canada menu snapshot stored in `/Users/varun/projects/homelab/supabase/chelseas-plate/seed.sql`.

## Run locally

```sh
cd apps/chelseas-plate
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Tests

```sh
cd apps/chelseas-plate
npm test
```

## Build and publish

```sh
docker build -t ghcr.io/varun-mehrotra/chelseas-plate:latest ./apps/chelseas-plate
docker push ghcr.io/varun-mehrotra/chelseas-plate:latest
```
