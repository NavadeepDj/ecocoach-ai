from app.schemas.profile import DietType, LifestyleProfile, WasteLevel
from app.services.calculator import CarbonCalculator
from app.services.factor_catalog import FactorCatalog
from app.services.recommendation import RecommendationEngine


def test_recommendation_triggers_for_car_travel() -> None:
    catalog = FactorCatalog.load("india-demo-2025.1")
    calculator = CarbonCalculator(catalog)
    engine = RecommendationEngine()

    profile = LifestyleProfile(
        weekly_car_km=200,
        diet_type=DietType.VEGAN,
        waste_level=WasteLevel.LOW,
        monthly_electricity_kwh=0,
    )
    result = calculator.calculate(profile)

    recs = engine.generate(profile, result.breakdown, catalog.data)
    
    # Check that carpooling recommendation triggered
    carpool_rec = next((r for r in recs if r.id == "carpool_shift"), None)
    assert carpool_rec is not None
    assert carpool_rec.category == "transport"
    assert carpool_rec.estimated_savings > 0
    assert "200.0 km" in carpool_rec.rationale


def test_no_plant_shift_recommendation_for_vegans() -> None:
    catalog = FactorCatalog.load("india-demo-2025.1")
    calculator = CarbonCalculator(catalog)
    engine = RecommendationEngine()

    profile = LifestyleProfile(
        weekly_car_km=0,
        diet_type=DietType.VEGAN,
        waste_level=WasteLevel.LOW,
        monthly_electricity_kwh=0,
    )
    result = calculator.calculate(profile)
    recs = engine.generate(profile, result.breakdown, catalog.data)

    # Vegans should not get plant-based shifts recommendation
    diet_rec = next((r for r in recs if r.id == "diet_plant_shift"), None)
    assert diet_rec is None


def test_diet_shift_triggers_for_mixed_diet() -> None:
    catalog = FactorCatalog.load("india-demo-2025.1")
    calculator = CarbonCalculator(catalog)
    engine = RecommendationEngine()

    profile = LifestyleProfile(
        weekly_car_km=0,
        diet_type=DietType.MIXED,
        waste_level=WasteLevel.LOW,
        monthly_electricity_kwh=0,
    )
    result = calculator.calculate(profile)
    recs = engine.generate(profile, result.breakdown, catalog.data)

    diet_rec = next((r for r in recs if r.id == "diet_plant_shift"), None)
    assert diet_rec is not None
    assert diet_rec.estimated_savings == 25.0


def test_recommendation_electricity_and_waste_triggers() -> None:
    catalog = FactorCatalog.load("india-demo-2025.1")
    calculator = CarbonCalculator(catalog)
    engine = RecommendationEngine()

    # Electricity and Waste triggers: 100 kWh (>40, >80), average waste
    profile = LifestyleProfile(
        weekly_car_km=0,
        diet_type=DietType.VEGAN,
        waste_level=WasteLevel.AVERAGE,
        monthly_electricity_kwh=100,
    )
    result = calculator.calculate(profile)
    recs = engine.generate(profile, result.breakdown, catalog.data)

    # led_lighting and ac_efficiency should trigger
    led_rec = next((r for r in recs if r.id == "led_lighting"), None)
    ac_rec = next((r for r in recs if r.id == "ac_efficiency"), None)
    assert led_rec is not None
    assert ac_rec is not None

    # waste_composting should trigger
    waste_rec = next((r for r in recs if r.id == "waste_composting"), None)
    assert waste_rec is not None


def test_recommendation_flight_trigger() -> None:
    catalog = FactorCatalog.load("india-demo-2025.1")
    calculator = CarbonCalculator(catalog)
    engine = RecommendationEngine()

    profile = LifestyleProfile(
        weekly_car_km=0,
        diet_type=DietType.VEGAN,
        waste_level=WasteLevel.LOW,
        monthly_electricity_kwh=0,
        monthly_flight_km=300,  # >200
    )
    result = calculator.calculate(profile)
    recs = engine.generate(profile, result.breakdown, catalog.data)

    flight_rec = next((r for r in recs if r.id == "flight_to_train"), None)
    assert flight_rec is not None


def test_recommendation_boundary_conditions() -> None:
    catalog = FactorCatalog.load("india-demo-2025.1")
    calculator = CarbonCalculator(catalog)
    engine = RecommendationEngine()

    # Boundary conditions: exactly 50 km car, exactly 200 km flights, exactly 40 kWh electricity, exactly 80 kWh electricity
    profile = LifestyleProfile(
        weekly_car_km=50,
        monthly_flight_km=200,
        monthly_electricity_kwh=40,
        diet_type=DietType.VEGAN,
        waste_level=WasteLevel.LOW,
    )
    result = calculator.calculate(profile)
    recs = engine.generate(profile, result.breakdown, catalog.data)

    carpool_rec = next((r for r in recs if r.id == "carpool_shift"), None)
    flight_rec = next((r for r in recs if r.id == "flight_to_train"), None)
    led_rec = next((r for r in recs if r.id == "led_lighting"), None)
    ac_rec = next((r for r in recs if r.id == "ac_efficiency"), None)

    # None of these should trigger because they are exactly at the boundary thresholds (which use strictly greater than >)
    assert carpool_rec is None
    assert flight_rec is None
    assert led_rec is None
    assert ac_rec is None

