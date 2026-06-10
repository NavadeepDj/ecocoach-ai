import { History, ChevronRight } from "lucide-react";
import type { FootprintResult } from "../types";

interface HistoryModalProps {
  history: FootprintResult[];
  onClose: () => void;
  onSelect: (result: FootprintResult) => void;
}

export function HistoryModal({ history, onClose, onSelect }: HistoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="card w-full max-w-lg rounded-3xl p-6 md:p-8 flex flex-col max-h-[80vh] shadow-2xl" role="dialog" aria-labelledby="history-modal-title">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
          <h2 id="history-modal-title" className="text-xl font-bold flex items-center gap-2 text-[var(--ink)]">
            <History className="h-5 w-5 text-[var(--green)]" /> Footprint History
          </h2>
          <button onClick={onClose} aria-label="Close History Modal" className="text-[var(--muted)] hover:text-black font-semibold text-sm">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">
              No saved footprints found. Complete an assessment to save one!
            </p>
          ) : (
            history.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelect(h);
                  onClose();
                }}
                className="choice w-full cursor-pointer hover:border-[var(--green)] flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[var(--green)]"
                aria-label={`Load footprint result from ${h.created_at ? new Date(h.created_at).toLocaleDateString() : 'unknown date'}`}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base text-[var(--ink)]">{h.total} kg CO2e</p>
                    {h.created_at && (
                      <span className="text-[10px] text-[var(--muted)] bg-[var(--soft)] px-2 py-0.5 rounded-full font-bold">
                        {new Date(h.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Score: {h.score} | Period: {h.period}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
