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


def analyze_image_for_description(image_bytes: bytes) -> dict:
    """Analyze image using Gemini and return description and advice."""

    # Check API key
    if not is_valid_api_key():
        return DEFAULT_AI_RESPONSE

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Using gemini-2.0-flash as it is the current high-performance stable model
        model_id = "gemini-2.0-flash"

        response = client.models.generate_content(
            model=model_id,
            contents=[
                get_prompt(),
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        return parse_response(response)

    except Exception as error:
        error_msg = str(error)
        print(f"AI ERROR [{type(error).__name__}]: {error_msg}")

        # Temporary: Return the EXACT error message to the user for debugging
        return {
            "description": f"DEBUG INFO: {error_msg}",
            "advice": [
                "Please report the 'DEBUG INFO' above to the development team.",
                "Ensure your API key is active in the Google AI Studio console.",
                "Try a smaller image or a different file format (JPG/PNG).",
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
