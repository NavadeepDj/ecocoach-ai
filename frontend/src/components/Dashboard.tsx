import { useState, useEffect } from "react";
import { Bike, Check, ChevronRight, Footprints, Leaf, User, Sparkles, Bolt, Car, Recycle, Utensils, RotateCcw } from "lucide-react";
import { getFootprintComparison } from "../api";
import { Brand, AuthControl } from "./Header";
import type { FootprintResult, ComparisonResult } from "../types";
import type { UserProfile } from "../firebase";

export const categoryMeta = {
  transport: { label: "Transport", icon: Car, color: "var(--coral)" },
  electricity: { label: "Electricity", icon: Bolt, color: "var(--gold)" },
  food: { label: "Food", icon: Utensils, color: "var(--green)" },
  waste: { label: "Waste", icon: Recycle, color: "var(--blue)" },
};

interface DashboardProps {
  result: FootprintResult;
  onReset: () => void;
  user: UserProfile | null;
  token: string;
  onSignIn: () => void;
  onSignOut: () => void;
  history: FootprintResult[];
  onSelectHistory: (result: FootprintResult) => void;
  onViewHistory: () => void;
}

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

  const toggleRec = (id: string) => {
    setCompletedRecs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalSavings = (result.recommendations || [])
    .filter((rec) => completedRecs.includes(rec.id))
    .reduce((acc, rec) => acc + rec.estimated_savings, 0);
  const futureFootprint = Math.max(0, result.total - totalSavings);
  const target = 166.67;
  const futureScore = Math.max(0, Math.min(100, Math.round(100 / (1 + futureFootprint / target))));
  const getScoreBand = (score: number) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "needs improvement";
    return "high impact";
  };

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

  const categories = Object.entries(result.breakdown) as [
    keyof typeof categoryMeta,
    number,
  ][];
  const max = Math.max(...categories.map(([, value]) => value));

  const userTotal = result.total;
  let activeBucket = "";
  if (userTotal <= 100) activeBucket = "0-100";
  else if (userTotal <= 200) activeBucket = "100-200";
  else if (userTotal <= 300) activeBucket = "200-300";
  else if (userTotal <= 400) activeBucket = "300-400";
  else if (userTotal <= 500) activeBucket = "400-500";
  else activeBucket = "500+";

  const buckets = ["0-100", "100-200", "200-300", "300-400", "400-500", "500+"];
  const maxCount = comparison ? Math.max(...Object.values(comparison.distribution), 1) : 1;

  return (
    <>
      <a
        href="#main-dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-[var(--green)] focus:font-bold focus:border focus:border-[var(--line)] focus:rounded-xl"
      >
        Skip to main content
      </a>
      <main id="main-dashboard-content" className="min-h-screen px-4 py-5 md:px-8 md:py-7">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
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
      </header>

      <section className="mx-auto max-w-6xl py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Your monthly baseline</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
              Here’s where you stand.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
            Estimated with factor set <strong>{result.factor_set}</strong>.
            Treat this as a useful direction, not an exact inventory.
          </p>
        </div>

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
                <p className="text-sm font-semibold text-[var(--muted)]">
                  Carbon Health Score
                </p>
                <p className="mt-2 text-5xl font-semibold">{result.score}</p>
              </div>
              <span className="icon-bubble">
                <Bike className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-7 h-3 overflow-hidden rounded-full bg-[var(--soft)]">
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

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card rounded-[2rem] p-7 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Your breakdown</p>
                <h2 className="mt-2 text-2xl font-semibold">What shapes your total</h2>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--muted)]" />
            </div>
            <div className="mt-8 space-y-6">
              {categories.map(([category, value]) => {
                const meta = categoryMeta[category];
                const Icon = meta.icon;
                return (
                  <div key={category}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold">
                        <Icon className="h-4 w-4" style={{ color: meta.color }} />
                        {meta.label}
                      </span>
                      <span className="text-sm font-semibold">
                        {value} <small className="text-[var(--muted)]">kg</small>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--soft)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: meta.color,
                          width: `${(value / max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!user ? (
            <div className="card rounded-[2rem] p-7 md:p-8 flex flex-col justify-between">
              <div>
                <p className="eyebrow">Compare & Save</p>
                <h2 className="mt-2 text-2xl font-semibold">Where do you rank?</h2>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  Sign in with Google to securely save this estimate to your profile and unlock your community percentile rank.
                </p>
              </div>
              <div className="mt-8">
                <button onClick={onSignIn} className="button-primary w-full flex items-center justify-center gap-2">
                  <User className="h-4 w-4" /> Sign In to Compare & Save
                </button>
              </div>
            </div>
          ) : (
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
                      Your monthly footprint is lower than <strong>{comparison.percentile}%</strong> of registered users in the community.
                    </p>
                    
                    <div className="mt-8">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-4 text-center">
                        Community Footprint Distribution (kg CO2e)
                      </p>
                      <div className="flex items-end justify-between gap-2 h-24 border-b border-[var(--line)] pb-1">
                        {buckets.map((bucket) => {
                          const count = comparison.distribution[bucket] || 0;
                          const heightPercent = (count / maxCount) * 100;
                          const isActive = bucket === activeBucket;
                          return (
                            <div key={bucket} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                              <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-[var(--ink)] text-white text-[10px] font-bold py-1 px-2 rounded-md whitespace-nowrap z-20 shadow-md">
                                {count} user{count !== 1 ? "s" : ""}
                              </div>
                              
                              <div
                                className={`w-full rounded-t-md transition-all duration-500 cursor-pointer ${
                                  isActive ? "bg-[var(--green)]" : "bg-[var(--line)] hover:bg-gray-300"
                                }`}
                                style={{ height: `${Math.max(heightPercent, 8)}%` }}
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
                        {buckets.map((b) => (
                          <span key={b} className="flex-1 text-center truncate">{b}</span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-[var(--muted)]">Unable to fetch comparison data.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card rounded-[2rem] p-7 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="eyebrow">Climate Action Plan</p>
                <h2 className="mt-2 text-2xl font-semibold">Tailored recommendations</h2>
              </div>
            </div>
            {result.recommendations && result.recommendations.length > 0 ? (
              <div className="space-y-4">
                {result.recommendations.map((rec) => {
                  const meta = categoryMeta[rec.category as keyof typeof categoryMeta];
                  const Icon = meta?.icon || Leaf;
                  const isCompleted = completedRecs.includes(rec.id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => toggleRec(rec.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleRec(rec.id);
                        }
                      }}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={isCompleted}
                      className={`flex gap-4 p-5 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--green)] focus:ring-offset-2 ${
                        isCompleted
                          ? "border-[var(--green)] bg-[var(--green)]/5"
                          : "border-[var(--line)] bg-white/50 hover:bg-white/80"
                      }`}
                    >
                      <div className="flex items-start pt-1">
                        <div
                          className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                            isCompleted
                              ? "border-[var(--green)] bg-[var(--green)] text-white"
                              : "border-[var(--muted)]/40 bg-white"
                          }`}
                        >
                          {isCompleted && <Check className="h-4 w-4" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${meta?.color}15`,
                              color: meta?.color,
                            }}
                          >
                            <Icon className="h-3.5 w-3.5" style={{ color: meta?.color }} />
                            {rec.category}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              rec.difficulty === "easy"
                                ? "bg-green-100 text-green-700"
                                : rec.difficulty === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {rec.difficulty}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--green)] bg-[var(--mint)]/30 px-2 py-0.5 rounded-full ml-auto">
                            -{rec.estimated_savings} kg/month
                          </span>
                        </div>
                        <h3 className="font-semibold text-base text-[var(--ink)]">{rec.title}</h3>
                        <p className="text-xs text-[var(--muted)] mt-1">{rec.description}</p>
                        <p className="text-xs font-semibold text-[var(--green)] mt-2 bg-[var(--soft)] p-2 rounded-xl border border-[var(--line)]">
                          💡 {rec.rationale}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                You already have a very low footprint! No recommendations are triggered.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="card rounded-[2rem] p-7 md:p-8 flex-1 flex flex-col justify-between">
              <div>
                <p className="eyebrow">Impact Calculator</p>
                <h2 className="mt-2 text-2xl font-semibold flex items-center gap-1.5">
                  <Footprints className="h-5 w-5 text-[var(--green)]" /> Future Footprint
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Check actions on the left to see how much carbon you could save next month.
                </p>

                <div className="mt-8 flex items-baseline gap-2 justify-center py-6 border-y border-[var(--line)] bg-[var(--soft)] rounded-[1.5rem]">
                  <div className="text-center w-1/2 border-r border-[var(--line)]">
                    <span className="text-4xl font-extrabold text-[var(--ink)] block">
                      {futureFootprint.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Future (kg CO2e)
                    </span>
                  </div>
                  <div className="text-center w-1/2">
                    <span className="text-4xl font-extrabold text-[var(--green)] block">
                      -{totalSavings.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--green)]">
                      Monthly Savings
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-[var(--muted)]">Future Score</span>
                      <span className="text-xs font-bold text-[var(--ink)]">{futureScore}/100</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--soft)]">
                      <div
                        className="h-full rounded-full bg-[var(--green)] transition-all duration-300"
                        style={{ width: `${futureScore}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-[var(--muted)] mt-2">
                      Band: <span className="capitalize text-[var(--green)] font-extrabold">{getScoreBand(futureScore)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-[var(--ink)] text-white p-5 rounded-2xl">
                <p className="text-xs text-white/70 leading-5">
                  If you complete all selected recommendations, you will reduce your footprint by{" "}
                  <strong>{((totalSavings / (result.total || 1)) * 100).toFixed(0)}%</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

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
