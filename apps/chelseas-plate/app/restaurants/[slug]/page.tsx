import Link from "next/link";
import { notFound } from "next/navigation";
import { MenuBrowser } from "@/components/menu-browser";
import { getMenuItemsForRestaurant, getRestaurantBySlug, restaurants } from "@/lib/data";

type RestaurantPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return restaurants.map((restaurant) => ({
    slug: restaurant.slug,
  }));
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const items = getMenuItemsForRestaurant(restaurant.id);

  return (
    <main className="page-shell">
      <div className="header-row">
        <div>
          <Link className="back-link" href="/">
            Back to restaurants
          </Link>
          <h1 className="page-title" style={{ marginTop: "12px" }}>
            {restaurant.name}
          </h1>
          <p className="subtitle" style={{ fontSize: "1.06rem", maxWidth: "58ch" }}>
            {restaurant.description}
          </p>
        </div>
        <div className="chip-row">
          <span className="tag">{restaurant.cuisineHint}</span>
          <span className="tag">{items.length} seeded menu items</span>
        </div>
      </div>

      <MenuBrowser restaurant={restaurant} items={items} />
    </main>
  );
}
