import type {
  Reservation,
  ReservationStatus,
  Resource,
  User,
} from "@prisma/client";

export type { Reservation, ReservationStatus };

export interface ReservationWithDetails extends Reservation {
  resource: Resource;
  user: User;
}

export interface CreateReservationInput {
  userId: number;
  resourceId: number;
  startTime: Date | string;
  endTime: Date | string;
  purpose: string;
}

export interface ValidatedCreateReservationInput {
  userId: number;
  resourceId: number;
  startTime: Date;
  endTime: Date;
  purpose: string;
}

export interface ReservationFilter {
  userId?: number;
  resourceId?: number;
  status?: ReservationStatus;
  startDate?: Date;
  endDate?: Date;
}
