from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.endpoints import router as api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# CORS - biar frontend (misal React di port lain) bisa akses API ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.database.connection import Base, engine
from app.database import schemas  # noqa: F401 - biar model Feedback keregister ke Base.metadata

Base.metadata.create_all(bind=engine)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": f"{settings.APP_NAME} is running",
        "version": settings.APP_VERSION,
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}