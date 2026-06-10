import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.services.firebase import FirebaseService

@pytest.fixture(autouse=True)
def mock_firebase_mode():
    with patch("app.services.firebase.MOCK_MODE", True):
        yield

client = TestClient(app)

VALID_FOOTPRINT = {
    "period": "monthly",
    "unit": "kg_co2e",
    "total": 150.0,
    "score": 75,
    "score_band": "low_impact",
    "largest_category": "transport",
    "breakdown": {
        "transport": 80.0,
        "electricity": 30.0,
        "food": 30.0,
        "waste": 10.0
    },
    "factor_set": "india-demo-2025.1",
    "factor_geography": "IN",
    "caveats": [],
    "explanation": [],
    "recommendations": []
}


def test_firebase_service_mock_operations() -> None:
    # Test verify_id_token
    user = FirebaseService.verify_id_token("mock-token-testuser")
    assert user["uid"] == "testuser"
    assert user["email"] == "testuser@example.com"

    # Test save_footprint
    FirebaseService.save_footprint("testuser", VALID_FOOTPRINT)

    # Test get_history
    history = FirebaseService.get_history("testuser")
    assert len(history) > 0
    assert history[0]["total"] == 150.0
    assert history[0]["uid"] == "testuser"

    # Test get_comparison
    comparison = FirebaseService.get_comparison("testuser", 150.0)
    assert "percentile" in comparison
    assert "total_users" in comparison
    assert "distribution" in comparison


def test_auth_endpoints_missing_token() -> None:
    # Save endpoint
    response = client.post("/api/footprint/save", json=VALID_FOOTPRINT)
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing or invalid Authorization header"

    # History endpoint
    response = client.get("/api/footprint/history")
    assert response.status_code == 401

    # Comparison endpoint
    response = client.get("/api/footprint/comparison?total=150.0")
    assert response.status_code == 401


def test_auth_endpoints_invalid_token() -> None:
    headers = {"Authorization": "Bearer invalid-token-xyz"}
    response = client.get("/api/footprint/history", headers=headers)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired authentication token"


def test_auth_endpoints_valid_token() -> None:
    headers = {"Authorization": "Bearer mock-token-authuser"}
    
    # Save
    response = client.post("/api/footprint/save", json=VALID_FOOTPRINT, headers=headers)
    assert response.status_code == 200
    assert response.json() == {"status": "saved"}

    # History
    response = client.get("/api/footprint/history", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
    assert response.json()[0]["total"] == 150.0

    # Comparison
    response = client.get("/api/footprint/comparison?total=150.0", headers=headers)
    assert response.status_code == 200
    assert "percentile" in response.json()


def test_input_validation_edge_cases() -> None:
    # Test invalid diet type
    invalid_profile = {
        "weekly_car_km": 50,
        "weekly_bus_km": 20,
        "weekly_train_km": 0,
        "monthly_flight_km": 0,
        "monthly_electricity_kwh": 100,
        "diet_type": "carnivore",  # Invalid enum value
        "waste_level": "average",
        "location": "IN",
    }
    response = client.post("/api/footprint/calculate", json=invalid_profile)
    assert response.status_code == 422

    # Test invalid waste level
    invalid_profile2 = {
        "weekly_car_km": 50,
        "weekly_bus_km": 20,
        "weekly_train_km": 0,
        "monthly_flight_km": 0,
        "monthly_electricity_kwh": 100,
        "diet_type": "mixed",
        "waste_level": "none",  # Invalid enum value
        "location": "IN",
    }
    response = client.post("/api/footprint/calculate", json=invalid_profile2)
    assert response.status_code == 422
