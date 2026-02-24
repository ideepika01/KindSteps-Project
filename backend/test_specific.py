from google import genai
from app.core.config import settings
import sys


def test():
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    model = "gemini-2.0-flash"
    print(f"Testing {model}...")
    try:
        response = client.models.generate_content(model=model, contents="Hi")
        print(f"SUCCESS: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")


if __name__ == "__main__":
    test()
