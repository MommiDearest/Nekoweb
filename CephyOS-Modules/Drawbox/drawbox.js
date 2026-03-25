// drawbox module - allows people to draw and submit images to your site! 
// requires: config.js to be loaded first

let currentColor = "#000000";
let drawing = false;
let erasing = false;
let canvas;
let ctx;

//start teh drawbox and helper functions
function initDrawbox() {
    setupPalette();
    setupSliders();
    setupCanvas();
    setupButtons();
    loadDrawingsGallery();
}
// set up your swatches, these are edited in the config file, it will iterate through each swatch added, so have fun
function setupPalette() {
    const swatchGrid = document.getElementById("swatch-grid");
    if (!swatchGrid) return;
    const swatches = CONFIG.drawboxColors || [];
    swatches.forEach((color) => {
        const s = document.createElement("div");
        s.className = "swatch";
        s.style.backgroundColor = color;
        s.title = color;
        if (color === currentColor) s.classList.add("active");
        swatchGrid.appendChild(s);
        s.addEventListener("click", () => {
            setColor(color);
        });
    });

}
// start the sliders
function setupSliders() {
    const rSlider = document.getElementById("r-slider");
    const gSlider = document.getElementById("g-slider");
    const bSlider = document.getElementById("b-slider");
    const rVal = document.getElementById("r-val");
    const gVal = document.getElementById("g-val");
    const bVal = document.getElementById("b-val");
    if (!rSlider || !gSlider || !bSlider) return;

    function updateColorFromSliders() {
        const r = parseInt(rSlider.value),
            g = parseInt(gSlider.value),
            b = parseInt(bSlider.value);
        rVal.textContent = r;
        gVal.textContent = g;
        bVal.textContent = b;
        setColor("#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""));
    }

    rSlider.addEventListener("input", updateColorFromSliders);
    gSlider.addEventListener("input", updateColorFromSliders);
    bSlider.addEventListener("input", updateColorFromSliders);
}

//start the canvas and setup ALL the event listeners
// theres even lsiteners here for touch- thats why its a bit long
function setupCanvas() {
    canvas = document.getElementById("draw-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    const sizeSlider = document.getElementById("draw-size");
    const eraserBtn = document.getElementById("draw-eraser");
    const clearBtn = document.getElementById("draw-clear");
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width,
            scaleY = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top) * scaleY,
        };
    };
    canvas.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        drawing = true;
        ctx.beginPath();
        const p = getPos(e);
        ctx.moveTo(p.x, p.y);
    });
    function handleDrawing(p) {
        if (!drawing) return;
        ctx.lineWidth = sizeSlider.value;
        ctx.lineCap = "round";
        if (erasing) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = currentColor;
        }
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);

    }

    canvas.addEventListener("mousemove", (e) => {
        handleDrawing(getPos(e));
    });
    canvas.addEventListener("touchmove",
        (e) => {
            e.preventDefault();
            handleDrawing(getPos(e));
        }, {
        passive: false
    });
    canvas.addEventListener("mouseup", () => (drawing = false));
    canvas.addEventListener("mouseleave", () => (drawing = false));
    canvas.addEventListener("touchstart",
        (e) => {
            e.preventDefault();
            drawing = true;
            ctx.beginPath();
            const p = getPos(e);
            ctx.moveTo(p.x, p.y);
        }, {
        passive: false
    });
    canvas.addEventListener("touchend", () => {
        drawing = false;
    });
    // Check for clickin, change the button display for the selected tool you can edit what you show, 
    //I just have a little pencil emote because it looked sute with my theme, and then the word eraser 
    // but i'm pretty basic
    eraserBtn.addEventListener("touchend", (e) => { e.preventDefault(); eraserBtn.click(); });
    clearBtn.addEventListener("touchend", (e) => { e.preventDefault(); clearBtn.click(); });
    eraserBtn.addEventListener("click", () => {
        erasing = !erasing;
        if (erasing) {
            eraserBtn.textContent = "Pen ✏️";
            canvas.style.cursor = "cell";
        } else {
            eraserBtn.textContent = "Eraser";
            canvas.style.cursor = "crosshair";
        }
    });
    clearBtn.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
}

// submit button and SEND IT
function setupButtons() {
    const submitBtn = document.getElementById("draw-submit");
    if (!submitBtn) return;
    const statusEl = document.getElementById("draw-status");
    const authorEl = document.getElementById("draw-author");
    submitBtn.addEventListener("touchend", (e) => {
        e.preventDefault();
        submitBtn.click();
    });

    submitBtn.addEventListener("click", async () => {
        statusEl.textContent = "Saving...";
        submitBtn.disabled = true;
        const author = authorEl.value.trim() || "Anonymous",
            timestamp = Date.now();
        const safeAuthor = author.trim().replace(/[^a-z0-9]/gi, '_') || 'Anonymous';
        const filename = `drawing-${timestamp}-${safeAuthor}.png`;
        const base64 = canvas.toDataURL("image/png").split(",");
        const Bytes = base64[1].length * 0.75;
        //check size to prevent spam im sure tehres a better way to write this, but it works for me! (honestly thats all of this)
        if (Bytes > 2_000_000) {
            statusEl.textContent = ``;
            submitBtn.disabled = false;
            return;
        }
        try {
            const res = await fetch(WORKER_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "submit",
                    filename,
                    base64,
                    author,
                }),
            });
            if (res.ok) {
                statusEl.textContent = "Saved! Gallery updated. I'll add it to public Gallery after a check!";
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                authorEl.value = "";
                loadDrawingsGallery();
            } else {
                const err = await res.json();
                statusEl.textContent = `Error: ${err.message}`;
            }
        } catch (e) {
            statusEl.textContent = "Network error try again.";
        }
        submitBtn.disabled = false;
    });
}

//color helper functions
function setColor(hex) {
    currentColor = hex;
    const preview = document.getElementById("colour-preview");
    if (preview) preview.style.backgroundColor = hex;
    document.querySelectorAll(".swatch").forEach((s) => {
        s.classList.toggle("active", s.style.backgroundColor === hexToRgb(hex));
    });
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

//load the gallery
async function loadDrawingsGallery() {

    const grid = document.getElementById("drawings-grid");
    if (!grid) return;
    grid.innerHTML = "<p>Loading...</p>";
    try {
      const res = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "list" }),
        });
        const files = await res.json();
        const drawings = files
            .filter((f) => f.name.endsWith(".png"))
            .sort((a, b) => b.name.localeCompare(a.name));
        if (!drawings.length) {
            grid.innerHTML = "<p>No drawings yet, be the first!</p>";
            return;
        }
        grid.innerHTML = "";
        drawings.forEach((file) => {
            const wrapper = document.createElement("div");
            wrapper.className = "gallery-item";
            const img = document.createElement("img");
            const parts = file.name.replace('.png', '').split('-');
            const drawingAuthor = parts[2] || 'Anonymous';
            const authorLabel = document.createElement("div");
            authorLabel.className = "gallery-author";
            authorLabel.textContent = drawingAuthor;
            fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'getImage', filename: file.name }),
            })
            .then(res => res.blob())
            .then(blob => { img.src = URL.createObjectURL(blob); });
            img.alt = file.name;
            img.addEventListener("click", () => {
                const overlay = document.createElement("div");
                overlay.style.cssText = `
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(255, 255, 255, 1);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    cursor: pointer;
                `;
                const fullImg = document.createElement("img");
                fullImg.src = img.src;
                fullImg.style.cssText = "max-width: 90%; max-height: 90%; object-fit: contain;";
                overlay.appendChild(fullImg);
                overlay.addEventListener("click", () => overlay.remove());
                document.body.appendChild(overlay);
            });
            wrapper.appendChild(img);
            wrapper.appendChild(authorLabel);
            grid.appendChild(wrapper);
        });
    } catch (e) {
        grid.innerHTML = "<p>Could not load drawings.</p>";
    }
  }