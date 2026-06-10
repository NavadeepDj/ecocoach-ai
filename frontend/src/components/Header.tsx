import { Leaf, History, LogOut, User } from "lucide-react";
import type { UserProfile } from "../firebase";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--mint)] shadow-lg">
        <Leaf className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-bold tracking-tight">EcoCoach AI</p>
        <p className="text-xs font-medium text-[var(--muted)]">
          Your practical climate guide
        </p>
      </div>
    </div>
  );
}

interface AuthControlProps {
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onViewHistory: () => void;
}

export function AuthControl({
  user,
  onSignIn,
  onSignOut,
  onViewHistory,
}: AuthControlProps) {
  if (user) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-white/70 p-1 pr-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--green)] text-white font-bold text-sm">
          {user.displayName ? user.displayName[0].toUpperCase() : "U"}
        </span>
        <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline">
          {user.displayName || user.email}
        </span>
        <button
          onClick={onViewHistory}
          className="text-xs font-bold text-[var(--green)] hover:underline flex items-center gap-1"
        >
          <History className="h-3.5 w-3.5" /> History
        </button>
        <button
          onClick={onSignOut}
          className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors p-1"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={onSignIn} className="button-secondary text-xs py-1.5 px-3 min-h-0">
      <User className="h-3.5 w-3.5" /> Sign in
    </button>
  );
}
