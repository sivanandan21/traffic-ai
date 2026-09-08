from pathlib import Path
import os
import re
import shutil

import boto3
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from botocore.exceptions import BotoCoreError, ClientError
from ultralytics import YOLO


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="Traffic AI API",
    version="1.0.0",
    description="Traffic image analysis using FastAPI, YOLO and Amazon S3.",
)


# ============================================================
# CORS
# ============================================================
#
# The frontend and API are now served through the same Nginx
# server, so normal browser requests are same-origin.
#
# These local origins are kept for development/testing.
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ============================================================
# DIRECTORIES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# AWS S3 CONFIGURATION
# ============================================================

S3_BUCKET = "traffic-ai-buck"

S3_REGION = "ap-south-1"

S3_PREFIX = "uploads"


# boto3 automatically uses the EC2 IAM role attached to the
# instance. No AWS access key or secret key is stored here.

s3 = boto3.client(
    "s3",
    region_name=S3_REGION,
)


# ============================================================
# YOLO MODEL
# ============================================================

print("Loading YOLO model...")

model = YOLO(
    "yolo11n.pt"
)

print("YOLO model loaded successfully!")


# ============================================================
# ALLOWED IMAGE TYPES
# ============================================================

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
}


# ============================================================
# MAXIMUM IMAGE SIZE
# ============================================================

MAX_FILE_SIZE = 10 * 1024 * 1024


# ============================================================
# SAFE FILENAME FUNCTION
# ============================================================

def safe_filename(filename: str) -> str:
    """
    Convert a user-provided filename into a safer local/S3 filename.
    """

    filename = Path(
        filename
    ).name

    filename = re.sub(
        r"[^A-Za-z0-9._-]",
        "_",
        filename,
    )

    if not filename:
        filename = "image"

    return filename


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Traffic AI backend is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "traffic-ai",
        "yolo": "ready",
        "s3": S3_BUCKET,
    }


# ============================================================
# ANALYZE IMAGE
# ============================================================

@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Validate filename
    # --------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing.",
        )


    # --------------------------------------------------------
    # Validate content type
    # --------------------------------------------------------

    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image type. "
                "Use JPEG, PNG, WEBP or BMP."
            ),
        )


    # --------------------------------------------------------
    # Create safe filename
    # --------------------------------------------------------

    filename = safe_filename(
        file.filename
    )


    # --------------------------------------------------------
    # Create local temporary file
    # --------------------------------------------------------

    file_path = UPLOAD_DIR / filename


    try:

        # ====================================================
        # SAVE UPLOADED FILE LOCALLY
        # ====================================================

        total_bytes = 0

        with file_path.open("wb") as buffer:

            while True:

                chunk = await file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                total_bytes += len(chunk)

                if total_bytes > MAX_FILE_SIZE:

                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "Image is too large. "
                            "Maximum size is 10MB."
                        ),
                    )

                buffer.write(
                    chunk
                )


        # ====================================================
        # UPLOAD IMAGE TO S3
        # ====================================================

        s3_key = (
            f"{S3_PREFIX}/{filename}"
        )


        try:

            s3.upload_file(
                str(file_path),
                S3_BUCKET,
                s3_key,
                ExtraArgs={
                    "ContentType":
                        file.content_type,
                },
            )

        except (
            ClientError,
            BotoCoreError,
        ) as exc:

            print(
                f"S3 upload failed: {exc}"
            )

            raise HTTPException(
                status_code=502,
                detail="Could not upload image to S3.",
            )


        # ====================================================
        # RUN YOLO
        # ====================================================

        try:

            results = model.predict(
                source=str(file_path),
                conf=0.25,
                verbose=False,
            )

        except Exception as exc:

            print(
                f"YOLO inference failed: {exc}"
            )

            raise HTTPException(
                status_code=500,
                detail="YOLO analysis failed.",
            )


        # ====================================================
        # INITIALIZE COUNTERS
        # ====================================================

        cars = 0

        bikes = 0

        people = 0

        boxes = []


        # ====================================================
        # PROCESS YOLO RESULTS
        # ====================================================

        for result in results:

            if result.boxes is None:
                continue


            for detection in result.boxes:

                # ------------------------------------------------
                # CLASS ID
                # ------------------------------------------------

                class_id = int(
                    detection.cls[0]
                )


                # ------------------------------------------------
                # CLASS NAME
                # ------------------------------------------------

                class_name = model.names.get(
                    class_id,
                    str(class_id),
                )


                # ------------------------------------------------
                # CONFIDENCE
                # ------------------------------------------------

                confidence = float(
                    detection.conf[0]
                )


                # ------------------------------------------------
                # BOUNDING BOX
                # ------------------------------------------------

                x1, y1, x2, y2 = map(
                    int,
                    detection.xyxy[0].tolist(),
                )


                width = max(
                    0,
                    x2 - x1,
                )

                height = max(
                    0,
                    y2 - y1,
                )


                # Ignore invalid boxes

                if width <= 0 or height <= 0:
                    continue


                # ------------------------------------------------
                # SUPPORTED TRAFFIC CLASSES
                # ------------------------------------------------

                if class_name == "car":

                    cars += 1

                    display_class = "car"


                elif class_name in {
                    "bicycle",
                    "motorcycle",
                }:

                    bikes += 1

                    display_class = class_name


                elif class_name == "person":

                    people += 1

                    display_class = "person"


                else:

                    # Ignore other YOLO classes
                    # for our traffic dashboard.

                    continue


                # ------------------------------------------------
                # ADD BOX
                # ------------------------------------------------

                boxes.append(
                    {
                        "x": x1,
                        "y": y1,
                        "width": width,
                        "height": height,
                        "class": display_class,
                        "confidence": round(
                            confidence,
                            3,
                        ),
                    }
                )


        # ====================================================
        # TOTAL OBJECTS
        # ====================================================

        total = (
            cars
            + bikes
            + people
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return {

            "message":
                "Image analyzed successfully",

            "filename":
                filename,

            "s3_bucket":
                S3_BUCKET,

            "s3_key":
                s3_key,

            "cars":
                cars,

            "bikes":
                bikes,

            "people":
                people,

            "total":
                total,

            "boxes":
                boxes,
        }


    finally:

        # ====================================================
        # DELETE LOCAL TEMPORARY FILE
        # ====================================================

        try:

            if file_path.exists():

                os.remove(
                    file_path
                )

        except OSError as exc:

            print(
                f"Temporary file cleanup failed: {exc}"
            )