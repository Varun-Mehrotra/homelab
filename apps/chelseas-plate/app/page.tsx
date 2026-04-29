import { getRestaurants } from "@/lib/repository";
import { RestaurantDirectory } from "@/components/restaurant-directory";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const restaurants = await getRestaurants();

  return (
    <main>
      <div className="cover">
        <div className="cover-vol">
          <span>The Field Guide</span>
          <span>For sensitive stomachs</span>
        </div>
        <h1>
          Eat <em>without</em> the worry.
        </h1>
        <p className="cover-lede">
          A pocket guide to a curated chain restaurant menu, filtered by the ingredients your gut would rather skip.
        </p>
        <div className="cover-deck">
          <div>
            <strong>Pick a chain.</strong>
            Browse the index below. Each entry runs to the current curated menu.
          </div>
          <div>
            <strong>Tell us what to skip.</strong>
            Tap allergen toggles. We&apos;ll mark every item instantly.
          </div>
          <div>
            <strong>Order with confidence.</strong>
            See ingredients, know what to skip, eat without worry.
          </div>
        </div>
      </div>

      <RestaurantDirectory restaurants={restaurants} />
    </main>
  );
}
