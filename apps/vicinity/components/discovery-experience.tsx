"use client";

import React from "react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { EventCard } from "@/components/event-card";
import { MapPicker } from "@/components/map-picker";
import { clampRadius } from "@/lib/geo";
import { defaultMapLocation, type Category, type EventRecord, type SearchLocation } from "@/lib/data";
import { findNearbyEvents } from "@/lib/repository";

type DiscoveryExperienceProps = {
  categories: Category[];
  events: EventRecord[];
};

export function DiscoveryExperience({ categories, events }: DiscoveryExperienceProps) {
  const [location, setLocation] = useState<SearchLocation>(defaultMapLocation);
  const [locationSource, setLocationSource] = useState<"map" | "device">("map");
  const [radiusKm, setRadiusKm] = useState(8);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("Showing a downtown-friendly starting point.");
  const deferredRadius = useDeferredValue(radiusKm);
  const deferredCategories = useDeferredValue(selectedCategories);

  const results = useMemo(
    () =>
      findNearbyEvents(events, {
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: deferredRadius,
        selectedCategories: deferredCategories,
      }),
    [deferredCategories, deferredRadius, events, location.latitude, location.longitude],
  );

  async function useDeviceLocation() {
    if (!navigator.geolocation) {
      setStatusMessage("Device geolocation is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(() => {
          setLocationSource("device");
          setLocation({
            label: "Your device location",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setStatusMessage("Using your device location for nearby event discovery.");
        });
      },
      () => {
        setStatusMessage("We could not read your device location, so the map selection is still active.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function toggleCategory(category: Category) {
    startTransition(() => {
      setSelectedCategories((current) =>
        current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category],
      );
    });
  }

  return (
    <>
      <section className="split-layout">
        <div className="controls-column">
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Search nearby</h2>
                <p className="muted">Switch between your device and a GTA map point, then tighten the radius.</p>
              </div>
            </div>

            <div className="field-block">
              <span className="field-label">Location source</span>
              <div className="toolbar-row">
                <button className="secondary-button" type="button" onClick={useDeviceLocation}>
                  Use device location
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setLocationSource("map");
                    setLocation(defaultMapLocation);
                    setStatusMessage("Using the map selection as your search center.");
                  }}
                >
                  Reset to map location
                </button>
              </div>
              <span className="status-pill" data-tone="success">
                {locationSource === "device" ? "Device location active" : "Map location active"}
              </span>
              <p className="muted">{statusMessage}</p>
            </div>

            <div className="field-block">
              <label className="field-label" htmlFor="radius">
                Search radius: {radiusKm} km
              </label>
              <div className="range-wrap">
                <input
                  id="radius"
                  aria-label="Search radius"
                  className="range-input"
                  max={50}
                  min={1}
                  step={1}
                  type="range"
                  value={radiusKm}
                  onChange={(event) => setRadiusKm(clampRadius(Number(event.target.value)))}
                />
              </div>
            </div>

            <div className="field-block">
              <span className="field-label">Interests</span>
              <div className="chip-row">
                {categories.map((category) => (
                  <button
                    key={category}
                    aria-pressed={selectedCategories.includes(category)}
                    className="chip-button"
                    data-active={selectedCategories.includes(category)}
                    type="button"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <MapPicker
            label="Choose a map point"
            note="Tap one of these GTA anchor spots to simulate searching from a hotel, neighborhood, or meetup area."
            value={location}
            onChange={(nextLocation) => {
              setLocationSource("map");
              setLocation(nextLocation);
              setStatusMessage(`Searching around ${nextLocation.label}.`);
            }}
          />
        </div>

        <div>
          <div className="section-heading">
            <div>
              <h2>{results.length} events worth a closer look</h2>
              <p className="muted">
                Results stay inside your radius and are sorted by distance first, then by the soonest upcoming start
                time.
              </p>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="results-grid">
              {results.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="panel result-empty">
              <h3>No events match this radius and interest mix yet.</h3>
              <p className="muted">Try a larger radius, clear a few interests, or switch to another map point.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
