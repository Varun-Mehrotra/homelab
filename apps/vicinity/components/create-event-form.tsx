"use client";

import React from "react";
import { useState, useTransition } from "react";
import { createEventAction, type CreateEventActionState } from "@/app/create/actions";
import { MapPicker } from "@/components/map-picker";
import { type Category, type CityRegion, type SearchLocation } from "@/lib/data";

type CreateEventFormProps = {
  categories: Category[];
  regions: CityRegion[];
  defaultLocation: SearchLocation;
  action?: typeof createEventAction;
};

const initialState: CreateEventActionState = { success: false };

export function CreateEventForm({ categories, regions, defaultLocation, action = createEventAction }: CreateEventFormProps) {
  const [state, setState] = useState<CreateEventActionState>(initialState);
  const [location, setLocation] = useState(defaultLocation);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextState = await action(state, formData);
      setState(nextState);
    });
  }

  return (
    <form className="form-card" noValidate onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field-block">
          <label className="field-label" htmlFor="title">
            Event title
          </label>
          <input className="text-input" id="title" name="title" required />
          {state.fieldErrors?.title ? <span className="error-text">{state.fieldErrors.title}</span> : null}
        </div>

        <div className="field-block">
          <label className="field-label" htmlFor="category">
            Category
          </label>
          <select className="select-input" defaultValue={categories[0]} id="category" name="category">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {state.fieldErrors?.category ? <span className="error-text">{state.fieldErrors.category}</span> : null}
        </div>

        <div className="field-block">
          <label className="field-label" htmlFor="startTime">
            Start time
          </label>
          <input className="text-input" id="startTime" name="startTime" required type="datetime-local" />
          {state.fieldErrors?.startTime ? <span className="error-text">{state.fieldErrors.startTime}</span> : null}
        </div>

        <div className="field-block">
          <label className="field-label" htmlFor="venueName">
            Venue or place
          </label>
          <input className="text-input" id="venueName" name="venueName" required />
          {state.fieldErrors?.venueName ? <span className="error-text">{state.fieldErrors.venueName}</span> : null}
        </div>

        <div className="field-block">
          <label className="field-label" htmlFor="cityRegion">
            Toronto/GTA region
          </label>
          <select className="select-input" defaultValue={regions[0]} id="cityRegion" name="cityRegion">
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          {state.fieldErrors?.cityRegion ? <span className="error-text">{state.fieldErrors.cityRegion}</span> : null}
        </div>

        <div className="field-block">
          <label className="field-label" htmlFor="priceText">
            Price
          </label>
          <input className="text-input" id="priceText" name="priceText" placeholder="Free, $25, From $40" required />
          {state.fieldErrors?.priceText ? <span className="error-text">{state.fieldErrors.priceText}</span> : null}
        </div>
      </div>

      <div className="field-block" style={{ marginTop: "18px" }}>
        <label className="field-label" htmlFor="description">
          Description
        </label>
        <textarea className="text-area" id="description" name="description" required />
        {state.fieldErrors?.description ? <span className="error-text">{state.fieldErrors.description}</span> : null}
      </div>

      <div className="form-grid" style={{ marginTop: "18px" }}>
        <div className="field-block">
          <label className="field-label" htmlFor="addressText">
            Address or meetup details
          </label>
          <input className="text-input" id="addressText" name="addressText" />
        </div>

        <div className="field-block">
          <label className="field-label" htmlFor="contactInfo">
            Contact information
          </label>
          <input className="text-input" id="contactInfo" name="contactInfo" placeholder="events@example.com or phone" />
          {state.fieldErrors?.contactInfo ? <span className="error-text">{state.fieldErrors.contactInfo}</span> : null}
        </div>

        <div className="field-block">
          <label className="field-label" htmlFor="bookingUrl">
            Booking link
          </label>
          <input className="text-input" id="bookingUrl" name="bookingUrl" placeholder="https://..." type="url" />
          {state.fieldErrors?.bookingUrl ? <span className="error-text">{state.fieldErrors.bookingUrl}</span> : null}
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <MapPicker
          label="Event location"
          note="Pick the closest GTA area marker so the event can show up inside radius-based discovery."
          value={location}
          onChange={setLocation}
        />
        <input name="latitude" type="hidden" value={location.latitude} readOnly />
        <input name="longitude" type="hidden" value={location.longitude} readOnly />
        {state.fieldErrors?.latitude ? <span className="error-text">{state.fieldErrors.latitude}</span> : null}
        {state.fieldErrors?.longitude ? <span className="error-text">{state.fieldErrors.longitude}</span> : null}
      </div>

      <div className="inline-actions" style={{ marginTop: "24px" }}>
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Publishing event..." : "Publish event"}
        </button>
        {state.message ? (
          <span className="status-pill" data-tone={state.success ? "success" : "error"}>
            {state.message}
          </span>
        ) : (
          <span className="form-note">At least one of contact information or booking URL is required.</span>
        )}
      </div>
    </form>
  );
}
