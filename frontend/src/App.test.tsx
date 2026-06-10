import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// Mock the API and Firebase modules since they do side effects
vi.mock("./api", () => ({
  calculateFootprint: vi.fn(),
  saveFootprint: vi.fn(),
  getFootprintHistory: vi.fn().mockResolvedValue([]),
  getFootprintComparison: vi.fn(),
  sendChatMessage: vi.fn(),
}));

vi.mock("./firebase", () => ({
  signInWithGoogle: vi.fn(),
  logout: vi.fn(),
  onAuthChanged: vi.fn((cb) => {
    cb(null);
    return () => {}; // unsubscribe function
  }),
  getAuthToken: vi.fn(),
}));

describe("App Component", () => {
  it("renders the main title", () => {
    render(<App />);
    expect(screen.getByText(/Small choices. A footprint you can actually understand./i)).toBeInTheDocument();
  });

  it("renders the brand correctly", () => {
    render(<App />);
    expect(screen.getByText("EcoCoach AI")).toBeInTheDocument();
  });
});
