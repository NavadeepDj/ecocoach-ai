# EcoCoach AI GitHub Issue Backlog

These issues are ordered by dependency and grouped into implementation phases.
They are ready to create once a writable GitHub repository is available.

## Phase 0: Product Foundation

### Issue: Define MVP personas, journeys, and acceptance criteria

**Labels:** `phase:0`, `type:product`, `priority:high`

Define the primary journeys for students, professionals, and families, then
select the single journey the MVP optimizes first.

Acceptance criteria:

- Primary MVP persona and journey are documented.
- MVP and deferred capabilities are clearly separated.
- Success metrics and demo acceptance criteria are documented.
- Open product decisions have named owners or explicit defaults.

### Issue: Document architecture decisions and service boundaries

**Labels:** `phase:0`, `type:architecture`, `priority:high`

Document the frontend, backend, persistence, deterministic engine, AI adapter,
and website-audit boundaries.

Acceptance criteria:

- Deterministic calculation and AI responsibilities are explicitly separated.
- Dependency direction and failure behavior are documented.
- Local and deployment architecture diagrams are included.
- SQLite-to-PostgreSQL migration assumptions are documented.

### Issue: Research and define versioned emission factors

**Labels:** `phase:0`, `type:research`, `domain:carbon`, `priority:critical`

Select credible sources and define factors for transport, electricity, food, and
waste.

Acceptance criteria:

- Each factor records source, geography, unit, effective date, and version.
- Default geography and fallback behavior are documented.
- Calculation boundaries and known limitations are documented.
- Factor updates cannot silently change historical calculations.

### Issue: Define API contracts and persistence model

**Labels:** `phase:0`, `type:design`, `area:backend`, `priority:high`

Finalize request/response contracts and database entities before implementation.

Acceptance criteria:

- Profile, calculation, recommendation, progress, chat, and audit contracts are
  specified.
- Units and validation rules are explicit.
- Calculation snapshots include factor-version metadata.
- Error response format is consistent.

### Issue: Create UX wireframes and accessibility baseline

**Labels:** `phase:0`, `type:design`, `area:frontend`, `priority:medium`

Design the assessment, dashboard, recommendations, progress, chat, and website
audit journeys.

Acceptance criteria:

- Mobile and desktop wireframes exist for core screens.
- Loading, empty, and error states are covered.
- Keyboard navigation, contrast, and screen-reader expectations are documented.
- The UI distinguishes estimates from exact measurements.

## Phase 1: Deterministic Carbon Engine

### Issue: Scaffold FastAPI backend and configuration

**Labels:** `phase:1`, `type:feature`, `area:backend`, `priority:critical`

Create the backend application structure, settings, health endpoint, and test
foundation.

Acceptance criteria:

- Backend runs with one documented command.
- Environment configuration is validated.
- Health endpoint and test setup work.
- No secrets are committed.

### Issue: Implement versioned emission-factor catalog

**Labels:** `phase:1`, `type:feature`, `domain:carbon`, `priority:critical`

Load, validate, and expose the factor version used by every calculation.

Acceptance criteria:

- Invalid or incomplete factors fail fast.
- Calculations select a documented default factor set.
- Responses expose factor version and provenance.
- Factor catalog behavior is unit tested.

### Issue: Implement lifestyle carbon calculation engine

**Labels:** `phase:1`, `type:feature`, `domain:carbon`, `priority:critical`

Calculate monthly transport, electricity, food, waste, and total CO2e.

Acceptance criteria:

- Inputs have explicit units and bounds.
- Category formulas are modular and deterministic.
- Results include category totals, overall total, and calculation explanation.
- Representative, boundary, and invalid-input cases are tested.

### Issue: Define and implement Carbon Health Score

**Labels:** `phase:1`, `type:feature`, `domain:carbon`, `priority:high`

Implement a transparent 0-100 score after choosing its comparison baseline.

Acceptance criteria:

- Score formula and bands are documented.
- The score is clamped to 0-100.
- Responses explain the baseline used.
- Boundary cases are tested.

### Issue: Expose profile and footprint calculation APIs

**Labels:** `phase:1`, `type:feature`, `area:backend`, `priority:high`

Implement validated profile submission and footprint calculation endpoints.

Acceptance criteria:

- API matches the agreed contract.
- Validation errors are actionable and consistent.
- Calculation responses include units, period, score, and factor version.
- API tests cover success and failure cases.

## Phase 2: Assessment And Dashboard MVP

### Issue: Scaffold React frontend and shared design system

**Labels:** `phase:2`, `type:feature`, `area:frontend`, `priority:critical`

Create the responsive application shell, navigation, styling, and shared states.

Acceptance criteria:

- Frontend runs with one documented command.
- Shared components cover buttons, cards, forms, alerts, and loading states.
- Mobile navigation and keyboard operation work.
- No unused dependencies are included.

### Issue: Build guided lifestyle assessment

**Labels:** `phase:2`, `type:feature`, `area:frontend`, `priority:critical`

Implement the 5-7 step assessment for transport, electricity, food, waste, and
location.

Acceptance criteria:

- Questions are shown one step at a time.
- Units, examples, validation, back navigation, and progress are clear.
- Submission calls the calculation API.
- Error recovery preserves entered answers.

### Issue: Build baseline carbon dashboard

**Labels:** `phase:2`, `type:feature`, `area:frontend`, `priority:critical`

Display the user's monthly result and make the largest sources easy to
understand.

Acceptance criteria:

- Dashboard shows total CO2e, reporting period, score, category breakdown, and
  largest contributor.
- Factor version and estimation caveat are discoverable.
- Layout works on mobile and desktop.
- Empty, loading, and error states are implemented.

## Phase 3: Recommendations And Coaching

### Issue: Implement deterministic recommendation engine

**Labels:** `phase:3`, `type:feature`, `domain:carbon`, `priority:critical`

Generate ranked actions based on the user's profile and largest contributors.

Acceptance criteria:

- Recommendations are tied to profile inputs and calculation outputs.
- Each recommendation has estimated savings, difficulty, and rationale.
- Ranking behavior is deterministic and tested.
- Unsupported savings claims are not produced.

### Issue: Add recommendations experience

**Labels:** `phase:3`, `type:feature`, `area:frontend`, `priority:high`

Display prioritized actions and explain why each action matters.

Acceptance criteria:

- Top actions show impact, difficulty, and rationale.
- Users can inspect the assumptions behind estimated savings.
- The largest contributor connects clearly to recommended actions.
- Responsive and accessible states are covered.

### Issue: Implement AI provider adapter and fallback coach

**Labels:** `phase:3`, `type:feature`, `area:ai`, `priority:high`

Add a provider-neutral AI interface plus a deterministic fallback that keeps the
assistant usable without an API key.

Acceptance criteria:

- AI provider is configured only through environment variables.
- Fallback coach works when AI is disabled, unavailable, or times out.
- AI receives deterministic results as context and cannot replace calculations.
- Provider errors do not break assessment or dashboard workflows.

### Issue: Build context-aware assistant chat flow

**Labels:** `phase:3`, `type:feature`, `area:ai`, `priority:medium`

Create a coaching flow that asks one question at a time and explains results in
plain language.

Acceptance criteria:

- The assistant uses prior profile and result context.
- It clearly distinguishes facts, estimates, and suggestions.
- It does not invent profile values, factors, or savings.
- The full flow works with the fallback coach.

## Phase 4: Persistence And Progress

### Issue: Add user, profile, footprint, and recommendation persistence

**Labels:** `phase:4`, `type:feature`, `area:backend`, `priority:critical`

Persist current profiles, immutable calculation snapshots, and recommendations.

Acceptance criteria:

- Recalculation creates a new immutable history record.
- Historical records include factor version and inputs needed for explanation.
- Recommendation completion state can be stored.
- Persistence behavior is tested.

### Issue: Decide and implement MVP identity model

**Labels:** `phase:4`, `type:decision`, `area:security`, `priority:high`

Choose single-user demo mode, lightweight authentication, or full
authentication, then implement the selected model.

Acceptance criteria:

- Decision and threat assumptions are documented.
- Users cannot access another user's data when multi-user mode is enabled.
- Local development remains straightforward.
- Authentication failures have clear UI and API behavior.

### Issue: Implement progress API and trend calculations

**Labels:** `phase:4`, `type:feature`, `area:backend`, `priority:high`

Return historical totals and category changes for progress views.

Acceptance criteria:

- API supports a documented time range.
- Results show total and category-level changes.
- Comparisons remain valid across factor versions or clearly flag differences.
- Trend calculation tests cover sparse and repeated data.

### Issue: Build progress history and before/after views

**Labels:** `phase:4`, `type:feature`, `area:frontend`, `priority:high`

Visualize footprint history and make improvements or regressions understandable.

Acceptance criteria:

- Users can see trend, latest change, and category changes.
- Charts have accessible non-visual summaries.
- Factor-version changes are disclosed.
- Empty and single-record states are useful.

## Phase 5: Website Carbon Audit

### Issue: Threat-model website URL auditing

**Labels:** `phase:5`, `type:security`, `area:website-audit`, `priority:critical`

Define protections before any server-side URL fetching is implemented.

Acceptance criteria:

- SSRF, redirect, DNS rebinding, oversized response, timeout, and unsafe scheme
  risks are documented.
- Private, loopback, link-local, and metadata-service destinations are blocked.
- Resource, redirect, and time limits are defined.
- Logging avoids leaking sensitive URL data.

### Issue: Implement secure webpage measurement service

**Labels:** `phase:5`, `type:feature`, `area:website-audit`, `priority:critical`

Measure approved public pages and return page weight, requests, and asset mix.

Acceptance criteria:

- Only allowed HTTP(S) destinations are measured.
- Redirects and resolved addresses are revalidated.
- Timeouts and size limits are enforced.
- Failure cases return safe, actionable errors.

### Issue: Implement website carbon estimation model

**Labels:** `phase:5`, `type:feature`, `domain:carbon`, `priority:high`

Estimate per-page-view CO2e from measured transfer data using a configurable,
documented model.

Acceptance criteria:

- Model assumptions, factor source, and version are documented.
- Output is explicitly labeled as an estimate.
- Results include per-view and optional monthly-traffic scenarios.
- Model behavior is tested with fixed measurements.

### Issue: Build website audit UI and optimization tips

**Labels:** `phase:5`, `type:feature`, `area:frontend`, `priority:high`

Allow users to submit a URL and understand its estimated impact and heavy assets.

Acceptance criteria:

- UI shows estimate, assumptions, asset breakdown, and prioritized tips.
- Unsafe or unsupported URLs produce helpful errors.
- Results call out large images, JavaScript, video, PDFs, and third parties when
  present.
- Loading and timeout states are implemented.

## Phase 6: Quality, Documentation, And Deployment

### Issue: Add end-to-end MVP journey tests

**Labels:** `phase:6`, `type:test`, `priority:high`

Cover assessment, calculation, recommendations, history, and website audit happy
paths.

Acceptance criteria:

- Critical user journeys run automatically.
- Fallback-coach behavior is covered.
- Tests avoid depending on unstable external sites or AI responses.
- Failures provide useful diagnostics.

### Issue: Complete accessibility and responsive-design pass

**Labels:** `phase:6`, `type:quality`, `area:frontend`, `priority:high`

Verify the MVP against the documented accessibility baseline.

Acceptance criteria:

- Core journeys work using keyboard navigation.
- Charts and status changes have accessible alternatives.
- Contrast and focus states pass agreed checks.
- Mobile layouts are verified at representative widths.

### Issue: Write project documentation and local setup guide

**Labels:** `phase:6`, `type:docs`, `priority:high`

Document setup, architecture, calculations, assumptions, limitations, and usage.

Acceptance criteria:

- README includes one-command-per-side local setup.
- `.env.example` documents all configuration without secrets.
- Emission factors, score formula, AI fallback, and website-audit caveats are
  explained.
- Repository structure and extension points are documented.

### Issue: Add CI and deployment configuration

**Labels:** `phase:6`, `type:devops`, `priority:high`

Automate checks and deploy a working public demo.

Acceptance criteria:

- CI runs backend tests, frontend checks, and build validation.
- Deployment configuration contains no secrets.
- Frontend, backend, and persistence deployment choices are documented.
- Deployed smoke test covers the primary MVP journey.

## Phase 7: Browser Extension Exploration

### Issue: Investigate active-tab website auditing extension

**Labels:** `phase:7`, `type:spike`, `area:website-audit`, `priority:low`

Evaluate a browser extension for auditing the currently open tab.

Acceptance criteria:

- Required permissions and privacy implications are documented.
- Prototype measures the active tab without collecting unrelated browsing data.
- Differences from pasted-URL auditing are documented.
- A go/no-go recommendation is recorded.

