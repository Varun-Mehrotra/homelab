import { describe, expect, it } from "vitest";
import { validateEventSubmission, validateRadius } from "@/lib/validation";

describe("event submission validation", () => {
  it("fails when required fields are missing", () => {
    const result = validateEventSubmission({
      title: "",
      description: "",
      startTime: "",
      venueName: "",
      addressText: "",
      latitude: "",
      longitude: "",
      contactInfo: "",
      bookingUrl: "",
      priceText: "",
      category: "",
      cityRegion: "",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation failure.");
    }

    expect(result.fieldErrors.title).toBeDefined();
    expect(result.fieldErrors.description).toBeDefined();
    expect(result.fieldErrors.startTime).toBeDefined();
    expect(result.fieldErrors.venueName).toBeDefined();
    expect(result.fieldErrors.priceText).toBeDefined();
  });

  it("fails when neither contact info nor booking link is present", () => {
    const result = validateEventSubmission({
      title: "AGO Late",
      description: "An arts night.",
      startTime: "2026-07-08T21:00",
      venueName: "AGO",
      addressText: "317 Dundas St W",
      latitude: "43.6536",
      longitude: "-79.3925",
      contactInfo: "",
      bookingUrl: "",
      priceText: "$30",
      category: "Arts",
      cityRegion: "Toronto",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation failure.");
    }

    expect(result.fieldErrors.contactInfo).toMatch(/contact/i);
    expect(result.fieldErrors.bookingUrl).toMatch(/booking/i);
  });

  it("rejects invalid coordinates, dates, and negative radius inputs", () => {
    expect(validateRadius(-4)).toEqual({
      success: false,
      message: "Radius must be a positive number.",
    });

    const result = validateEventSubmission({
      title: "AGO Late",
      description: "An arts night.",
      startTime: "not-a-date",
      venueName: "AGO",
      addressText: "317 Dundas St W",
      latitude: "50",
      longitude: "-100",
      contactInfo: "hello@example.com",
      bookingUrl: "https://example.com",
      priceText: "$30",
      category: "Arts",
      cityRegion: "Toronto",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation failure.");
    }

    expect(result.fieldErrors.startTime).toBeDefined();
    expect(result.fieldErrors.latitude).toBeDefined();
    expect(result.fieldErrors.longitude).toBeDefined();
  });
});
