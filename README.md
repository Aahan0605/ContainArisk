<div align="center">

# 🚢 CONTAIN'A'RISK

### Smart Container Risk Analysis & Trade Intelligence Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Frontend-2563eb?style=for-the-badge)](https://containarisk.vercel.app)
[![API](https://img.shields.io/badge/⚡_API-Railway-6366f1?style=for-the-badge)](https://containarisk-backend-production-32e3.up.railway.app/docs)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-3b82f6?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)

<br/>

> **AI-powered customs intelligence platform** that predicts container risk, detects trade fraud networks, prioritizes inspections, and explains suspicious shipments — all in real time.

<br/>

![ContainARisk Banner](https://img.shields.io/badge/54%2C000%2B-Containers_Analyzed-ef4444?style=flat-square) &nbsp;
![ML](https://img.shields.io/badge/ML-RandomForest_Model-8b5cf6?style=flat-square) &nbsp;
![Uptime](https://img.shields.io/badge/Status-Live-22c55e?style=flat-square)

</div>

---

## ✨ What is ContainARisk?

ContainARisk is an end-to-end **container risk intelligence platform** built for customs authorities and port security teams. It combines machine learning, real-time analytics, and AI-generated investigation reports to flag high-risk shipments before they clear customs.

```
🔍 Scan Container  →  🤖 ML Risk Score  →  📊 Intelligence Dashboard  →  📄 PDF Report
```

---

## 🖥️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CONTAIN'A'RISK                        │
├──────────────┬──────────────────────┬───────────────────┤
│   Frontend   │      Backend         │    ML Engine       │
│  Next.js 14  │  FastAPI + Python    │  scikit-learn      │
│   (Vercel)   │    (Railway)         │  RandomForest      │
│              │                      │                    │
│  Dashboard   │  REST API + CORS     │  Risk Scoring      │
│  Trade Map   │  CSV / Supabase DB   │  Anomaly Detect    │
│  AI Reports  │  PDF Generation      │  Feature Eng.      │
└──────────────┴──────────────────────┴───────────────────┘
```

---

## 🎯 Key Features

| Feature | Description |
|---|---|
| 🤖 **ML Risk Engine** | RandomForest model scoring containers 0–100 across CRITICAL / HIGH / MEDIUM / LOW |
| 🗺️ **Global Trade Map** | Interactive real-time map of all active shipping routes with risk overlays |
| 📊 **Intelligence Dashboard** | Live metrics, anomaly detection, trend charts, and entity trade networks |
| 📄 **PDF Reports** | Auto-generated investigation reports downloadable per container |
| 🧠 **AI Explanations** | Natural language explanations of why a container was flagged |
| 🔍 **54,000+ Records** | Pre-loaded historical dataset for instant analytics |
| 📦 **Container Management** | Add, search, filter, and track containers with full risk profiles |
| 🔐 **Auth System** | Login / signup with backend + localStorage fallback |

---

## 🛠️ Tech Stack

<table>
<tr>
<td><b>Frontend</b></td>
<td>Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts</td>
</tr>
<tr>
<td><b>Backend</b></td>
<td>Python 3.10+, FastAPI, Uvicorn, Gunicorn, ReportLab, python-dotenv</td>
</tr>
<tr>
<td><b>ML</b></td>
<td>scikit-learn 1.6, Pandas 2, NumPy 1.26, Joblib</td>
</tr>
<tr>
<td><b>Database</b></td>
<td>CSV fallback (54k records included) · PostgreSQL via Supabase (optional)</td>
</tr>
<tr>
<td><b>Deployment</b></td>
<td>Vercel (frontend) · Railway (backend) · Docker support included</td>
</tr>
</table>

---

## 🚦 Risk Classification

```
Risk Score ≥ 85  →  🔴 CRITICAL   →  MANDATORY_INSPECT
Risk Score 70–84 →  🟠 HIGH       →  ENFORCE_INSPECT
Risk Score 40–69 →  🟡 MEDIUM     →  MONITOR
Risk Score < 40  →  🟢 LOW        →  CLEAR
```

---

## 📂 Repository Structure

```
ContainARisk/
├── 📁 backend/          # FastAPI server, ML inference, PDF generation
│   ├── main.py          # All API routes
│   ├── services/        # ML engine, risk scoring, PDF, email
│   ├── database/        # Supabase + CSV fallback
│   ├── ai_explanations/ # NLG-based investigation reports
│   └── ml/              # Bundled ML models for Railway
├── 📁 frontend/         # Next.js 14 dashboard (Vercel-ready)
│   └── src/
│       ├── app/         # Pages: dashboard, containers, intelligence
│       ├── components/  # Charts, maps, modals, watchlist
│       └── lib/         # API service layer
├── 📁 ml/               # Model training scripts
├── 📁 data/             # Raw + cleaned datasets (54k records)
├── 📁 docs/             # Problem statement & documentation
├── .env.example         # Environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+

### 1️⃣ Clone the repo

```bash
git clone https://github.com/Aahan0605/ContainArisk.git
cd ContainArisk
```

### 2️⃣ Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3️⃣ Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

Open **http://localhost:3000** — API runs at **http://localhost:8000/docs**

---

## 🌐 Production Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel
# Add env var: NEXT_PUBLIC_API_BASE_URL=https://your-railway-url.up.railway.app
```

### Backend → Railway
1. Connect `Aahan0605/ContainArisk` repo in Railway
2. Set root directory to `backend/`
3. Add env vars: `SUPABASE_URL`, `SUPABASE_KEY`
4. Railway auto-detects and deploys ✅

---

## 📊 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check + containers loaded count |
| `GET` | `/summary` | Dashboard statistics |
| `GET` | `/containers` | Paginated container list |
| `GET` | `/containers/critical` | Critical risk containers |
| `GET` | `/container/{id}` | Container details |
| `GET` | `/container/{id}/risk-analysis` | Risk indicators + recommendation |
| `GET` | `/container/{id}/report` | Download PDF report |
| `POST` | `/container` | Create new container |
| `GET` | `/trade-routes` | Global shipping routes with risk |
| `GET` | `/risk-trends` | Monthly risk trend data |
| `POST` | `/predict` | ML risk prediction for single container |
| `POST` | `/analyze` | Batch ML analysis |

> Full interactive docs at `/docs` (Swagger UI)

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| API Response Time | < 100ms (CSV) · < 50ms (PostgreSQL) |
| ML Prediction | < 50ms per container |
| Data Loaded | 54,000 records in memory at startup |
| Concurrent Users | 100–500 per instance · 5000+ with load balancing |

---

## 🔐 Security

- 🔒 Environment variables for all secrets
- 🌐 CORS protection (domain-specific in production)
- ✅ Input validation on all endpoints
- 🔑 JWT-ready authentication architecture
- 🛡️ HTTPS/SSL enforced in production

---

## 🎯 Roadmap

- [ ] 🔔 Real-time push notifications
- [ ] 📱 Mobile app (React Native)
- [ ] 🔑 OAuth2 / JWT authentication
- [ ] 🤖 Custom trainable risk models
- [ ] 🏛️ Integration with customs systems
- [ ] 🌍 Multi-language support
- [ ] 📡 WebSocket live container tracking

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for smarter, safer global trade.

[![GitHub stars](https://img.shields.io/github/stars/Aahan0605/ContainArisk?style=social)](https://github.com/Aahan0605/ContainArisk)

</div>
