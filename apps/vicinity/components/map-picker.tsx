"use client";

import React from "react";
import { mapLocations, type SearchLocation } from "@/lib/data";

type MapPickerProps = {
  label: string;
  value: SearchLocation;
  onChange: (location: SearchLocation) => void;
  note?: string;
};

const markerPositions: Record<string, { left: string; top: string }> = {
  "Downtown Toronto": { left: "49%", top: "51%" },
  "The Distillery District": { left: "57%", top: "58%" },
  "High Park": { left: "31%", top: "53%" },
  "North York Centre": { left: "56%", top: "28%" },
  "Scarborough Town Centre": { left: "82%", top: "34%" },
  "Port Credit": { left: "15%", top: "76%" },
  "Vaughan Metropolitan Centre": { left: "38%", top: "16%" },
};

export function MapPicker({ label, value, onChange, note }: MapPickerProps) {
  const activePosition = markerPositions[value.label] ?? { left: "49%", top: "51%" };

  return (
    <div className="map-card">
      <div className="section-heading">
        <div>
          <h2>{label}</h2>
          <p className="map-note">{note ?? "Pick a GTA anchor point to search around or attach to your event."}</p>
        </div>
      </div>

      <div className="map-surface" aria-label={label} role="group">
        {mapLocations.map((location) => {
          const position = markerPositions[location.label];

          return (
            <button
              key={location.label}
              className="map-marker"
              data-active={location.label === value.label}
              style={{ left: position.left, top: position.top }}
              type="button"
              onClick={() => onChange(location)}
            >
              {location.label}
            </button>
          );
        })}
        <div
          className="map-pin"
          aria-hidden="true"
          style={{ left: activePosition.left, top: activePosition.top }}
        />
      </div>

      <div className="map-footer">
        <div className="coordinate-pill">
          <strong>{value.label}</strong>
          <div>
            {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </div>
        </div>
        <div className="legend-row" aria-hidden="true">
          <span className="legend-pill">Lake Ontario edge</span>
          <span className="legend-pill">Urban core to GTA nodes</span>
        </div>
      </div>
    </div>
  );
}
