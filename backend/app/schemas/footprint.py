from typing import Literal
from pydantic import BaseModel, Field


class CategoryBreakdown(BaseModel):
    transport: float = Field(ge=0)
    electricity: float = Field(ge=0)
    food: float = Field(ge=0)
    waste: float = Field(ge=0)


class Recommendation(BaseModel):
    id: str
    title: str
    description: str
    estimated_savings: float
    difficulty: Literal["easy", "medium", "hard"]
    rationale: str
    category: Literal["transport", "electricity", "food", "waste"]


class FootprintResult(BaseModel):
    period: str = "monthly"
    unit: str = "kg_co2e"
    total: float = Field(ge=0)
    score: int = Field(ge=0, le=100)
    score_band: str
    largest_category: str
    breakdown: CategoryBreakdown
    factor_set: str
    factor_geography: str
    caveats: list[str]
    explanation: list[str]
    recommendations: list[Recommendation] = []


