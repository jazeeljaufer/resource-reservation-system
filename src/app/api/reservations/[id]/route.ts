import { NextResponse } from "next/server";
import {
  cancelReservation,
  getReservationById,
  ServiceError,
} from "@/services/reservation.service";
import { validateReservationId } from "@/validators/reservation";
import { ReservationStatus } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = validateReservationId(id);

    if (!idValidation.success) {
      return NextResponse.json(
        { message: "Invalid reservation ID.", errors: idValidation.errors },
        { status: 400 }
      );
    }

    const reservation = await getReservationById(idValidation.data);
    if (!reservation) {
      return NextResponse.json(
        { message: `Reservation with ID ${idValidation.data} was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation, { status: 200 });
  } catch (error) {
    console.error("GET /api/reservations/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve reservation." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = validateReservationId(id);

    if (!idValidation.success) {
      return NextResponse.json(
        { message: "Invalid reservation ID.", errors: idValidation.errors },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Malformed JSON in request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    // Disallow arbitrary changes that bypass conflict checks
    if (
      payload.startTime !== undefined ||
      payload.endTime !== undefined ||
      payload.resourceId !== undefined ||
      payload.userId !== undefined
    ) {
      return NextResponse.json(
        {
          message:
            "Modifying reservation schedule or resource directly is not permitted. Please cancel and create a new reservation.",
        },
        { status: 400 }
      );
    }

    const isCancelRequest =
      payload.action === "cancel" ||
      payload.status === ReservationStatus.CANCELLED;

    if (!isCancelRequest) {
      return NextResponse.json(
        {
          message:
            'Only reservation cancellation is supported via PATCH (e.g. { "action": "cancel" } or { "status": "CANCELLED" }).',
        },
        { status: 400 }
      );
    }

    const cancelled = await cancelReservation(idValidation.data);
    return NextResponse.json(
      {
        message: "Reservation cancelled successfully.",
        reservation: cancelled,
      },
      { status: 200 }
    );
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

    console.error("PATCH /api/reservations/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to update reservation." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = validateReservationId(id);

    if (!idValidation.success) {
      return NextResponse.json(
        { message: "Invalid reservation ID.", errors: idValidation.errors },
        { status: 400 }
      );
    }

    const cancelled = await cancelReservation(idValidation.data);
    return NextResponse.json(
      {
        message: "Reservation cancelled successfully.",
        reservation: cancelled,
      },
      { status: 200 }
    );
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

    console.error("DELETE /api/reservations/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to cancel reservation." },
      { status: 500 }
    );
  }
}
