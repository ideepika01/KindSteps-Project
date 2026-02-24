from google import genai
from google.genai import types
from app.core.config import settings
import json


# fallback if AI fails
DEFAULT_AI_RESPONSE = {
    "description": "AI is unavailable. Please describe manually.",
    "advice": [
        "Stay calm.",
        "Check for injuries.",
        "Wait for help.",
    ],
}


# main function to analyze image
def analyze_image_for_description(
    image_bytes: bytes, mime_type: str = "image/jpeg"
) -> dict:

    # return fallback if API key missing
    if not settings.GEMINI_API_KEY or "your_gemini_api_key" in settings.GEMINI_API_KEY:
        return DEFAULT_AI_RESPONSE

    versions = ["v1", "v1beta"]
    models = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-2.0-flash"]

    last_error = None

    # try each version and model
    for version in versions:
        for model in models:
            try:
                # create gemini client
                client = genai.Client(
                    api_key=settings.GEMINI_API_KEY,
                    http_options={"api_version": version},
                )

                # send image to AI
                response = client.models.generate_content(
                    model=model,
                    contents=[
                        "Analyze and return JSON with description and advice",
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    ),
                )

                # convert and return result
                return parse_ai_response(response)

            except Exception as e:
                last_error = str(e)

                # invalid key error
                if "401" in last_error or "API_KEY_INVALID" in last_error:
                    return {
                        "description": "Invalid API Key",
                        "advice": ["Check your GEMINI_API_KEY"],
                    }

                continue

    # quota limit error
    if last_error and ("429" in last_error or "EXHAUSTED" in last_error):
        return {
            "description": "Daily limit reached",
            "advice": ["Try again later"],
        }

    return DEFAULT_AI_RESPONSE


# convert AI text to dictionary
def parse_ai_response(response) -> dict:

    try:
        text = response.text.strip()

        # remove markdown if present
        if "```" in text:
            text = text.split("```json")[-1].split("```")[0].strip()

        return json.loads(text)

    except Exception:
        return DEFAULT_AI_RESPONSE
