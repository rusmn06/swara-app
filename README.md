# Swara — Feedback Analytics Dashboard for MagangHub

Swara is an internal analytics dashboard that turns raw internship participant feedback (questionnaire responses) into structured, actionable insight for MagangHub's management team. It gives real-time visibility into participant sentiment, the kinds of issues participants are running into, and how each partner company is performing over time.

## What it does

- **Overview Dashboard** — a home screen summarizing overall sentiment trend, negative-sentiment share by partner, a partner leaderboard, and trending topics.
- **Sentiment Monitoring** — tracks the Positive / Negative / Neutral split of feedback over time and by filters.
- **Feedback Category** — breaks feedback down by category (e.g. Platform & Technical, Administration & Benefits, Program Policy, Mentoring, Communication, Other).
- **Root Cause Analysis** — surfaces the specific underlying causes behind negative feedback (e.g. UI/UX, Attendance, Login, Report Upload, System Bugs).
- **Trending Participant Issues** — compares this week vs. last week by category to flag issues that are spiking.
- **Partner (Mitra) Performance Monitoring** — compares partner companies (Halodoc, Ajaib, DANA, IndoDana, Traveloka) on issue volume and severity.
- **Program Report** — reporting view for a given program batch.
- **Executive Overview** — a read-only, filter-free summary page built specifically for management, showing all-time aggregated KPIs, trend, top topics, and partner health, with local notes and PDF export.

Under the hood, feedback text has already been processed and scored by a machine learning pipeline (sentiment classification, category classification, and an engineered `issue_score` that combines category severity with negative sentiment), so the dashboard is working with clean, structured data rather than raw text.

## Tech stack

**Frontend**
- React + TypeScript + Vite
- TailAdmin (dashboard template) + Tailwind CSS v4
- ApexCharts (charts) and DataTables.net (large tables, server-side processing)
- ExcelJS for client-side Excel export

**Backend**
- FastAPI (Python) + Pandas for data processing
- MySQL for storage (via SQLAlchemy)
- ReportLab for server-side PDF export

**Planned deployment:** AWS Free Tier — S3 (frontend), EC2 (backend), RDS (database)

## Prerequisites

- Node.js (LTS) and npm/yarn
- Python 3.10+ and pip
- MySQL server — locally this project uses **Laragon** on Windows
- The processed dataset file and trained model files (`.pkl`) from the ML team

## Getting started

### 1. Set up the database

1. Start MySQL (e.g. via Laragon).
2. Create the database and tables using the SQL script provided by the backend team (`code.txt` / database design doc), which sets up `maganghub_db` with the `feedbacks` table (and `users`, `companies`, `participants` if in use).

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # on Windows
pip install -r requirements.txt
```

Create a `.env` file inside `backend/` with your local MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=maganghub_db
JWT_SECRET_KEY=
```

`JWT_SECRET_KEY` is the secret used to sign authentication tokens. Generate a random value for it — don't leave it blank or use a guessable string. Pick one of these:

```bash
# Option 1: Python (works anywhere Python is installed)
python -c "import secrets; print(secrets.token_hex(32))"

# Option 2: OpenSSL
openssl rand -hex 32
```

Copy the output into `JWT_SECRET_KEY` in `.env`. Use a different value for each environment (local, staging, production), and never commit `.env` to version control (it's already covered by `.gitignore`).

Make sure the model files and dataset CSV are placed in `backend/app/models/` (paths are configured in `app/core/config.py`).

Run the API:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`, with all analytics endpoints under `http://127.0.0.1:8000/api`. Interactive API docs are available at `http://127.0.0.1:8000/docs`.

### 3. Seed initial user accounts

Since there's no user registration UI, initial accounts are created via a seed script. Define the accounts to be created, for example:

```python
USERS_TO_SEED = [
    {
        "username": "admin",
        "password": "swara2026",
        "display_name": "Admin Swara",
        "role": "admin",
    },
    {
        "username": "manajer",
        "password": "swara2026",
        "display_name": "Executive",
        "role": "manajerial",
    },
]
```

Run the seed script once against your local database (from `backend/`, with the virtual environment active):

```bash
python -m app.database.seed_users
```

This will hash each password before storing it and insert the accounts into the `users` table. Notes:

- Change the placeholder passwords above before running this against anything beyond local development — never seed production with default passwords.
- Re-running the seed script should not create duplicate accounts if a username already exists; adjust the script to skip or update existing usernames.
- `role` here distinguishes an `admin` (full dashboard access) from `manajerial` (Executive Overview-only access) — make sure this matches whatever roles the auth/authorization logic actually checks for.

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

By default the frontend expects the backend at `http://127.0.0.1:8000/api` — check your `.env` / config file in the frontend project if you need to point it elsewhere.

Open the app at the local Vite dev URL shown in the terminal (typically `http://localhost:5173`).

## Key API endpoints

All endpoints are served under `/api` and read from the processed dataset (partner records tagged "Synthetic Feedback" and root causes tagged "Not Relevant" / "Other" are excluded from analytics):

| Endpoint | Purpose |
|---|---|
| `GET /stats/sentiment` | Sentiment distribution (filters: date range, company, program batch) |
| `GET /stats/category` | Feedback count by category (filter: program batch) |
| `GET /stats/company` | Per-partner performance summary (filters: date range) |
| `GET /stats/trend` | Sentiment over time — daily/weekly/monthly (filters: period, date range) |
| `GET /stats/leaderboard` | Partner ranking by issue score (filters: limit, company, category, date range, batch) |
| `GET /stats/root-cause` | Root cause distribution (filters: company, date range, batch) |
| `GET /stats/trending-issues` | Current vs. previous week issue trend by category |
| `GET /stats/trending-keywords` | Trending keywords/topics from feedback text |
| `GET /feedback` | Paginated raw feedback list with filters |

## Notes on data & scope

- The single source of truth for all dashboard analytics is the processed dataset produced by the ML team (feature-engineered CSV with sentiment, category, root cause, and issue score already computed). A separate, larger dataset used for model training is not used by the dashboard.
- Login/authentication is not yet implemented in the current build — it's planned as a separate feature.
- The Executive Overview page is intentionally static: no filters, date pickers, or grouping controls, since it's meant as a fixed, always-current summary for management.

## Project status

Seven core dashboard pages plus the Executive Overview summary page are built and functional against a stable set of backend endpoints. Remaining work includes authentication, cloud deployment to AWS, and resolving a scikit-learn version mismatch warning between the training and serving environments.