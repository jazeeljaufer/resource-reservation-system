"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard" || pathname === "/";
  const isResources = pathname === "/resources";
  const isReservations = pathname === "/reservations";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-base tracking-tight text-black"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/30">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <span>ResourceHub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            <Link
              href="/dashboard"
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                isDashboard
                  ? "text-orange-600 bg-orange-50/90 font-semibold border border-orange-200/70"
                  : "text-zinc-600 hover:text-black hover:bg-zinc-100/80"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/resources"
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                isResources
                  ? "text-orange-600 bg-orange-50/90 font-semibold border border-orange-200/70"
                  : "text-zinc-600 hover:text-black hover:bg-zinc-100/80"
              }`}
            >
              Resources
            </Link>
            <Link
              href="/reservations"
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                isReservations
                  ? "text-orange-600 bg-orange-50/90 font-semibold border border-orange-200/70"
                  : "text-zinc-600 hover:text-black hover:bg-zinc-100/80"
              }`}
            >
              Reservations
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 border border-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            API Connected
          </span>
        </div>
      </div>
    </header>
  );
}
