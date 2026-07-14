# Dependency FastAPI buat proteksi endpoint pakai JWT dari httpOnly cookie
import jwt
from fastapi import Cookie, Depends, HTTPException, status

from app.core.security import decode_access_token

COOKIE_NAME = "swara_token"


def get_current_user(swara_token: str | None = Cookie(default=None)) -> dict:
    # Ambil user info dari JWT di cookie. Raise HTTPException kalau token invalid/expired.
    if swara_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
        )

    try:
        payload = decode_access_token(swara_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    return payload

# Fungsi buat ngecek role user. Dipakai di endpoint yang butuh role tertentu.
def require_role(*allowed_roles: str):
    def role_checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource.",
            )
        return user

    return role_checker