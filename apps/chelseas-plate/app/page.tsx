import { RestaurantDirectory } from "@/components/restaurant-directory";
import { allergenOptions, restaurants } from "@/lib/data";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-chip-row">
          <span className="hero-chip">5 Canadian chains</span>
          <span className="hero-chip">Restaurant-first browsing</span>
          <span className="hero-chip">Allergen-aware filtering</span>
        </div>
        <h1>Chelsea&apos;s Plate</h1>
        <p>
          Pick a fast-food restaurant, scan the menu, and exclude allergens before you order. The goal is simple:
          help people with food allergies see what still looks possible at a glance.
        </p>
        <div className="chip-row" style={{ marginTop: "20px" }}>
          {allergenOptions.slice(0, 6).map((allergen) => (
            <span key={allergen} className="tag">
              {allergen}
            </span>
          ))}
        </div>
      </section>

      <RestaurantDirectory restaurants={restaurants} />
    </main>
  );
}
