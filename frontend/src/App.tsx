import { useState, useEffect, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { calculateFootprint, saveFootprint, getFootprintHistory } from "./api";
import { signInWithGoogle, logout, onAuthChanged, getAuthToken, type UserProfile } from "./firebase";
import type { FootprintResult, LifestyleProfile } from "./types";

import { Brand, AuthControl } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { HistoryModal } from "./components/HistoryModal";
import { ChatAssistant } from "./components/ChatAssistant";
import { steps, Welcome, TravelStep, EnergyStep, LifestyleStep, Review, Stat } from "./components/Questionnaire";
import { Progress } from "./components/Questionnaire";

const initialProfile: LifestyleProfile = {
  weekly_car_km: 0,
  weekly_bus_km: 0,
  weekly_train_km: 0,
  monthly_flight_km: 0,
  monthly_electricity_kwh: 120,
  diet_type: "mixed",
  waste_level: "average",
  location: "IN",
};

function App() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initialProfile);
  const [result, setResult] = useState<FootprintResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string>("");
  const [history, setHistory] = useState<FootprintResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await getAuthToken();
          setToken(idToken);
          const userHistory = await getFootprintHistory(idToken);
          setHistory(userHistory);
        } catch (err) {
          console.error("Failed to load history on auth change", err);
        }
      } else {
        setToken("");
        setHistory([]);
      }
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    try {
      const loggedUser = await signInWithGoogle();
      setUser(loggedUser);
      const idToken = await getAuthToken();
      setToken(idToken);
      const userHistory = await getFootprintHistory(idToken);
      setHistory(userHistory);
      
      if (result) {
        await saveFootprint(result, idToken);
        const updatedHistory = await getFootprintHistory(idToken);
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error("Sign in failed", err);
      setError("Google sign in failed.");
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken("");
      setHistory([]);
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  const updateNumber = (key: keyof LifestyleProfile, value: string) => {
    setProfile((current) => ({
      ...current,
      [key]: Math.max(0, Number(value) || 0),
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await calculateFootprint(profile);
      setResult(res);
      const currentToken = await getAuthToken();
      if (currentToken) {
        await saveFootprint(res, currentToken);
        const updatedHistory = await getFootprintHistory(currentToken);
        setHistory(updatedHistory);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <>
        <Dashboard
          result={result}
          onReset={() => setResult(null)}
          user={user}
          token={token}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          history={history}
          onSelectHistory={(h) => setResult(h)}
          onViewHistory={() => setShowHistory(true)}
        />
        {showHistory && (
          <HistoryModal
            history={history}
            onClose={() => setShowHistory(false)}
            onSelect={(h) => setResult(h)}
          />
        )}
        <ChatAssistant result={result} />
      </>
    );
  }

  return (
    <>
      <a
        href="#main-assessment-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-[var(--green)] focus:font-bold focus:border focus:border-[var(--line)] focus:rounded-xl"
      >
        Skip to main content
      </a>
      <main id="main-assessment-content" className="min-h-screen px-4 py-4 md:px-8 md:py-7">
        <header className="mx-auto flex max-w-6xl items-center justify-between">
          <Brand />
          <div className="flex items-center gap-3">
            <AuthControl
              user={user}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              onViewHistory={() => setShowHistory(true)}
            />
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              India demo factors
            </span>
          </div>
        </header>

        <section className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[0.72fr_1.28fr] lg:py-14">
          <aside className="hero-panel rounded-[2rem] p-7 text-white md:p-10">
            <p className="eyebrow text-[var(--mint)]">{steps[step].eyebrow}</p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight md:text-6xl">
              Small choices. A footprint you can actually understand.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">
              EcoCoach turns everyday habits into an explainable monthly estimate,
              then helps you focus on the changes that matter most.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              <Stat value="4" label="clear categories" />
              <Stat value="100%" label="explainable" />
              <Stat value="5 min" label="to your baseline" />
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[var(--mint)]" />
                <p className="font-semibold">Built to coach, not judge</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Your result is an estimate with visible assumptions, never a
                hidden AI guess.
              </p>
            </div>
          </aside>

          <form
            onSubmit={submit}
            className="card flex min-h-[650px] flex-col rounded-[2rem] p-6 md:p-10"
          >
            <Progress current={step} />
            <div className="flex-1 py-8 md:py-10">
              {step === 0 && <Welcome />}
              {step === 1 && (
                <TravelStep profile={profile} updateNumber={updateNumber} />
              )}
              {step === 2 && (
                <EnergyStep profile={profile} updateNumber={updateNumber} />
              )}
              {step === 3 && (
                <LifestyleStep profile={profile} setProfile={setProfile} />
              )}
              {step === 4 && <Review profile={profile} />}
            </div>

            {error && (
              <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-5">
              <button
                type="button"
                className="button-secondary"
                disabled={step === 0}
                onClick={() => setStep((current) => Math.max(0, current - 1))}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => setStep((current) => current + 1)}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button className="button-primary" disabled={loading}>
                  {loading ? "Calculating..." : "See my footprint"}
                  {!loading && <Sparkles className="h-4 w-4" />}
                </button>
              )}
            </div>
          </form>
        </section>
        {showHistory && (
          <HistoryModal
            history={history}
            onClose={() => setShowHistory(false)}
            onSelect={(h) => setResult(h)}
          />
        )}
      </main>
      <ChatAssistant result={null} />
    </>
  );
}

export default App;
