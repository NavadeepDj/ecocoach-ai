from fastapi.testclient import TestClient

from app.main import app
from app.services.coach import CoachService


def test_offline_coach_keyword_matching() -> None:
    footprint = {
        "total": 350.0,
        "largest_category": "electricity",
        "breakdown": {
            "transport": 100.0,
            "electricity": 150.0,
            "food": 80.0,
            "waste": 20.0
        }
    }

    # Test transport keyword response
    reply_transport = CoachService.chat([{"role": "user", "text": "Tell me about my car commute"}], footprint)
    assert "transport emissions are 100.0" in reply_transport

    # Test electricity keyword response
    reply_elec = CoachService.chat([{"role": "user", "text": "how to save power?"}], footprint)
    assert "electricity emissions are 150.0" in reply_elec

    # Test general fallback response
    reply_general = CoachService.chat([{"role": "user", "text": "hello coach"}], footprint)
    assert "biggest category is 'electricity'" in reply_general


def test_coach_chat_api_endpoint() -> None:
    client = TestClient(app)
    payload = {
        "history": [
            {"role": "user", "text": "What should I do to save waste?"}
        ],
        "footprint": {
            "period": "monthly",
            "unit": "kg_co2e",
            "total": 200.0,
            "score": 45,
            "score_band": "needs_improvement",
            "largest_category": "waste",
            "breakdown": {
                "transport": 40.0,
                "electricity": 60.0,
                "food": 70.0,
                "waste": 30.0
            },
            "factor_set": "india-demo-2025.1",
            "factor_geography": "IN",
            "caveats": [],
            "explanation": [],
            "recommendations": []
        }
    }

    response = client.post("/api/coach/chat", json=payload)
    assert response.status_code == 200
    assert "reply" in response.json()
    assert "waste emissions are 30.0" in response.json()["reply"]


def test_online_coach_with_mock() -> None:
    from unittest.mock import MagicMock, patch

    footprint = {
        "total": 350.0,
        "largest_category": "electricity",
        "breakdown": {
            "transport": 100.0,
            "electricity": 150.0,
            "food": 80.0,
            "waste": 20.0
        }
    }
    
    mock_client = MagicMock()
    mock_chat = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "This is a mocked Gemini response for carbon footprint coaching."
    mock_chat.send_message.return_value = mock_response
    mock_client.chats.create.return_value = mock_chat
    
    with patch("app.services.coach._gemini_client", mock_client):
        reply = CoachService.chat([{"role": "user", "text": "What do you think of my footprint?"}], footprint)
        assert reply == "This is a mocked Gemini response for carbon footprint coaching."
        mock_client.chats.create.assert_called_once()
        mock_chat.send_message.assert_called_once_with("What do you think of my footprint?")


def test_online_coach_graceful_fallback_on_error() -> None:
    from unittest.mock import MagicMock, patch

    footprint = {
        "total": 350.0,
        "largest_category": "electricity",
        "breakdown": {
            "transport": 100.0,
            "electricity": 150.0,
            "food": 80.0,
            "waste": 20.0
        }
    }
    
    mock_client = MagicMock()
    mock_client.chats.create.side_effect = Exception("API connection timed out")
    
    with patch("app.services.coach._gemini_client", mock_client):
        reply = CoachService.chat([{"role": "user", "text": "how to save power?"}], footprint)
        assert "electricity emissions are 150.0" in reply

