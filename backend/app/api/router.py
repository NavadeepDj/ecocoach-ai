"""API endpoints for carbon footprint calculation, persistence, and coaching."""

from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_calculator, get_factor_catalog
from app.schemas.footprint import FootprintResult
from app.schemas.profile import LifestyleProfile
from app.services.calculator import CarbonCalculator
from app.services.factor_catalog import FactorCatalog
from app.services.firebase import FirebaseService
from app.services.coach import CoachService

api_router = APIRouter()

# Maximum chat messages forwarded per request (cost / abuse guard)
_MAX_CHAT_MESSAGES = 20


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> dict[str, Any]:
    """Extract and verify a Firebase ID token from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = authorization.split(" ", maxsplit=1)[1]
    try:
        user = FirebaseService.verify_id_token(token)
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )


@api_router.get("/factors", tags=["factors"])
def factor_metadata(
    catalog: FactorCatalog = Depends(get_factor_catalog),
) -> dict[str, object]:
    """Return public metadata about the active emission-factor set."""
    return catalog.public_metadata()


@api_router.post(
    "/footprint/calculate",
    response_model=FootprintResult,
    tags=["footprint"],
)
def calculate_footprint(
    profile: LifestyleProfile,
    calculator: CarbonCalculator = Depends(get_calculator),
) -> FootprintResult:
    """Calculate a deterministic carbon footprint from the provided lifestyle profile."""
    return calculator.calculate(profile)


@api_router.post("/footprint/save", tags=["footprint"])
def save_footprint(
    result: FootprintResult,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    """Persist a footprint result for the authenticated user."""
    FirebaseService.save_footprint(user["uid"], result.model_dump())
    return {"status": "saved"}


@api_router.get("/footprint/history", tags=["footprint"])
def get_footprint_history(
    user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Retrieve the authenticated user's historical footprint snapshots."""
    return FirebaseService.get_history(user["uid"])


@api_router.get("/footprint/comparison", tags=["footprint"])
def get_footprint_comparison(
    total: float,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Compare the user's footprint against all other registered users."""
    return FirebaseService.get_comparison(user["uid"], total)


# ------------------------------------------------------------------
# Chat / Coach
# ------------------------------------------------------------------

class ChatMessageSchema(BaseModel):
    """A single message in the coach conversation."""

    role: Literal["user", "model"]
    text: str = Field(..., max_length=2000)


class ChatRequestSchema(BaseModel):
    """Payload for the coach chat endpoint."""

    history: list[ChatMessageSchema] = Field(..., max_length=_MAX_CHAT_MESSAGES)
    footprint: FootprintResult


@api_router.post("/coach/chat", tags=["coach"])
def coach_chat(
    payload: ChatRequestSchema,
) -> dict[str, str]:
    """Send a message to the EcoCoach AI assistant."""
    history_dicts = [{"role": msg.role, "text": msg.text} for msg in payload.history]
    reply = CoachService.chat(history_dicts, payload.footprint.model_dump())
    return {"reply": reply}
