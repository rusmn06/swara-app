from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import COOKIE_NAME, get_current_user
from app.core.security import create_access_token, verify_password
from app.database.connection import get_db
from app.database.schemas import User

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str | None
    role: str


# Endpoint login: verifikasi kredensial, set JWT sebagai httpOnly cookie
@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    token = create_access_token(user_id=user.id, username=user.username, role=user.role)

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.JWT_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

    return UserResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        role=user.role,
    )


# Endpoint logout: hapus cookie JWT dari browser
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"message": "Logged out successfully."}


# Endpoint buat ambil info user yang lagi login, dari JWT di cookie
@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == int(current_user["sub"])).first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    return UserResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        role=user.role,
    )