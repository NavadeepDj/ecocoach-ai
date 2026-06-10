/**
 * @module components/Dashboard
 * @description The main results dashboard displayed after a carbon footprint
 * calculation completes. Composes sub-components for the breakdown chart,
 * community comparison, recommendation list, and impact calculator.
 */
import { useState, useEffect } from "react";
import { Bike, Footprints, Sparkles, Bolt, Car, Recycle, Utensils, RotateCcw } from "lucide-react";
import { getFootprintComparison } from "../api";
import { Brand, AuthControl } from "./Header";
import { BreakdownChart } from "./BreakdownChart";
import { CommunityComparison } from "./CommunityComparison";
import { RecommendationList } from "./RecommendationList";
import { ImpactCalculator } from "./ImpactCalculator";
import type { FootprintResult, ComparisonResult } from "../types";
import type { UserProfile } from "../firebase";

/** Mapping of category keys to display metadata (label, icon, colour). */
export const categoryMeta = {
  transport: { label: "Transport", icon: Car, color: "var(--coral)" },
  electricity: { label: "Electricity", icon: Bolt, color: "var(--gold)" },
  food: { label: "Food", icon: Utensils, color: "var(--green)" },
  waste: { label: "Waste", icon: Recycle, color: "var(--blue)" },
};

/** Props accepted by the {@link Dashboard} component. */
interface DashboardProps {
  /** The calculated footprint result. */
  result: FootprintResult;
  /** Callback to reset the result and return to the questionnaire. */
  onReset: () => void;
  /** The currently signed-in user, or null if anonymous. */
  user: UserProfile | null;
  /** Firebase ID token for authenticated API calls. */
  token: string;
  /** Callback to trigger Google sign-in. */
  onSignIn: () => void;
  /** Callback to sign the user out. */
  onSignOut: () => void;
  /** The user's historical footprint snapshots. */
  history: FootprintResult[];
  /** Callback when the user selects a historical result. */
  onSelectHistory: (result: FootprintResult) => void;
  /** Callback to open the full history modal. */
  onViewHistory: () => void;
}

/**
 * Top-level dashboard layout that assembles the hero stat panel,
 * breakdown chart, community comparison, recommendation checklist,
 * and impact calculator into a cohesive results page.
 */
export function Dashboard({
  result,
  onReset,
  user,
  token,
  onSignIn,
  onSignOut,
  history,
  onSelectHistory,
  onViewHistory,
}: DashboardProps) {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [completedRecs, setCompletedRecs] = useState<string[]>([]);

  useEffect(() => {
    setCompletedRecs([]);
  }, [result]);

  /** Toggle a recommendation's completed state. */
  const toggleRec = (id: string) => {
    setCompletedRecs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalSavings = (result.recommendations || [])
    .filter((rec) => completedRecs.includes(rec.id))
    .reduce((acc, rec) => acc + rec.estimated_savings, 0);

  useEffect(() => {
    if (token) {
      setCompLoading(true);
      getFootprintComparison(result.total, token)
        .then((data) => setComparison(data))
        .catch((err) => console.error("Failed to load comparison data", err))
        .finally(() => setCompLoading(false));
    } else {
      setComparison(null);
    }
  }, [token, result.total]);

  return (
    <>
      <a
        href="#main-dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-[var(--green)] focus:font-bold focus:border focus:border-[var(--line)] focus:rounded-xl"
      >
        Skip to main content
      </a>
      <main id="main-dashboard-content" className="min-h-screen px-4 py-5 md:px-8 md:py-7">
        <nav aria-label="Dashboard navigation" className="mx-auto flex max-w-6xl items-center justify-between">
          <Brand />
          <div className="flex items-center gap-3">
            <AuthControl
              user={user}
              onSignIn={onSignIn}
              onSignOut={onSignOut}
              onViewHistory={onViewHistory}
            />
            <button className="button-secondary" onClick={onReset}>
              <RotateCcw className="h-4 w-4" /> Update answers
            </button>
          </div>
        </nav>

        <section className="mx-auto max-w-6xl py-10">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Your monthly baseline</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
                Here's where you stand.
              </h1>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
              Estimated with factor set <strong>{result.factor_set}</strong>.
              Treat this as a useful direction, not an exact inventory.
            </p>
          </div>

          {/* Hero row: total + health score */}
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="hero-panel relative overflow-hidden rounded-[2rem] p-7 text-white md:p-10">
              <div className="relative z-10">
                <p className="text-sm font-semibold text-white/55 flex items-center gap-1.5">
                  <Footprints className="h-4.5 w-4.5 text-[var(--mint)]" />
                  Estimated monthly footprint
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-6xl font-semibold tracking-tight md:text-8xl">
                    {result.total}
                  </span>
                  <span className="pb-3 text-sm font-semibold text-white/60">
                    kg CO2e
                  </span>
                </div>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
                  <Sparkles className="h-4 w-4 text-[var(--mint)]" />
                  Biggest contributor:{" "}
                  <strong className="capitalize">{result.largest_category}</strong>
                </div>
              </div>
              <div className="orb" />
            </div>

            <div className="card rounded-[2rem] p-7 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--muted)]">Carbon Health Score</p>
                  <p className="mt-2 text-5xl font-semibold">{result.score}</p>
                </div>
                <span className="icon-bubble">
                  <Bike className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-7 h-3 overflow-hidden rounded-full bg-[var(--soft)]" role="progressbar" aria-valuenow={result.score} aria-valuemin={0} aria-valuemax={100} aria-label={`Carbon Health Score: ${result.score} out of 100`}>
                <div
                  className="h-full rounded-full bg-[var(--green)]"
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                Your score is <strong>{result.score_band.replace("_", " ")}</strong>.
                It compares your estimate with a 2 tCO2e annual lifestyle target.
              </p>
            </div>
          </div>

          {/* Breakdown + Community comparison */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <BreakdownChart result={result} />
            <CommunityComparison
              isSignedIn={!!user}
              onSignIn={onSignIn}
              compLoading={compLoading}
              comparison={comparison}
              userTotal={result.total}
            />
          </div>

          {/* Recommendations + Impact calculator */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <RecommendationList
              result={result}
              completedRecs={completedRecs}
              toggleRec={toggleRec}
            />
            <div className="flex flex-col gap-5">
              <ImpactCalculator
                currentTotal={result.total}
                totalSavings={totalSavings}
              />
            </div>
          </div>

          {/* Caveats + motivational badge */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="card rounded-[2rem] p-7 md:p-8">
              <p className="eyebrow">What to know</p>
              <h2 className="mt-2 text-2xl font-semibold">This estimate stays honest.</h2>
              <div className="mt-6 space-y-3">
                {result.caveats.slice(0, 3).map((caveat) => (
                  <div className="flex gap-3 rounded-2xl bg-[var(--soft)] p-4" key={caveat}>
                    <div className="mt-0.5 flex-shrink-0 text-[var(--green)]">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </div>
                    <p className="text-sm leading-6 text-[var(--muted)]">{caveat}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card rounded-[2rem] p-7 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-white to-[var(--soft)] border border-[var(--line)]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] text-[var(--green)] pointer-events-none">
                <Footprints className="w-64 h-64" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--green)]/10 text-[var(--green)] mb-4">
                  <Footprints className="h-8 w-8 animate-bounce" style={{ animationDuration: '3s' }} />
                </span>
                <h3 className="text-lg font-bold text-[var(--ink)]">Every Step Counts</h3>
                <p className="text-xs text-[var(--muted)] max-w-[240px] mt-2 leading-5">
                  Reducing your emissions isn't about perfection. It's about small, consistent adjustments to your everyday routine.
                </p>
                <div className="mt-6 px-4 py-2 bg-[var(--ink)] text-[var(--mint)] rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                  {result.score >= 80 ? "Eco Champion" : result.score >= 60 ? "Low Carbon Hero" : "Climate Action Mode"}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
