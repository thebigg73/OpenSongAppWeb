// The Javascript for scaling songs, headings, etc.

import { state } from "./state";

let userSettings = {
    autoScale: localStorage.getItem("openSong_autoScale") !== "false",
    maxFontSize: parseInt(localStorage.getItem("openSong_maxFontSize") || "24", 10)
};

// Function to auto-calculate font size or enforce line wrapping
export function applyTextScaling() {
    const sheetContent = document.getElementById("sheet-content");
    if (!sheetContent) return;

    const sections = sheetContent.querySelectorAll("#sheet-content > div");
    if (sections.length === 0) return;

    // Target both chord-lyric lines and pure lyric lines
    const selector = ".chord-lyric-pair-line, .pure-lyric-line";

    if (userSettings.autoScale) {
        let globalMinScale = 1;

        // Pass 1: Find the tightest scale ratio across ALL text lines in the song
        sections.forEach((section) => {
            const sectionInnerWidth = section.clientWidth - 32; // section padding buffer
            section.querySelectorAll(selector).forEach((line) => {
                line.style.flexWrap = "nowrap";
                line.style.whiteSpace = "nowrap";
                line.style.fontSize = `${userSettings.maxFontSize}px`;

                const scrollWidth = line.scrollWidth;
                if (scrollWidth > sectionInnerWidth && scrollWidth > 0) {
                    const ratio = sectionInnerWidth / scrollWidth;
                    if (ratio < globalMinScale) {
                        globalMinScale = ratio;
                    }
                }
            });
        });

        const unifiedSize = Math.max(12, Math.floor(userSettings.maxFontSize * globalMinScale));

        // Proportional chord size calculation
        const chordScaleFactor =
            getComputedStyle(document.documentElement).getPropertyValue("--chord-font-scale").trim() || "0.85rem";
        let chordSize = unifiedSize * 0.85;
        if (chordScaleFactor.includes("rem") || chordScaleFactor.includes("em")) {
            chordSize = unifiedSize * parseFloat(chordScaleFactor);
        }

        // Pass 2: Apply unified font size to everything uniformly
        sections.forEach((section) => {
            section.querySelectorAll(selector).forEach((line) => {
                line.style.fontSize = `${unifiedSize}px`;
                line.querySelectorAll(".chord-above").forEach((chord) => {
                    chord.style.fontSize = `${chordSize}px`;
                });
            });
        });
    } else {
        // Auto-scale disabled: normal wrapping
        sections.forEach((section) => {
            section.querySelectorAll(selector).forEach((line) => {
                line.style.flexWrap = "wrap";
                line.style.whiteSpace = "normal";
                line.style.fontSize = `${userSettings.maxFontSize}px`;
                line.querySelectorAll(".chord-above").forEach((chord) => {
                    chord.style.fontSize = "";
                });
            });
        });
    }
}

export function initScaling() {
    // Call applyTextScaling whenever the window resizes or settings are saved
    window.addEventListener("resize", () => {
        if (state.activeSong) applyTextScaling();
    });

    if (document.getElementById("folder-filter-select")) {
        document.getElementById("fullscreen-toggle-btn").addEventListener("click", toggleAppFullscreen);
    }
}

export function toggleAppFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Enter fullscreen on the root document element
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch((err) => {
                console.warn(`Fullscreen request failed: ${err.message}`);
            });
        } else if (docEl.webkitRequestFullscreen) {
            // Safari compatibility fallback
            docEl.webkitRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}
