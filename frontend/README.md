# ContainArisk - Smart Container Risk Analysis & Trade Intelligence

ContainArisk is an advanced end-to-end platform for detecting high-risk shipping containers using machine learning, AI-powered insights, and real-time trade monitoring.

## 🚀 Overview

The system consists of three main components:
- **Backend**: A high-performance FastAPI server providing machine learning risk predictions, automated report generation, and data management.
- **Frontend**: A sleek, modern Next.js dashboard featuring real-time analytics, interactive global maps, and AI-powered risk explanations.
- **ML Engine**: A scikit-learn based risk prediction model with automated feature engineering.

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, Leaflet, Recharts.
- **Backend**: Python 3.10+, FastAPI, Supabase (PostgreSQL), ReportLab (PDF generation).
- **Machine Learning**: Scikit-Learn, Pandas, NumPy, Joblib.

## 📂 Repository Structure

```text
/backend          # FastAPI backend server
/frontend         # Next.js frontend (production-ready)
/frontend-legacy  # Vite-based frontend (previous version)
/ml               # Machine Learning training scripts and models
/data             # Raw and processed datasets
/docs             # Project documentation (Problem statement, etc.)
README.md         # Main project overview
QUICKSTART.md     # Fast-track setup guide
.env.example      # Environment variables template
.gitignore        # Standardized git ignore rules
```

## 🚥 Getting Started

For detailed setup instructions, please refer to [QUICKSTART.md](./QUICKSTART.md).

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📜 Documentation

- [Problem Statement](./docs/Problem%20Statement%20(2).pdf)
- [Quickstart Guide](./QUICKSTART.md)

## ⚖️ License

MIT License - see [LICENSE](LICENSE) for details.
