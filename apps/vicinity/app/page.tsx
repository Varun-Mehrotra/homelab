import Link from "next/link";
import { DiscoveryExperience } from "@/components/discovery-experience";
import { getCategories, getUpcomingEvents } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, events] = await Promise.all([getCategories(), getUpcomingEvents()]);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-chip-row">
          <span className="hero-chip">Toronto + GTA</span>
          <span className="hero-chip">Location-based event discovery</span>
          <span className="hero-chip">Traveler and local friendly</span>
        </div>
        <div className="hero-topline">
          <div>
            <p className="eyebrow">Vicinity</p>
            <h1>Find what is happening around you, not just what is famous.</h1>
            <p className="hero-copy">
              Pick your location from your device or the map, set a radius, and browse upcoming events that match the
              kind of day or night you want to have in Toronto and the GTA.
            </p>
          </div>
          <Link className="primary-link" href="/create">
            Create a new event
          </Link>
        </div>
      </section>

      <DiscoveryExperience categories={categories} events={events} />
    </main>
  );
}
