// Universal Pointer Event Listeners (Drag-to-scroll only on active click/press)
import { navigateSong } from "./song.js";

let pointerStartX = 0;
let pointerStartY = 0;
let lastPointerY = 0;
let lastPointerTime = 0;
let scrollVelocity = 0;
let isDraggingVertically = false;
let isPointerDown = false;
let flingAnimationId = null;

const songSheetElement = document.getElementById("song-sheet");

if (songSheetElement) {
    songSheetElement.addEventListener(
        "pointerdown",
        (e) => {
            // For mouse inputs, ensure only the primary (left) click initiates the drag
            if (e.pointerType === "mouse" && e.buttons !== 1) return;

            // Cancel any active fling momentum when starting a new press
            if (flingAnimationId) {
                cancelAnimationFrame(flingAnimationId);
                flingAnimationId = null;
            }

            isPointerDown = true;
            pointerStartX = e.clientX;
            pointerStartY = e.clientY;
            lastPointerY = e.clientY;
            lastPointerTime = performance.now();
            scrollVelocity = 0;
            isDraggingVertically = false;
        },
        { passive: true }
    );

    songSheetElement.addEventListener(
        "pointermove",
        (e) => {
            // Ignore movement entirely unless the mouse button or finger is actively held down
            if (!isPointerDown) return;

            const deltaX = e.clientX - pointerStartX;
            const deltaY = e.clientY - pointerStartY;

            // Determine if this is a vertical drag gesture
            if (!isDraggingVertically && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
                isDraggingVertically = true;
            }

            if (isDraggingVertically) {
                const now = performance.now();
                const dt = now - lastPointerTime;
                const dy = e.clientY - lastPointerY;

                if (dt > 0) {
                    // Calculate velocity for fling effect (pixels per millisecond)
                    scrollVelocity = dy / dt;
                }

                // Scroll the container directly
                songSheetElement.scrollTop -= dy;

                lastPointerY = e.clientY;
                lastPointerTime = now;
            }
        },
        { passive: true }
    );

    songSheetElement.addEventListener(
        "pointerup",
        (e) => {
            if (!isPointerDown) return;
            isPointerDown = false;

            const deltaX = e.clientX - pointerStartX;
            const deltaY = e.clientY - pointerStartY;

            if (isDraggingVertically) {
                // Apply Fling Momentum (inertia decay)
                if (Math.abs(scrollVelocity) > 0.2) {
                    const friction = 0.95; // Deceleration rate
                    const step = () => {
                        scrollVelocity *= friction;
                        songSheetElement.scrollTop -= scrollVelocity * 16; // scale by frame interval roughly

                        if (Math.abs(scrollVelocity) > 0.05) {
                            flingAnimationId = requestAnimationFrame(step);
                        } else {
                            cancelAnimationFrame(flingAnimationId);
                            flingAnimationId = null;
                        }
                    };
                    flingAnimationId = requestAnimationFrame(step);
                }
                isDraggingVertically = false;
            } else {
                // Horizontal Swipe / Drag for Song Navigation (> 30px threshold)
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
                    if (deltaX > 0) {
                        navigateSong(-1); // Previous Song
                    } else {
                        navigateSong(1); // Next Song
                    }
                }
            }
        },
        { passive: true }
    );

    songSheetElement.addEventListener(
        "pointercancel",
        () => {
            isPointerDown = false;
            isDraggingVertically = false;
        },
        { passive: true }
    );
}

// 1. Keyboard Arrow Navigation Listeners
document.addEventListener("keydown", (e) => {
    // Ignore if user is typing in an input, textarea, or active modal
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    if (document.getElementById("song-editor-modal")?.classList.contains("hidden") === false) return;
    if (document.getElementById("settings-modal")?.classList.contains("hidden") === false) return;
    if (document.getElementById("folder-modal")?.classList.contains("hidden") === false) return;

    if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateSong(-1); // Previous song
    } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateSong(1); // Next song
    }
});
