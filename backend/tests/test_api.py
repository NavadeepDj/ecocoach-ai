from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_PROFILE = {
    "weekly_car_km": 50,
    "weekly_bus_km": 20,
    "weekly_train_km": 0,
    "monthly_flight_km": 0,
    "monthly_electricity_kwh": 100,
    "diet_type": "vegetarian",
    "waste_level": "average",
    "location": "IN",
}


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_calculation_endpoint_returns_explainable_result() -> None:
    response = client.post("/api/footprint/calculate", json=VALID_PROFILE)

    assert response.status_code == 200
    result = response.json()
    assert result["factor_set"] == "india-demo-2025.1"
    assert result["unit"] == "kg_co2e"
    assert result["total"] == 267.3
    assert result["largest_category"] == "food"
    assert len(result["caveats"]) > 0
    assert len(result["explanation"]) > 0


def test_profile_submit_returns_baseline() -> None:
    response = client.post("/api/profile/submit", json=VALID_PROFILE)

    assert response.status_code == 200
    assert response.json()["period"] == "monthly"


def test_negative_activity_is_rejected() -> None:
    profile = {**VALID_PROFILE, "weekly_car_km": -1}

    response = client.post("/api/footprint/calculate", json=profile)

    assert response.status_code == 422


def test_factor_metadata_exposes_sources_without_factor_values() -> None:
    response = client.get("/api/factors")

    assert response.status_code == 200
    metadata = response.json()
    assert metadata["id"] == "india-demo-2025.1"
    assert len(metadata["sources"]) == 3
    assert "transport_kg_co2e_per_passenger_km" not in metadata

