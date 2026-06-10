/**
 * @module components/BreakdownChart
 * @description Horizontal bar chart showing the user's carbon footprint
 * broken down by category (Transport, Electricity, Food, Waste).
 */
import { ChevronRight } from "lucide-react";
import { categoryMeta } from "./Dashboard";
import type { FootprintResult } from "../types";

interface BreakdownChartProps {
  /** The calculated footprint result containing the category breakdown. */
  result: FootprintResult;
}

/**
 * Renders a labelled horizontal bar chart of the four emission categories.
 * Each bar is proportional to the largest category so the user can
 * visually compare their biggest contributor at a glance.
 */
export function BreakdownChart({ result }: BreakdownChartProps) {
  const categories = Object.entries(result.breakdown) as [
    keyof typeof categoryMeta,
    number,
  ][];
  const max = Math.max(...categories.map(([, value]) => value));

  return (
    <div className="card rounded-[2rem] p-7 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Your breakdown</p>
          <h2 className="mt-2 text-2xl font-semibold">What shapes your total</h2>
        </div>
        <ChevronRight className="h-5 w-5 text-[var(--muted)]" />
      </div>
      <div className="mt-8 space-y-6" role="list" aria-label="Carbon footprint breakdown by category">
        {categories.map(([category, value]) => {
          const meta = categoryMeta[category];
          const Icon = meta.icon;
          return (
            <div key={category} role="listitem">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <Icon className="h-4 w-4" style={{ color: meta.color }} />
                  {meta.label}
                </span>
                <span className="text-sm font-semibold">
                  {value} <small className="text-[var(--muted)]">kg</small>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--soft)]" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={`${meta.label}: ${value} kg CO2e`}>
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
  );
}
