from typing import Annotated, Any
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.dependencies import get_calculator, get_factor_catalog
from app.schemas.footprint import FootprintResult
from app.schemas.profile import LifestyleProfile
from app.services.calculator import CarbonCalculator
from app.services.factor_catalog import FactorCatalog
from app.services.firebase import FirebaseService

api_router = APIRouter()


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = authorization.split(" ")[1]
    try:
        user = FirebaseService.verify_id_token(token)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
        )


@api_router.get("/factors", tags=["factors"])
def factor_metadata(
    catalog: FactorCatalog = Depends(get_factor_catalog),
) -> dict[str, object]:
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
    return calculator.calculate(profile)


@api_router.post(
    "/profile/submit",
    response_model=FootprintResult,
    tags=["profile"],
)
def submit_profile(
    profile: LifestyleProfile,
    calculator: CarbonCalculator = Depends(get_calculator),
) -> FootprintResult:
    """Calculate a baseline now; persistence is introduced in a later phase."""
    return calculator.calculate(profile)


@api_router.post("/footprint/save", tags=["footprint"])
def save_footprint(
    result: FootprintResult,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    FirebaseService.save_footprint(user["uid"], result.model_dump())
    return {"status": "saved"}


@api_router.get("/footprint/history", tags=["footprint"])
def get_footprint_history(
    user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    return FirebaseService.get_history(user["uid"])


@api_router.get("/footprint/comparison", tags=["footprint"])
def get_footprint_comparison(
    total: float,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return FirebaseService.get_comparison(user["uid"], total)


