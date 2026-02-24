from google import genai
from google.genai import types
from app.core.config import settings
import base64


def test_image():
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    # Create a tiny dummy JPEG
    dummy_image = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    )

    model = "gemini-flash-latest"
    print(f"Testing {model} with image...")
    try:
        response = client.models.generate_content(
            model=model,
            contents=[
                "Describe this color",
                types.Part.from_bytes(data=dummy_image, mime_type="image/png"),
            ],
        )
        print(f"SUCCESS: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")


if __name__ == "__main__":
    test_image()
