export type DietType = "vegan" | "vegetarian" | "mixed" | "meat_heavy";
export type WasteLevel = "low" | "average" | "high";

export interface LifestyleProfile {
  weekly_car_km: number;
  weekly_bus_km: number;
  weekly_train_km: number;
  monthly_flight_km: number;
  monthly_electricity_kwh: number;
  diet_type: DietType;
  waste_level: WasteLevel;
  location: string;
}

export interface FootprintResult {
  period: string;
  unit: string;
  total: number;
  score: number;
  score_band: string;
  largest_category: string;
  breakdown: Record<"transport" | "electricity" | "food" | "waste", number>;
  factor_set: string;
  factor_geography: string;
  caveats: string[];
  explanation: string[];
  created_at?: string;
  recommendations: Recommendation[];
}

export interface ComparisonResult {
  percentile: number;
  total_users: number;
  distribution: Record<string, number>;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  estimated_savings: number;
  difficulty: "easy" | "medium" | "hard";
  rationale: string;
  category: "transport" | "electricity" | "food" | "waste";
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}



