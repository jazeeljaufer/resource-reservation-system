"use client";

import { useEffect, useState } from "react";

interface UserItem {
  id: number;
  name: string;
  email: string;
}

interface ResourceOption {
  id: number;
  name: string;
  type: string;
  location: string | null;
  isActive: boolean;
}

interface ReservationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ReservationForm({ onSuccess, onCancel }: ReservationFormProps) {
  function getInitialDateTimeRange() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatLocalDateTime = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const start = new Date(now);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);

    return {
      start: formatLocalDateTime(start),
      end: formatLocalDateTime(end),
    };
  }

  // Form fields with lazy initial values
  const [resourceId, setResourceId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [startTime, setStartTime] = useState<string>(() => getInitialDateTimeRange().start);
  const [endTime, setEndTime] = useState<string>(() => getInitialDateTimeRange().end);
  const [purpose, setPurpose] = useState<string>("");

  // Options loaded from APIs
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);

  // Quick user creation mode if no users exist
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [userCreationError, setUserCreationError] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Form states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch active resources and users with race-condition cleanup
  useEffect(() => {
    let ignore = false;

    async function loadOptions() {
      try {
        const [resourcesRes, usersRes] = await Promise.all([
          fetch("/api/resources?isActive=true"),
          fetch("/api/users"),
        ]);

        if (ignore) return;

        if (resourcesRes.ok) {
          const resData: ResourceOption[] = await resourcesRes.json();
          const activeOnly = resData.filter((r) => r.isActive);
          setResources(activeOnly);
          if (activeOnly.length > 0) {
            setResourceId(String(activeOnly[0].id));
          }
        }

        if (usersRes.ok) {
          const userData: UserItem[] = await usersRes.json();
          setUsers(userData);
          if (userData.length > 0) {
            setUserId(String(userData[0].id));
          } else {
            setIsCreatingUser(true);
          }
        }
      } catch (err) {
        console.error("Failed to load options:", err);
      } finally {
        if (!ignore) {
          setIsLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserCreationError(null);

    const trimmedName = newUserName.trim();
    const trimmedEmail = newUserEmail.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setUserCreationError("Both name and email are required to register a user.");
      return;
    }

    setIsSubmittingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUserCreationError(data.message || "Failed to create user.");
        return;
      }

      // Add to users list and select
      setUsers((prev) => [...prev, data]);
      setUserId(String(data.id));
      setIsCreatingUser(false);
      setNewUserName("");
      setNewUserEmail("");
      if (fieldErrors.userId) {
        setFieldErrors((prev) => ({ ...prev, userId: "" }));
      }
    } catch {
      setUserCreationError("Network error while creating user.");
    } finally {
      setIsSubmittingUser(false);
    }
  }

  function validate() {
    const errors: Record<string, string> = {};

    if (!resourceId) {
      errors.resourceId = "Please select a resource.";
    }

    if (!userId) {
      errors.userId = "Please select a reserving user.";
    }

    if (!startTime) {
      errors.startTime = "Start date and time are required.";
    }

    if (!endTime) {
      errors.endTime = "End date and time are required.";
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime())) {
        errors.startTime = "Invalid start time.";
      }
      if (isNaN(end.getTime())) {
        errors.endTime = "Invalid end time.";
      }
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (start.getTime() >= end.getTime()) {
          errors.endTime = "End time must be strictly after start time.";
        }
      }
    }

    const trimmedPurpose = purpose.trim();
    if (!trimmedPurpose) {
      errors.purpose = "Reservation purpose is required.";
    } else if (trimmedPurpose.length > 500) {
      errors.purpose = "Purpose must not exceed 500 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: Number(resourceId),
          userId: Number(userId),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          purpose: purpose.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setApiError(
            "Booking conflict: This resource is already reserved for the selected time window. Please pick a different time slot."
          );
        } else if (data.errors && Array.isArray(data.errors)) {
          setApiError(data.errors.join(" "));
        } else {
          setApiError(data.message || "Failed to create reservation.");
        }
        return;
      }

      // Success
      setPurpose("");
      setFieldErrors({});
      onSuccess();
    } catch (err) {
      console.error("Reservation creation error:", err);
      setApiError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {apiError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-rose-600 mt-0.5 shrink-0"
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
          <div className="flex-1 font-medium">{apiError}</div>
        </div>
      )}

      {/* Resource Selector */}
      <div>
        <label
          htmlFor="res-resource"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Select Resource <span className="text-rose-500">*</span>
        </label>
        {isLoadingOptions ? (
          <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        ) : resources.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            No active resources available. Please create or activate a resource first.
          </div>
        ) : (
          <select
            id="res-resource"
            value={resourceId}
            onChange={(e) => {
              setResourceId(e.target.value);
              if (fieldErrors.resourceId) {
                setFieldErrors((prev) => ({ ...prev, resourceId: "" }));
              }
            }}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white ${
              fieldErrors.resourceId
                ? "border-rose-300 focus:border-rose-500 text-rose-900"
                : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
            }`}
          >
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.type} {r.location ? `(${r.location})` : ""}
              </option>
            ))}
          </select>
        )}
        {fieldErrors.resourceId && (
          <p className="mt-1 text-xs text-rose-600 font-medium">
            {fieldErrors.resourceId}
          </p>
        )}
      </div>

      {/* User Selector & Inline Register Option */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="res-user"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-700"
          >
            Reserved For (User) <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsCreatingUser(!isCreatingUser)}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            {isCreatingUser ? "Select Existing User" : "+ Register Team Member"}
          </button>
        </div>

        {isCreatingUser ? (
          <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3.5 space-y-3">
            <p className="text-xs text-orange-950 font-medium">
              Register a team member in the system database:
            </p>
            {userCreationError && (
              <p className="text-xs text-rose-600 font-medium">
                {userCreationError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Full Name (e.g. Sarah Connor)"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-orange-500"
              />
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Work Email (e.g. sarah@lab.io)"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateUser}
              disabled={isSubmittingUser}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmittingUser ? "Adding..." : "Add & Select User"}
            </button>
          </div>
        ) : isLoadingOptions ? (
          <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" />
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            No registered users found. Click &quot;+ Register Team Member&quot; above to add one.
          </div>
        ) : (
          <select
            id="res-user"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              if (fieldErrors.userId) {
                setFieldErrors((prev) => ({ ...prev, userId: "" }));
              }
            }}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white ${
              fieldErrors.userId
                ? "border-rose-300 focus:border-rose-500 text-rose-900"
                : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
            }`}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        )}
        {fieldErrors.userId && (
          <p className="mt-1 text-xs text-rose-600 font-medium">
            {fieldErrors.userId}
          </p>
        )}
      </div>

      {/* Date & Time Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="res-start-time"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Start Time <span className="text-rose-500">*</span>
          </label>
          <input
            id="res-start-time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              if (fieldErrors.startTime) {
                setFieldErrors((prev) => ({ ...prev, startTime: "" }));
              }
            }}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white ${
              fieldErrors.startTime
                ? "border-rose-300 focus:border-rose-500 text-rose-900"
                : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
            }`}
          />
          {fieldErrors.startTime && (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {fieldErrors.startTime}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="res-end-time"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
          >
            End Time <span className="text-rose-500">*</span>
          </label>
          <input
            id="res-end-time"
            type="datetime-local"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              if (fieldErrors.endTime) {
                setFieldErrors((prev) => ({ ...prev, endTime: "" }));
              }
            }}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white ${
              fieldErrors.endTime
                ? "border-rose-300 focus:border-rose-500 text-rose-900"
                : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
            }`}
          />
          {fieldErrors.endTime && (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {fieldErrors.endTime}
            </p>
          )}
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label
          htmlFor="res-purpose"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
        >
          Booking Purpose <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="res-purpose"
          rows={3}
          value={purpose}
          onChange={(e) => {
            setPurpose(e.target.value);
            if (fieldErrors.purpose) {
              setFieldErrors((prev) => ({ ...prev, purpose: "" }));
            }
          }}
          placeholder="e.g., Weekly Engineering Architecture Review & Sprint Demo"
          maxLength={500}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white placeholder:text-zinc-400 resize-none ${
            fieldErrors.purpose
              ? "border-rose-300 focus:border-rose-500 text-rose-900"
              : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
          }`}
        />
        <div className="flex justify-between items-center mt-1 text-xs text-zinc-400">
          <span>Explain the meeting or experiment topic</span>
          <span>{purpose.length}/500</span>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || resources.length === 0 || (!userId && !isCreatingUser)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-4 h-4 animate-spin text-white"
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
              <span>Confirming Booking...</span>
            </>
          ) : (
            <>
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Book Reservation</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
