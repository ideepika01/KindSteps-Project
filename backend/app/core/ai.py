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

    # Ordered list of models to try. We try stable, then latest, then specific versions.
    potential_models = [
        "gemini-2.0-flash",  # Fastest stable
        "gemini-1.5-flash",  # Standard stable
        "gemini-1.5-flash-latest",  # Latest alias
        "gemini-1.5-flash-8b",  # Small model (high availability)
        "gemini-1.5-pro",  # High quality fallback
    ]

    last_error = "No models attempted"

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
                    response_mime_type="application/json", temperature=0.1
                ),
            )

            result = parse_response(response)
            if result and (result.get("description") or result.get("advice")):
                print(f"DEBUG: AI Analysis SUCCESS with model: {model_id}")
                return result

            raise ValueError("Empty or invalid response structure")

        except Exception as error:
            last_error = str(error)
            print(f"DEBUG: Model {model_id} failed: {last_error[:120]}")

            # If it's a 401/403 (Auth), we stop entirely as no model will work
            if any(
                kw in last_error.upper()
                for kw in ["401", "403", "KEY_INVALID", "PERMISSION_DENIED"]
            ):
                break

            # For 404 or other errors, continue to the next model
            continue

    # If we get here, all models failed
    error_str = last_error.upper()
    error_hint = last_error[:120] + "..." if len(last_error) > 120 else last_error

    # Categorize the final failure for the user
    if "404" in error_str or "NOT_FOUND" in error_str:
        return {
            "description": f"AI ACTIVATION PENDING ({error_hint}). Please wait 5 minutes.",
            "advice": [
                "You recently enabled the API, Google takes time to propagate.",
                "Refresh this page in a few minutes.",
                "Ensure your Vercel API key matches the Project you enabled.",
            ],
        }

    if "429" in error_str or "QUOTA" in error_str:
        return {
            "description": f"AI QUOTA LIMIT ({error_hint}). Please describe manually.",
            "advice": [
                "Retry in 60 seconds",
                "Check your daily limit in AI Studio",
                "Manual entry is recommended for now",
            ],
        }

    return {
        "description": f"AI SERVICE ERROR ({error_hint}). Please describe manually.",
        "advice": [
            "Ensure the photo is clear and under 5MB",
            "Try again later",
            f"Technical Note: {error_hint}",
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
        "Analyze this image of a person in potential distress. "
        "Strictly return JSON: {'description': 'A compassionate 1-2 sentence description', 'advice': ['step 1', 'step 2', 'step 3']}"
    )


def parse_response(response) -> dict:
    """Convert AI response to dictionary safely."""
    try:
        if hasattr(response, "parsed") and response.parsed:
            return response.parsed

        raw_text = response.text.strip()

        # Clean markdown code blocks
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            raw_text = "\n".join(lines).strip()

        return json.loads(raw_text)

    except Exception as e:
        print(f"DEBUG: Parse Error: {e}")
        return DEFAULT_AI_RESPONSE
