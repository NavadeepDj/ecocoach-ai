# EcoCoach AI

EcoCoach AI is a context-aware sustainability assistant that helps people
estimate, understand, track, and reduce their carbon footprint.

The project is being built around one important rule: calculations are
deterministic and explainable; AI is only a coaching and explanation layer.

## Current Slice

The first working slice provides:

- a versioned emission-factor catalog
- deterministic monthly calculations for transport, electricity, food, and
  waste
- a transparent Carbon Health Score
- FastAPI endpoints for health, factor metadata, profile submission, and
  footprint calculation
- unit and API tests

All results are estimates. The initial factor set is intended for an
India-default demo and documents its assumptions in the API response.

## Run The Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the interactive API documentation.

Run tests:

```powershell
cd backend
pytest
```

## Repository Layout

```text
backend/   FastAPI application and deterministic carbon engine
docs/      Product plan, architecture decisions, and calculation assumptions
frontend/  React application (next implementation slice)
```

## Planning

- [Implementation plan](docs/implementation-plan.md)
- [GitHub issue backlog](docs/github-issues.md)
- [Architecture decisions](docs/architecture.md)
- [Calculation methodology](docs/calculation-methodology.md)

