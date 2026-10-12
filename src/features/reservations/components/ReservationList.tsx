"use client";

import { useState } from "react";
import { ReservationStatus } from "@prisma/client";

export interface ReservationDetailItem {
  id: number;
  userId: number;
  resourceId: number;
  startTime: string;
  endTime: string;
  purpose: string;
  status: ReservationStatus;
  createdAt: string;
  resource: {
    id: number;
    name: string;
    type: string;
    location: string | null;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ReservationListProps {
  reservations: ReservationDetailItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreateClick?: () => void;
}

export function ReservationList({
  reservations,
  isLoading,
  error,
  onRefresh,
  onCreateClick,
}: ReservationListProps) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCancel(id: number, purpose: string) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel the reservation for "${purpose}"?\nThis slot will become available for other team members.`
    );
    if (!confirmed) return;

    setCancellingId(id);
    setActionError(null);

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setActionError(data.message || "Failed to cancel reservation.");
        return;
      }

      onRefresh();
    } catch (err) {
      console.error("Cancellation error:", err);
      setActionError("A network error occurred while cancelling the reservation.");
    } finally {
      setCancellingId(null);
    }
  }

  function formatTimeWindow(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const dateStr = start.toLocaleDateString(undefined, dateOptions);
    const startTimeStr = start.toLocaleTimeString(undefined, timeOptions);
    const endTimeStr = end.toLocaleTimeString(undefined, timeOptions);

    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const duration =
      hours > 0
        ? `${hours} hr${hours > 1 ? "s" : ""}${mins > 0 ? ` ${mins} min` : ""}`
        : `${mins} mins`;

    return {
      dateStr,
      timeStr: `${startTimeStr} – ${endTimeStr}`,
      duration,
    };
  }

  // 1. Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-100 animate-pulse space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
            <div className="h-8 bg-slate-50 rounded-xl w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">
            Failed to load reservations
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mx-auto shadow-inner">
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-zinc-950">
            No reservations found
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            There are currently no reservations matching your filter criteria. Book a resource to get started.
          </p>
        </div>
        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Book a Reservation
          </button>
        )}
      </div>
    );
  }

  // 4. Reservations Cards List
  return (
    <div className="space-y-4">
      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-sm text-rose-800 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-3.5">
        {reservations.map((res) => {
          const { dateStr, timeStr, duration } = formatTimeWindow(
            res.startTime,
            res.endTime
          );

          const isConfirmed = res.status === ReservationStatus.CONFIRMED;

          return (
            <div
              key={res.id}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md ${
                isConfirmed
                  ? "border-zinc-200/80 hover:border-orange-300"
                  : "border-zinc-200/50 bg-zinc-50/40 opacity-80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left Section: Resource & Purpose */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-zinc-950">
                      {res.resource.name}
                    </span>
                    <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200/80 rounded-md px-2 py-0.5">
                      {res.resource.type}
                    </span>
                    {res.resource.location && (
                      <span className="text-xs text-zinc-400">
                        • {res.resource.location}
                      </span>
                    )}
                  </div>

                  {/* Purpose */}
                  <p className="text-sm text-zinc-700 font-medium">
                    {res.purpose}
                  </p>

                  {/* Reserved By */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-800 font-semibold text-[10px]">
                      {res.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span>
                      Reserved by{" "}
                      <strong className="text-zinc-800">{res.user.name}</strong>{" "}
                      ({res.user.email})
                    </span>
                  </div>
                </div>

                {/* Right Section: Time & Status */}
                <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Cancelled
                      </span>
                    )}
                  </div>

                  {/* Date and Time Details */}
                  <div className="sm:text-right space-y-0.5">
                    <div className="text-xs font-bold text-zinc-950">
                      {dateStr}
                    </div>
                    <div className="text-xs text-zinc-600 font-medium">
                      {timeStr}{" "}
                      <span className="text-zinc-400 font-normal">
                        ({duration})
                      </span>
                    </div>
                  </div>

                  {/* Cancellation Action */}
                  {isConfirmed && (
                    <button
                      onClick={() => handleCancel(res.id, res.purpose)}
                      disabled={cancellingId === res.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {cancellingId === res.id ? (
                        <>
                          <svg
                            className="w-3 h-3 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          Cancelling...
                        </>
                      ) : (
                        "Cancel Booking"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
