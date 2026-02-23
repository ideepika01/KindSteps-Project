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
    """Analyze image using Gemini and return description and advice."""

    # Check API key
    if not is_valid_api_key():
        return DEFAULT_AI_RESPONSE

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Using gemini-1.5-flash-latest for better compatibility with free tier
        model_id = "gemini-1.5-flash-latest"

        response = client.models.generate_content(
            model=model_id,
            contents=[
                get_prompt(),
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        return parse_response(response)

    except Exception as error:
        error_msg = str(error)
        print(f"AI ERROR [{type(error).__name__}]: {error_msg}")

        error_str = error_msg.upper()

        # Determine a helpful hint from the error for the advice section
        error_hint = error_msg[:60] + "..." if len(error_msg) > 60 else error_msg

        # Handle Quota / Resource Exhausted
        if any(kw in error_str for kw in ["429", "QUOTA", "EXHAUSTED", "LIMIT"]):
            return {
                "description": "AI Quota Exceeded: The free tier has reached its daily or per-minute limit. Please provide a manual description for now.",
                "advice": [
                    "Try again in a few minutes",
                    "The AI service is currently at capacity",
                    f"Technical Note: {error_hint}",
                ],
            }

        # Handle Overload / Service Unavailable
        if any(
            kw in error_str for kw in ["503", "UNAVAILABLE", "OVERLOADED", "TIMEOUT"]
        ):
            return {
                "description": "AI Overloaded: The service is currently receiving too many requests. Please try again in 30 seconds.",
                "advice": [
                    "Wait a moment and retry",
                    "The service is temporarily busy",
                    f"Technical Note: {error_hint}",
                ],
            }

        # Catch-all for other errors (e.g. Region not supported, Invalid Key)
        return {
            "description": "AI analysis is temporarily unavailable. Please describe the situation manually.",
            "advice": [
                "Describe the situation manually for now",
                "Ensure your photo is clear and under 5MB",
                f"Service Info: {error_hint}",
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
        # Remove starting ```json or ```
        lines = raw_text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        # Remove ending ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw_text = "\n".join(lines).strip()

    try:
        return json.loads(raw_text)

    except Exception as e:
        print(f"JSON Parse Error: {e} | Raw text: {raw_text[:100]}...")
        return DEFAULT_AI_RESPONSE
