import joblib
import pandas as pd
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from app.core.config import settings

router = APIRouter()

# Load model sekali aja pas aplikasi start, biar gak load ulang tiap request
try:
    sentiment_model = joblib.load(settings.SENTIMENT_MODEL_PATH)
    category_model = joblib.load(settings.CATEGORY_MODEL_PATH)
except FileNotFoundError as e:
    sentiment_model = None
    category_model = None
    print(f"[WARNING] Model belum ketemu: {e}")


class AnalyzeRequest(BaseModel):
    text: str


@router.post("/analyze")
def analyze_feedback(payload: AnalyzeRequest):
    if sentiment_model is None or category_model is None:
        raise HTTPException(status_code=500, detail="Model belum berhasil di-load, cek path-nya.")

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Teks feedback tidak boleh kosong.")

    category = category_model.predict([text])[0]
    sentiment = sentiment_model.predict([text])[0]

    return {
        "status": "success",
        "text": text,
        "category": category,
        "sentiment": sentiment,
    }


def _evaluate_model(model, df: pd.DataFrame, text_col: str, label_col: str) -> dict:
    if model is None:
        raise HTTPException(status_code=500, detail="Model belum berhasil di-load, cek path-nya.")

    data = df.dropna(subset=[text_col, label_col])
    X = data[text_col].astype(str)
    y_true = data[label_col].astype(str)

    y_pred = model.predict(X)
    labels = sorted(y_true.unique().tolist())

    return {
        "total_data": len(data),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "classification_report": classification_report(
            y_true, y_pred, output_dict=True, zero_division=0
        ),
        "confusion_matrix": {
            "labels": labels,
            "matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
        },
    }


@router.get("/evaluate/sentiment")
def evaluate_sentiment():
    df = pd.read_csv(settings.DATASET_PATH)
    return _evaluate_model(sentiment_model, df, text_col="model_text", label_col="sentiment")


@router.get("/evaluate/category")
def evaluate_category():
    df = pd.read_csv(settings.DATASET_PATH)
    return _evaluate_model(category_model, df, text_col="model_text", label_col="feedback_category")


@router.get("/evaluate/all")
def evaluate_all():
    df = pd.read_csv(settings.DATASET_PATH)
    return {
        "sentiment": _evaluate_model(sentiment_model, df, text_col="model_text", label_col="sentiment"),
        "category": _evaluate_model(category_model, df, text_col="model_text", label_col="feedback_category"),
    }