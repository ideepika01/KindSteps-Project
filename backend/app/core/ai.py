from google import genai
from google.genai import types
from app.core.config import settings
import json

# Fallback response for dry-runs or errors
DEFAULT_AI_RESPONSE = {
    "description": "AI analysis is currently in preview mode. Please provide a manual description.",
    "advice": [
        "Maintain a safe distance and speak calmly.",
        "Check for any immediate medical needs.",
        "Stay with the person until help arrives.",
    ],
}


def analyze_image_for_description(image_bytes: bytes) -> dict:
    """Uses Gemini to identify details and provide compassionate advice."""

    # Check for API Key presence
    if not settings.GEMINI_API_KEY or "your_gemini_api_key" in settings.GEMINI_API_KEY:
        return DEFAULT_AI_RESPONSE

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt = (
            "Analyze this image of a person in distress. Return a JSON object with: "
            "'description' (professional physical description) and "
            "'advice' (3 short compassionate steps for the reporter)."
        )

        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        # Handle different response formats from the SDK
        try:
            if hasattr(response, "parsed") and response.parsed:
                return response.parsed
            return json.loads(response.text)
        except Exception:
            # If JSON parsing fails, return default
            return DEFAULT_AI_RESPONSE

    except Exception as e:
        print(f"AI Error: {e}")
        return DEFAULT_AI_RESPONSE
