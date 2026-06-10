/**
 * @module components/CommunityComparison
 * @description Displays the user's percentile ranking against
 * the community and a distribution histogram of all users' footprints.
 */
import { User } from "lucide-react";
import type { ComparisonResult } from "../types";

/** Footprint distribution bucket labels used in the histogram. */
const BUCKETS = ["0-100", "100-200", "200-300", "300-400", "400-500", "500+"] as const;

interface CommunityComparisonProps {
  /** Whether the user is signed in. */
  isSignedIn: boolean;
  /** Callback to trigger Google sign-in. */
  onSignIn: () => void;
  /** Whether comparison data is currently loading. */
  compLoading: boolean;
  /** The fetched comparison data (percentile + distribution). */
  comparison: ComparisonResult | null;
  /** The user's total monthly footprint in kg CO2e. */
  userTotal: number;
}

/**
 * Renders a community comparison panel.
 *
 * - If the user is **not signed in**, shows a CTA to sign in.
 * - If signed in but **loading**, shows a skeleton placeholder.
 * - If signed in with **data**, shows a percentile badge and a
 *   distribution histogram highlighting the user's bucket.
 */
export function CommunityComparison({
  isSignedIn,
  onSignIn,
  compLoading,
  comparison,
  userTotal,
}: CommunityComparisonProps) {
  /** Determine which bucket the current user falls into. */
  let activeBucket = "";
  if (userTotal <= 100) activeBucket = "0-100";
  else if (userTotal <= 200) activeBucket = "100-200";
  else if (userTotal <= 300) activeBucket = "200-300";
  else if (userTotal <= 400) activeBucket = "300-400";
  else if (userTotal <= 500) activeBucket = "400-500";
  else activeBucket = "500+";

  const maxCount = comparison
    ? Math.max(...Object.values(comparison.distribution), 1)
    : 1;

  if (!isSignedIn) {
    return (
      <div className="card rounded-[2rem] p-7 md:p-8 flex flex-col justify-between">
        <div>
          <p className="eyebrow">Compare & Save</p>
          <h2 className="mt-2 text-2xl font-semibold">Where do you rank?</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Sign in with Google to securely save this estimate to your profile
            and unlock your community percentile rank.
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={onSignIn}
            className="button-primary w-full flex items-center justify-center gap-2"
          >
            <User className="h-4 w-4" /> Sign In to Compare & Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-[2rem] p-7 md:p-8 flex flex-col justify-between">
      <div>
        <p className="eyebrow">Community Percentile</p>
        <h2 className="mt-2 text-2xl font-semibold">You're doing great!</h2>

        {compLoading ? (
          <div className="mt-6 animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : comparison ? (
          <>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Your monthly footprint is lower than{" "}
              <strong>{comparison.percentile}%</strong> of registered users in
              the community.
            </p>

            <div className="mt-8" role="figure" aria-label="Community footprint distribution histogram">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-4 text-center">
                Community Footprint Distribution (kg CO2e)
              </p>
              <div
                className="flex items-end justify-between gap-2 h-24 border-b border-[var(--line)] pb-1"
                aria-hidden="true"
              >
                {BUCKETS.map((bucket) => {
                  const count = comparison.distribution[bucket] || 0;
                  const heightPercent = (count / maxCount) * 100;
                  const isActive = bucket === activeBucket;
                  return (
                    <div
                      key={bucket}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-[var(--ink)] text-white text-[10px] font-bold py-1 px-2 rounded-md whitespace-nowrap z-20 shadow-md">
                        {count} user{count !== 1 ? "s" : ""}
                      </div>

                      <div
                        className={`w-full rounded-t-md transition-all duration-500 cursor-pointer ${
                          isActive
                            ? "bg-[var(--green)]"
                            : "bg-[var(--line)] hover:bg-gray-300"
                        }`}
                        style={{
                          height: `${Math.max(heightPercent, 8)}%`,
                        }}
                      />

                      {isActive && (
                        <span className="absolute -top-4 text-[10px] font-extrabold text-[var(--green)] animate-bounce">
                          You
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-bold text-[var(--muted)]">
                {BUCKETS.map((b) => (
                  <span key={b} className="flex-1 text-center truncate">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Unable to fetch comparison data.
          </p>
        )}
      </div>
    </div>
  );
}
