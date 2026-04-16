import { describe, expect, it } from "vitest";
import { sampleEvents } from "@/lib/data";
import { findNearbyEvents, mapEventRow } from "@/lib/repository";

describe("event repository shaping", () => {
  it("maps event rows into UI-facing event records", () => {
    expect(
      mapEventRow({
        id: "harbourfront-jazz",
        title: "Harbourfront Jazz",
        description: "Skyline views and live jazz.",
        start_time: "2026-07-06T20:00:00-04:00",
        venue_name: "Harbourfront Centre",
        address_text: "235 Queens Quay W, Toronto, ON",
        latitude: 43.6387,
        longitude: -79.3815,
        contact_info: null,
        booking_url: "https://example.com/jazz",
        price_text: "$25",
        category: "Music",
        city_region: "Toronto",
        created_at: "2026-01-01T00:00:00Z",
      }),
    ).toEqual({
      id: "harbourfront-jazz",
      title: "Harbourfront Jazz",
      description: "Skyline views and live jazz.",
      startTime: "2026-07-06T20:00:00-04:00",
      venueName: "Harbourfront Centre",
      addressText: "235 Queens Quay W, Toronto, ON",
      latitude: 43.6387,
      longitude: -79.3815,
      bookingUrl: "https://example.com/jazz",
      priceText: "$25",
      category: "Music",
      cityRegion: "Toronto",
      createdAt: "2026-01-01T00:00:00Z",
    });
  });
});

describe("nearby event discovery", () => {
  it("only returns events inside the radius", () => {
    const results = findNearbyEvents(sampleEvents, {
      latitude: 43.6532,
      longitude: -79.3832,
      radiusKm: 3,
      now: new Date("2026-07-01T12:00:00-04:00"),
    });

    expect(results.every((event) => event.distanceKm <= 3)).toBe(true);
    expect(results.some((event) => event.id === "celebration-square-watch-party")).toBe(false);
  });

  it("excludes past events", () => {
    const results = findNearbyEvents(
      [
        ...sampleEvents,
        {
          ...sampleEvents[0],
          id: "expired-market",
          startTime: "2026-06-01T12:00:00-04:00",
        },
      ],
      {
        latitude: 43.6532,
        longitude: -79.3832,
        radiusKm: 10,
        now: new Date("2026-07-01T12:00:00-04:00"),
      },
    );

    expect(results.some((event) => event.id === "expired-market")).toBe(false);
  });

  it("applies category filters", () => {
    const results = findNearbyEvents(sampleEvents, {
      latitude: 43.6532,
      longitude: -79.3832,
      radiusKm: 15,
      selectedCategories: ["Food"],
      now: new Date("2026-07-01T12:00:00-04:00"),
    });

    expect(results.map((event) => event.category)).toEqual(["Food"]);
  });

  it("sorts by distance first and then upcoming start time", () => {
    const results = findNearbyEvents(sampleEvents, {
      latitude: 43.6532,
      longitude: -79.3832,
      radiusKm: 50,
      now: new Date("2026-07-01T12:00:00-04:00"),
    });

    expect(results[0]?.id).toBe("ago-after-hours");
    expect(results[1]?.id).toBe("kensington-tasting-walk");
  });
});
