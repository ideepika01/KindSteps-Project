from google import genai
from app.core.config import settings

def list_models():
    print(f"Listing available models for API Key: {settings.GEMINI_API_KEY[:10]}...")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        for model in client.models.list():
             # Basic model object print
             print(f"Model ID: {model.name}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    list_models()
