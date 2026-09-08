from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path
import shutil

from ultralytics import YOLO


# ==========================================
# CREATE APP
# ==========================================

app = FastAPI()


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,

    # Allow all origins in development so any port / file:// works
    allow_origins=["*"],

    allow_credentials=False,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ==========================================
# UPLOAD DIRECTORY
# ==========================================

UPLOAD_DIR = Path("uploads")

UPLOAD_DIR.mkdir(
    exist_ok=True
)


# ==========================================
# LOAD YOLO
# ==========================================

# Path to YOLO model — resolved relative to this file so it works
# regardless of which directory you run uvicorn/python from.
BASE_DIR = Path(__file__).parent.parent
MODEL_PATH = BASE_DIR / "yolo11n.pt"

if MODEL_PATH.exists():
    print(f"Loading YOLO model from: {MODEL_PATH}")
    model = YOLO(str(MODEL_PATH))
else:
    print(f"Local model not found at {MODEL_PATH}, auto-downloading 'yolo11n.pt'...")
    model = YOLO("yolo11n.pt")

print("YOLO model loaded successfully!")



# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Traffic AI backend is running"
    }


# ==========================================
# HEALTH
# ==========================================

@app.get("/api/health")
def health():

    return {
        "status": "ok"
    }


# ==========================================
# ANALYZE IMAGE
# ==========================================

@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...)
):

    # --------------------------------------
    # Save uploaded image
    # --------------------------------------

    file_path = UPLOAD_DIR / file.filename

    with file_path.open("wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    # --------------------------------------
    # Run YOLO
    # --------------------------------------

    results = model.predict(
        source=str(file_path),
        conf=0.25
    )


    # --------------------------------------
    # Counters
    # --------------------------------------

    cars = 0
    bikes = 0
    people = 0

    boxes = []


    # --------------------------------------
    # Process detections
    # --------------------------------------

    for result in results:

        for box in result.boxes:

            # Class ID

            class_id = int(
                box.cls[0]
            )


            # Class name

            class_name = model.names[
                class_id
            ]


            # Confidence

            confidence = float(
                box.conf[0]
            )


            # Bounding box coordinates

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0].tolist()
            )


            width = x2 - x1

            height = y2 - y1


            # ----------------------------------
            # Count supported traffic objects
            # ----------------------------------

            if class_name == "car":

                cars += 1

                display_class = "car"


            elif class_name in [
                "motorcycle",
                "bicycle"
            ]:

                bikes += 1

                display_class = class_name


            elif class_name == "person":

                people += 1

                display_class = "person"


            else:

                # Ignore objects that aren't
                # relevant to our dashboard.

                continue


            # ----------------------------------
            # Store bounding box
            # ----------------------------------

            boxes.append({

                "x": x1,

                "y": y1,

                "width": width,

                "height": height,

                "class": display_class,

                "confidence": round(
                    confidence,
                    3
                )

            })


    # --------------------------------------
    # Total
    # --------------------------------------

    total = (
        cars +
        bikes +
        people
    )


    # --------------------------------------
    # Response
    # --------------------------------------

    return {

        "message":
            "Image analyzed successfully",

        "filename":
            file.filename,

        "cars":
            cars,

        "bikes":
            bikes,

        "people":
            people,

        "total":
            total,

        "boxes":
            boxes

    }