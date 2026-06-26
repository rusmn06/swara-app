# FastAPI app main entry point
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
## Import settings dari config.py
from app.core.config import settings

# SQLAlchemy engine dan sessionmaker
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency buat dipakai di endpoint yang butuh akses database
def get_db():
    """Dependency buat dipakai di endpoint yang butuh akses database."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()