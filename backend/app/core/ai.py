from google import genai
from google.genai import types
from app.core.config import settings
import json

DEFAULT_AI_RESPONSE = {
    "description": "AI unavailable. Please describe manually.",
    "advice": ["Stay calm.", "Check for injuries.", "Wait for help."]
}


def analyze_image_for_description(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:

    if not settings.GEMINI_API_KEY:
        return DEFAULT_AI_RESPONSE

    try:
        
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                "Analyze the image and return JSON with fields: description, advice, condition.",
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)  
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",  
                temperature=0.1
            )
        )

        # convert AI response to dictionary
        return json.loads(response.text)

    except Exception as e:
        return DEFAULT_AI_RESPONSE