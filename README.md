# ContainArisk - Smart Container Risk Analysis & Trade Intelligence

ContainArisk is an advanced end-to-end platform for detecting high-risk shipping containers using machine learning, AI-powered insights, and real-time trade monitoring. **Production-ready with optimized risk recommendations, year-based analytics, and seamless container management.**

## 🚀 Overview

The system consists of three main components:
- **Backend**: A high-performance FastAPI server providing machine learning risk predictions, automated report generation, and data management with CSV fallback database.
- **Frontend**: A sleek, modern Next.js dashboard (optimized for Vercel) featuring real-time analytics, interactive global maps, year-filtered trend charts, and AI-powered risk explanations.
- **ML Engine**: A scikit-learn based risk prediction model with automated feature engineering and real-time container risk assessment.

## ✨ Latest Updates (v1.1.0)

### 🔧 Bug Fixes
- ✅ **Fixed Recommendation Logic**: Critical containers (risk ≥ 85) now show "MANDATORY_INSPECT" instead of "AUTO_CLEAR"
  - Risk ≥ 85: MANDATORY_INSPECT (CRITICAL)
  - Risk 70-84: ENFORCE_INSPECT (URGENT)
  - Risk 40-69: MONITOR (HIGH)
  - Risk < 40: CLEAR (NORMAL)
- ✅ **Year-based Risk Trends**: Added year selector dropdown to Risk Trend Chart for detailed historical analysis
- ✅ **Add Container Form**: Fully functional container creation with automatic CSV persistence and risk analysis

### 📦 Database
- **CSV Fallback**: Automatic fallback to CSV database when Supabase is unavailable
- **54,000+ Records**: Pre-loaded with 54,000+ historical container records
- **Dual Storage**: Supports both CSV files and PostgreSQL (Supabase) for flexibility

### 🚀 Deployment
- **Vercel Ready**: Frontend optimized for Vercel deployment with zero configuration
- **Production Ready**: Backend can run with Gunicorn on any server
- **Docker Support**: Full Docker and docker-compose configurations included

## 🛠 Tech Stack

- **Frontend**: Next.js 14.2.35, React 18, TypeScript, Tailwind CSS 3, Framer Motion, Recharts 3
- **Backend**: Python 3.10+, FastAPI, Supabase (PostgreSQL optional), CSV database fallback, ReportLab (PDF generation)
- **Machine Learning**: Scikit-Learn 1.3+, Pandas 2+, NumPy 1.26+, Joblib
- **Deployment**: Vercel (Frontend), AWS/GCP/DigitalOcean/Heroku (Backend)
- **Database**: CSV files (included) or PostgreSQL (Supabase)
- **Authentication**: JWT-ready architecture
- **Containerization**: Docker & docker-compose

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

### 1. Backend Setup (Development)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup (Development)
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

The application will be available at `http://localhost:5173` (frontend) and `http://localhost:8000` (API).

### 3. Production Deployment

#### Frontend on Vercel (Recommended)
```bash
# Deploy frontend to Vercel
npm install -g vercel
cd frontend
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_BASE_URL https://your-backend-api.com
```

#### Backend Deployment
```bash
# Option 1: Using Gunicorn
pip install gunicorn uvloop
gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 main:app

# Option 2: Using Docker
docker build -f Dockerfile.backend -t containarisk-backend .
docker run -p 8000:8000 containarisk-backend
```

See [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md) for detailed deployment instructions.

## 🌐 Live Demo

- **Frontend**: Deploy to Vercel with one command
- **Backend**: Deploy to AWS/GCP/DigitalOcean using provided configurations
- **API Documentation**: Available at `http://localhost:8000/docs` (Swagger UI)

## 📊 API Endpoints

### Container Management
- `GET /summary` - Get container statistics
- `GET /containers` - List all containers with pagination
- `GET /container/{id}` - Get container details
- `GET /container/{id}/risk-analysis` - Get risk analysis with recommendation
- `POST /container` - Create new container
- `GET /container/{id}/report` - Download PDF report

### Risk Analysis
- `GET /risk-analysis` - Batch risk analysis
- `POST /bulk-upload` - Upload multiple containers (CSV)

### AI Explanations
- `POST /explain-risk` - Get AI explanation for risk factors

### Health
- `GET /health` - Health check endpoint

## 📜 Documentation

- [Problem Statement](./docs/Problem%20Statement%20(2).pdf)
- [Quickstart Guide](./QUICKSTART.md)
- [Production Guide](./PRODUCTION_GUIDE.md) - Complete deployment guide
- [API Documentation](./QUICKSTART.md) - Endpoint specifications

## 🔐 Security

- Environment variables for sensitive data
- CORS protection (domain-specific in production)
- Rate limiting support
- Input validation on all endpoints
- JWT-ready authentication structure
- HTTPS/SSL recommended for production

## 📦 Database Options

### CSV Database (Default - Included)
- ✅ No setup required
- ✅ 54,000+ pre-loaded records
- ✅ Automatic persistence
- ✅ Good for MVP/testing

### PostgreSQL/Supabase (Recommended for Production)
- ✅ Scalable
- ✅ Automatic backups
- ✅ Better performance for large datasets
- ✅ Real-time replication

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd ../frontend
npm test
```

## 📈 Performance

- **Response Time**: < 100ms (CSV), < 50ms (PostgreSQL)
- **Concurrent Users**: 100-500 per server, 5000+ with load balancing
- **ML Predictions**: < 50ms per container
- **Data Loading**: 54,000 records loaded in memory

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📧 Support

For issues and questions:
- Check [QUICKSTART.md](./QUICKSTART.md)
- Review [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md)
- Open a GitHub issue

## ⚖️ License

MIT License - see [LICENSE](LICENSE) for details.

## 🎯 Future Roadmap

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] API authentication (OAuth2/JWT)
- [ ] Custom risk models
- [ ] Integration with customs systems
- [ ] Multi-language support
