"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ReservationStatus } from "@prisma/client";

interface ResourceItem {
  id: number;
  name: string;
  type: string;
  location: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReservationItem {
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

export default function DashboardPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [resResources, resReservations] = await Promise.all([
          fetch("/api/resources"),
          fetch("/api/reservations"),
        ]);

        if (ignore) return;

        if (!resResources.ok || !resReservations.ok) {
          throw new Error("Failed to load dashboard metrics from API.");
        }

        const [resourcesData, reservationsData] = await Promise.all([
          resResources.json(),
          resReservations.json(),
        ]);

        if (!ignore) {
          setResources(resourcesData);
          setReservations(reservationsData);
          setCurrentTimestamp(Date.now());
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Dashboard data load error:", err);
          const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  // Derived Metrics
  const totalResources = resources.length;
  const activeResources = resources.filter((r) => r.isActive).length;
  const inactiveResources = totalResources - activeResources;

  const totalReservations = reservations.length;
  const confirmedReservations = reservations.filter(
    (r) => r.status === ReservationStatus.CONFIRMED
  ).length;
  const cancelledReservations = reservations.filter(
    (r) => r.status === ReservationStatus.CANCELLED
  ).length;

  // Upcoming confirmed reservations (start time in the future, sorted by start time ascending)
  const upcomingReservations = reservations
    .filter(
      (r) =>
        r.status === ReservationStatus.CONFIRMED &&
        (currentTimestamp === 0 || new Date(r.startTime).getTime() > currentTimestamp)
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 5);

  // Recent reservations (sorted by creation time descending)
  const recentReservations = [...reservations]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  function formatDateTimeRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return {
      date: start.toLocaleDateString(undefined, dateOptions),
      time: `${start.toLocaleTimeString(undefined, timeOptions)} – ${end.toLocaleTimeString(undefined, timeOptions)}`,
    };
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Dashboard Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-50/90 border border-orange-200/70 rounded-md px-2 py-0.5">
                Overview
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 font-medium">PrimeWave Lab</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">
              Resource Operations Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Live capacity utilization, booking requests, and schedule overview.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs disabled:opacity-50"
              title="Refresh dashboard metrics"
            >
              <svg
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>

            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
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
              New Reservation
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-rose-600 shrink-0"
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
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Summary Cards */}
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">
            Summary Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Resources */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-orange-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total Resources
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-950 tracking-tight">
                  {isLoading ? "–" : totalResources}
                </span>
                <span className="text-xs text-zinc-400 font-medium">inventory items</span>
              </div>
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-100 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {isLoading ? "–" : activeResources} Active
                </span>
                {inactiveResources > 0 && (
                  <span className="text-zinc-400">
                    • {inactiveResources} Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Total Bookings */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-orange-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total Reservations
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-950 tracking-tight">
                  {isLoading ? "–" : totalReservations}
                </span>
                <span className="text-xs text-zinc-400 font-medium">all-time records</span>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                <span>System timetable entries</span>
              </div>
            </div>

            {/* Confirmed Reservations */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-orange-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Confirmed Bookings
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                  {isLoading ? "–" : confirmedReservations}
                </span>
                <span className="text-xs text-emerald-600/80 font-medium">valid slots</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                <span>Active commitments</span>
              </div>
            </div>

            {/* Cancelled Reservations */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-orange-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Cancelled Bookings
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
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
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-600 tracking-tight">
                  {isLoading ? "–" : cancelledReservations}
                </span>
                <span className="text-xs text-zinc-400 font-medium">released slots</span>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                <span>Slots non-blocking</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Panel */}
        <section aria-labelledby="quick-actions-heading">
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-black via-zinc-950 to-neutral-900 p-6 text-white shadow-md shadow-black/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h3 id="quick-actions-heading" className="text-lg font-bold">
                  Quick Management Navigation
                </h3>
                <p className="text-xs text-zinc-300 max-w-xl">
                  Quickly transition into inventory administration or inspect live reservation timetables.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-xs font-semibold text-white transition-colors backdrop-blur-xs"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Manage Resources
                </Link>

                <Link
                  href="/reservations"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-sm shadow-orange-500/25"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Schedule Bookings
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2 & 3. Upcoming and Recent Reservations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 2. Upcoming Reservations */}
          <section
            aria-labelledby="upcoming-heading"
            className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 id="upcoming-heading" className="text-base font-bold text-zinc-950">
                      Upcoming Confirmed Bookings
                    </h3>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                      {upcomingReservations.length}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Confirmed future reservations ordered chronologically.
                  </p>
                </div>

                <Link
                  href="/reservations"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  View All →
                </Link>
              </div>

              {/* Content List */}
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 animate-pulse space-y-2"
                      >
                        <div className="h-4 bg-zinc-200 rounded w-1/3" />
                        <div className="h-3 bg-zinc-100 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : upcomingReservations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                      No future confirmed reservations found.
                    </p>
                    <Link
                      href="/reservations"
                      className="inline-block text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Book a future time slot →
                    </Link>
                  </div>
                ) : (
                  upcomingReservations.map((res) => {
                    const { date, time } = formatDateTimeRange(
                      res.startTime,
                      res.endTime
                    );

                    return (
                      <div
                        key={res.id}
                        className="rounded-xl border border-zinc-200 bg-white hover:border-orange-300 hover:shadow-xs p-4 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-bold text-zinc-950">
                              {res.resource.name}
                            </span>
                            <span className="ml-2 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200/80 rounded px-1.5 py-0.5">
                              {res.resource.type}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Confirmed
                          </span>
                        </div>

                        <p className="text-xs text-zinc-700 font-medium line-clamp-1">
                          {res.purpose}
                        </p>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100/80">
                          <span>
                            {date} • <strong className="text-zinc-700">{time}</strong>
                          </span>
                          <span>
                            by <span className="font-semibold text-zinc-700">{res.user.name}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 text-xs text-zinc-400">
              Only future CONFIRMED slots are listed above.
            </div>
          </section>

          {/* 3. Recent Reservations */}
          <section
            aria-labelledby="recent-heading"
            className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 id="recent-heading" className="text-base font-bold text-zinc-950">
                      Recent Reservations Activity
                    </h3>
                    <span className="rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold">
                      {recentReservations.length}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Latest booking records by creation timestamp.
                  </p>
                </div>

                <Link
                  href="/reservations"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  View History →
                </Link>
              </div>

              {/* Content List */}
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 animate-pulse space-y-2"
                      >
                        <div className="h-4 bg-zinc-200 rounded w-1/3" />
                        <div className="h-3 bg-zinc-100 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : recentReservations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                      No reservation activity logged yet.
                    </p>
                  </div>
                ) : (
                  recentReservations.map((res) => {
                    const isConfirmed = res.status === ReservationStatus.CONFIRMED;
                    const { date, time } = formatDateTimeRange(
                      res.startTime,
                      res.endTime
                    );

                    return (
                      <div
                        key={res.id}
                        className="rounded-xl border border-zinc-200 bg-white hover:border-orange-300 hover:shadow-xs p-4 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-bold text-zinc-950">
                              {res.resource.name}
                            </span>
                            <span className="ml-2 text-xs text-zinc-500">
                              for {res.user.name}
                            </span>
                          </div>

                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                              Cancelled
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-700 font-medium line-clamp-1">
                          {res.purpose}
                        </p>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100/80">
                          <span>
                            Slot: {date} ({time})
                          </span>
                          <span>
                            Created{" "}
                            {new Date(res.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 text-xs text-zinc-400">
              Sorted by creation timestamp in descending order.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
