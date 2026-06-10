/**
 * @module components/RecommendationList
 * @description Interactive checklist of personalised carbon-reduction
 * recommendations. Users can toggle actions to see projected savings.
 */
import { Check, Leaf } from "lucide-react";
import { categoryMeta } from "./Dashboard";
import type { FootprintResult } from "../types";

interface RecommendationListProps {
  /** The calculated footprint result including recommendations. */
  result: FootprintResult;
  /** IDs of recommendations the user has marked as completed. */
  completedRecs: string[];
  /** Toggle a recommendation's completed state by ID. */
  toggleRec: (id: string) => void;
}

/**
 * Renders a list of actionable, category-tagged recommendations.
 *
 * Each card acts as a checkbox (`role="checkbox"`) and is fully
 * keyboard-accessible (Enter / Space to toggle). Completed cards
 * are visually distinguished and feed into the Impact Calculator.
 */
export function RecommendationList({
  result,
  completedRecs,
  toggleRec,
}: RecommendationListProps) {
  return (
    <div className="card rounded-[2rem] p-7 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow">Climate Action Plan</p>
          <h2 className="mt-2 text-2xl font-semibold">Tailored recommendations</h2>
        </div>
      </div>
      {result.recommendations && result.recommendations.length > 0 ? (
        <div className="space-y-4" role="group" aria-label="Carbon reduction recommendations">
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
                aria-label={`${rec.title} — saves ${rec.estimated_savings} kg per month`}
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
  );
}
