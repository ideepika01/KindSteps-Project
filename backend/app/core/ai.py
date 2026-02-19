from google import genai
from google.genai import types
from app.core.config import settings
import json


# -------- DEFAULT RESPONSE --------

DEFAULT_AI_RESPONSE = {
    "description": "AI analysis is currently unavailable. Please provide a manual description.",
    "advice": [
        "Maintain a safe distance and speak calmly.",
        "Check for any immediate medical needs.",
        "Stay with the person until help arrives.",
    ],
}


# -------- MAIN FUNCTION --------


def analyze_image_for_description(image_bytes: bytes) -> dict:
    """Analyze image using Gemini and return description and advice."""

    # Check API key
    if not is_valid_api_key():
        return DEFAULT_AI_RESPONSE

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=[
                get_prompt(),
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        return parse_response(response)

    except Exception as error:
        print("AI Error:", error)

        return DEFAULT_AI_RESPONSE


# -------- HELPER FUNCTIONS --------


def is_valid_api_key() -> bool:
    """Check if API key is valid."""
    api_key = settings.GEMINI_API_KEY

    if not api_key:
        return False

    if "your_gemini_api_key" in api_key:
        return False

    return True


def get_prompt() -> str:
    """Return AI prompt."""
    return (
        "Analyze this image of a person in distress. "
        "Return JSON with:"
        " 'description' and 'advice' (3 compassionate steps)."
    )


def parse_response(response) -> dict:
    """Convert AI response to dictionary."""

    if hasattr(response, "parsed") and response.parsed:
        return response.parsed

    try:
        return json.loads(response.text)

    except Exception:
        return DEFAULT_AI_RESPONSE
