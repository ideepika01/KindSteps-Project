from google import genai
from app.core.config import settings
import os


def check_ai():
    print(f"Testing API Key: {settings.GEMINI_API_KEY[:10]}...")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        print("Fetching models...")
        models = client.models.list()

        print("\nAVAILABLE MODELS FOR THIS KEY:")
        count = 0
        for m in models:
            print(f"- {m.name}")
            count += 1

        if count == 0:
            print(
                "WARNING: No models found. This usually means the API is NOT enabled for this project."
            )

    except Exception as e:
        print(f"\nCRITICAL ERROR: {str(e)}")
        if "403" in str(e):
            print(
                "Reason: 403 Forbidden. The API key is valid but the Generative Language API is disabled in Cloud Console."
            )
        elif "401" in str(e):
            print("Reason: 401 Unauthorized. The API key itself is invalid.")


if __name__ == "__main__":
    check_ai()
