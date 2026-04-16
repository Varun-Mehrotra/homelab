import { RestaurantDirectory } from "@/components/restaurant-directory";
import { getAllergens, getRestaurants } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allergens, restaurants] = await Promise.all([getAllergens(), getRestaurants()]);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-chip-row">
          <span className="hero-chip">Live McDonald&apos;s Canada data</span>
          <span className="hero-chip">Restaurant-first browsing</span>
          <span className="hero-chip">Ingredient-backed allergen flags</span>
        </div>
        <h1>Chelsea&apos;s Plate</h1>
        <p>
          Browse McDonald&apos;s Canada menu data, search specific items, and exclude allergens before you order. The
          goal is simple: help people with food allergies see what still looks possible at a glance.
        </p>
        <div className="chip-row" style={{ marginTop: "20px" }}>
          {allergens.slice(0, 6).map((allergen) => (
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
