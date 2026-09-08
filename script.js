/**
 * TrafficAI Analyzer & Vision Renderer Engine
 *
 * Frontend:
 * HTML + CSS + JavaScript
 *
 * Backend:
 * FastAPI + YOLO
 */


document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // DOM ELEMENTS
    // ==========================================

    const imageInput =
        document.getElementById("imageInput");

    const uploadArea =
        document.getElementById("uploadArea");

    const canvasWrapper =
        document.getElementById("canvasWrapper");

    const visionCanvas =
        document.getElementById("visionCanvas");

    const removeImage =
        document.getElementById("removeImage");

    const analyzeBtn =
        document.getElementById("analyzeBtn");

    const analysisStatus =
        document.getElementById("analysisStatus");

    const carCount =
        document.getElementById("carCount");

    const bikeCount =
        document.getElementById("bikeCount");

    const personCount =
        document.getElementById("personCount");

    const totalCount =
        document.getElementById("totalCount");

    const trafficLevel =
        document.getElementById("trafficLevel");

    const trafficProgress =
        document.getElementById("trafficProgress");

    const presetBtns =
        document.querySelectorAll(".preset-btn");


    // ==========================================
    // CHECK REQUIRED ELEMENTS
    // ==========================================

    if (!imageInput || !visionCanvas) {

        console.error(
            "TrafficAI: Required elements not found."
        );

        return;
    }


    // ==========================================
    // CANVAS
    // ==========================================

    const ctx =
        visionCanvas.getContext("2d");


    // ==========================================
    // APPLICATION STATE
    // ==========================================

    let currentImage = null;

    let selectedFile = null;


    // ==========================================
    // BACKEND URL (Dynamic Host for Localhost & AWS EC2)
    // ==========================================

    const API_URL =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || !window.location.hostname
            ? "http://127.0.0.1:8000/api"
            : `http://${window.location.hostname}:8000/api`;


    // ==========================================
    // SAMPLE IMAGES
    // ==========================================

    const sampleImages = {

        sample1:
            "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",

        sample2:
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",

        sample3:
            "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=800&q=80"

    };


    // ==========================================
    // PRESET BUTTONS
    // ==========================================

    presetBtns.forEach(btn => {

        btn.addEventListener("click", () => {

            const key =
                btn.dataset.preset;

            const imageUrl =
                sampleImages[key];

            if (imageUrl) {

                loadPresetUrl(
                    imageUrl
                );

            }

        });

    });


    // ==========================================
    // LOAD PRESET IMAGE
    // ==========================================

    function loadPresetUrl(url) {
        const img = new Image();
        img.crossOrigin = "Anonymous";

        if (analysisStatus) {
            analysisStatus.textContent = "FETCHING SCENE DATA // 読み込み中...";
        }

        img.onload = () => {
            currentImage = img;
            renderImageOnCanvas(img);
            showCanvasView();

            // Try to fetch as Blob so user can run detection on preset
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    selectedFile = new File([blob], "preset_traffic.jpg", { type: "image/jpeg" });
                    if (analysisStatus) {
                        analysisStatus.textContent = "PRESET LOADED // 待機中 (READY TO DETECT)";
                    }
                    if (analyzeBtn) {
                        analyzeBtn.disabled = false;
                    }
                })
                .catch(() => {
                    selectedFile = null;
                    if (analysisStatus) {
                        analysisStatus.textContent = "PRESET LOADED // 待機中 (UPLOAD FOR BACKEND)";
                    }
                });
        };

        img.onerror = () => {
            showToast("FAILED TO LOAD PRESET FRAME // 読み込み失敗", "error");
        };

        img.src = url;
    }


    // ==========================================
    // FILE INPUT
    // ==========================================

    imageInput.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];


            if (file) {

                handleFile(
                    file
                );

            }

        }
    );


    // ==========================================
    // HANDLE IMAGE FILE
    // ==========================================

    function handleFile(file) {

        // ------------------------------
        // Validate file type
        // ------------------------------

        if (!file.type.startsWith("image/")) {

            showToast(
                "Please select a valid image file.",
                "error"
            );

            return;
        }


        // ------------------------------
        // Validate file size
        // ------------------------------

        const maxSize =
            10 * 1024 * 1024;


        if (file.size > maxSize) {

            showToast(
                "Image size must be smaller than 10MB.",
                "error"
            );

            return;
        }


        // ------------------------------
        // Store file
        // ------------------------------

        selectedFile =
            file;


        // ------------------------------
        // Read image
        // ------------------------------

        const reader =
            new FileReader();


        reader.onload = (event) => {

            const img =
                new Image();


            img.onload = () => {

                currentImage =
                    img;


                renderImageOnCanvas(
                    img
                );


                showCanvasView();


                if (analysisStatus) {

                    analysisStatus.textContent =
                        "Image loaded & ready";

                }

            };


            img.onerror = () => {

                showToast(
                    "Could not read the image.",
                    "error"
                );

            };


            img.src =
                event.target.result;

        };


        reader.onerror = () => {

            showToast(
                "Could not read the selected file.",
                "error"
            );

        };


        reader.readAsDataURL(
            file
        );

    }


    // ==========================================
    // RENDER IMAGE ON CANVAS
    // ==========================================

    function renderImageOnCanvas(img) {

        visionCanvas.width =
            img.naturalWidth ||
            img.width;


        visionCanvas.height =
            img.naturalHeight ||
            img.height;


        ctx.clearRect(
            0,
            0,
            visionCanvas.width,
            visionCanvas.height
        );


        ctx.drawImage(
            img,
            0,
            0,
            visionCanvas.width,
            visionCanvas.height
        );

    }


    // ==========================================
    // SHOW CANVAS VIEW
    // ==========================================

    function showCanvasView() {

        if (uploadArea) {

            uploadArea.style.display =
                "none";

        }


        if (canvasWrapper) {

            canvasWrapper.classList.add(
                "active"
            );

        }


        if (analyzeBtn) {

            analyzeBtn.disabled =
                false;

        }

    }


    // ==========================================
    // REMOVE IMAGE
    // ==========================================

    if (removeImage) {

        removeImage.addEventListener(
            "click",
            () => {

                currentImage =
                    null;


                selectedFile =
                    null;


                if (imageInput) {

                    imageInput.value =
                        "";

                }


                ctx.clearRect(
                    0,
                    0,
                    visionCanvas.width,
                    visionCanvas.height
                );


                if (canvasWrapper) {

                    canvasWrapper.classList.remove(
                        "active"
                    );

                }


                if (uploadArea) {

                    uploadArea.style.display =
                        "flex";

                }


                if (analyzeBtn) {

                    analyzeBtn.disabled =
                        true;

                }


                if (analysisStatus) {

                    analysisStatus.textContent =
                        "Waiting for input";

                }


                resetStatsDisplay();

            }
        );

    }


    // ==========================================
    // DRAG & DROP
    // ==========================================

    if (uploadArea) {

        uploadArea.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

                uploadArea.classList.add(
                    "dragging"
                );

            }
        );


        uploadArea.addEventListener(
            "dragleave",
            () => {

                uploadArea.classList.remove(
                    "dragging"
                );

            }
        );


        uploadArea.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();


                uploadArea.classList.remove(
                    "dragging"
                );


                const file =
                    event.dataTransfer.files[0];


                if (file) {

                    handleFile(
                        file
                    );

                }

            }
        );

    }


    // ==========================================
    // SEND IMAGE TO FASTAPI
    // ==========================================

    async function sendImageToBackend(file) {

        const formData =
            new FormData();


        /*
         * IMPORTANT:
         *
         * "file" must match the FastAPI
         * parameter:
         *
         * file: UploadFile = File(...)
         */

        formData.append(
            "file",
            file
        );


        try {

            const response =
                await fetch(
                    `${API_URL}/analyze`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            // ------------------------------
            // Check HTTP response
            // ------------------------------

            if (!response.ok) {

                let errorMessage =
                    `Server returned ${response.status}`;


                try {

                    const errorData =
                        await response.json();


                    if (errorData.detail) {

                        errorMessage =
                            errorData.detail;

                    }

                } catch {
                    // Ignore JSON parsing error
                }


                throw new Error(
                    errorMessage
                );

            }


            // ------------------------------
            // Convert response to JSON
            // ------------------------------

            const result =
                await response.json();


            console.log(
                "YOLO backend response:",
                result
            );


            return result;

        }

        catch (error) {

            console.error(
                "Backend connection failed:",
                error
            );


            showToast(
                "Could not connect to the backend.",
                "error"
            );


            return null;

        }

    }


    // ==========================================
    // ANALYZE BUTTON
    // ==========================================

    if (analyzeBtn) {

        analyzeBtn.addEventListener(
            "click",
            async () => {

                // ------------------------------
                // Check image
                // ------------------------------

                if (!currentImage) {

                    showToast(
                        "Please select an image first.",
                        "error"
                    );

                    return;
                }


                // ------------------------------
                // Check actual File object
                // ------------------------------

                if (!selectedFile) {

                    showToast(
                        "Please upload an image from your device.",
                        "error"
                    );

                    return;
                }


                // ------------------------------
                // Get credits
                // ------------------------------

                let credits =
                    getStoredCredits();


                // ------------------------------
                // Check credits
                // ------------------------------

                if (credits <= 0) {

                    showToast(
                        "You have 0 credits left for today!",
                        "error"
                    );

                    return;

                }


                // ------------------------------
                // Disable button
                // ------------------------------

                analyzeBtn.disabled =
                    true;


                if (analysisStatus) {

                    analysisStatus.textContent =
                        "Uploading image to AI server...";

                }


                // ------------------------------
                // Send image
                // ------------------------------

                const result =
                    await sendImageToBackend(
                        selectedFile
                    );


                // ------------------------------
                // Check result
                // ------------------------------

                if (!result) {

                    analyzeBtn.disabled =
                        false;

                    return;

                }


                console.log(
                    "YOLO result:",
                    result
                );


                // ==================================
                // GET YOLO COUNTS
                // ==================================

                const cars =
                    Number(
                        result.cars ?? 0
                    );


                const bikes =
                    Number(
                        result.bikes ?? 0
                    );


                const people =
                    Number(
                        result.people ?? 0
                    );


                const total =
                    Number(
                        result.total ??
                        (
                            cars +
                            bikes +
                            people
                        )
                    );


                // ==================================
                // CALCULATE TRAFFIC LEVEL
                // ==================================

                const level =
                    calculateTrafficLevel(
                        total
                    );


                const percentage =
                    calculateTrafficPercentage(
                        total
                    );


                // ==================================
                // DISPLAY REAL YOLO RESULTS
                // ==================================

                displayResults({

                    cars: cars,

                    bikes: bikes,

                    people: people,

                    total: total,

                    level: level,

                    percentage: percentage

                });


                // ==================================
                // DRAW REAL YOLO BOXES
                // ==================================

                drawBoundingBoxes(
                    result.boxes || []
                );


                // ==================================
                // DEDUCT CREDIT
                // ==================================

                credits--;

                setStoredCredits(
                    credits
                );


                // ==================================
                // SAVE HISTORY
                // ==================================

                saveHistoryItem({

                    time:
                        new Date().toLocaleTimeString(
                            [],
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        ),

                    date:
                        new Date().toLocaleDateString(),

                    cars:
                        cars,

                    bikes:
                        bikes,

                    people:
                        people,

                    total:
                        total,

                    level:
                        level,

                    percentage:
                        percentage,

                    boxes:
                        result.boxes || []

                });


                // ==================================
                // SUCCESS
                // ==================================

                if (analysisStatus) {

                    analysisStatus.textContent =
                        "YOLO analysis completed";

                }


                showToast(
                    `Detection Complete! ${total} objects detected.`,
                    "success"
                );


                // Enable button

                analyzeBtn.disabled =
                    false;

            }
        );

    }


    // ==========================================
    // TRAFFIC LEVEL
    // ==========================================

    function calculateTrafficLevel(total) {

        if (total < 10) {

            return "LOW";

        }


        if (total < 20) {

            return "MEDIUM";

        }


        return "HIGH";

    }


    // ==========================================
    // TRAFFIC PROGRESS
    // ==========================================

    function calculateTrafficPercentage(total) {

        if (total < 10) {

            return 30;

        }


        if (total < 20) {

            return 65;

        }


        return 92;

    }


    // ==========================================
    // DISPLAY RESULTS
    // ==========================================

    function displayResults(result) {

        if (carCount) {

            carCount.textContent =
                result.cars;

        }


        if (bikeCount) {

            bikeCount.textContent =
                result.bikes;

        }


        if (personCount) {

            personCount.textContent =
                result.people;

        }


        if (totalCount) {

            totalCount.textContent =
                result.total;

        }


        if (trafficLevel) {

            trafficLevel.textContent =
                result.level;

        }


        if (trafficProgress) {

            trafficProgress.style.width =
                `${result.percentage}%`;

        }

    }


    // ==========================================
    // DRAW REAL YOLO BOUNDING BOXES (ANIME MECHA HUD)
    // ==========================================

    function drawBoundingBoxes(boxes) {
        // Restore the original image first
        renderImageOnCanvas(currentImage);

        if (!Array.isArray(boxes)) {
            return;
        }

        // Scale text and lines according to image size
        const fontSize = Math.max(
            12,
            Math.min(22, Math.floor(visionCanvas.width / 50))
        );

        const lineWidth = Math.max(
            2,
            Math.floor(visionCanvas.width / 350)
        );

        boxes.forEach((box) => {
            const className = String(box.class || "object").toLowerCase();

            // Anime High-Voltage Palette
            let color = "#a855f7"; // purple fallback
            let displayName = "TARGET // 目標";

            if (className === "person") {
                color = "#ffe600"; // Neon Yellow
                displayName = "PERSON // 歩行者";
            } else if (className === "car") {
                color = "#ff2a85"; // Hot Manga Pink
                displayName = "CAR // 車両";
            } else if (className === "motorcycle") {
                color = "#00f0ff"; // Cyber Cyan
                displayName = "MOTOR // 二輪";
            } else if (className === "bicycle") {
                color = "#00f0ff"; // Cyber Cyan
                displayName = "BIKE // 自転車";
            }

            const x = Number(box.x);
            const y = Number(box.y);
            const width = Number(box.width);
            const height = Number(box.height);

            // Ignore invalid boxes
            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(width) ||
                !Number.isFinite(height) ||
                width <= 0 ||
                height <= 0
            ) {
                return;
            }

            // 1. Draw Target Box Outline
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.strokeRect(x, y, width, height);

            // 2. Draw Mecha HUD Corner Brackets (Target Lock-on)
            const bracketLen = Math.max(6, Math.min(24, Math.min(width, height) / 3));
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = lineWidth + 1.5;

            // Top-Left
            ctx.beginPath();
            ctx.moveTo(x, y + bracketLen);
            ctx.lineTo(x, y);
            ctx.lineTo(x + bracketLen, y);
            ctx.stroke();

            // Top-Right
            ctx.beginPath();
            ctx.moveTo(x + width - bracketLen, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + bracketLen);
            ctx.stroke();

            // Bottom-Left
            ctx.beginPath();
            ctx.moveTo(x, y + height - bracketLen);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x + bracketLen, y + height);
            ctx.stroke();

            // Bottom-Right
            ctx.beginPath();
            ctx.moveTo(x + width - bracketLen, y + height);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x + width, y + height - bracketLen);
            ctx.stroke();

            // 3. Draw subtle center reticle mark (+)
            const cx = x + width / 2;
            const cy = y + height / 2;
            const reticleSize = Math.min(6, Math.min(width, height) / 5);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - reticleSize, cy);
            ctx.lineTo(cx + reticleSize, cy);
            ctx.moveTo(cx, cy - reticleSize);
            ctx.lineTo(cx, cy + reticleSize);
            ctx.stroke();

            // 4. Bounding Box Label (Neo-Brutalist Sticker)
            const confidence = Math.round(Number(box.confidence || 0) * 100);
            const label = `[ ${displayName} ${confidence}% ]`;

            ctx.font = `800 ${fontSize}px 'JetBrains Mono', 'Space Grotesk', monospace, sans-serif`;
            const textWidth = ctx.measureText(label).width;
            const paddingX = 8;
            const paddingY = 5;
            const labelWidth = textWidth + paddingX * 2;
            const labelHeight = fontSize + paddingY * 2;

            let labelX = x;
            let labelY = y - labelHeight - 3;

            // Keep label inside horizontal boundaries
            if (labelX + labelWidth > visionCanvas.width) {
                labelX = visionCanvas.width - labelWidth - 2;
            }
            if (labelX < 0) {
                labelX = 2;
            }

            // If there's no room above, draw inside top of box
            if (labelY < 0) {
                labelY = y + 4;
            }

            // 4a. Brutalist Hard Drop Shadow
            ctx.fillStyle = "#000000";
            ctx.fillRect(labelX + 3, labelY + 3, labelWidth, labelHeight);

            // 4b. Neon Sticker Background
            ctx.fillStyle = color;
            ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

            // 4c. Bold Black Ink Border
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

            // 4d. Stark Black Text
            ctx.fillStyle = "#000000";
            ctx.fillText(
                label,
                labelX + paddingX,
                labelY + fontSize + paddingY - 3
            );
        });
    }


    // ==========================================
    // RESET RESULTS
    // ==========================================

    function resetStatsDisplay() {

        if (carCount) {

            carCount.textContent =
                "--";

        }


        if (bikeCount) {

            bikeCount.textContent =
                "--";

        }


        if (personCount) {

            personCount.textContent =
                "--";

        }


        if (totalCount) {

            totalCount.textContent =
                "--";

        }


        if (trafficLevel) {

            trafficLevel.textContent =
                "--";

        }


        if (trafficProgress) {

            trafficProgress.style.width =
                "0%";

        }

    }

});