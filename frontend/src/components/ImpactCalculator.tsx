/**
 * @module components/ImpactCalculator
 * @description "What-if" calculator that projects future footprint and
 * Carbon Health Score based on which recommendations the user selects.
 */
import { Footprints } from "lucide-react";

interface ImpactCalculatorProps {
  /** The user's current total monthly footprint in kg CO2e. */
  currentTotal: number;
  /** Sum of estimated_savings for all checked recommendations. */
  totalSavings: number;
}

/**
 * Derives a projected Carbon Health Score from an estimated monthly footprint.
 *
 * The formula mirrors the backend: `100 / (1 + footprint / target)` where
 * target is 166.67 kg CO2e (≈ 2 tonnes / year).
 */
function getScoreBand(score: number): string {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "needs improvement";
  return "high impact";
}

/**
 * Renders a side-panel showing projected savings, future footprint, and a
 * projected Carbon Health Score bar. Updates live as the user toggles
 * recommendation checkboxes in {@link RecommendationList}.
 */
export function ImpactCalculator({
  currentTotal,
  totalSavings,
}: ImpactCalculatorProps) {
  const target = 166.67;
  const futureFootprint = Math.max(0, currentTotal - totalSavings);
  const futureScore = Math.max(
    0,
    Math.min(100, Math.round(100 / (1 + futureFootprint / target)))
  );

  return (
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
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--soft)]" role="progressbar" aria-valuenow={futureScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Projected Carbon Health Score: ${futureScore} out of 100`}>
              <div
                className="h-full rounded-full bg-[var(--green)] transition-all duration-300"
                style={{ width: `${futureScore}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-[var(--muted)] mt-2">
              Band:{" "}
              <span className="capitalize text-[var(--green)] font-extrabold">
                {getScoreBand(futureScore)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-[var(--ink)] text-white p-5 rounded-2xl">
        <p className="text-xs text-white/70 leading-5">
          If you complete all selected recommendations, you will reduce your footprint by{" "}
          <strong>
            {((totalSavings / (currentTotal || 1)) * 100).toFixed(0)}%
          </strong>
          .
        </p>
      </div>
    </div>
  );
}
