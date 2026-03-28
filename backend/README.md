# SmartContainer Backend

This is the FastAPI backend for the SmartContainer frontend. It provides the necessary endpoints with mock data to run the frontend application fully.

## Prerequisites
- Python 3.8+

## Setup Instructions

1. **Install Dependencies**
   Open your terminal in this `backend` directory and run:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Server**
   Start the FastAPI development server using `uvicorn`:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend will now be accessible at `http://localhost:8000`.

3. **API Documentation**
   FastAPI automatically generates interactive API documentation. You can view it by navigating to:
   - [Swagger UI](http://localhost:8000/docs)
   - [ReDoc](http://localhost:8000/redoc)

## Endpoints Provided
The backend implements all endpoints required by the frontend's `src/services/api.js`:
- `GET /summary`
- `GET /risk-distribution`
- `GET /high-risk-containers`
- `POST /upload-containers`
- `GET /container/{id}`
- `GET /country-risk`
- `GET /importer-risk`
- `GET /trade-routes`
- `GET /risk-heatmap`
- `POST /ai-explain`
- `GET /risk-alerts`
