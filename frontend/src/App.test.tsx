import { render, screen, fireEvent } from "@testing-library/react";
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
  onAuthChanged: vi.fn((cb: (user: null) => void) => {
    cb(null);
    return () => {};
  }),
  getAuthToken: vi.fn().mockResolvedValue(""),
}));

describe("App Component", () => {
  it("renders the main title on the welcome step", () => {
    render(<App />);
    expect(
      screen.getByText(/Small choices. A footprint you can actually understand./i)
    ).toBeInTheDocument();
  });

  it("renders the brand correctly", () => {
    render(<App />);
    expect(screen.getByText("EcoCoach AI")).toBeInTheDocument();
  });

  it("renders the skip-to-content link for accessibility", () => {
    render(<App />);
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
  });

  it("shows Step 1 of 5 initially", () => {
    render(<App />);
    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
  });

  it("navigates to the Travel step when Continue is clicked", () => {
    render(<App />);
    const continueBtn = screen.getByText("Continue");
    fireEvent.click(continueBtn);
    expect(screen.getByText(/How do you usually get around/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();
  });

  it("navigates back from Travel step to Welcome", () => {
    render(<App />);
    // Go to step 2
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();
    // Go back
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
  });

  it("navigates through all steps to the Review step", () => {
    render(<App />);
    // Step 1 → 2
    fireEvent.click(screen.getByText("Continue"));
    // Step 2 → 3
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText(/What does a month of electricity look like/i)).toBeInTheDocument();
    // Step 3 → 4
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText(/Tell us about food and waste/i)).toBeInTheDocument();
    // Step 4 → 5 (Review)
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText(/Ready for your baseline/i)).toBeInTheDocument();
    expect(screen.getByText("See my footprint")).toBeInTheDocument();
  });

  it("disables the Back button on the first step", () => {
    render(<App />);
    const backBtn = screen.getByText("Back");
    expect(backBtn.closest("button")).toBeDisabled();
  });

  it("renders the chat assistant button", () => {
    render(<App />);
    expect(screen.getByLabelText("Open chat assistant")).toBeInTheDocument();
  });

  it("displays the India demo factors badge", () => {
    render(<App />);
    expect(screen.getByText("India demo factors")).toBeInTheDocument();
  });
});
