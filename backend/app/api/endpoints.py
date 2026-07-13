# FastAPI app main entry point
import joblib
import pandas as pd
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
# Import settings dari config.py
from app.core.config import settings
import ast
from collections import Counter
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import io
import csv
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

router = APIRouter()

# Load model sekali aja pas aplikasi start, biar gak load ulang tiap request
try:
    sentiment_model = joblib.load(settings.SENTIMENT_MODEL_PATH)
    category_model = joblib.load(settings.CATEGORY_MODEL_PATH)
except FileNotFoundError as e:
    sentiment_model = None
    category_model = None
    print(f"[WARNING] Model belum ketemu: {e}")
    
# Load dataset sekali saja saat server start, biar efisien
try:
    df_dataset = pd.read_csv(
        settings.DATASET_PATH,
        sep=";",
        encoding="utf-8-sig"
    )
    print(f"[INFO] Dataset berhasil dimuat: {len(df_dataset)} baris")
except FileNotFoundError as e:
    df_dataset = None
    print(f"[WARNING] Dataset tidak ditemukan: {e}")
    
# Helper: pastikan dataset tersedia
def _get_dataset() -> pd.DataFrame:
    if df_dataset is None:
        raise HTTPException(status_code=500, detail="Dataset tidak ditemukan, cek path-nya.")
    df = df_dataset.copy()

    # Pastikan numeric, tapi TIDAK dihitung ulang -- pakai issue_score asli dari CSV
    df["severity_weight"] = pd.to_numeric(df["severity_weight"], errors="coerce").fillna(0)
    df["issue_score"] = pd.to_numeric(df["issue_score"], errors="coerce").fillna(0)

    return df

class AnalyzeRequest(BaseModel):
    text: str

# Endpoint buat analisis feedback
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

# Endpoint buat evaluasi model (accuracy, classification report, confusion matrix)
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
    
# Mapping kategori dari label lama ke label yang dipakai model
CATEGORY_MAPPING = {
    "technical issues": "Platform & Teknis",
    "platform & teknis": "Platform & Teknis",
    "networking": "Networking & Relasi",
    "networking & relasi": "Networking & Relasi",
    "mentoring": "Mentoring & Pendampingan",
    "mentoring & pendampingan": "Mentoring & Pendampingan",
    "assignment": "Tugas & Beban Kerja",
    "tugas & beban kerja": "Tugas & Beban Kerja",
    "career development": "Pengembangan Karier",
    "pengembangan karier": "Pengembangan Karier",
    "learning materials": "Materi Pembelajaran",
    "materi pembelajaran": "Materi Pembelajaran",
}

df_dataset["category_clean"] = df_dataset["feedback_category"].str.lower().map(CATEGORY_MAPPING).fillna(df_dataset["feedback_category"])

# Endpoint buat evaluasi model sentiment dan category
@router.get("/evaluate/sentiment")
def evaluate_sentiment():
    # 1. Panggil _get_dataset() agar otomatis memori efisien & bebas data sintetis
    df = _get_dataset()
    
    # 2. Amankan dari data kosong (NaN) yang bikin model error
    df_eval = df.dropna(subset=["preprocessed_text", "sentiment"])
    
    return _evaluate_model(sentiment_model, df_eval, text_col="preprocessed_text", label_col="sentiment")

@router.get("/evaluate/category")
def evaluate_category():
    df = _get_dataset()
    df_eval = df.dropna(subset=["preprocessed_text", "feedback_category"])
    
    # 3. Perbaikan kolom label menggunakan "feedback_category"
    return _evaluate_model(category_model, df, text_col="preprocessed_text", label_col="category_clean")

@router.get("/evaluate/all")
def evaluate_all():
    df = _get_dataset()
    
    # Pastikan data yang dievaluasi tidak mengandung NaN di kolom targetnya
    df_eval_sent = df.dropna(subset=["preprocessed_text", "sentiment"])
    df_eval_cat = df.dropna(subset=["preprocessed_text", "feedback_category"])
    
    return {
        "sentiment": _evaluate_model(sentiment_model, df_eval_sent, text_col="preprocessed_text", label_col="sentiment"),
        "category": _evaluate_model(category_model, df_eval_cat, text_col="preprocessed_text", label_col="category_clean"),
    }

# Stat Endpoint buat statistik dataset
# 1. Distribusi Sentimen
@router.get("/stats/sentiment")
def stats_sentiment(start_date: str = None, end_date: str = None, company: str = None, program_batch: str = None):
    df = _get_dataset()
    df = df[df["internship_company"] != "Synthetic Feedback"]

    if company:
        df = df[df["internship_company"].str.lower() == company.lower()]
    if program_batch:
        df = df[df["program_batch"].str.lower() == program_batch.lower()]

    if start_date or end_date:
        df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
        if start_date:
            df = df[df["submission_date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["submission_date"] <= pd.to_datetime(end_date)]

    counts = df["sentiment"].value_counts()
    return {
        "Positif": int(counts.get("Positive", 0)),
        "Negatif": int(counts.get("Negative", 0)),
        "Netral": int(counts.get("Neutral", 0)),
    }

# 2. Distribusi Kategori Isu
@router.get("/stats/category")
def stats_category(program_batch: str = None, company: str = None, start_date: str = None, end_date: str = None):
    df = _get_dataset()

    if program_batch:
        df = df[df["program_batch"].str.lower() == program_batch.lower()]
    if company:
        df = df[df["internship_company"].str.lower() == company.lower()]

    df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
    tanggal_maksimum = df["submission_date"].max()

    if start_date:
        df = df[df["submission_date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["submission_date"] <= pd.to_datetime(end_date)]

    counts = df["feedback_category"].value_counts()
    return {
        "data": [
            {"category": category, "count": int(count)}
            for category, count in counts.items()
        ],
        "latest_date": tanggal_maksimum.strftime("%Y-%m-%d") if pd.notna(tanggal_maksimum) else None,
    }

# 3. Performa Perusahaan Mitra
@router.get("/stats/company")
def stats_company(start_date: str = None, end_date: str = None, program_batch: str = None):
    df = _get_dataset()

    df = df[df["internship_company"] != "Synthetic Feedback"]

    if program_batch:
        df = df[df["program_batch"].str.lower() == program_batch.lower()]

    if start_date or end_date:
        df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
        if start_date:
            df = df[df["submission_date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["submission_date"] <= pd.to_datetime(end_date)]

    result = []
    for company, group in df.groupby("internship_company"):
        total_feedback   = len(group)
        negative_feedback = int((group["sentiment"] == "Negative").sum())
        total_issue_score = round(float(group["issue_score"].sum()), 2)
        dominant_issue   = group["feedback_category"].value_counts().idxmax()

        result.append({
            "company":          company,
            "total_feedback":   total_feedback,
            "negative_feedback": negative_feedback,
            "issue_score":      total_issue_score,
            "dominant_issue":   dominant_issue,
        })

    result.sort(key=lambda x: x["issue_score"], reverse=True)

    return {"data": result}

# 4. Tren Sentimen dari Waktu ke Waktu
@router.get("/stats/trend")
def stats_trend(period: str = "weekly", start_date: str = None, end_date: str = None):
    df = _get_dataset()
    df = df[df["internship_company"] != "Synthetic Feedback"]

    # Konversi kolom tanggal
    df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
    df = df.dropna(subset=["submission_date"])
    tanggal_maksimum = df["submission_date"].max()

    # Filter tanggal kalau ada
    if start_date:
        df = df[df["submission_date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["submission_date"] <= pd.to_datetime(end_date)]

    # Tentukan format grouping berdasarkan period (format lebih ringkas & mudah dibaca)
    if period == "daily":
        df["period_sort"] = df["submission_date"].dt.normalize()
        df["period"] = df["submission_date"].dt.strftime("%d %b")
    elif period == "monthly":
        df["period_sort"] = df["submission_date"].values.astype("datetime64[M]")
        df["period"] = df["submission_date"].dt.strftime("%b %Y")
    else:  # weekly (default)
        awal_minggu = df["submission_date"] - pd.to_timedelta(
            df["submission_date"].dt.weekday, unit="D"
        )
        akhir_minggu = awal_minggu + pd.Timedelta(days=6)
        df["period_sort"] = awal_minggu
        df["period"] = (
            awal_minggu.dt.strftime("%d %b") + " - " + akhir_minggu.dt.strftime("%d %b")
        )

    # Pivot: hitung jumlah tiap sentimen per periode
    grouped = (
        df.groupby(["period_sort", "period", "sentiment"])
        .size()
        .unstack(fill_value=0)
    )

    grouped = grouped.sort_index(level="period_sort")
    grouped = grouped.reset_index(level="period_sort", drop=True)

    # Pastikan ketiga kolom selalu ada walau datanya 0
    for col in ["Positive", "Negative", "Neutral"]:
        if col not in grouped.columns:
            grouped[col] = 0

    result = [
        {
            "date": period,
            "Positif": int(row["Positive"]),
            "Negatif": int(row["Negative"]),
            "Netral": int(row["Neutral"]),
        }
        for period, row in grouped.iterrows()
    ]

    return {
        "data": result,
        "latest_date": tanggal_maksimum.strftime("%Y-%m-%d") if pd.notna(tanggal_maksimum) else None,
    }
    
@router.get("/stats/category-trend")
def stats_category_trend(period: str = "weekly", start_date: str = None, end_date: str = None):
    df = _get_dataset()
    df = df[df["internship_company"] != "Synthetic Feedback"]

    df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
    df = df.dropna(subset=["submission_date"])

    if start_date:
        df = df[df["submission_date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["submission_date"] <= pd.to_datetime(end_date)]

    if period == "daily":
        df["period_sort"] = df["submission_date"].dt.normalize()
        df["period"] = df["submission_date"].dt.strftime("%d %b")
    elif period == "monthly":
        df["period_sort"] = df["submission_date"].values.astype("datetime64[M]")
        df["period"] = df["submission_date"].dt.strftime("%b %Y")
    else:  # weekly
        awal_minggu = df["submission_date"] - pd.to_timedelta(df["submission_date"].dt.weekday, unit="D")
        akhir_minggu = awal_minggu + pd.Timedelta(days=6)
        df["period_sort"] = awal_minggu
        df["period"] = awal_minggu.dt.strftime("%d %b") + " - " + akhir_minggu.dt.strftime("%d %b")

    # Pivot: hitung jumlah tiap kategori per periode (dinamis, bukan kolom tetap)
    grouped = (
        df.groupby(["period_sort", "period", "feedback_category"])
        .size()
        .unstack(fill_value=0)
    )

    grouped = grouped.sort_index(level="period_sort")
    grouped = grouped.reset_index(level="period_sort", drop=True)

    daftar_kategori = sorted(df["feedback_category"].dropna().unique().tolist())

    result = [
        {
            "date": period_label,
            **{kategori: int(row.get(kategori, 0)) for kategori in daftar_kategori},
        }
        for period_label, row in grouped.iterrows()
    ]

    return {"data": result, "categories": daftar_kategori}

@router.get("/stats/issue-trend")
def stats_issue_trend(company: str = None, period: str = "monthly", start_date: str = None, end_date: str = None):
    df = _get_dataset()
    df = df[df["internship_company"] != "Synthetic Feedback"]

    if company:
        df = df[df["internship_company"].str.lower() == company.lower()]

    df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
    df = df.dropna(subset=["submission_date"])
    tanggal_maksimum = df["submission_date"].max()

    if start_date:
        df = df[df["submission_date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["submission_date"] <= pd.to_datetime(end_date)]

    if period == "daily":
        df["period_sort"] = df["submission_date"].dt.normalize()
        df["period"] = df["submission_date"].dt.strftime("%d %b")
    elif period == "weekly":
        awal_minggu = df["submission_date"] - pd.to_timedelta(df["submission_date"].dt.weekday, unit="D")
        akhir_minggu = awal_minggu + pd.Timedelta(days=6)
        df["period_sort"] = awal_minggu
        df["period"] = awal_minggu.dt.strftime("%d %b") + " - " + akhir_minggu.dt.strftime("%d %b")
    else:  # monthly (default)
        df["period_sort"] = df["submission_date"].values.astype("datetime64[M]")
        df["period"] = df["submission_date"].dt.strftime("%b %Y")

    grouped = df.groupby(["period_sort", "period"]).agg(
        total_feedback=("feedback_id", "count"),
        sum_issue_score=("issue_score", "sum"),
    ).reset_index()
    grouped = grouped.sort_values("period_sort")

    result = [
        {
            "date": row["period"],
            "avg_issue_score": round(row["sum_issue_score"] / row["total_feedback"], 3) if row["total_feedback"] > 0 else 0,
        }
        for _, row in grouped.iterrows()
    ]

    return {
        "data": result,
        "latest_date": tanggal_maksimum.strftime("%Y-%m-%d") if pd.notna(tanggal_maksimum) else None,
    }

# 5. Leaderboard Perusahaan Mitra
@router.get("/stats/leaderboard")
def stats_leaderboard(
    limit: int = 10,
    company: str = None,
    category: str = None,
    start_date: str = None,
    end_date: str = None,
    program_batch: str = None,
):
    df = _get_dataset()
    df = df[df["internship_company"] != "Synthetic Feedback"]

    if company:
        df = df[df["internship_company"].str.lower() == company.lower()]
    if category:
        df = df[df["feedback_category"].str.lower() == category.lower()]
    if program_batch:
        df = df[df["program_batch"].str.lower() == program_batch.lower()]

    if start_date or end_date:
        df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
        if start_date:
            df = df[df["submission_date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["submission_date"] <= pd.to_datetime(end_date)]

    result = []
    for company, group in df.groupby("internship_company"):
        total_feedback    = len(group)
        negative_feedback = int((group["sentiment"] == "Negative").sum())
        total_issue_score = round(float(group["issue_score"].sum()), 2)
        dominant_issue    = group["feedback_category"].value_counts().idxmax()

        result.append({
            "company":           company,
            "total_feedback":    total_feedback,
            "negative_feedback": negative_feedback,
            "issue_score":       total_issue_score,
            "dominant_issue":    dominant_issue,
        })

    # Urutkan by issue_score tertinggi, ambil sejumlah limit
    result.sort(key=lambda x: x["issue_score"], reverse=True)
    result = result[:limit]

    # Tambahkan rank setelah sorting
    for i, item in enumerate(result, start=1):
        item["rank"] = i

    return {"data": result}

# 6. Distribusi Akar Masalah
@router.get("/stats/root-cause")
def stats_root_cause(company: str = None, start_date: str = None, end_date: str = None, program_batch: str = None, last_days: int = None):
    df = _get_dataset()

    df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
    tanggal_maksimum = df["submission_date"].max()

    if last_days:
        batas_awal = tanggal_maksimum - pd.Timedelta(days=last_days - 1)
        df = df[df["submission_date"] >= batas_awal]

    if company:
        df = df[df["internship_company"].str.lower() == company.lower()]
    if program_batch:
        df = df[df["program_batch"].str.lower() == program_batch.lower()]

    if start_date:
        df = df[df["submission_date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["submission_date"] <= pd.to_datetime(end_date)]

    df = df[df["root_cause"].notna()]
    df = df[df["root_cause"] != "Tidak Relevan"]
    df = df[df["root_cause"] != "Lainnya"]

    counts = df["root_cause"].value_counts()

    return {
        "data": [
            {"root_cause": root_cause, "count": int(count)}
            for root_cause, count in counts.items()
        ],
        "latest_date": tanggal_maksimum.strftime("%Y-%m-%d") if pd.notna(tanggal_maksimum) else None,
    }
    
# 7. Daftar Feedback Individual (untuk Live Triage Alerts, dkk)
@router.get("/feedback")
def get_feedback_list(
    limit: int = 20,
    page: int = 1,
    sentiment: str = None,
    category: str = None,
    company: str = None,
    start_date: str = None,
    end_date: str = None,
    severity_weight: int = None,
    keyword: str = None,
):
    df = _get_dataset()

    # Buang data sintetis/augmentasi, cuma tampilkan feedback asli
    df = df[df["internship_company"] != "Synthetic Feedback"]

    # Pastikan submission_date jadi datetime biar bisa diurutkan
    df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")

    # Filter opsional
    if sentiment:
        df = df[df["sentiment"].str.lower() == sentiment.lower()]
    if category:
        df = df[df["feedback_category"].str.lower() == category.lower()]
    if company:
        df = df[df["internship_company"].str.lower() == company.lower()]
    if start_date:
        df = df[df["submission_date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["submission_date"] <= pd.to_datetime(end_date)]
    if severity_weight is not None:
        df = df[df["severity_weight"] == severity_weight]
    if keyword:
        df = df[df["feedback_text"].str.contains(keyword, case=False, na=False)]
        
    # Urutkan dari yang paling baru
    df = df.sort_values("submission_date", ascending=False)

    total = len(df)

    # Pagination sederhana
    start = (page - 1) * limit
    end = start + limit
    df = df.iloc[start:end]

    # Kolom yang relevan aja buat dashboard (skip kolom internal NLP)
    kolom_dipakai = [
        "feedback_id",
        "participant_id",
        "internship_company",
        "submission_date",
        "feedback_text",
        "feedback_category",
        "sentiment",
        "root_cause",
        "issue_score",
        "program_batch",
    ]
    df = df[kolom_dipakai]

    # Rapikan format tanggal jadi "2026-06-23" saja
    df["submission_date"] = df["submission_date"].dt.strftime("%Y-%m-%d")

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": df.to_dict(orient="records")
    }
    
@router.get("/feedback/datatable")
def feedback_datatable(request: Request):
    df = _get_dataset()
    params = request.query_params

    draw = int(params.get("draw", 1))
    start = int(params.get("start", 0))
    length = int(params.get("length", 10))
    search_value = params.get("search[value]", "").strip()

    category = params.get("category", "").strip()
    root_cause = params.get("root_cause", "").strip()
    severity_weight = params.get("severity_weight", "").strip()
    start_date = params.get("start_date", "").strip()
    end_date = params.get("end_date", "").strip()
    program_batch = params.get("program_batch", "").strip()

    records_total = len(df)
    filtered = df.copy()

    # Parse tanggal ke datetime asli, dipakai buat filter DAN sort (bukan string)
    filtered["submission_date_parsed"] = pd.to_datetime(
        filtered["submission_date"], format="%d/%m/%Y", errors="coerce"
    )

    if category:
        filtered = filtered[filtered["feedback_category"] == category]
    if root_cause:
        filtered = filtered[filtered["root_cause"] == root_cause]
    if severity_weight:
        filtered = filtered[filtered["severity_weight"] == int(severity_weight)]

    if start_date:
        filtered = filtered[filtered["submission_date_parsed"] >= pd.to_datetime(start_date)]
    if end_date:
        filtered = filtered[filtered["submission_date_parsed"] <= pd.to_datetime(end_date)]

    if search_value:
        filtered = filtered[
            filtered["feedback_text"].astype(str).str.contains(search_value, case=False, na=False)
            | filtered["internship_company"].astype(str).str.contains(search_value, case=False, na=False)
        ]
        
    if program_batch:
        filtered = filtered[filtered["program_batch"].str.lower() == program_batch.lower()]

    records_filtered = len(filtered)

    # Whitelist kolom yang boleh di-sort, dikirim LANGSUNG oleh frontend (bukan index-based mapping)
    KOLOM_DIIZINKAN = {
        "submission_date", "internship_company", "feedback_text",
        "feedback_category", "root_cause", "severity_weight", "sentiment",
    }
    order_column = params.get("order_column", "submission_date")
    order_dir = params.get("order[0][dir]", "desc")

    if order_column not in KOLOM_DIIZINKAN:
        order_column = "submission_date"

    # Sort tanggal pakai kolom yang udah di-parse jadi datetime asli, bukan string
    sort_col = "submission_date_parsed" if order_column == "submission_date" else order_column

    if order_column == "sentiment":
    # Urutan custom: Positive > Neutral > Negative, bukan alfabet
        urutan_sentiment = ["Positive", "Neutral", "Negative"]
        filtered["sentiment_sort"] = pd.Categorical(
        filtered["sentiment"], categories=urutan_sentiment, ordered=True
        )
        sort_col = "sentiment_sort"

    filtered = filtered.sort_values(sort_col, ascending=(order_dir == "asc"))

    page_data = filtered.iloc[start : start + length]

    data = [
        {
            "submission_date": row["submission_date"],
            "internship_company": row["internship_company"],
            "feedback_text": row["feedback_text"],
            "feedback_category": row["feedback_category"],
            "root_cause": row["root_cause"],
            "severity_weight": int(row["severity_weight"]),
            "sentiment": row["sentiment"],
        }
        for _, row in page_data.iterrows()
    ]

    return {
        "draw": draw,
        "recordsTotal": records_total,
        "recordsFiltered": records_filtered,
        "data": data,
    }
    
# 8. Trending Issues (Early Warning) - deteksi lonjakan kategori antar minggu
@router.get("/stats/trending-issues")
def stats_trending_issues(threshold_persen: float = 15.0):
    df = _get_dataset()

    # Buang baris yang week_number-nya kosong
    df = df.dropna(subset=["week_number"])

    # Tentukan minggu terakhir dan minggu sebelumnya
    minggu_terakhir = df["week_number"].max()
    minggu_sebelumnya = minggu_terakhir - 1

    # Pisahkan data per periode
    data_sekarang = df[df["week_number"] == minggu_terakhir]
    data_lalu = df[df["week_number"] == minggu_sebelumnya]

    # Hitung jumlah feedback per kategori di masing-masing periode
    hitung_sekarang = data_sekarang["feedback_category"].value_counts()
    hitung_lalu = data_lalu["feedback_category"].value_counts()

    # Gabungkan semua kategori yang muncul di salah satu periode
    semua_kategori = set(hitung_sekarang.index) | set(hitung_lalu.index)

    hasil = []
    for kategori in semua_kategori:
        jumlah_sekarang = int(hitung_sekarang.get(kategori, 0))
        jumlah_lalu = int(hitung_lalu.get(kategori, 0))

        # Hitung persentase perubahan (hati-hati kalau jumlah_lalu = 0)
        if jumlah_lalu == 0:
            persen_perubahan = 100.0 if jumlah_sekarang > 0 else 0.0
        else:
            persen_perubahan = round(
                ((jumlah_sekarang - jumlah_lalu) / jumlah_lalu) * 100, 1
            )

        hasil.append({
            "category": kategori,
            "jumlah_minggu_ini": jumlah_sekarang,
            "jumlah_minggu_lalu": jumlah_lalu,
            "persen_perubahan": persen_perubahan,
            "is_trending": persen_perubahan >= threshold_persen,
        })

    # Urutkan dari kenaikan paling tinggi
    hasil.sort(key=lambda x: x["persen_perubahan"], reverse=True)

    return {
        "minggu_terakhir": minggu_terakhir,
        "minggu_sebelumnya": minggu_sebelumnya,
        "threshold_persen": threshold_persen,
        "data": hasil,
    }
    
# Daftar kata umum yang mau disaring dari hasil trending keywords
STOPWORDS_TAMBAHAN = {
    "sekali", "sangat", "tidak", "sama", "sebuah", "yang", "dan", "atau",
    "ini", "itu", "ada", "juga", "masih", "sudah", "bisa", "akan",
    "saya", "kami", "kita", "nya", "dengan", "untuk", "dari", "pada",
    "program", "magang", "maganghub",
    "baik", "cukup", "aku", "lebih", "oke", "membantu", "waktu",
    "sering", "banyak", "benar", "banget", "kadang", "kurang",
}

@router.get("/stats/trending-keywords")
def stats_trending_keywords(limit: int = 20, program_batch: str = None):
    df = _get_dataset()

    df = df[df["internship_company"] != "Synthetic Feedback"]

    if program_batch:
        df = df[df["program_batch"].str.lower() == program_batch.lower()]

    counter = Counter()

    for tokens_str in df["tokens_clean"].dropna():
        try:
            tokens = ast.literal_eval(tokens_str)
            tokens_bersih = [t for t in tokens if t.lower() not in STOPWORDS_TAMBAHAN]
            counter.update(tokens_bersih)
        except (ValueError, SyntaxError):
            continue

    top_words = counter.most_common(limit)

    return {
        "data": [{"keyword": word, "count": count} for word, count in top_words]
    }

def _siapkan_data_export(program_batch: str = None):
    df = _get_dataset()
    if program_batch:
        df = df[df["program_batch"].str.lower() == program_batch.lower()]

    kolom_export = [
        "feedback_id", "submission_date", "internship_company", "program_batch",
        "feedback_text", "feedback_category", "root_cause", "severity_weight",
        "sentiment", "issue_score",
    ]
    return df[kolom_export]


@router.get("/feedback/export/csv")
def feedback_export_csv(program_batch: str = None):
    df_export = _siapkan_data_export(program_batch)

    buffer = io.StringIO()
    df_export.to_csv(buffer, index=False, quoting=csv.QUOTE_ALL)
    csv_bytes = buffer.getvalue().encode("utf-8-sig")

    nama_file = f"swara_report_{program_batch or 'all_batch'}.csv".replace(" ", "_")

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={nama_file}"},
    )


@router.get("/feedback/export/pdf")
def feedback_export_pdf(program_batch: str = None):
    df_export = _siapkan_data_export(program_batch)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=15 * mm, bottomMargin=15 * mm)
    styles = getSampleStyleSheet()
    style_sel = styles["BodyText"]
    style_sel.fontSize = 7
    style_sel.leading = 9

    header = ["Date", "Partner", "Feedback", "Category", "Root Cause", "Severity", "Sentiment"]
    data_rows = [header]

    for _, row in df_export.iterrows():
        data_rows.append([
            str(row["submission_date"]),
            str(row["internship_company"]),
            Paragraph(str(row["feedback_text"]), style_sel),
            str(row["feedback_category"]),
            str(row["root_cause"]),
            str(row["severity_weight"]),
            str(row["sentiment"]),
        ])

    tabel = Table(data_rows, colWidths=[45*mm, 35*mm, 110*mm, 40*mm, 35*mm, 25*mm, 30*mm], repeatRows=1)
    tabel.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5B2EFF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTSIZE", (0, 1), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]))

    doc.build([tabel])
    buffer.seek(0)

    nama_file = f"swara_report_{program_batch or 'all_batch'}.pdf".replace(" ", "_")

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={nama_file}"},
    )
    
def _siapkan_summary_report(program_batch: str = None):
    df = _get_dataset()
    if program_batch:
        df = df[df["program_batch"].str.lower() == program_batch.lower()]

    total_feedback = len(df)
    positif = int((df["sentiment"] == "Positive").sum())
    netral = int((df["sentiment"] == "Neutral").sum())
    negatif = int((df["sentiment"] == "Negative").sum())

    kategori_counts = df["feedback_category"].value_counts()
    kategori_data = [
        {"category": k, "count": int(v), "percent": round(v / total_feedback * 100, 1) if total_feedback else 0}
        for k, v in kategori_counts.items()
    ]

    df_root_cause = df[df["root_cause"].notna() & ~df["root_cause"].isin(["Tidak Relevan", "Lainnya"])]
    top_issues = df_root_cause["root_cause"].value_counts().head(5)
    top_issues_data = [{"root_cause": k, "count": int(v)} for k, v in top_issues.items()]

    df_partner = df[df["internship_company"] != "Synthetic Feedback"]
    partner_data = []
    for company, group in df_partner.groupby("internship_company"):
        total_p = len(group)
        neg_p = int((group["sentiment"] == "Negative").sum())
        partner_data.append({
            "company": company,
            "negative_percent": round(neg_p / total_p * 100, 1) if total_p else 0,
        })

    return {
        "total_feedback": total_feedback,
        "positive_percent": round(positif / total_feedback * 100, 1) if total_feedback else 0,
        "neutral_percent": round(netral / total_feedback * 100, 1) if total_feedback else 0,
        "negative_percent": round(negatif / total_feedback * 100, 1) if total_feedback else 0,
        "category_breakdown": kategori_data,
        "top_issues": top_issues_data,
        "partner_breakdown": partner_data,
    }


@router.get("/report/summary/export/csv")
def report_summary_export_csv(program_batch: str = None):
    summary = _siapkan_summary_report(program_batch)

    buffer = io.StringIO()
    writer = csv.writer(buffer, quoting=csv.QUOTE_ALL)

    writer.writerow(["Swara Program Report"])
    writer.writerow(["Batch", program_batch or "All Batches"])
    writer.writerow([])

    writer.writerow(["Summary"])
    writer.writerow(["Total Feedback", summary["total_feedback"]])
    writer.writerow(["Positive Sentiment (%)", summary["positive_percent"]])
    writer.writerow(["Neutral Sentiment (%)", summary["neutral_percent"]])
    writer.writerow(["Negative Sentiment (%)", summary["negative_percent"]])
    writer.writerow([])

    writer.writerow(["Feedback Category Distribution"])
    writer.writerow(["Category", "Count", "Percent (%)"])
    for item in summary["category_breakdown"]:
        writer.writerow([item["category"], item["count"], item["percent"]])
    writer.writerow([])

    writer.writerow(["Top Trending Topics"])
    writer.writerow(["Root Cause", "Count"])
    for item in summary["top_issues"]:
        writer.writerow([item["root_cause"], item["count"]])
    writer.writerow([])

    writer.writerow(["Negative Sentiment by Partner"])
    writer.writerow(["Partner", "Negative (%)"])
    for item in summary["partner_breakdown"]:
        writer.writerow([item["company"], item["negative_percent"]])

    csv_bytes = buffer.getvalue().encode("utf-8-sig")
    nama_file = f"swara_summary_{program_batch or 'all_batch'}.csv".replace(" ", "_")

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={nama_file}"},
    )


@router.get("/report/summary/export/pdf")
def report_summary_export_pdf(program_batch: str = None):
    summary = _siapkan_summary_report(program_batch)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=15 * mm, bottomMargin=15 * mm)
    styles = getSampleStyleSheet()
    elemen = []

    elemen.append(Paragraph("Swara Program Report", styles["Title"]))
    elemen.append(Paragraph(f"Batch: {program_batch or 'All Batches'}", styles["Normal"]))
    elemen.append(Spacer(1, 10 * mm))

    ringkasan_data = [
        ["Total Feedback", str(summary["total_feedback"])],
        ["Positive Sentiment", f"{summary['positive_percent']}%"],
        ["Neutral Sentiment", f"{summary['neutral_percent']}%"],
        ["Negative Sentiment", f"{summary['negative_percent']}%"],
    ]
    tabel_ringkasan = Table(ringkasan_data, colWidths=[80 * mm, 60 * mm])
    tabel_ringkasan.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    elemen.append(tabel_ringkasan)
    elemen.append(Spacer(1, 10 * mm))

    elemen.append(Paragraph("Feedback Category Distribution", styles["Heading2"]))
    kategori_rows = [["Category", "Count", "Percent"]] + [
        [item["category"], str(item["count"]), f"{item['percent']}%"] for item in summary["category_breakdown"]
    ]
    tabel_kategori = Table(kategori_rows, colWidths=[80 * mm, 30 * mm, 30 * mm])
    tabel_kategori.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5B2EFF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]))
    elemen.append(tabel_kategori)
    elemen.append(Spacer(1, 10 * mm))

    elemen.append(Paragraph("Top Trending Topics", styles["Heading2"]))
    issue_rows = [["Root Cause", "Count"]] + [
        [item["root_cause"], str(item["count"])] for item in summary["top_issues"]
    ]
    tabel_issue = Table(issue_rows, colWidths=[80 * mm, 30 * mm])
    tabel_issue.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5B2EFF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]))
    elemen.append(tabel_issue)
    elemen.append(Spacer(1, 10 * mm))

    elemen.append(Paragraph("Negative Sentiment by Partner", styles["Heading2"]))
    partner_rows = [["Partner", "Negative (%)"]] + [
        [item["company"], f"{item['negative_percent']}%"] for item in summary["partner_breakdown"]
    ]
    tabel_partner = Table(partner_rows, colWidths=[80 * mm, 30 * mm])
    tabel_partner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5B2EFF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]))
    elemen.append(tabel_partner)

    doc.build(elemen)
    buffer.seek(0)

    nama_file = f"swara_summary_{program_batch or 'all_batch'}.pdf".replace(" ", "_")

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={nama_file}"},
    )
    
@router.get("/feedback/export/json")
def feedback_export_json(program_batch: str = None):
    df_export = _siapkan_data_export(program_batch)
    df_export = df_export.fillna("")
    return {"data": df_export.to_dict(orient="records")}


@router.get("/report/summary")
def report_summary(program_batch: str = None):
    return _siapkan_summary_report(program_batch)
    
# Daftar program_batch yang tersedia, buat dropdown filter
@router.get("/stats/batches")
def stats_batches():
    df = _get_dataset()
    batches = sorted(df["program_batch"].dropna().unique().tolist())
    return {"data": batches}

@router.get("/stats/executive-kpi")
def stats_executive_kpi():
    df = _get_dataset()
    df = df[df["internship_company"] != "Synthetic Feedback"]

    total_feedback = len(df)
    positif = int((df["sentiment"] == "Positive").sum())
    positive_percent = round(positif / total_feedback * 100, 1) if total_feedback else 0

    weeks_running = int(df["week_number"].dropna().max()) if df["week_number"].notna().any() else 0

    partner_stats = []
    for company, group in df.groupby("internship_company"):
        total_p = len(group)
        avg_issue = group["issue_score"].sum() / total_p if total_p else 0
        partner_stats.append(avg_issue)

    critical_partners_count = sum(1 for avg in partner_stats if avg >= 4)

    return {
        "total_feedback": total_feedback,
        "positive_percent": positive_percent,
        "critical_partners_count": critical_partners_count,
        "weeks_running": weeks_running,
    }
    
@router.get("/report/executive-summary/export/pdf")
def executive_summary_export_pdf():
    df = _get_dataset()
    df = df[df["internship_company"] != "Synthetic Feedback"]

    total_feedback = len(df)
    positif = int((df["sentiment"] == "Positive").sum())
    negatif = int((df["sentiment"] == "Negative").sum())
    netral = int((df["sentiment"] == "Neutral").sum())

    df_root_cause = df[df["root_cause"].notna() & ~df["root_cause"].isin(["Tidak Relevan", "Lainnya"])]
    top_issues = df_root_cause["root_cause"].value_counts().head(5)

    partner_rows = []
    for company, group in df.groupby("internship_company"):
        total_p = len(group)
        avg_issue = group["issue_score"].sum() / total_p if total_p else 0
        label = "Critical" if avg_issue >= 4 else "High" if avg_issue >= 2 else "Medium" if avg_issue >= 1 else "Low"
        partner_rows.append((company, label))

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    elemen = []

    elemen.append(Paragraph("Swara — Executive Program Summary", styles["Title"]))
    elemen.append(Paragraph(f"Generated: {pd.Timestamp.now().strftime('%d %B %Y')}", styles["Normal"]))
    elemen.append(Spacer(1, 8 * mm))

    kpi_rows = [
        ["Total Feedback", str(total_feedback)],
        ["Positive Sentiment", f"{round(positif/total_feedback*100,1) if total_feedback else 0}%"],
        ["Negative Sentiment", f"{round(negatif/total_feedback*100,1) if total_feedback else 0}%"],
        ["Neutral Sentiment", f"{round(netral/total_feedback*100,1) if total_feedback else 0}%"],
    ]
    tabel_kpi = Table(kpi_rows, colWidths=[90 * mm, 60 * mm])
    tabel_kpi.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elemen.append(tabel_kpi)
    elemen.append(Spacer(1, 10 * mm))

    elemen.append(Paragraph("Top Issues This Period", styles["Heading2"]))
    issue_rows = [["Root Cause", "Cases"]] + [[k, str(v)] for k, v in top_issues.items()]
    tabel_issue = Table(issue_rows, colWidths=[90 * mm, 40 * mm])
    tabel_issue.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5B2EFF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]))
    elemen.append(tabel_issue)
    elemen.append(Spacer(1, 10 * mm))

    elemen.append(Paragraph("Partner Health Status", styles["Heading2"]))
    warna_label = {"Critical": "#FEF2F2", "High": "#FFF7ED", "Medium": "#FEFCE8", "Low": "#ECFDF5"}
    partner_table_rows = [["Partner", "Status"]] + partner_rows
    tabel_partner = Table(partner_table_rows, colWidths=[90 * mm, 40 * mm])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5B2EFF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]
    for i, (_, label) in enumerate(partner_rows, start=1):
        style_cmds.append(("BACKGROUND", (1, i), (1, i), colors.HexColor(warna_label[label])))
    tabel_partner.setStyle(TableStyle(style_cmds))
    elemen.append(tabel_partner)

    doc.build(elemen)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=swara_executive_summary.pdf"},
    )



# DEBUG SEMENTARA - hapus setelah selesai cek
# @router.get("/debug/date")
# def debug_date():
#     df = _get_dataset()
#     sample = df["submission_date"].head(10).tolist()
#     total = len(df)
#     after_parse = pd.to_datetime(df["submission_date"], errors="coerce").notna().sum()
#     return {
#         "sample_values": sample,
#         "total_rows": total,
#         "berhasil_di_parse": int(after_parse),
#     }

# DEBUG SEMENTARA v2
# @router.get("/debug/trend")
# def debug_trend():
#     df = _get_dataset()
    
#     # Cek sebelum parse
#     print("Sebelum parse:", df["submission_date"].dtype)
    
#     df["submission_date"] = pd.to_datetime(df["submission_date"], errors="coerce")
#     df = df.dropna(subset=["submission_date"])
    
#     print("Setelah dropna:", len(df), "baris")
    
#     # Cek kolom sentiment nilainya apa saja
#     print("Nilai unik sentiment:", df["sentiment"].unique().tolist())
    
#     df["period"] = df["submission_date"].dt.to_period("W").astype(str)
    
#     grouped = df.groupby(["period", "sentiment"]).size().unstack(fill_value=0)
    
#     return {
#         "jumlah_setelah_dropna": len(df),
#         "sample_period": df["period"].head(5).tolist(),
#         "sentiment_unique": df["sentiment"].unique().tolist(),
#         "grouped_columns": grouped.columns.tolist(),
#         "grouped_head": grouped.head(3).to_dict(),
#     }

@router.get("/debug/avg-issue-score")
def debug_avg_issue_score():
    df = _get_dataset()
    grouped = df.groupby("internship_company").agg(
        total_feedback=("feedback_id", "count"),
        sum_issue_score=("issue_score", "sum"),
    ).reset_index()

    grouped["avg_issue_score"] = round(grouped["sum_issue_score"] / grouped["total_feedback"], 4)
    grouped = grouped.sort_values("avg_issue_score", ascending=False)

    return grouped.to_dict(orient="records")

