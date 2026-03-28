# SmartContainer Backend — Start Script
# Run from the project root: .\backend\start.ps1
# Or from backend/: .\start.ps1

Write-Host "Starting SmartContainer Backend..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot"

# Check if model exists, train if missing
$modelPath = ".\models\risk_model.joblib"
if (-not (Test-Path $modelPath)) {
    Write-Host "ML model not found. Training now (this takes ~2 min)..." -ForegroundColor Yellow
    python ..\ml\training\train.py
    Write-Host "Training complete." -ForegroundColor Green
}
else {
    Write-Host "ML model found at $modelPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Backend running at: http://localhost:8000" -ForegroundColor Green
Write-Host "Swagger UI at:      http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

uvicorn main:app --reload --port 8000
