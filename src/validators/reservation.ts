import type {
  ReservationFilter,
  ValidatedCreateReservationInput,
} from "@/types/reservation";
import { ReservationStatus } from "@prisma/client";

export type ValidationResult<T> =
  | { success: true; data: T; errors?: never }
  | { success: false; data?: never; errors: string[] };

const MAX_PURPOSE_LENGTH = 500;

export function validateReservationId(id: unknown): ValidationResult<number> {
  const numericId = typeof id === "string" ? Number(id) : id;

  if (
    typeof numericId !== "number" ||
    !Number.isInteger(numericId) ||
    numericId <= 0
  ) {
    return {
      success: false,
      errors: ["Reservation ID must be a positive integer."],
    };
  }

  return { success: true, data: numericId };
}

function parseAndValidateDate(value: unknown, fieldName: string): { date: Date | null; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { date: null, error: `${fieldName} is required.` };
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (isNaN(date.getTime())) {
    return { date: null, error: `${fieldName} must be a valid date.` };
  }

  return { date };
}

export function validateCreateReservationInput(
  input: unknown
): ValidationResult<ValidatedCreateReservationInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return {
      success: false,
      errors: ["Request body must be a valid JSON object."],
    };
  }

  const payload = input as Record<string, unknown>;

  // User ID
  const userIdNum =
    typeof payload.userId === "string" ? Number(payload.userId) : payload.userId;
  if (
    typeof userIdNum !== "number" ||
    !Number.isInteger(userIdNum) ||
    userIdNum <= 0
  ) {
    errors.push("User ID must be a positive integer.");
  }

  // Resource ID
  const resourceIdNum =
    typeof payload.resourceId === "string"
      ? Number(payload.resourceId)
      : payload.resourceId;
  if (
    typeof resourceIdNum !== "number" ||
    !Number.isInteger(resourceIdNum) ||
    resourceIdNum <= 0
  ) {
    errors.push("Resource ID must be a positive integer.");
  }

  // Start & End Time
  const { date: startTime, error: startError } = parseAndValidateDate(
    payload.startTime,
    "Start time"
  );
  if (startError) errors.push(startError);

  const { date: endTime, error: endError } = parseAndValidateDate(
    payload.endTime,
    "End time"
  );
  if (endError) errors.push(endError);

  if (startTime && endTime) {
    if (startTime.getTime() >= endTime.getTime()) {
      errors.push("End time must be after start time.");
    }
  }

  // Purpose
  let purpose = "";
  if (
    typeof payload.purpose !== "string" ||
    payload.purpose.trim().length === 0
  ) {
    errors.push("Purpose is required.");
  } else {
    purpose = payload.purpose.trim();
    if (purpose.length > MAX_PURPOSE_LENGTH) {
      errors.push(
        `Purpose must not exceed ${MAX_PURPOSE_LENGTH} characters.`
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      userId: userIdNum as number,
      resourceId: resourceIdNum as number,
      startTime: startTime as Date,
      endTime: endTime as Date,
      purpose,
    },
  };
}

export function validateReservationFilter(
  query: unknown
): ValidationResult<ReservationFilter> {
  if (!query || typeof query !== "object") {
    return { success: true, data: {} };
  }

  const params = query as Record<string, unknown>;
  const filter: ReservationFilter = {};
  const errors: string[] = [];

  if (params.userId !== undefined && params.userId !== "") {
    const userIdNum = Number(params.userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      errors.push("User ID filter must be a positive integer.");
    } else {
      filter.userId = userIdNum;
    }
  }

  if (params.resourceId !== undefined && params.resourceId !== "") {
    const resourceIdNum = Number(params.resourceId);
    if (!Number.isInteger(resourceIdNum) || resourceIdNum <= 0) {
      errors.push("Resource ID filter must be a positive integer.");
    } else {
      filter.resourceId = resourceIdNum;
    }
  }

  if (params.status !== undefined && params.status !== "") {
    if (
      params.status === ReservationStatus.CONFIRMED ||
      params.status === ReservationStatus.CANCELLED
    ) {
      filter.status = params.status as ReservationStatus;
    } else {
      errors.push(
        `Status filter must be either ${ReservationStatus.CONFIRMED} or ${ReservationStatus.CANCELLED}.`
      );
    }
  }

  if (params.startDate !== undefined && params.startDate !== "") {
    const startDate = new Date(String(params.startDate));
    if (isNaN(startDate.getTime())) {
      errors.push("Start date filter must be a valid date.");
    } else {
      filter.startDate = startDate;
    }
  }

  if (params.endDate !== undefined && params.endDate !== "") {
    const endDate = new Date(String(params.endDate));
    if (isNaN(endDate.getTime())) {
      errors.push("End date filter must be a valid date.");
    } else {
      filter.endDate = endDate;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: filter };
}
