"use client";

import { useState } from "react";

interface ResourceFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const RESOURCE_TYPE_PRESETS = [
  "Conference Room",
  "Workstation",
  "Meeting Booth",
  "Laboratory Equipment",
  "Projector & AV",
  "Company Vehicle",
];

export function ResourceForm({ onSuccess, onCancel }: ResourceFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "Resource name is required.";
    } else if (trimmedName.length > 100) {
      errors.name = "Name must not exceed 100 characters.";
    }

    const trimmedType = type.trim();
    if (!trimmedType) {
      errors.type = "Resource type is required.";
    } else if (trimmedType.length > 50) {
      errors.type = "Type must not exceed 50 characters.";
    }

    if (location.trim().length > 150) {
      errors.location = "Location must not exceed 150 characters.";
    }

    if (description.trim().length > 500) {
      errors.description = "Description must not exceed 500 characters.";
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
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: type.trim(),
          location: location.trim() || null,
          description: description.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setApiError(data.errors.join(" "));
        } else {
          setApiError(data.message || "Failed to create resource.");
        }
        return;
      }

      // Success
      setName("");
      setType("");
      setLocation("");
      setDescription("");
      setFieldErrors({});
      onSuccess();
    } catch (err) {
      console.error("Resource creation failed:", err);
      setApiError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      {apiError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 flex items-start gap-3">
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

      {/* Resource Name */}
      <div>
        <label
          htmlFor="resource-name"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Resource Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="resource-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: "" }));
            }
          }}
          placeholder="e.g., Executive Boardroom A"
          maxLength={100}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white placeholder:text-slate-400 ${
            fieldErrors.name
              ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-rose-900"
              : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
          }`}
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          {fieldErrors.name ? (
            <span className="text-rose-600 font-medium">{fieldErrors.name}</span>
          ) : (
            <span className="text-zinc-400">Clear and descriptive title</span>
          )}
          <span className="text-zinc-400">{name.length}/100</span>
        </div>
      </div>

      {/* Resource Type */}
      <div>
        <label
          htmlFor="resource-type"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
        >
          Category / Type <span className="text-rose-500">*</span>
        </label>
        <input
          id="resource-type"
          type="text"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            if (fieldErrors.type) {
              setFieldErrors((prev) => ({ ...prev, type: "" }));
            }
          }}
          placeholder="e.g., Conference Room or custom category"
          maxLength={50}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white placeholder:text-zinc-400 ${
            fieldErrors.type
              ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-rose-900"
              : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
          }`}
        />
        {/* Quick Type Selection Pills */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RESOURCE_TYPE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setType(preset);
                if (fieldErrors.type) {
                  setFieldErrors((prev) => ({ ...prev, type: "" }));
                }
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border ${
                type === preset
                  ? "bg-orange-50 text-orange-600 border-orange-300 font-semibold"
                  : "bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        {fieldErrors.type && (
          <p className="mt-1 text-xs text-rose-600 font-medium">
            {fieldErrors.type}
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="resource-location"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Location <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <input
            id="resource-location"
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              if (fieldErrors.location) {
                setFieldErrors((prev) => ({ ...prev, location: "" }));
              }
            }}
            placeholder="e.g., Building 4, 3rd Floor, Wing B"
            maxLength={150}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white placeholder:text-zinc-400 ${
              fieldErrors.location
                ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-rose-900"
                : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
            }`}
          />
        </div>
        {fieldErrors.location && (
          <p className="mt-1 text-xs text-rose-600 font-medium">
            {fieldErrors.location}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="resource-description"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
        >
          Description / Amenities{" "}
          <span className="text-zinc-400 font-normal">(Optional)</span>
        </label>
        <textarea
          id="resource-description"
          rows={3}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (fieldErrors.description) {
              setFieldErrors((prev) => ({ ...prev, description: "" }));
            }
          }}
          placeholder="Capacity, hardware, whiteboards, video conferencing links, or usage instructions..."
          maxLength={500}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none bg-white placeholder:text-zinc-400 resize-none ${
            fieldErrors.description
              ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-rose-900"
              : "border-zinc-200 hover:border-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-zinc-900"
          }`}
        />
        <div className="flex justify-between items-center mt-1 text-xs text-zinc-400">
          <span>Useful details for teammates reserving this space</span>
          <span>{description.length}/500</span>
        </div>
      </div>

      {/* Actions */}
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
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
              <span>Creating Resource...</span>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Save Resource</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
