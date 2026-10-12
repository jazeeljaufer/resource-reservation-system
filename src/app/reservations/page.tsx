"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReservationForm } from "@/features/reservations/components/ReservationForm";
import {
  ReservationDetailItem,
  ReservationList,
} from "@/features/reservations/components/ReservationList";
import { ReservationStatus } from "@prisma/client";

interface ResourceOption {
  id: number;
  name: string;
  type: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationDetailItem[]>([]);
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedResourceId, setSelectedResourceId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshReservations = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Load resource options for filter dropdown with cancellation cleanup
  useEffect(() => {
    let ignore = false;
    async function loadResourceOptions() {
      try {
        const res = await fetch("/api/resources");
        if (!ignore && res.ok) {
          const data: ResourceOption[] = await res.json();
          setResources(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load resource options:", err);
        }
      }
    }
    loadResourceOptions();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch reservations whenever filters or refresh trigger changes
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const params = new URLSearchParams();
        if (selectedResourceId !== "all") {
          params.append("resourceId", selectedResourceId);
        }
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/reservations${queryString}`);

        if (ignore) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load reservations.");
        }

        const data: ReservationDetailItem[] = await res.json();
        if (!ignore) {
          setReservations(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("fetchReservations error:", err);
          const msg = err instanceof Error ? err.message : "Failed to load reservations.";
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
  }, [selectedResourceId, statusFilter, refreshTrigger]);

  // Client-side quick filter for search query across user, resource name, or purpose
  const filteredReservations = reservations.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.purpose.toLowerCase().includes(q) ||
      r.resource.name.toLowerCase().includes(q) ||
      r.user.name.toLowerCase().includes(q) ||
      r.user.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <Header />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title & Add Booking Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                Reservations Schedule
              </h1>
              <span className="rounded-full bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                {reservations.length}{" "}
                {reservations.length === 1 ? "Booking" : "Bookings"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Real-time reservation timetable with strict conflict prevention.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all"
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
                strokeWidth={2.2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Book Reservation
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, user, or resource..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-9 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Resource Filter */}
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                aria-label="Filter by resource"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
              >
                <option value="all">All Resources</option>
                {resources.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.name}
                  </option>
                ))}
              </select>

              {/* Status Filter Pills */}
              <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100/70 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                    statusFilter === "all"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(ReservationStatus.CONFIRMED)}
                  className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                    statusFilter === ReservationStatus.CONFIRMED
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Confirmed
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(ReservationStatus.CANCELLED)}
                  className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                    statusFilter === ReservationStatus.CANCELLED
                      ? "bg-white text-zinc-800 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Cancelled
                </button>
              </div>

              {/* Reset Filters */}
              {(searchQuery || selectedResourceId !== "all" || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedResourceId("all");
                    setStatusFilter("all");
                  }}
                  className="rounded-xl border border-zinc-200 px-2.5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reservations List */}
        <ReservationList
          reservations={filteredReservations}
          isLoading={isLoading}
          error={error}
          onRefresh={refreshReservations}
          onCreateClick={() => setIsModalOpen(true)}
        />
      </main>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">
                  New Reservation
                </h2>
                <p className="text-xs text-zinc-500">
                  Book a room, lab equipment, or workstation for your team.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <ReservationForm
              onSuccess={() => {
                setIsModalOpen(false);
                refreshReservations();
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
