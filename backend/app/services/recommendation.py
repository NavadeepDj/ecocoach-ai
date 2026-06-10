from typing import Any
from app.schemas.footprint import CategoryBreakdown, Recommendation
from app.schemas.profile import LifestyleProfile


class RecommendationEngine:
    def generate(
        self,
        profile: LifestyleProfile,
        breakdown: CategoryBreakdown,
        factors: dict[str, Any],
    ) -> list[Recommendation]:
        recommendations = []

        # 1. Transport Recommendations
        # Carpooling / Public Transport
        if profile.weekly_car_km > 50:
            car_emissions = (
                profile.weekly_car_km
                * (52 / 12)
                * factors["transport_kg_co2e_per_passenger_km"]["car"]
            )
            bus_equivalent = (
                profile.weekly_car_km
                * (52 / 12)
                * factors["transport_kg_co2e_per_passenger_km"]["bus"]
            )
            savings = max(0.0, (car_emissions - bus_equivalent) * 0.5)
            if savings > 1.0:
                recommendations.append(
                    Recommendation(
                        id="carpool_shift",
                        title="Carpool or Use Public Transit",
                        description="Share your daily car commute or switch to bus/train transit for half of your weekly travel.",
                        estimated_savings=round(savings, 2),
                        difficulty="medium",
                        rationale=f"Since you drive {profile.weekly_car_km} km weekly, shifting 50% of this travel to transit can save up to {savings:.1f} kg CO2e monthly.",
                        category="transport",
                    )
                )

        # Train instead of short flights
        if profile.monthly_flight_km > 200:
            flight_emissions = (
                profile.monthly_flight_km
                * factors["transport_kg_co2e_per_passenger_km"]["flight"]
            )
            train_equivalent = (
                profile.monthly_flight_km
                * factors["transport_kg_co2e_per_passenger_km"]["train"]
            )
            savings = max(0.0, (flight_emissions - train_equivalent) * 0.3)
            if savings > 1.0:
                recommendations.append(
                    Recommendation(
                        id="flight_to_train",
                        title="Replace Short Flights with Trains",
                        description="Opt for rail or overnight trains instead of flying for domestic journeys.",
                        estimated_savings=round(savings, 2),
                        difficulty="hard",
                        rationale=f"With {profile.monthly_flight_km} km of monthly flights, replacing 30% of them with train travel saves {savings:.1f} kg CO2e.",
                        category="transport",
                    )
                )

        # 2. Electricity Recommendations
        # Switch to LEDs
        if profile.monthly_electricity_kwh > 40:
            savings = (
                profile.monthly_electricity_kwh
                * 0.15
                * factors["electricity_kg_co2e_per_kwh"]
            )
            if savings > 1.0:
                recommendations.append(
                    Recommendation(
                        id="led_lighting",
                        title="Switch to Energy-Efficient LEDs",
                        description="Upgrade traditional incandescent or CFL bulbs in your home to high-efficiency LEDs.",
                        estimated_savings=round(savings, 2),
                        difficulty="easy",
                        rationale=f"Replacing home bulbs with LEDs reduces electricity consumption by around 15%, saving {savings:.1f} kg CO2e monthly.",
                        category="electricity",
                    )
                )

        # AC Temperature Setting
        if profile.monthly_electricity_kwh > 80:
            savings = (
                profile.monthly_electricity_kwh
                * 0.06
                * factors["electricity_kg_co2e_per_kwh"]
            )
            if savings > 1.0:
                recommendations.append(
                    Recommendation(
                        id="ac_efficiency",
                        title="Optimize AC Temperature to 24°C+",
                        description="Keep your air conditioner set to 24°C or higher and keep filters clean to maximize cooling efficiency.",
                        estimated_savings=round(savings, 2),
                        difficulty="easy",
                        rationale=f"Raising your AC temperature by a couple of degrees can reduce your overall energy footprint by 6%, saving {savings:.1f} kg CO2e.",
                        category="electricity",
                    )
                )

        # 3. Food Recommendations
        # Meatless Mondays / Shift to plant-based
        if profile.diet_type.value in ["meat_heavy", "mixed"]:
            savings = 50.0 if profile.diet_type.value == "meat_heavy" else 25.0
            recommendations.append(
                Recommendation(
                    id="diet_plant_shift",
                    title="Adopt 'Meatless Mondays' or Plant-Based Days",
                    description="Substitute meat and dairy with local, plant-based proteins for several days each week.",
                    estimated_savings=savings,
                    difficulty="easy",
                    rationale="Animal agriculture generates significantly higher lifecycle emissions. Choosing plant-based meals cuts down your food carbon footprint.",
                    category="food",
                )
            )

        # 4. Waste Recommendations
        # Composting & Waste Sorting
        if profile.waste_level.value in ["high", "average"]:
            low_waste_val = factors["waste_monthly_kg_co2e"]["low"]
            current_waste_val = factors["waste_monthly_kg_co2e"][profile.waste_level.value]
            savings = max(0.0, current_waste_val - low_waste_val)
            if savings > 0.5:
                recommendations.append(
                    Recommendation(
                        id="waste_composting",
                        title="Sort Recyclables & Compost Organic Waste",
                        description="Separate paper, plastic, and glass for recycling, and compost your organic kitchen scraps to reduce landfill waste.",
                        estimated_savings=round(savings, 2),
                        difficulty="medium",
                        rationale=f"Moving from '{profile.waste_level}' to low waste output avoids organic decomposition in landfills, saving {savings:.1f} kg CO2e monthly.",
                        category="waste",
                    )
                )

        # Sort recommendations by savings (descending)
        return sorted(recommendations, key=lambda x: x.estimated_savings, reverse=True)
