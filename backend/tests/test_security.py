import time
from jose import jwt
from app.core import security
from app.core import config


def test_password_hash_and_verify():
    pwd = "my-secret"
    h = security.get_password_hash(pwd)
    assert isinstance(h, str) and len(h) > 0
    assert security.verify_password(pwd, h) is True
    assert security.verify_password("wrong", h) is False


def test_create_access_token_and_decode(monkeypatch):
    # Ensure predictable secret and algorithm for decoding
    monkeypatch.setattr(config, "settings", config.Settings(SECRET_KEY="test-secret", ALGORITHM="HS256", DATABASE_URL="sqlite:///test.db"))

    token = security.create_access_token({"sub": "alice@example.com"}, expires_delta=None)
    payload = jwt.decode(token, config.settings.SECRET_KEY, algorithms=[config.settings.ALGORITHM])

    assert payload.get("sub") == "alice@example.com"
    assert "exp" in payload
    # exp should be in the future (allow some slack)
    assert payload["exp"] > int(time.time()) - 10
