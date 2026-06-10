import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Bolt,
  Bus,
  Car,
  Check,
  ChevronRight,
  CloudSun,
  History,
  Info,
  Leaf,
  LogOut,
  Plane,
  Recycle,
  RotateCcw,
  Sparkles,
  Train,
  User,
  Utensils,
  MessageSquare,
  Send,
  X,
  Footprints,
} from "lucide-react";
import {
  useState,
  useEffect,
  useRef,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { calculateFootprint, saveFootprint, getFootprintHistory, getFootprintComparison, sendChatMessage } from "./api";
import { signInWithGoogle, logout, onAuthChanged, getAuthToken, type UserProfile } from "./firebase";
import type {
  ComparisonResult,
  DietType,
  FootprintResult,
  LifestyleProfile,
  WasteLevel,
  ChatMessage,
} from "./types";

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

const steps = [
  { label: "Welcome", eyebrow: "A clearer starting point" },
  { label: "Travel", eyebrow: "How you move" },
  { label: "Home", eyebrow: "Energy at home" },
  { label: "Lifestyle", eyebrow: "Food and waste" },
  { label: "Review", eyebrow: "Ready to calculate" },
];

const categoryMeta = {
  transport: { label: "Transport", icon: Car, color: "var(--coral)" },
  electricity: { label: "Electricity", icon: Bolt, color: "var(--gold)" },
  food: { label: "Food", icon: Utensils, color: "var(--green)" },
  waste: { label: "Waste", icon: Recycle, color: "var(--blue)" },
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
      
      // If we have calculated result, save it immediately
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

function Brand() {
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs leading-4 text-white/55">{label}</p>
    </div>
  );
}

function Progress({ current }: { current: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
        <span>
          Step {current + 1} of {steps.length}
        </span>
        <span>{steps[current].label}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--soft)]">
        <div
          className="h-full rounded-full bg-[var(--green)] transition-all duration-500"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Welcome() {
  const [factIndex, setFactIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const facts = [
    "The average global carbon footprint is about 4.7 tonnes of CO2 per year, but the target to avoid 2°C warming is under 2 tonnes.",
    "Food accounts for 10-30% of a household's carbon footprint, with meat and dairy having the highest lifecycle emissions.",
    "Leaving an air conditioner running all day can generate 10-15 kg of CO2, depending on how your electricity is generated.",
    "Composting organic scraps and recycling avoids methane in landfills, reducing waste emissions by over 50%.",
    "Replacing a domestic short-haul flight with a train journey reduces travel carbon emissions by up to 80-90%.",
    "Energy-efficient LED bulbs use 75-80% less energy than traditional incandescent bulbs and last 25 times longer."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % facts.length);
        setFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-xl">
      <span className="icon-bubble">
        <CloudSun className="h-7 w-7" />
      </span>

      {/* hard facts flashing card */}
      <div className="mt-6 p-4 rounded-2xl bg-[var(--soft)] border border-[var(--line)] flex items-start gap-3 shadow-sm hover:shadow-md transition-all">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--green)]/10 text-[var(--green)] shrink-0 mt-0.5">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
        </span>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
            <span>Did You Know?</span>
            <span className="text-[9px] font-mono opacity-80">{factIndex + 1} / {facts.length}</span>
          </p>
          <p className={`text-xs text-[var(--ink)] leading-5 mt-1 transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
            {facts[factIndex]}
          </p>
        </div>
      </div>

      <p className="eyebrow mt-6 flex items-center gap-1.5">
        <Footprints className="h-3.5 w-3.5" /> Your baseline
      </p>
      <h2 className="section-title mt-3">Let’s make carbon feel less abstract.</h2>
      <p className="section-copy">
        We’ll ask about travel, home electricity, food, and waste. You’ll get a
        monthly estimate, a clear breakdown, and the biggest place to start.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          "No account needed",
          "Assumptions stay visible",
          "Change answers anytime",
          "AI never invents totals",
        ].map((item) => (
          <div className="mini-card" key={item}>
            <Check className="h-4 w-4 text-[var(--green)]" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function TravelStep({
  profile,
  updateNumber,
}: {
  profile: LifestyleProfile;
  updateNumber: (key: keyof LifestyleProfile, value: string) => void;
}) {
  return (
    <div>
      <p className="eyebrow">Weekly travel</p>
      <h2 className="section-title mt-3">How do you usually get around?</h2>
      <p className="section-copy">
        Rough estimates are absolutely fine. Flights use a monthly distance.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <NumberField
          icon={<Car />}
          label="Car"
          suffix="km / week"
          value={profile.weekly_car_km}
          onChange={(value) => updateNumber("weekly_car_km", value)}
        />
        <NumberField
          icon={<Bus />}
          label="Bus"
          suffix="km / week"
          value={profile.weekly_bus_km}
          onChange={(value) => updateNumber("weekly_bus_km", value)}
        />
        <NumberField
          icon={<Train />}
          label="Train"
          suffix="km / week"
          value={profile.weekly_train_km}
          onChange={(value) => updateNumber("weekly_train_km", value)}
        />
        <NumberField
          icon={<Plane />}
          label="Flights"
          suffix="km / month"
          value={profile.monthly_flight_km}
          onChange={(value) => updateNumber("monthly_flight_km", value)}
        />
      </div>
      <div className="mt-6 flex gap-3 rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 text-xs leading-5 text-[var(--muted)] shadow-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green)] animate-pulse" />
        <p>
          <strong>Travel Truth:</strong> Aviation emits about 285g of CO2 per passenger km, compared to just 14g for rail transit and 104g for average cars. Shifting short flights to trains reduces travel emissions by up to 90%!
        </p>
      </div>
    </div>
  );
}

function EnergyStep({
  profile,
  updateNumber,
}: {
  profile: LifestyleProfile;
  updateNumber: (key: keyof LifestyleProfile, value: string) => void;
}) {
  return (
    <div>
      <p className="eyebrow">Home energy</p>
      <h2 className="section-title mt-3">What does a month of electricity look like?</h2>
      <p className="section-copy">
        Check a recent electricity bill for kWh or units. In India, one billed
        unit is typically one kWh.
      </p>
      <div className="mt-8 max-w-md">
        <NumberField
          icon={<Bolt />}
          label="Monthly electricity"
          suffix="kWh / month"
          value={profile.monthly_electricity_kwh}
          onChange={(value) => updateNumber("monthly_electricity_kwh", value)}
        />
      </div>
      <div className="mt-6 flex gap-3 rounded-2xl bg-[var(--soft)] p-4 text-sm leading-6 text-[var(--muted)]">
        <Info className="mt-1 h-4 w-4 shrink-0 text-[var(--green)]" />
        The current demo uses an India-default grid factor. Regional electricity
        mixes can differ considerably.
      </div>
      <div className="mt-4 flex gap-3 rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 text-xs leading-5 text-[var(--muted)] shadow-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green)] animate-pulse" />
        <p>
          <strong>Power Truth:</strong> In carbon-intensive grids (like coal-reliant systems), electricity can account for over 50% of household footprint emissions. Adjusting AC thermostats by just 1°C saves up to 6% of cooling energy!
        </p>
      </div>
    </div>
  );
}

function LifestyleStep({
  profile,
  setProfile,
}: {
  profile: LifestyleProfile;
  setProfile: Dispatch<SetStateAction<LifestyleProfile>>;
}) {
  const diets: { value: DietType; label: string; note: string }[] = [
    { value: "vegan", label: "Vegan", note: "Plant-based" },
    { value: "vegetarian", label: "Vegetarian", note: "No meat or fish" },
    { value: "mixed", label: "Mixed", note: "A bit of everything" },
    { value: "meat_heavy", label: "Meat-heavy", note: "Meat most days" },
  ];
  const waste: { value: WasteLevel; label: string; note: string }[] = [
    { value: "low", label: "Low", note: "Reuse, sort, compost" },
    { value: "average", label: "Average", note: "Some sorting and reuse" },
    { value: "high", label: "High", note: "Frequent disposables" },
  ];

  return (
    <div>
      <p className="eyebrow">Everyday habits</p>
      <h2 className="section-title mt-3">Tell us about food and waste.</h2>
      <p className="section-copy">
        These use broad behavior bands for now, and your result will say so.
      </p>
      <ChoiceGroup
        title="Which best matches your diet?"
        icon={<Utensils />}
        options={diets}
        selected={profile.diet_type}
        onSelect={(diet_type) =>
          setProfile((current) => ({ ...current, diet_type }))
        }
      />
      <ChoiceGroup
        title="How would you describe household waste?"
        icon={<Recycle />}
        options={waste}
        selected={profile.waste_level}
        onSelect={(waste_level) =>
          setProfile((current) => ({ ...current, waste_level }))
        }
      />
    </div>
  );
}

function ChoiceGroup<T extends string>({
  title,
  icon,
  options,
  selected,
  onSelect,
}: {
  title: string;
  icon: ReactNode;
  options: { value: T; label: string; note: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <fieldset className="mt-7">
      <legend className="mb-3 flex items-center gap-2 font-semibold">
        <span className="h-4 w-4">{icon}</span> {title}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`choice ${selected === option.value ? "choice-selected" : ""}`}
          >
            <span>
              <strong>{option.label}</strong>
              <small>{option.note}</small>
            </span>
            {selected === option.value && <Check className="h-4 w-4" />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Review({ profile }: { profile: LifestyleProfile }) {
  const rows = [
    ["Car travel", `${profile.weekly_car_km} km / week`],
    ["Bus + train", `${profile.weekly_bus_km + profile.weekly_train_km} km / week`],
    ["Flights", `${profile.monthly_flight_km} km / month`],
    ["Electricity", `${profile.monthly_electricity_kwh} kWh / month`],
    ["Diet", profile.diet_type.replace("_", " ")],
    ["Waste", profile.waste_level],
  ];
  return (
    <div>
      <p className="eyebrow">One last look</p>
      <h2 className="section-title mt-3">Ready for your baseline?</h2>
      <p className="section-copy">
        Your estimate uses versioned factors and will include the important
        caveats alongside the result.
      </p>
      <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">
        {rows.map(([label, value]) => (
          <div
            className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 last:border-0"
            key={label}
          >
            <span className="text-sm text-[var(--muted)]">{label}</span>
            <span className="font-semibold capitalize">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberField({
  icon,
  label,
  suffix,
  value,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  suffix: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="number-field">
      <span className="flex items-center gap-2 font-semibold">
        <span className="h-5 w-5 text-[var(--green)]">{icon}</span>
        {label}
      </span>
      <span className="mt-5 flex items-end gap-2">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <small>{suffix}</small>
      </span>
    </label>
  );
}

function Dashboard({
  result,
  onReset,
  user,
  token,
  onSignIn,
  onSignOut,
  history,
  onSelectHistory,
  onViewHistory,
}: {
  result: FootprintResult;
  onReset: () => void;
  user: UserProfile | null;
  token: string;
  onSignIn: () => void;
  onSignOut: () => void;
  history: FootprintResult[];
  onSelectHistory: (result: FootprintResult) => void;
  onViewHistory: () => void;
}) {
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

  // Calculate user active bucket for community chart
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

          {/* Comparison / Save Card */}
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
                    
                    {/* Footprint Distribution Graph */}
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
                              {/* Hover tooltip */}
                              <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-[var(--ink)] text-white text-[10px] font-bold py-1 px-2 rounded-md whitespace-nowrap z-20 shadow-md">
                                {count} user{count !== 1 ? "s" : ""}
                              </div>
                              
                              {/* Bar */}
                              <div
                                className={`w-full rounded-t-md transition-all duration-500 cursor-pointer ${
                                  isActive ? "bg-[var(--green)]" : "bg-[var(--line)] hover:bg-gray-300"
                                }`}
                                style={{ height: `${Math.max(heightPercent, 8)}%` }}
                              />
                              
                              {/* You indicator pin */}
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

        {/* Climate Action Plan & Recommendations */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Recommendations Checklist */}
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

          {/* Potential Future Footprint */}
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
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green)]" />
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

// Subcomponents

function AuthControl({
  user,
  onSignIn,
  onSignOut,
  onViewHistory,
}: {
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onViewHistory: () => void;
}) {
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

function HistoryModal({
  history,
  onClose,
  onSelect,
}: {
  history: FootprintResult[];
  onClose: () => void;
  onSelect: (result: FootprintResult) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="card w-full max-w-lg rounded-3xl p-6 md:p-8 flex flex-col max-h-[80vh] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--ink)]">
            <History className="h-5 w-5 text-[var(--green)]" /> Footprint History
          </h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-black font-semibold text-sm">
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
              <div
                key={i}
                onClick={() => {
                  onSelect(h);
                  onClose();
                }}
                className="choice cursor-pointer hover:border-[var(--green)] flex items-center justify-between transition-all"
              >
                <div>
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatAssistantProps {
  result: FootprintResult | null;
}

function ChatAssistant({ result }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: "model",
        text: result
          ? "Hi! I'm EcoCoach. I've analyzed your carbon footprint and generated personalized recommendations. Feel free to ask me any questions!"
          : "Hi! I'm EcoCoach. Please calculate your carbon footprint first, and I can give you personalized coaching. In the meantime, feel free to ask me general green living questions!",
      },
    ]);
  }, [result]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    const footprintCtx = result || {
      period: "monthly",
      unit: "kg_co2e",
      total: 0,
      score: 0,
      score_band: "high_impact",
      largest_category: "transport",
      breakdown: { transport: 0, electricity: 0, food: 0, waste: 0 },
      factor_set: "none",
      factor_geography: "none",
      caveats: [],
      explanation: [],
      recommendations: [],
    };

    try {
      const reply = await sendChatMessage(newMessages, footprintCtx);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      console.error("Chat error", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I'm having trouble connecting right now. Please try again in a bit!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = () => {
    if (!result) {
      return [
        "How is my carbon footprint calculated?",
        "What is a typical household footprint?",
        "What are simple ways to start saving carbon?",
      ];
    }

    const list: string[] = [];
    const largest = result.largest_category;
    
    if (largest) {
      list.push(`How do I reduce my ${largest} footprint?`);
    }
    
    if (result.breakdown && result.breakdown.food > 120 && largest !== "food") {
      list.push("Tell me about food carbon impact.");
    }
    
    if (result.breakdown && result.breakdown.electricity > 50 && largest !== "electricity") {
      list.push("How to lower my electricity use?");
    }
    
    if (list.length < 3) {
      list.push("Give me a quick green tip.");
    }

    return list.slice(0, 3);
  };

  const suggestions = getSuggestions();

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat assistant"
          aria-expanded="false"
          className="flex items-center gap-2 rounded-full px-5 py-3.5 bg-[var(--ink)] text-[var(--mint)] shadow-2xl hover:scale-105 transition-all duration-300 border border-[var(--mint)]/20 cursor-pointer"
        >
          <MessageSquare className="h-5 w-5 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-wider">Chat with Coach</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="EcoCoach AI chat assistant"
          aria-modal="false"
          className="flex flex-col w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[85vh] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[var(--line)] overflow-hidden transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--ink)] text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--green)] text-[var(--mint)]">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">EcoCoach AI</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                  Climate Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat assistant"
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] text-xs leading-relaxed p-3.5 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-[var(--green)] text-white rounded-tr-none"
                      : "bg-[var(--soft)] text-[var(--ink)] rounded-tl-none border border-[var(--line)]/50"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--soft)] text-[var(--muted)] text-xs p-3.5 rounded-2xl rounded-tl-none border border-[var(--line)]/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[var(--muted)]/60 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[var(--muted)]/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[var(--muted)]/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion Prompts */}
          {!isLoading && suggestions.length > 0 && (
            <div className="px-4 pb-2 pt-1 flex flex-col gap-1.5 border-t border-[var(--line)]/40 bg-gray-50/50">
              <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider">
                Suggested questions:
              </p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug)}
                    className="text-[10px] text-[var(--green)] hover:text-white font-semibold bg-white hover:bg-[var(--green)] border border-[var(--green)]/35 hover:border-[var(--green)] rounded-full px-2.5 py-1 text-left transition-all"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-[var(--line)] flex gap-2 items-center bg-white"
          >
            <label htmlFor="chat-input-field" className="sr-only">Ask EcoCoach anything</label>
            <input
              id="chat-input-field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask EcoCoach anything..."
              disabled={isLoading}
              className="flex-1 bg-[var(--soft)] border border-[var(--line)] focus:border-[var(--green)] rounded-full px-4 py-2 text-xs outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="grid h-8 w-8 place-items-center rounded-full bg-[var(--ink)] text-white hover:scale-105 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;

