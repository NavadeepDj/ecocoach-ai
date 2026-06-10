"""Context-aware coaching service powered by the Gemini API with offline fallback."""

import logging
from typing import Any, Literal

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini client initialisation
# ---------------------------------------------------------------------------
_gemini_client: genai.Client | None = None

api_key = settings.gemini_api_key
if api_key:
    try:
        _gemini_client = genai.Client(api_key=api_key)
        logger.info("Gemini API client initialised (google-genai SDK).")
    except Exception as exc:
        logger.warning("Failed to create Gemini client (%s). Coach running in Offline Mode.", exc)
else:
    logger.warning(
        "ECOCOACH_GEMINI_API_KEY not configured. Coach running in Offline Mode."
    )

# Model hierarchy to try in order of preference (primary and backups)
_GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

# Maximum number of prior messages forwarded to Gemini (cost-guard)
_MAX_HISTORY_TURNS = 20


class CoachService:
    """Carbon-footprint coaching assistant."""

    @staticmethod
    def chat(
        history: list[dict[str, str]],
        footprint: dict[str, Any],
    ) -> str:
        """Process a chat conversation and return the coach's reply.

        Uses the Gemini API when available; falls back to deterministic
        keyword-matching when the API key is missing or all configured models fail.
        """
        if not history:
            return (
                "Hi there! I'm EcoCoach, your carbon footprint guide. "
                "Ask me anything about your results or how to reduce them!"
            )

        latest_user_message = (
            history[-1]["text"].lower() if history[-1]["role"] == "user" else ""
        )

        if _gemini_client is None:
            return CoachService._get_offline_response(latest_user_message, footprint)

        try:
            breakdown = footprint.get("breakdown", {})
            system_prompt = (
                "You are EcoCoach AI, a friendly and context-aware carbon footprint coach.\n"
                "You help users understand their carbon footprint and take actionable steps to reduce it.\n\n"
                f"User's Current Footprint Context:\n"
                f"- Total monthly emissions: {footprint.get('total')} {footprint.get('unit', 'kg_co2e')}\n"
                f"- Carbon Health Score: {footprint.get('score')} / 100 ({footprint.get('score_band')} band)\n"
                f"- Largest contributor category: {footprint.get('largest_category')}\n"
                f"- Breakdown:\n"
                f"  * Transport: {breakdown.get('transport', 0)} kg CO2e\n"
                f"  * Electricity: {breakdown.get('electricity', 0)} kg CO2e\n"
                f"  * Food: {breakdown.get('food', 0)} kg CO2e\n"
                f"  * Waste: {breakdown.get('waste', 0)} kg CO2e\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. Calculations are deterministic and explainable; you MUST NOT invent, alter, "
                "or contradict the footprint totals, scores, breakdown values, or savings shown above.\n"
                "2. Keep your answers concise (2-4 sentences), encouraging, and highly actionable.\n"
                "3. Focus recommendations on their largest categories first."
            )

            # Trim history to last N turns to bound Gemini token usage
            trimmed = history[-_MAX_HISTORY_TURNS:]

            # Build prior turns as Content objects (exclude the latest message)
            gemini_history: list[types.Content] = []
            for msg in trimmed[:-1]:
                role: Literal["user", "model"] = "user" if msg["role"] == "user" else "model"
                gemini_history.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=msg["text"])])
                )

            # Try models in order of preference
            last_exc = None
            for model_name in _GEMINI_MODELS:
                try:
                    chat = _gemini_client.chats.create(
                        model=model_name,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                        ),
                        history=gemini_history,
                    )
                    response = chat.send_message(trimmed[-1]["text"])
                    return response.text
                except Exception as exc:
                    logger.warning(
                        "Gemini chat failed with model %s (%s). Trying next backup model...",
                        model_name,
                        exc,
                    )
                    last_exc = exc
                    continue

            # If all models failed, raise the last encountered error to trigger offline fallback
            if last_exc:
                raise last_exc
        except Exception as exc:
            logger.error("All Gemini models failed: %s. Falling back to offline.", exc)
            return CoachService._get_offline_response(latest_user_message, footprint)

    # ------------------------------------------------------------------
    # Offline fallback
    # ------------------------------------------------------------------
    @staticmethod
    def _get_offline_response(query: str, footprint: dict[str, Any]) -> str:
        """Return a deterministic keyword-matched response."""
        breakdown = footprint.get("breakdown", {})
        largest = footprint.get("largest_category", "transport")

        # Normalise punctuation and split into individual words
        words = set(
            query.replace("?", " ").replace("!", " ")
            .replace(".", " ").replace(",", " ")
            .split()
        )

        is_transport = any(
            w in words
            for w in ["transport", "car", "bus", "train", "flight", "fly", "travel"]
        ) or "flight" in query or "travel" in query

        is_electricity = any(
            w in words
            for w in ["electricity", "power", "energy", "ac", "cooling", "light", "led"]
        ) or "electricity" in query

        is_food = any(
            w in words
            for w in ["food", "diet", "meat", "vegan", "vegetarian", "eat"]
        ) or "vegetarian" in query

        is_waste = any(
            w in words
            for w in ["waste", "compost", "recycle", "landfill", "trash"]
        ) or "compost" in query

        if is_transport:
            return (
                f"Your transport emissions are {breakdown.get('transport', 0)} kg CO2e monthly. "
                "I recommend trying to carpool, take public bus or train transit, or switch "
                "domestic flights for trains where possible. "
                "Check out the specific transport recommendations on your dashboard to see your estimated savings!"
            )

        if is_electricity:
            return (
                f"Your electricity emissions are {breakdown.get('electricity', 0)} kg CO2e monthly. "
                "You can easily reduce this by swapping out traditional bulbs for energy-efficient LEDs, "
                "and setting your air conditioner to 24°C or higher. "
                "Clean filters also help save about 6% of cooling energy!"
            )

        if is_food:
            return (
                f"Your food emissions are {breakdown.get('food', 0)} kg CO2e monthly. "
                "Animal products have high lifecycle footprints. Incorporating 'Meatless Mondays' "
                "or swapping beef/mutton for plant proteins (like lentils, tofu, or beans) "
                "a few days a week is one of the most effective actions you can take."
            )

        if is_waste:
            return (
                f"Your waste emissions are {breakdown.get('waste', 0)} kg CO2e monthly. "
                "Landfill emissions are caused by organic waste decomposing anaerobically. "
                "By composting your organic kitchen scraps and recycling plastics, paper, "
                "and glass, you can significantly reduce your footprint."
            )

        # General response tailored to the largest category
        tips = {
            "transport": "You should check out public transit alternatives or carpooling to reduce your travel footprint.",
            "electricity": "Switching to LED lights and adjusting AC thermostats is a great way to lower your energy impact.",
            "food": "Eating plant-based meals even a couple of days a week makes a significant reduction in food carbon emissions.",
            "waste": "Composting your food scraps and sorting paper/plastics reduces methane emissions in landfills.",
        }

        return (
            f"Hi! I am your offline EcoCoach. Looking at your footprint, your total is "
            f"{footprint.get('total', 0)} kg CO2e, and your biggest category is '{largest}'. "
            f"{tips.get(largest, '')} "
            "Ask me about any specific category (transport, electricity, food, waste) for more detailed tips!"
        )
