from enum import StrEnum

from pydantic import BaseModel, Field


class DietType(StrEnum):
    VEGAN = "vegan"
    VEGETARIAN = "vegetarian"
    MIXED = "mixed"
    MEAT_HEAVY = "meat_heavy"


class WasteLevel(StrEnum):
    LOW = "low"
    AVERAGE = "average"
    HIGH = "high"


class LifestyleProfile(BaseModel):
    weekly_car_km: float = Field(default=0, ge=0, le=5000)
    weekly_bus_km: float = Field(default=0, ge=0, le=5000)
    weekly_train_km: float = Field(default=0, ge=0, le=10000)
    monthly_flight_km: float = Field(default=0, ge=0, le=100000)
    monthly_electricity_kwh: float = Field(ge=0, le=100000)
    diet_type: DietType
    waste_level: WasteLevel
    location: str = Field(default="IN", min_length=2, max_length=32)

