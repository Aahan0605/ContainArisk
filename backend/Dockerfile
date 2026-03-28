# Use a slim Python 3.10 image for efficient deployment
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED 1

# Set the working directory to /app
WORKDIR /app

# Install system dependencies (needed for certain Python libs if necessary)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY backend/requirements.txt /app/requirements.txt

# Install the Python dependencies
# We will clean the requirements.txt during implementation, but let's assume it's valid now
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the data folder (important for keeping the 54k records)
COPY data /app/data

# Copy the backend source code
COPY backend /app/backend

# Use port 7860 (Hugging Face default)
EXPOSE 7860

# Add a non-root user for security (required by Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

# Command to run the FastAPI server
# Running from the 'backend' folder as a package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
