import { NextResponse } from "next/server";
import {
  createReservation,
  listReservations,
  ServiceError,
} from "@/services/reservation.service";
import {
  validateCreateReservationInput,
  validateReservationFilter,
} from "@/validators/reservation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawFilter = {
      userId: searchParams.get("userId") ?? undefined,
      resourceId: searchParams.get("resourceId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
    };

    const filterResult = validateReservationFilter(rawFilter);
    if (!filterResult.success) {
      return NextResponse.json(
        {
          message: "Invalid reservation filter parameters.",
          errors: filterResult.errors,
        },
        { status: 400 }
      );
    }

    const reservations = await listReservations(filterResult.data);
    return NextResponse.json(reservations, { status: 200 });
  } catch (error) {
    console.error("GET /api/reservations error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve reservations." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Malformed JSON in request body." },
        { status: 400 }
      );
    }

    const validation = validateCreateReservationInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed.", errors: validation.errors },
        { status: 400 }
      );
    }

    const reservation = await createReservation(validation.data);
    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (error instanceof ServiceError) {
      const statusMap: Record<string, number> = {
        CONFLICT: 409,
        NOT_FOUND: 404,
        BAD_REQUEST: 400,
        INTERNAL: 500,
      };
      const status = statusMap[error.code] || 400;
      return NextResponse.json({ message: error.message }, { status });
    }

    console.error("POST /api/reservations error:", error);
    return NextResponse.json(
      { message: "Failed to create reservation." },
      { status: 500 }
    );
  }
}
