from google import genai
from app.core.config import settings
import sys

def test_api_key():
    print(f"Testing Gemini API Key with gemini-pro-latest...")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-pro-latest",
            contents=["Say 'Hello!'"]
        )
        print(f"AI Response: '{response.text}'")
        print("Model gemini-pro-latest works.")
    except Exception as e:
        print(f"Test failed for gemini-pro-latest: {e}")

if __name__ == "__main__":
    test_api_key()
