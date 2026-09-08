FROM python:3.11-slim

# Prevent Python from creating .pyc files
# and make logs appear immediately.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Store Ultralytics configuration inside the container.
ENV YOLO_CONFIG_DIR=/app/.ultralytics

WORKDIR /app

# System packages required by OpenCV and runtime libraries.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgl1 \
        libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip.
RUN python -m pip install --no-cache-dir --upgrade pip

# Install CPU-only PyTorch first.
RUN python -m pip install --no-cache-dir \
    torch \
    torchvision \
    --index-url https://download.pytorch.org/whl/cpu

# Copy Python dependency list.
COPY requirements.txt .

# Install application dependencies.
RUN python -m pip install --no-cache-dir \
    fastapi \
    uvicorn \
    python-multipart \
    boto3 \
    ultralytics \
    opencv-python-headless

# Copy backend application.
COPY main.py .

# Create required directories.
RUN mkdir -p /app/uploads /app/.ultralytics

# FastAPI port inside the container.
EXPOSE 8000

# Start FastAPI.
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]