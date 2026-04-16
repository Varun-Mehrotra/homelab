import { type SearchLocation } from "@/lib/data";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  origin: Pick<SearchLocation, "latitude" | "longitude">,
  destination: Pick<SearchLocation, "latitude" | "longitude">,
) {
  const dLatitude = toRadians(destination.latitude - origin.latitude);
  const dLongitude = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversine =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(dLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

export function formatDistanceKm(distanceKm: number) {
  return `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km away`;
}

export function clampRadius(radiusKm: number) {
  if (Number.isNaN(radiusKm)) {
    return 5;
  }

  return Math.min(50, Math.max(1, radiusKm));
}
