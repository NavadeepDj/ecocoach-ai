# EcoCoach AI Implementation Plan

## Product Goal

EcoCoach AI is a context-aware sustainability assistant for students,
professionals, and families. It helps users estimate, understand, track, and
reduce their carbon footprint through transparent calculations, personalized
recommendations, progress history, and website carbon audits.

## Product Principles

- Carbon calculations must be deterministic, transparent, and testable.
- AI may guide conversations and explain results, but must not invent emission
  calculations or savings.
- Recommendations must be tied to the user's measured footprint and include
  estimated savings where possible.
- Emission factors must record their source, geography, unit, and version.
- The first website-audit release accepts a pasted URL. Inspecting the currently
  open browser tab requires a separate browser extension and is deferred.
- The application must work without an external AI provider by using a
  deterministic fallback coach.
- The initial build should remain small, locally runnable, and easy to deploy.

## Proposed Technical Direction

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: FastAPI, Python
- Persistence: SQLite for local development, designed for a later PostgreSQL
  deployment
- AI: provider-neutral adapter with a deterministic fallback
- Website audit: server-side URL audit with strict SSRF protections; use a
  browser-based measurement approach only after the basic audit is secure
- Testing: backend unit and API tests, focused frontend component tests, and a
  small end-to-end happy-path suite

## Scope Decisions

### MVP Includes

- Guided profile assessment
- Deterministic monthly footprint calculation for transport, electricity, food,
  and waste
- Category breakdown and Carbon Health Score
- Personalized, rule-based recommendations with estimated savings
- Saved footprint history and progress dashboard
- Optional AI explanations and coaching with a mock fallback
- Pasted-URL website carbon audit
- Documentation, tests, and local run instructions

### Deferred

- Browser extension for auditing the currently open tab
- Social features, teams, challenges, and leaderboards
- Automated utility or transport-data integrations
- Native mobile applications
- Complex household member permissions
- Production billing or paid plans

## Phase 0: Product Foundation

Goal: resolve the assumptions that affect every later calculation and establish
the project contracts before feature work starts.

Deliverables:

- Architecture decision record
- Defined MVP personas and primary user journey
- Versioned emissions-factor catalog with documented sources
- API contract and data model
- UX wireframes and accessibility baseline
- Security model for website URL auditing

Exit criteria:

- Every footprint input has a unit and validation rule.
- Every output category has a documented calculation formula.
- Open product decisions are either resolved or explicitly deferred.

## Phase 1: Deterministic Carbon Engine

Goal: produce reliable, explainable footprint calculations independently of AI
and UI.

Deliverables:

- Backend foundation and configuration
- Profile and calculation schemas
- Versioned emission-factor loading
- Transport, electricity, food, and waste calculators
- Total footprint and Carbon Health Score
- Calculation explanations and factor provenance
- Unit and API tests

Exit criteria:

- Given the same profile and factor version, the engine always returns the same
  result.
- Category totals, units, formulas, and factor sources are visible in the
  response.
- Boundary and invalid-input tests pass.

## Phase 2: Assessment And Dashboard MVP

Goal: let a user complete an assessment and understand their baseline.

Deliverables:

- React application shell and design system
- Guided onboarding/profile assessment
- Dashboard with total, score, category breakdown, and largest contributor
- Responsive and accessible states for loading, errors, and empty data
- Frontend/backend integration tests

Exit criteria:

- A first-time user can complete the assessment and see a baseline footprint.
- Results clearly state the reporting period and units.

## Phase 3: Recommendations And Coaching

Goal: turn footprint results into specific, measurable next actions.

Deliverables:

- Rule-based recommendation engine
- Estimated savings calculation and difficulty labels
- Recommendation ranking based on impact and user context
- AI provider adapter and deterministic fallback coach
- Context-aware assistant flow that asks one question at a time
- Safety rules preventing AI-generated calculation claims

Exit criteria:

- Recommendations are reproducible without AI.
- AI explanations cite deterministic calculation results and degrade gracefully
  when the provider is unavailable.

## Phase 4: Persistence And Progress

Goal: show whether user behavior and estimated emissions improve over time.

Deliverables:

- User/profile persistence
- Immutable footprint snapshots with factor-version metadata
- Recommendation persistence and completion status
- Progress API and trend charts
- Before/after comparison and category-level change

Exit criteria:

- Recalculating a changed profile creates a new history entry.
- Historical results remain explainable even after factor updates.

## Phase 5: Website Carbon Audit

Goal: estimate the footprint of a pasted webpage URL and provide actionable web
performance recommendations.

Deliverables:

- Secure URL validation and SSRF protections
- Page measurement and configurable carbon-estimation model
- Asset breakdown for images, JavaScript, video, PDFs, and third-party requests
- Audit history and optimization tips
- Timeouts, size limits, and error handling

Exit criteria:

- Public HTTP(S) URLs can be audited safely.
- Local, private, metadata-service, and otherwise disallowed destinations are
  blocked.
- Estimates show assumptions and should not be presented as exact measurements.

## Phase 6: Quality, Documentation, And Deployment

Goal: make the project demonstrable, maintainable, and deployable.

Deliverables:

- End-to-end happy-path tests
- Accessibility and responsive-design pass
- Complete README and architecture documentation
- Environment example and deployment configuration
- CI checks for backend and frontend
- Demo data and deployment verification

Exit criteria:

- A new contributor can run each side with one documented command.
- CI is green and no secrets or heavy binaries are committed.
- The deployed demo supports the complete MVP journey.

## Phase 7: Browser Extension Exploration

Goal: determine whether active-tab auditing creates enough user value to justify
the added permissions and maintenance.

Deliverables:

- Browser-extension feasibility spike
- Permission and privacy review
- Active-tab measurement prototype
- Go/no-go decision

## Open Decisions Before Implementation

1. Should the first demo use a single local user, lightweight sign-in, or full
   authentication?
2. Which geography should be the default for electricity and transport emission
   factors?
3. Should the Carbon Health Score compare users against a global target,
   regional average, or a personal baseline?
4. Which AI provider, if any, should be configured for the first deployment?
5. What hosting platforms are preferred for the frontend, backend, and database?

