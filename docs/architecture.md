# Architecture Decisions

## System Boundaries

EcoCoach AI is a modular monorepo with a React frontend and FastAPI backend.

The backend owns:

- validated profile contracts
- deterministic carbon calculations
- versioned emission factors
- recommendation rules
- persistence and history
- AI-provider adapters
- secure website auditing

The frontend owns:

- guided assessment interactions
- result visualization
- coaching conversations
- progress and audit experiences

## Decision: Deterministic Calculations, Optional AI

Carbon totals, scores, and estimated savings must be produced by deterministic
services. An AI provider may ask questions or explain those results, but it
must not replace or silently alter calculations.

If AI is unavailable, the application will use a deterministic fallback coach.

## Decision: Single-User Demo First

The first release uses a single local demo user. This keeps the initial slice
focused on calculation quality and the user journey. Multi-user authentication
is deferred until the persistence phase and must be threat-modeled before use.

## Decision: SQLite-Ready Persistence Boundary

Local development will use SQLite. Data access will remain behind service and
repository boundaries so deployment can move to PostgreSQL without changing
calculation behavior.

## Decision: Pasted URL Before Active Tab

The first website audit accepts a pasted public HTTP(S) URL. Reading the
currently active browser tab requires a browser extension, additional
permissions, and a separate privacy review.

## Failure Behavior

- Invalid profile inputs return structured validation errors.
- Missing or malformed factor catalogs fail application startup.
- AI failures must not prevent assessment or calculation.
- Website audit failures must not expose internal network details.

