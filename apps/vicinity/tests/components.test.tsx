import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateEventForm } from "@/components/create-event-form";
import { DiscoveryExperience } from "@/components/discovery-experience";
import { categories, defaultMapLocation, sampleEvents, torontoRegions } from "@/lib/data";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("discovery experience", () => {
  it("switches to device location when geolocation succeeds", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({
        coords: {
          latitude: 43.65,
          longitude: -79.39,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      } as GeolocationPosition),
    );

    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition,
      },
    });

    render(<DiscoveryExperience categories={categories} events={sampleEvents} />);

    await user.click(screen.getByRole("button", { name: /use device location/i }));

    expect(getCurrentPosition).toHaveBeenCalled();
    expect(screen.getByText(/device location active/i)).toBeInTheDocument();
  });

  it("updates results when radius or categories change", async () => {
    const user = userEvent.setup();

    render(<DiscoveryExperience categories={categories} events={sampleEvents} />);

    expect(screen.getAllByRole("article")).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "Food" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);

    fireEvent.change(screen.getByRole("slider", { name: /search radius/i }), {
      target: { value: "2" },
    });

    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
});

describe("create event form", () => {
  it("shows validation errors and succeeds with a valid submission", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockResolvedValueOnce({
        success: false,
        message: "Please fix the highlighted fields.",
        fieldErrors: { title: "Title is required." },
      })
      .mockResolvedValueOnce({
        success: true,
        message: "Your event is live and ready to be discovered.",
      });

    render(
      <CreateEventForm
        action={action}
        categories={categories}
        defaultLocation={defaultMapLocation}
        regions={torontoRegions}
      />,
    );

    await user.click(screen.getByRole("button", { name: /publish event/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/event title/i), "AGO After Hours");
    await user.type(screen.getByLabelText(/start time/i), "2026-07-08T21:00");
    await user.type(screen.getByLabelText(/venue or place/i), "AGO");
    await user.type(screen.getByLabelText(/^price$/i), "$35");
    await user.type(screen.getByLabelText(/description/i), "An art-filled late evening.");
    await user.type(screen.getByLabelText(/contact information/i), "events@ago.ca");

    await user.click(screen.getByRole("button", { name: /publish event/i }));
    expect(await screen.findByText(/event is live/i)).toBeInTheDocument();
  });
});
