from app.core.config import settings
import sys

print(f"Python version: {sys.version}")
print(f"GEMINI_API_KEY: '{settings.GEMINI_API_KEY[:5]}...{settings.GEMINI_API_KEY[-5:]}'" if settings.GEMINI_API_KEY else "GEMINI_API_KEY: Not set")

try:
    from google import genai
    print("google-genai is installed.")
    
    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            print("Successfully initialized Gemini Client.")
        except Exception as e:
            print(f"Failed to initialize Gemini Client: {e}")
    else:
        print("Skipping client initialization due to missing API key.")
except ImportError:
    print("google-genai is NOT installed.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
