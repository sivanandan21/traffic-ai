FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV YOLO_CONFIG_DIR=/app/.ultralytics

WORKDIR /app

# System packages required by OpenCV and runtime libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgl1 \
        libgomp1 \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN python -m pip install --no-cache-dir --upgrade pip

# Install CPU-only PyTorch (keeps container slim and fast)
RUN python -m pip install --no-cache-dir \
    torch \
    torchvision \
    --index-url https://download.pytorch.org/whl/cpu

# Copy and install backend Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt

# Copy pre-downloaded YOLO weights or bake during build
COPY yolo11n.pt* backend/yolo11n.pt* ./
RUN python -c "from ultralytics import YOLO; YOLO('yolo11n.pt')"

# Copy backend application code
COPY backend/main.py ./main.py

# Copy frontend static files and media assets into /app/frontend
COPY index.html analysis.html history.html about.html style.css script.js common.js ./frontend/
COPY assets/ ./frontend/assets/

# Create application directories
RUN mkdir -p /app/uploads /app/.ultralytics

# Expose unified application port
EXPOSE 8000

# Built-in container health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"

# Start unified FastAPI server serving both Web Frontend and AI Backend
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# Trigger unified build
