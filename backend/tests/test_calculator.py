import pytest

from app.schemas.profile import DietType, LifestyleProfile, WasteLevel
from app.services.calculator import CarbonCalculator
from app.services.factor_catalog import FactorCatalog


@pytest.fixture
def calculator() -> CarbonCalculator:
    return CarbonCalculator(FactorCatalog.load("india-demo-2025.1"))


def test_zero_activity_still_includes_food_and_waste(
    calculator: CarbonCalculator,
) -> None:
    profile = LifestyleProfile(
        monthly_electricity_kwh=0,
        diet_type=DietType.VEGAN,
        waste_level=WasteLevel.LOW,
    )

    result = calculator.calculate(profile)

    assert result.breakdown.transport == 0
    assert result.breakdown.electricity == 0
    assert result.breakdown.food == 100
    assert result.breakdown.waste == 8
    assert result.total == 108
    assert result.largest_category == "food"


def test_calculation_is_deterministic(calculator: CarbonCalculator) -> None:
    profile = LifestyleProfile(
        weekly_car_km=100,
        weekly_bus_km=25,
        weekly_train_km=10,
        monthly_flight_km=500,
        monthly_electricity_kwh=250,
        diet_type=DietType.MIXED,
        waste_level=WasteLevel.AVERAGE,
    )

    first = calculator.calculate(profile)
    second = calculator.calculate(profile)

    assert first == second
    assert first.total == 545.35
    assert first.score == 23
    assert first.score_band == "high_impact"


def test_score_stays_within_bounds(calculator: CarbonCalculator) -> None:
    profile = LifestyleProfile(
        weekly_car_km=5000,
        monthly_flight_km=100000,
        monthly_electricity_kwh=100000,
        diet_type=DietType.MEAT_HEAVY,
        waste_level=WasteLevel.HIGH,
    )

    result = calculator.calculate(profile)

    assert 0 <= result.score <= 100
