import type { ChatMessage, ComparisonResult, FootprintResult, LifestyleProfile } from "./types";

export async function calculateFootprint(
  profile: LifestyleProfile,
): Promise<FootprintResult> {
  const response = await fetch("/api/footprint/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error("We could not calculate your footprint. Check your answers.");
  }

  return response.json() as Promise<FootprintResult>;
}

export async function saveFootprint(
  result: FootprintResult,
  token: string,
): Promise<{ status: string }> {
  const response = await fetch("/api/footprint/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error("Could not save your footprint. Please try again.");
  }

  return response.json() as Promise<{ status: string }>;
}

export async function getFootprintHistory(token: string): Promise<FootprintResult[]> {
  const response = await fetch("/api/footprint/history", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Could not load your history.");
  }

  return response.json() as Promise<FootprintResult[]>;
}

export async function getFootprintComparison(
  total: number,
  token: string,
): Promise<ComparisonResult> {
  const response = await fetch(`/api/footprint/comparison?total=${total}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Could not load footprint comparison data.");
  }

  return response.json() as Promise<ComparisonResult>;
}

export async function sendChatMessage(
  history: ChatMessage[],
  footprint: FootprintResult,
): Promise<string> {
  const response = await fetch("/api/coach/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ history, footprint }),
  });

  if (!response.ok) {
    throw new Error("Could not communicate with the coach.");
  }

  const data = await response.json() as { reply: string };
  return data.reply;
}



