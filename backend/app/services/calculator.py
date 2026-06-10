from app.schemas.footprint import CategoryBreakdown, FootprintResult
from app.schemas.profile import LifestyleProfile
from app.services.factor_catalog import FactorCatalog
from app.services.recommendation import RecommendationEngine

WEEKS_PER_MONTH = 52 / 12


class CarbonCalculator:
    def __init__(self, catalog: FactorCatalog):
        self.catalog = catalog
        self.recommendation_engine = RecommendationEngine()

    def calculate(self, profile: LifestyleProfile) -> FootprintResult:
        factors = self.catalog.data
        transport_factors = factors["transport_kg_co2e_per_passenger_km"]

        transport_parts = {
            "car": profile.weekly_car_km
            * WEEKS_PER_MONTH
            * transport_factors["car"],
            "bus": profile.weekly_bus_km
            * WEEKS_PER_MONTH
            * transport_factors["bus"],
            "train": profile.weekly_train_km
            * WEEKS_PER_MONTH
            * transport_factors["train"],
            "flight": profile.monthly_flight_km * transport_factors["flight"],
        }

        raw_breakdown = {
            "transport": sum(transport_parts.values()),
            "electricity": profile.monthly_electricity_kwh
            * factors["electricity_kg_co2e_per_kwh"],
            "food": factors["food_monthly_kg_co2e"][profile.diet_type.value],
            "waste": factors["waste_monthly_kg_co2e"][profile.waste_level.value],
        }
        total = sum(raw_breakdown.values())
        target = factors["monthly_target_kg_co2e"]
        score = max(0, min(100, round(100 / (1 + total / target))))
        largest_category = max(raw_breakdown, key=raw_breakdown.get)

        breakdown = CategoryBreakdown(
            **{category: round(value, 2) for category, value in raw_breakdown.items()}
        )

        recommendations = self.recommendation_engine.generate(profile, breakdown, factors)

        return FootprintResult(
            total=round(total, 2),
            score=score,
            score_band=self._score_band(score),
            largest_category=largest_category,
            breakdown=breakdown,
            factor_set=factors["id"],
            factor_geography=factors["geography"],
            caveats=factors["caveats"],
            explanation=[
                "Weekly transport distances are converted using 52 / 12 weeks per month.",
                "Electricity equals monthly kWh multiplied by the selected grid factor.",
                "Food and waste currently use broad monthly behavioral proxies.",
                f"The score compares this estimate with a {target:.2f} kg CO2e monthly target.",
            ],
            recommendations=recommendations,
        )

    @staticmethod
    def _score_band(score: int) -> str:
        if score >= 80:
            return "excellent"
        if score >= 60:
            return "good"
        if score >= 40:
            return "needs_improvement"
        return "high_impact"

