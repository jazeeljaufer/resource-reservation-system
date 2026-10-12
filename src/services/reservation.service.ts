import { prisma } from "@/lib/prisma";
import type {
  ReservationFilter,
  ReservationWithDetails,
  ValidatedCreateReservationInput,
} from "@/types/reservation";
import { Prisma, ReservationStatus } from "@prisma/client";

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "INTERNAL" = "BAD_REQUEST"
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

const reservationInclude = {
  resource: true,
  user: true,
} as const;

/**
 * Lists reservations with optional filters for user, resource, status, and date range.
 * Results are ordered by start time in descending order.
 */
export async function listReservations(
  filter?: ReservationFilter
): Promise<ReservationWithDetails[]> {
  const where: Prisma.ReservationWhereInput = {};

  if (filter?.userId !== undefined) {
    where.userId = filter.userId;
  }

  if (filter?.resourceId !== undefined) {
    where.resourceId = filter.resourceId;
  }

  if (filter?.status !== undefined) {
    where.status = filter.status;
  }

  if (filter?.startDate || filter?.endDate) {
    where.startTime = {
      ...(filter.startDate && { gte: filter.startDate }),
      ...(filter.endDate && { lte: filter.endDate }),
    };
  }

  return prisma.reservation.findMany({
    where,
    include: reservationInclude,
    orderBy: {
      startTime: "desc",
    },
  });
}

/**
 * Retrieves a single reservation by ID along with its associated resource and user.
 */
export async function getReservationById(
  id: number
): Promise<ReservationWithDetails | null> {
  return prisma.reservation.findUnique({
    where: { id },
    include: reservationInclude,
  });
}

/**
 * Creates a new reservation within a Prisma interactive transaction.
 *
 * Validations performed:
 * 1. Checks that end time is strictly after start time.
 * 2. Confirms the user exists in the database.
 * 3. Confirms the resource exists and is currently active (`isActive = true`).
 * 4. Checks for conflicting CONFIRMED reservations on the same resource using:
 *    existing.startTime < requested.endTime AND existing.endTime > requested.startTime
 *
 * Concurrency Note:
 * This interactive transaction executes within PostgreSQL's default READ COMMITTED isolation.
 * It guarantees atomic evaluation and rollback. Under extreme parallel concurrency, PostgreSQL
 * table/row locks or a GiST range exclusion constraint would be needed to prevent race-condition overlaps.
 */
export async function createReservation(
  data: ValidatedCreateReservationInput
): Promise<ReservationWithDetails> {
  if (data.startTime.getTime() >= data.endTime.getTime()) {
    throw new ServiceError(
      "Reservation end time must be after start time.",
      "BAD_REQUEST"
    );
  }

  return prisma.$transaction(async (tx) => {
    // 1. Verify user exists
    const user = await tx.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new ServiceError(
        `User with ID ${data.userId} was not found.`,
        "NOT_FOUND"
      );
    }

    // 2. Verify resource exists and is active
    const resource = await tx.resource.findUnique({
      where: { id: data.resourceId },
    });

    if (!resource) {
      throw new ServiceError(
        `Resource with ID ${data.resourceId} was not found.`,
        "NOT_FOUND"
      );
    }

    if (!resource.isActive) {
      throw new ServiceError(
        `Resource "${resource.name}" is currently inactive and cannot be reserved.`,
        "BAD_REQUEST"
      );
    }

    // 3. Check for overlapping CONFIRMED reservations on the same resource
    // Overlap condition: existing.startTime < requested.endTime AND existing.endTime > requested.startTime
    const conflictingReservation = await tx.reservation.findFirst({
      where: {
        resourceId: data.resourceId,
        status: ReservationStatus.CONFIRMED,
        startTime: {
          lt: data.endTime,
        },
        endTime: {
          gt: data.startTime,
        },
      },
    });

    if (conflictingReservation) {
      throw new ServiceError(
        "The requested resource is already reserved for the selected time window.",
        "CONFLICT"
      );
    }

    // 4. Create the reservation
    return tx.reservation.create({
      data: {
        userId: data.userId,
        resourceId: data.resourceId,
        startTime: data.startTime,
        endTime: data.endTime,
        purpose: data.purpose,
        status: ReservationStatus.CONFIRMED,
      },
      include: reservationInclude,
    });
  });
}

/**
 * Cancels an active reservation.
 *
 * - If the reservation does not exist, throws a NOT_FOUND ServiceError.
 * - If the reservation is already cancelled, throws a BAD_REQUEST ServiceError to prevent inconsistent states.
 * - Cancelled reservations no longer block future bookings as conflict checks only query CONFIRMED status.
 */
export async function cancelReservation(
  id: number
): Promise<ReservationWithDetails> {
  const existing = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ServiceError(
      `Reservation with ID ${id} was not found.`,
      "NOT_FOUND"
    );
  }

  if (existing.status === ReservationStatus.CANCELLED) {
    throw new ServiceError(
      "This reservation is already cancelled.",
      "BAD_REQUEST"
    );
  }

  return prisma.reservation.update({
    where: { id },
    data: {
      status: ReservationStatus.CANCELLED,
    },
    include: reservationInclude,
  });
}
