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

    # Use 'latest' aliases which are often more resilient to API versioning changes
    potential_models = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash",
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
            if result and result.get("description"):
                print(f"DEBUG: AI Analysis SUCCESS with model: {model_id}")
                return result

            raise ValueError("Empty response from AI")

        except Exception as error:
            last_error = f"Model {model_id} failed: {str(error)}"
            print(f"DEBUG: {last_error[:150]}...")

            error_msg = last_error.upper()
            # If the API isn't enabled, all models will return 404 or PERMISSION_DENIED
            if "NOT_FOUND" in error_msg or "404" in error_msg:
                # If the first model fails with 404, suggest activation
                if model_id == "gemini-1.5-flash-latest":
                    return {
                        "description": "AI SERVICE NOT ENABLED: Please enable the 'Generative Language API' in your Google Cloud Console.",
                        "advice": [
                            "Go to console.cloud.google.com/apis/library",
                            "Search for 'Generative Language API'",
                            "Click ENABLE for your project.",
                        ],
                    }

            if any(
                kw in error_msg
                for kw in ["401", "403", "KEY_INVALID", "PERMISSION_DENIED"]
            ):
                break
            continue

    # Final error handling if all fail
    error_str = last_error.upper()
    error_hint = last_error[:120] + "..." if len(last_error) > 120 else last_error

    # Categorize for the user
    if "429" in error_str or "QUOTA" in error_str:
        return {
            "description": f"AI QUOTA EXCEEDED ({error_hint}). Please describe manually.",
            "advice": [
                "The free tier has reached its per-minute limit",
                "Retry in 60 seconds",
                "Wait for quota reset",
            ],
        }

    if "404" in error_str or "NOT_FOUND" in error_str:
        return {
            "description": f"AI MODEL UNAVAILABLE ({error_hint}). Please describe manually.",
            "advice": [
                "Ensure 'Generative Language API' is enabled in your Google Cloud Project",
                "Check if your region supports Gemini",
                "Try a fresh API key in a brand new project",
            ],
        }

    return {
        "description": f"AI SERVICE ERROR ({error_hint}). Please describe manually.",
        "advice": [
            "Ensure the photo is under 5MB and clear",
            "The service might be temporarily down",
            f"Technical Trace: {error_hint}",
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
        "Strictly return JSON: {'description': 'A compassionate 1-2 sentence description', 'advice': ['step 1', 'step 2', 'step 3']}"
    )


def parse_response(response) -> dict:
    """Convert AI response to dictionary safely."""
    try:
        # Some SDK versions provide .parsed directly
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
        print(f"DEBUG: Parse Error: {e} | Text: {response.text[:50]}...")
        return DEFAULT_AI_RESPONSE
