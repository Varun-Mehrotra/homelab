import { calculateDistanceKm } from "@/lib/geo";
import { categories, sampleEvents, type Category, type EventRecord, type EventSubmission } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase";

type EventRow = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  venue_name: string;
  address_text: string;
  latitude: number;
  longitude: number;
  contact_info: string | null;
  booking_url: string | null;
  price_text: string;
  category: Category;
  city_region: EventRecord["cityRegion"];
  created_at: string;
};

export type EventWithDistance = EventRecord & {
  distanceKm: number;
};

type NearbyOptions = {
  latitude: number;
  longitude: number;
  radiusKm: number;
  selectedCategories?: Category[];
  now?: Date;
};

export function mapEventRow(row: EventRow): EventRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    venueName: row.venue_name,
    addressText: row.address_text,
    latitude: row.latitude,
    longitude: row.longitude,
    contactInfo: row.contact_info ?? undefined,
    bookingUrl: row.booking_url ?? undefined,
    priceText: row.price_text,
    category: row.category,
    cityRegion: row.city_region,
    createdAt: row.created_at,
  };
}

export function getCategories() {
  return Promise.resolve(categories);
}

export function isUpcomingEvent(event: EventRecord, now = new Date()) {
  return new Date(event.startTime).getTime() >= now.getTime();
}

export function sortNearbyEvents(left: EventWithDistance, right: EventWithDistance) {
  if (left.distanceKm !== right.distanceKm) {
    return left.distanceKm - right.distanceKm;
  }

  return new Date(left.startTime).getTime() - new Date(right.startTime).getTime();
}

export function findNearbyEvents(events: EventRecord[], options: NearbyOptions) {
  const selectedCategories = options.selectedCategories ?? [];
  const now = options.now ?? new Date();

  return events
    .filter((event) => isUpcomingEvent(event, now))
    .filter((event) => selectedCategories.length === 0 || selectedCategories.includes(event.category))
    .map((event) => ({
      ...event,
      distanceKm: calculateDistanceKm(options, event),
    }))
    .filter((event) => event.distanceKm <= options.radiusKm)
    .sort(sortNearbyEvents);
}

export async function getUpcomingEvents() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return sampleEvents;
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, description, start_time, venue_name, address_text, latitude, longitude, contact_info, booking_url, price_text, category, city_region, created_at",
    )
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(`Failed to load events: ${error.message}`);
  }

  return (data as EventRow[]).map(mapEventRow);
}

export async function createEvent(submission: EventSubmission) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Event creation requires Supabase to be configured.");
  }

  const { error } = await supabase.from("events").insert({
    id: globalThis.crypto.randomUUID(),
    title: submission.title,
    description: submission.description,
    start_time: submission.startTime,
    venue_name: submission.venueName,
    address_text: submission.addressText,
    latitude: submission.latitude,
    longitude: submission.longitude,
    contact_info: submission.contactInfo ?? null,
    booking_url: submission.bookingUrl ?? null,
    price_text: submission.priceText,
    category: submission.category,
    city_region: submission.cityRegion,
  });

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }
}
