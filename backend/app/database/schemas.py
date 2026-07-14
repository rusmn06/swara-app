from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Boolean, Enum, func
from app.database.connection import Base

# Model User buat tabel users di database (autentikasi & role-based access)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=True)
    role = Column(Enum("admin", "manajerial", name="user_role"), nullable=False, default="manajerial")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


# Model Feedback buat tabel feedbacks di database
class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # Sementara belum ada FK ke participants(id) karena tabel itu di-skip dulu.
    # Nanti kalau tabel participants dibuat, ini bisa diubah jadi ForeignKey.
    participant_id = Column(Integer, nullable=True)
    feedback_text = Column(Text, nullable=False)
    predicted_category = Column(String(50), nullable=False)
    predict_sentiment = Column(String(75), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())