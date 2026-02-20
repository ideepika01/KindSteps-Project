import os
import sys

# Add the current directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from google import genai
from app.core.config import settings


def list_models():
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        print("No API Key found")
        return

    client = genai.Client(api_key=api_key)

    print("Available Models:")
    try:
        # The new SDK might use a different method for listing models
        # Exploring common attributes
        for model in client.models.list():
            print(f"- {model.name}")
    except Exception as e:
        print(f"Error listing models: {e}")


if __name__ == "__main__":
    list_models()
