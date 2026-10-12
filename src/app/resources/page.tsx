"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ResourceForm } from "@/features/resources/components/ResourceForm";
import {
  ResourceItem,
  ResourceList,
} from "@/features/resources/components/ResourceList";

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal state for resource creation
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (selectedType !== "all") {
        params.append("type", selectedType);
      }
      if (statusFilter === "active") {
        params.append("isActive", "true");
      } else if (statusFilter === "inactive") {
        params.append("isActive", "false");
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/resources${queryString}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load resources from server.");
      }

      const data: ResourceItem[] = await res.json();
      setResources(data);
    } catch (err: unknown) {
      console.error("fetchResources error:", err);
      const msg = err instanceof Error ? err.message : "Failed to load resources.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedType, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchResources();
    }, 250);

    return () => clearTimeout(timeout);
  }, [fetchResources]);

  const distinctTypes = Array.from(
    new Set(resources.map((r) => r.type).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <Header />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-black">
                Resource Inventory
              </h1>
              <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                {resources.length} {resources.length === 1 ? "Resource" : "Resources"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Manage rooms, labs, workstations, and equipment available for team reservations.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.98] transition-all"
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
            Add Resource
          </button>
        </div>

        {/* Filter and Search Bar Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-100">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, location, or description..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-9 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
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

            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                aria-label="Filter by resource type"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
              >
                <option value="all">All Types</option>
                {distinctTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
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
                      ? "bg-white text-black shadow-xs font-bold"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                    statusFilter === "active"
                      ? "bg-white text-orange-600 shadow-xs font-bold"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                  className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                    statusFilter === "inactive"
                      ? "bg-white text-zinc-800 shadow-xs font-bold"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  Inactive
                </button>
              </div>

              {/* Reset Filters */}
              {(searchTerm || selectedType !== "all" || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("all");
                    setStatusFilter("all");
                  }}
                  className="rounded-xl border border-zinc-200 px-2.5 py-2 text-xs font-medium text-zinc-500 hover:text-black hover:bg-zinc-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resource List Component */}
        <ResourceList
          resources={resources}
          isLoading={isLoading}
          error={error}
          onRefresh={fetchResources}
          onCreateClick={() => setIsModalOpen(true)}
        />
      </main>

      {/* Create Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-black/20 transition-all max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-bold text-black">
                  Add New Resource
                </h2>
                <p className="text-xs text-zinc-500">
                  Register a resource to allow reservations and booking slots.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
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

            <ResourceForm
              onSuccess={() => {
                setIsModalOpen(false);
                fetchResources();
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
