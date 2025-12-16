# =========================================================
# TOKEN SCHEMAS
# =========================================================

from pydantic import BaseModel
from typing import Optional

# 1. THE TOKEN ITSELF
# This is what we send to the user after login.
class Token(BaseModel):
    access_token: str
    token_type: str

# 2. DATA INSIDE TOEKN
# When we decode the token, what do we expect to find?
class TokenData(BaseModel):
    email: Optional[str] = None
