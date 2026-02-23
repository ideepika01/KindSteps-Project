from google import genai
from google.genai import types
from app.core.config import settings
import json


# -------- DEFAULT RESPONSE --------

DEFAULT_AI_RESPONSE = {
    "description": "AI analysis is currently unavailable. Please describe the situation manually.",
    "advice": [
        "Maintain a safe distance and speak calmly.",
        "Check for any immediate medical needs.",
        "Stay with the person until help arrives.",
    ],
}


# -------- MAIN FUNCTION --------


def analyze_image_for_description(
    image_bytes: bytes, mime_type: str = "image/jpeg"
) -> dict:
    """Analyze image using Gemini with smart multi-tier failover."""

    if not is_valid_api_key():
        return DEFAULT_AI_RESPONSE

    # Ordered list of best-performing and most-available models for 2026
    potential_models = [
        "gemini-1.5-flash",  # Primary stable
        "gemini-1.5-flash-8b",  # Best for high-traffic/low-quota
        "gemini-1.5-pro",  # High quality fallback
        "gemini-2.0-flash-exp",  # Experimental fallback
    ]

    last_error = "Unknown AI Error"

    for model_id in potential_models:
        try:
            print(f"DEBUG: Attempting AI Analysis with model: {model_id}")

            # Re-initializing client to ensure clean state per attempt
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            response = client.models.generate_content(
                model=model_id,
                contents=[
                    get_prompt(),
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,  # Lower temperature for more stable JSON
                ),
            )

            result = parse_response(response)
            print(f"DEBUG: AI Analysis SUCCESS with model: {model_id}")
            return result

        except Exception as error:
            last_error = str(error)
            print(f"AI Model {model_id} failed: {last_error[:100]}...")

            # Critical errors that won't work with ANY model
            check_msg = last_error.upper()
            if any(
                kw in check_msg
                for kw in ["API_KEY_INVALID", "401", "403", "PERMISSION_DENIED"]
            ):
                break

            continue

    # If all models fail, determine the most helpful error message
    error_str = last_error.upper()
    error_hint = last_error[:100] + "..." if len(last_error) > 100 else last_error

    # Categorized user-friendly responses
    if any(kw in error_str for kw in ["429", "QUOTA", "EXHAUSTED", "LIMIT"]):
        return {
            "description": f"AI QUOTA REACHED ({error_hint}). Please describe manually.",
            "advice": [
                "Try again in 5-10 minutes",
                "Check your Google AI Studio quota",
                "Manual detail is prioritized",
            ],
        }

    if any(kw in error_str for kw in ["404", "NOT_FOUND", "MODEL_NOT_FOUND"]):
        return {
            "description": f"AI MODEL MISMATCH ({error_hint}). Please describe manually.",
            "advice": [
                "Ensure Generative Language API is enabled in Cloud Console",
                "Wait for the service to synchronize",
                "Check your API key region",
            ],
        }

    return {
        "description": f"AI SERVICE ISSUE ({error_hint}). Please describe manually.",
        "advice": [
            "Check your internet and wait 60 seconds",
            "Try a different photo format",
            f"Debug Info: {error_hint}",
        ],
    }


# -------- HELPER FUNCTIONS --------


def is_valid_api_key() -> bool:
    """Check if API key is valid."""
    api_key = settings.GEMINI_API_KEY
    if not api_key or "your_gemini_api_key" in api_key:
        return False
    return True


def get_prompt() -> str:
    """Return AI prompt."""
    return (
        "Analyze this image of a person in distress. "
        "Provide a compassionate, factual description and 3 helpful steps. "
        "Return strictly as JSON with 'description' (string) and 'advice' (list of strings)."
    )


def parse_response(response) -> dict:
    """Convert AI response to dictionary safely."""
    try:
        if hasattr(response, "parsed") and response.parsed:
            return response.parsed

        raw_text = response.text.strip()

        # Clean markdown if present
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            raw_text = "\n".join(lines).strip()

        return json.loads(raw_text)

    except Exception as e:
        print(f"Parse Error: {e}")
        return DEFAULT_AI_RESPONSE
