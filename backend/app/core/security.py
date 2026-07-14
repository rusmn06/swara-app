# Modul buat hashing password dan generate/verifikasi JWT
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Context buat hashing password pakai bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password pakai bcrypt, Hasil hash ini yang disimpan di DB."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verifikasi password plain text sama hash-nya. Return True kalau cocok."""
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(user_id: int, username: str, role: str) -> str:
    """Generate JWT buat user yang login. Return string token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode JWT dan return payload-nya. Raise exception kalau token invalid."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])