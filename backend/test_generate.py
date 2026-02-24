from google import genai
from app.core.config import settings


def test_generate(version, model):
    print(f"Testing {model} with {version}...")
    client = genai.Client(
        api_key=settings.GEMINI_API_KEY, http_options={"api_version": version}
    )
    try:
        response = client.models.generate_content(model=model, contents="Hello")
        print(f"SUCCESS {model} {version}")
        return True
    except Exception as e:
        print(f"ERROR {model} {version}: {e}")
        return False


if __name__ == "__main__":
    models = [
        "gemini-1.5-flash",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-2.0-flash",
    ]
    for v in ["v1", "v1beta"]:
        for m in models:
            if test_generate(v, m):
                print(f"--- MODEL {m} WORKS ---")
