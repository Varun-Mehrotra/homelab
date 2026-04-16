import React from "react";
import { formatDistanceKm } from "@/lib/geo";
import { type EventWithDistance } from "@/lib/repository";

type EventCardProps = {
  event: EventWithDistance;
};

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="event-card">
      <div className="result-tags">
        <span className="tag">{event.category}</span>
        <span className="tag">{event.cityRegion}</span>
      </div>
      <div>
        <h3>{event.title}</h3>
        <p>{event.description}</p>
      </div>
      <div className="event-meta">
        <span>{formatEventTime(event.startTime)}</span>
        <span>{formatDistanceKm(event.distanceKm)}</span>
        <span>{event.priceText}</span>
      </div>
      <div>
        <strong>{event.venueName}</strong>
        <p>{event.addressText}</p>
      </div>
      <div className="inline-actions">
        {event.bookingUrl ? (
          <a className="primary-link" href={event.bookingUrl} target="_blank" rel="noreferrer">
            Book now
          </a>
        ) : null}
        {event.contactInfo ? <span className="tag">Contact: {event.contactInfo}</span> : null}
      </div>
    </article>
  );
}
