"use server";

import { createEvent } from "@/lib/repository";
import { validateEventSubmission } from "@/lib/validation";

export type CreateEventActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function createEventAction(
  _previousState: CreateEventActionState,
  formData: FormData,
): Promise<CreateEventActionState> {
  const payload = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    venueName: String(formData.get("venueName") ?? ""),
    addressText: String(formData.get("addressText") ?? ""),
    latitude: String(formData.get("latitude") ?? ""),
    longitude: String(formData.get("longitude") ?? ""),
    contactInfo: String(formData.get("contactInfo") ?? ""),
    bookingUrl: String(formData.get("bookingUrl") ?? ""),
    priceText: String(formData.get("priceText") ?? ""),
    category: String(formData.get("category") ?? ""),
    cityRegion: String(formData.get("cityRegion") ?? ""),
  };

  const validation = validateEventSubmission(payload);

  if (!validation.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: validation.fieldErrors,
    };
  }

  try {
    await createEvent(validation.data);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to create event right now.",
    };
  }

  return {
    success: true,
    message: "Your event is live and ready to be discovered.",
  };
}
