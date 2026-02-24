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

    # Try both v1 and v1beta API versions
    api_versions = ["v1", "v1beta"]

    # Expanded model list to handle name mismatches and model-specific quota limits
    # gemini-flash-latest and gemini-flash-lite-latest are often more reliable aliases
    potential_models = [
        "gemini-1.5-flash",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash",
    ]

    last_error = "No models attempted"

    for version in api_versions:
        for model_id in potential_models:
            try:
                print(
                    f"DEBUG: Attempting AI Analysis with model: {model_id} (API: {version})"
                )

                # Force specific API version
                client = genai.Client(
                    api_key=settings.GEMINI_API_KEY,
                    http_options={"api_version": version},
                )

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
                    print(
                        f"DEBUG: AI Analysis SUCCESS with model: {model_id} ({version})"
                    )
                    return result

                raise ValueError("Invalid structure")

            except Exception as error:
                last_error = str(error)
                print(f"DEBUG: Model {model_id} ({version}) failed: {last_error[:100]}")

                # If it's a 401, stop immediately
                if any(kw in last_error.upper() for kw in ["401", "API_KEY_INVALID"]):
                    return {
                        "description": "AI KEY INVALID (401). Your Vercel environment variable might be incorrect.",
                        "advice": [
                            "Check the key in Vercel Settings",
                            "Ensure no extra spaces",
                            "Redeploy after change",
                        ],
                    }

                # If it's a 429 for this specific model, we can try the next model
                # This is useful if one model (like 2.0) is exhausted but 1.5 is not
                continue

    # Final error handling if all fail
    error_str = last_error.upper()
    error_hint = last_error[:150] + "..." if len(last_error) > 150 else last_error

    if "429" in error_str or "EXHAUSTED" in error_str:
        return {
            "description": "AI QUOTA EXCEEDED (429). You have reached the free tier limit.",
            "advice": [
                "Please wait 60 seconds and try again.",
                "Note: Daily quotas reset at Midnight PST (GMT-8). If it's been 'one night' in your local time, the Google cycle might not have reset yet.",
                "Check your daily quota at https://aistudio.google.com/app/plan_and_billing.",
                "The free tier allows 15 requests per minute.",
            ],
        }

    return {
        "description": f"AI SERVICE MISMATCH ({error_hint}).",
        "advice": [
            "1. Visit https://aistudio.google.com/app/apikey",
            "2. Ensure your key is 'Unrestricted' OR tied to the correct Cloud Project",
            "3. Verify that the Project shows 'Generative Language API' as ENABLED",
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
        if hasattr(response, "parsed") and response.parsed:
            return response.parsed
        raw_text = response.text.strip()
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
