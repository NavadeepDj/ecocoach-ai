# EcoCoach AI

EcoCoach AI is a context-aware sustainability assistant that helps people estimate, understand, track, and reduce their carbon footprint. 

Calculations are deterministic and explainable; AI is used as a coaching and explanation layer, ensuring transparency and accountability.

---

## Features

- **Deterministic Carbon Calculation**: Monthly calculation across four key categories (Transport, Electricity, Food, and Waste) based on versioned emission factor catalogs.
- **Explainable Scores & Caveats**: Each calculation provides a transparent Carbon Health Score (0-100) and outlines the underlying assumptions and caveats.
- **Context-Aware AI Coach**: A friendly chat assistant powered by the new `google-genai` SDK that answers questions about your specific footprint and offers actionable, context-aware savings recommendations.
- **Local Fallback Mode**: If the Gemini API is offline or unconfigured, the AI Coach falls back to a deterministic, keyword-matched recommendation engine.
- **Firebase Persistence**: Save your assessment history, track trends over time, and compare your footprint against other users.
- **Google Authentication**: Take assessments anonymously first, then sign in with Google to securely save your history and sync results across devices.
- **Interactive Distribution Analysis**: Compare your carbon footprint against the community with a percentile score and a distribution bucket chart.
- **A11y Compliant**: Built with keyboard navigation, visible focus indicators, skip-to-content links, and ARIA markup for screen readers.

---

## Repository Layout

```text
backend/   FastAPI application, deterministic carbon engine, and tests
frontend/  React + TypeScript + Vite single-page application
docs/      Product plan, architecture decisions, and calculation methodology
```

---

## Run The Backend

1. **Set Up Virtual Environment**:
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -e ".[dev]"
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` in the `backend/` directory:
   ```env
   ECOCOACH_FIREBASE_SERVICE_ACCOUNT=path/to/your/firebase-adminsdk.json
   ECOCOACH_GEMINI_API_KEY=your-gemini-api-key
   ```
   *Note: If no service account is provided, EcoCoach automatically runs in local mock database mode.*

3. **Start the API Server**:
   ```powershell
   uvicorn app.main:app --reload
   ```
   Open `http://127.0.0.1:8000/docs` for interactive Swagger API documentation.

4. **Run Backend Tests**:
   ```powershell
   pytest
   ```

---

## Run The Frontend

1. **Install Dependencies**:
   ```powershell
   cd frontend
   npm install
   ```

2. **Configure Environment**:
   Create a `frontend/.env` file with your Firebase Client Configuration:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
   *Note: If these variables are left unconfigured, the frontend automatically runs in mock auth mode, allowing full development without Firebase setup.*

3. **Start Development Server**:
   ```powershell
   npm run dev
   ```
   Open `http://localhost:5173` to view the application.

4. **Build for Production**:
   ```powershell
   npm run build
   ```

5. **Run Frontend Tests**:
   ```powershell
   npm run test
   ```

---

## Hackathon Problem Statement Alignment

This project directly addresses the hackathon problem statement:

1. **Meaningful Actionability** — Breaks complex global carbon emission problems into relatable, everyday user habits. The deterministic engine provides baseline measurements and identifies the user's largest carbon contributor.
2. **Context-Aware Recommendations** — Gemini AI leverages the user's specific lifestyle profile (diet, travel, energy) to recommend targeted emission-reduction strategies, calculating precise monthly kilogram savings for each tip.
3. **Transparent Coaching** — EcoCoach avoids hallucinated "AI math." Calculations and assumptions are explicitly presented. The AI layer acts strictly as a coach to explain data and provide actionable advice.
4. **Resiliency & Fallbacks** — The system features a local fallback rule-engine. If Gemini fails or times out, the app gracefully degrades to deterministic recommendations using a prioritised model hierarchy.

---

## Quality & Testing

This project is optimised and audited against five key quality metrics:

| Metric | Approach |
|---|---|
| **Security** | Zero credentials in Git, sanitised auth errors, strict Pydantic input validation, explicit CORS origin/method/header whitelisting, bounded chat histories. |
| **Code Quality** | Modular React components (`Dashboard`, `ChatAssistant`, `Questionnaire`, `BreakdownChart`, `CommunityComparison`, `RecommendationList`, `ImpactCalculator`), JSDoc on all modules, barrel exports, ErrorBoundary, typed Firebase config. |
| **Efficiency** | Cached Gemini clients, `@lru_cache` settings, clean Firestore subcollection queries. |
| **Testing** | 23 backend Pytest tests (API, calculator, coach fallback, Firebase mock, recommendations). Frontend Vitest + React Testing Library tests. |
| **Accessibility** | `lang="en"`, skip links, `<nav>` landmarks, `aria-live="polite"` on chat, `role="progressbar"` on charts, `role="checkbox"` on recommendations, full keyboard navigation. |

