import Link from "next/link";
import { notFound } from "next/navigation";
import { MenuBrowser } from "@/components/menu-browser";
import { getMenuItemsForRestaurant, getRestaurantBySlug } from "@/lib/repository";

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

  const items = await getMenuItemsForRestaurant(restaurant.id);

  return (
    <main>
      <div className="page-head">
        <Link className="crumb" href="/">
          ← Back to the index
        </Link>
        <div className="folio">The Menu</div>
        <h1 className="page-title">{restaurant.name}</h1>
        {restaurant.cuisineHint && <div className="page-tagline">{restaurant.cuisineHint}</div>}
        <div className="double-rule" />
      </div>

      <MenuBrowser items={items} />
    </main>
  );
}
