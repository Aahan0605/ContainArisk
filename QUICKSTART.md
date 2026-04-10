# ⚡ Quickstart Guide

This guide will help you get **ContainArisk** up and running on your local machine in under 5 minutes.

## 📋 Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Supabase Account** (for database and auth)

## 🛠 Step 1: Clone and Environment Setup

1. Clone the repository (if you haven't already).
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your Supabase credentials.

## 🐍 Step 2: Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # Mac/Linux
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will run at `http://localhost:8000`*

## ⚛️ Step 3: Frontend Setup (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`*

## ✅ Step 4: Verification

1. Open your browser and go to `http://localhost:5173`.
2. You should see the login/dashboard.
3. If the backend is running correctly, the dashboard metrics will populate automatically.

---

## 🔧 Common Issues

- **Port Conflict**: If port 5173 or 8000 is in use, Change the port in `frontend/package.json` or run uvicorn with `--port`.
- **Supabase Errors**: Ensure your `SUPABASE_URL` and `SUPABASE_KEY` in `.env` are correct.
- **Dependency Issues**: If `npm install` fails, try `npm install --legacy-peer-deps`.
