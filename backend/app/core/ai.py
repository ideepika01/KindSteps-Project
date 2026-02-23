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
    """Analyze image using Gemini with automatic model failover."""

    if not is_valid_api_key():
        return DEFAULT_AI_RESPONSE

    # List of models to try in order of likelihood of availability/quota
    potential_models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-1.0-pro-vision-latest",
        "gemini-1.5-flash-latest",
    ]

    last_error = "Unknown AI Error"

    for model_id in potential_models:
        try:
            print(f"DEBUG: Attempting AI Analysis with model: {model_id}")
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            response = client.models.generate_content(
                model=model_id,
                contents=[
                    get_prompt(),
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )

            result = parse_response(response)
            print(f"DEBUG: AI Analysis SUCCESS with model: {model_id}")
            return result

        except Exception as error:
            last_error = str(error)
            print(f"AI Model {model_id} failed: {last_error[:100]}...")
            # If 401 (Unauth) or 403 (Forbidden), we stop early as it's an API key issue
            if (
                "401" in last_error
                or "403" in last_error
                or "API_KEY_INVALID" in last_error.upper()
            ):
                break
            continue

    # If all models fail, determine the most helpful error message
    error_str = last_error.upper()
    error_hint = last_error[:65] + "..." if len(last_error) > 65 else last_error

    # Handle Quota / Resource Exhausted
    if any(kw in error_str for kw in ["429", "QUOTA", "EXHAUSTED", "LIMIT"]):
        return {
            "description": f"AI QUOTA EXCEEDED ({error_hint}). All models are at capacity. Please describe manually.",
            "advice": [
                "Try again in 5-10 minutes",
                "The free tier limit has been reached",
                f"Service Info: {error_hint}",
            ],
        }

    # Handle Overload / Service Unavailable
    if any(kw in error_str for kw in ["503", "UNAVAILABLE", "OVERLOADED", "TIMEOUT"]):
        return {
            "description": f"AI SERVICE BUSY ({error_hint}). Please try again in 30 seconds.",
            "advice": [
                "Wait a moment and click 'Auto-describe' again",
                "The server is temporarily overloaded",
                f"Service Info: {error_hint}",
            ],
        }

    # Catch-all for API Key errors or Regional restrictions
    return {
        "description": f"AI KEY/SERVICE LIMIT ({error_hint}). Please describe manually.",
        "advice": [
            "Check if your API key is restricted in AI Studio",
            "Try creating a NEW API key in a NEW project",
            f"Technical Note: {error_hint}",
        ],
    }


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
    """Convert AI response to dictionary, handling potential markdown wrapping."""

    if hasattr(response, "parsed") and response.parsed:
        return response.parsed

    raw_text = response.text.strip()

    # Handle markdown code blocks if the model included them
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw_text = "\n".join(lines).strip()

    try:
        return json.loads(raw_text)

    except Exception as e:
        print(f"JSON Parse Error: {e} | Raw text: {raw_text[:100]}...")
        return DEFAULT_AI_RESPONSE
