import { categories, torontoRegions, type EventSubmission } from "@/lib/data";

type ValidationFailure = {
  success: false;
  fieldErrors: Record<string, string>;
};

type ValidationSuccess = {
  success: true;
  data: EventSubmission;
};

export type ValidationResult = ValidationFailure | ValidationSuccess;

function trim(value: string) {
  return value.trim();
}

function isValidCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function validateRadius(rawRadius: number) {
  if (!Number.isFinite(rawRadius) || rawRadius <= 0) {
    return { success: false as const, message: "Radius must be a positive number." };
  }

  return { success: true as const, radiusKm: Math.min(50, Math.max(1, rawRadius)) };
}

export function validateEventSubmission(payload: Record<string, string>): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const title = trim(payload.title);
  const description = trim(payload.description);
  const startTime = trim(payload.startTime);
  const venueName = trim(payload.venueName);
  const addressText = trim(payload.addressText);
  const contactInfo = trim(payload.contactInfo);
  const bookingUrl = trim(payload.bookingUrl);
  const priceText = trim(payload.priceText);
  const category = trim(payload.category);
  const cityRegion = trim(payload.cityRegion);
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!title) {
    fieldErrors.title = "Title is required.";
  }

  if (!description) {
    fieldErrors.description = "Description is required.";
  }

  if (!venueName) {
    fieldErrors.venueName = "Venue is required.";
  }

  if (!startTime || Number.isNaN(Date.parse(startTime))) {
    fieldErrors.startTime = "A valid start time is required.";
  }

  if (!priceText) {
    fieldErrors.priceText = "Price is required.";
  }

  if (!contactInfo && !bookingUrl) {
    fieldErrors.contactInfo = "Add contact information or a booking link.";
    fieldErrors.bookingUrl = "Add a booking link or contact information.";
  }

  if (bookingUrl) {
    try {
      const url = new URL(bookingUrl);

      if (!["http:", "https:"].includes(url.protocol)) {
        fieldErrors.bookingUrl = "Booking link must start with http or https.";
      }
    } catch {
      fieldErrors.bookingUrl = "Booking link must be a valid URL.";
    }
  }

  if (!categories.includes(category as EventSubmission["category"])) {
    fieldErrors.category = "Choose one of the supported event categories.";
  }

  if (!torontoRegions.includes(cityRegion as EventSubmission["cityRegion"])) {
    fieldErrors.cityRegion = "Choose a supported Toronto/GTA region.";
  }

  if (!isValidCoordinate(latitude, 43, 44.2)) {
    fieldErrors.latitude = "Pick a location within the Toronto/GTA area.";
  }

  if (!isValidCoordinate(longitude, -80.2, -78.8)) {
    fieldErrors.longitude = "Pick a location within the Toronto/GTA area.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: {
      title,
      description,
      startTime: new Date(startTime).toISOString(),
      venueName,
      addressText,
      latitude,
      longitude,
      contactInfo: contactInfo || undefined,
      bookingUrl: bookingUrl || undefined,
      priceText,
      category: category as EventSubmission["category"],
      cityRegion: cityRegion as EventSubmission["cityRegion"],
    },
  };
}
