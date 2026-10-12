"use client";

import { useState } from "react";

export interface ResourceItem {
  id: number;
  name: string;
  type: string;
  location: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ResourceListProps {
  resources: ResourceItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreateClick?: () => void;
}

export function ResourceList({
  resources,
  isLoading,
  error,
  onRefresh,
  onCreateClick,
}: ResourceListProps) {
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDeactivate(id: number, name: string) {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${name}"? It will no longer be available for new reservations.`
    );
    if (!confirmed) return;

    setDeactivatingId(id);
    setActionError(null);

    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setActionError(data.message || "Failed to deactivate resource.");
        return;
      }

      onRefresh();
    } catch (err) {
      console.error("Failed to deactivate resource:", err);
      setActionError("A network error occurred while updating the resource.");
    } finally {
      setDeactivatingId(null);
    }
  }

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-100 animate-pulse space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="h-10 bg-slate-50 rounded-xl" />
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <div className="h-3 bg-slate-100 rounded w-24" />
              <div className="h-7 w-20 bg-slate-100 rounded-lg" />
            </div>
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
            Failed to load resources
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (resources.length === 0) {
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-zinc-900">
            No resources found
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            No resources match your search or filter settings, or no resources have been created yet.
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
            Add New Resource
          </button>
        )}
      </div>
    );
  }

  // 4. Resource Cards Grid
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-100 hover:shadow-md hover:border-orange-300 transition-all duration-200"
          >
            {/* Top row: Name & Status */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                    {resource.name}
                  </h3>
                  <span className="inline-block mt-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200/80 rounded-md px-2 py-0.5">
                    {resource.type}
                  </span>
                </div>

                {/* Active / Inactive Status Badge */}
                {resource.isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Inactive
                  </span>
                )}
              </div>

              {/* Location */}
              {resource.location && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <svg
                    className="w-3.5 h-3.5 text-slate-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate">{resource.location}</span>
                </div>
              )}

              {/* Description */}
              {resource.description ? (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {resource.description}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic mb-4">
                  No additional description provided.
                </p>
              )}
            </div>

            {/* Bottom Row: Creation Date & Quick Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400">
                Added {new Date(resource.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              {resource.isActive && (
                <button
                  onClick={() => handleDeactivate(resource.id, resource.name)}
                  disabled={deactivatingId === resource.id}
                  className="text-slate-500 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                  title="Deactivate resource from future bookings"
                >
                  {deactivatingId === resource.id ? (
                    <span className="inline-flex items-center gap-1">
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
                      Updating...
                    </span>
                  ) : (
                    "Deactivate"
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
