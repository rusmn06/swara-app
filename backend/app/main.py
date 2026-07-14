# FastAPI app main entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import router as api_router
from app.api.endpoints_auth import router as auth_router

#Inisialisasi FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Tambahin middleware CORS biar frontend bisa akses backend dari domain berbeda (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.database.connection import Base, engine
from app.database import schemas  # model Feedback keregister ke Base.metadata

Base.metadata.create_all(bind=engine)

# Register router dari endpoints.py ke FastAPI app
app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

# Root endpoint dan health check
@app.get("/")
def root():
    return {
        "message": f"{settings.APP_NAME} is running",
        "version": settings.APP_VERSION,
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}