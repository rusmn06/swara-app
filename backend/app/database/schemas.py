from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func

from app.database.connection import Base


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