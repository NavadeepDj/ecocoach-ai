/**
 * @module components/Questionnaire
 * @description Multi-step carbon footprint questionnaire components.
 * Includes the Welcome screen, Travel/Energy/Lifestyle input steps,
 * the Review summary, and shared UI primitives (Progress, NumberField, etc.).
 */
import { useState, useEffect, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { CloudSun, Footprints, Check, Sparkles, Car, Bus, Train, Plane, Bolt, Info, Utensils, Recycle } from "lucide-react";
import type { LifestyleProfile, DietType, WasteLevel } from "../types";

export const steps = [
  { label: "Welcome", eyebrow: "A clearer starting point" },
  { label: "Travel", eyebrow: "How you move" },
  { label: "Home", eyebrow: "Energy at home" },
  { label: "Lifestyle", eyebrow: "Food and waste" },
  { label: "Review", eyebrow: "Ready to calculate" },
];

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs leading-4 text-white/55">{label}</p>
    </div>
  );
}

export function Progress({ current }: { current: number }) {
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

export function Welcome() {
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

export function TravelStep({
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

export function EnergyStep({
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

export function LifestyleStep({
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

export function ChoiceGroup<T extends string>({
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
            role="radio"
            aria-checked={selected === option.value}
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

export function Review({ profile }: { profile: LifestyleProfile }) {
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

export function NumberField({
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
