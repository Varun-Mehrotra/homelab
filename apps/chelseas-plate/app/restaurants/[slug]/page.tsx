import { notFound } from "next/navigation";
import { MenuBrowser } from "@/components/menu-browser";
import { TransitionLink } from "@/components/transition-link";
import { getAllergens, getMenuItemsForRestaurant, getRestaurantBySlug } from "@/lib/repository";

export const dynamic = "force-dynamic";

type RestaurantPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const [allergens, items] = await Promise.all([getAllergens(), getMenuItemsForRestaurant(restaurant.id)]);

  return (
    <main className="restaurant-page">
      <div className="crumb-rail">
        <TransitionLink className="crumb" href="/" direction="back">
          ← Back to the index
        </TransitionLink>
      </div>
      <div className="page-head">
        <div className="folio">The Menu</div>
        <h1 className="page-title">{restaurant.name}</h1>
        {restaurant.cuisineHint && <div className="page-tagline">{restaurant.cuisineHint}</div>}
        <div className="double-rule" />
      </div>

      <MenuBrowser items={items} availableAllergens={allergens} />
    </main>
  );
}
