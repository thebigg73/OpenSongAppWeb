// The Javascript to deal with the autoscroll feature
import { createIcons, icons } from "lucide";
import { state } from "./state.js";
import { showToast } from "./toast.js";

let isAutoscrolling = false;
let autoscrollAnimationId = null;
let scrollStartTime = null;
let preDelayTimeout = null;
let pausedScrollTop = 0;

export function initAutoscroll() {
    const toggleBtn = document.getElementById("autoscroll-toggle-btn");
    const slider = document.getElementById("autoscroll-slider");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            if (!state.activeSong) {
                showToast("No active song to autoscroll.");
                return;
            }
            toggleAutoscroll();
        });
    }

    if (slider) {
        slider.addEventListener("input", (e) => {
            // If already scrolling, adjust timing dynamically based on new speed multiplier
            if (isAutoscrolling) {
                // Re-sync start time smoothly based on current scroll position
                const songSheet = document.getElementById("song-sheet");
                if (songSheet) {
                    const maxScroll = songSheet.scrollHeight - songSheet.clientHeight;
                    const currentProgress = maxScroll > 0 ? songSheet.scrollTop / maxScroll : 0;
                    const durationSec = getSongDuration(state.activeSong);
                    const preDelaySec = getSongPreDelay(state.activeSong);
                    const speedMultiplier = parseFloat(e.target.value) || 1;
                    const activeScrollDuration = Math.max(10, (durationSec - preDelaySec) / speedMultiplier);

                    scrollStartTime = performance.now() - currentProgress * activeScrollDuration * 1000;
                }
            }
        });
    }

    updateAutoscrollInfo();
}

function getSongDuration(song) {
    if (song && song.duration && !isNaN(parseInt(song.duration, 10))) {
        return parseInt(song.duration, 10);
    }
    // Fallback to user setting in localStorage or default 180s (3 minutes)
    const savedDefault = localStorage.getItem("defaultSongDuration");
    return savedDefault ? parseInt(savedDefault, 10) : 180;
}

function getSongPreDelay(song) {
    if (song && song.predelay && !isNaN(parseInt(song.predelay, 10))) {
        return parseInt(song.predelay, 10);
    }
    return 10; // Default 10s pre-delay
}

export function updateAutoscrollInfo(song = state.activeSong) {
    stopAutoscroll();

    const durationLabel = document.getElementById("song-duration-label");
    const predelayLabel = document.getElementById("song-predelay-label");
    const statusVal = document.getElementById("autoscroll-status-val");

    if (!song) {
        if (durationLabel) durationLabel.textContent = "--";
        if (predelayLabel) predelayLabel.textContent = "--";
        if (statusVal) statusVal.textContent = "No Song";
        return;
    }

    const durationSec = getSongDuration(song);
    const preDelaySec = getSongPreDelay(song);

    // Format minutes & seconds for labels
    const formatTime = (sec) => {
        const mins = Math.floor(sec / 60);
        const remSec = sec % 60;
        return mins > 0 ? `${mins}m ${remSec}s` : `${remSec}s`;
    };

    if (durationLabel) durationLabel.textContent = formatTime(durationSec);
    if (predelayLabel) predelayLabel.textContent = `${preDelaySec}s`;
    if (statusVal) statusVal.textContent = "Ready";
}

export function toggleAutoscroll() {
    if (isAutoscrolling) {
        stopAutoscroll();
        showToast("Autoscroll paused");
    } else {
        startAutoscroll();
        showToast("Autoscroll started");
    }
}

export function startAutoscroll() {
    const songSheet = document.getElementById("song-sheet");
    const statusVal = document.getElementById("autoscroll-status-val");
    const toggleBtn = document.getElementById("autoscroll-toggle-btn");

    if (!songSheet || !state.activeSong) return;

    const maxScroll = songSheet.scrollHeight - songSheet.clientHeight;
    if (maxScroll <= 0) {
        showToast("Song fits entirely on screen.");
        return;
    }

    isAutoscrolling = true;
    if (toggleBtn) {
        toggleBtn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i>`;
        createIcons({ icons });
    }

    const preDelaySec = getSongPreDelay(state.activeSong);
    const durationSec = getSongDuration(state.activeSong);
    const slider = document.getElementById("autoscroll-slider");
    const speedMultiplier = slider ? parseFloat(slider.value) || 1 : 1;

    const activeScrollDuration = Math.max(5, (durationSec - preDelaySec) / speedMultiplier);

    if (statusVal) statusVal.textContent = preDelaySec > 0 ? `Pre-delay (${preDelaySec}s)...` : "Scrolling...";

    // Handle pre-delay phase before animation loop begins
    const beginScrollAnimation = () => {
        if (!isAutoscrolling) return;
        if (statusVal) statusVal.textContent = "Scrolling...";

        scrollStartTime = performance.now();

        const step = (currentTime) => {
            if (!isAutoscrolling) return;

            const elapsedSec = (currentTime - scrollStartTime) / 1000;
            const progress = Math.min(1, elapsedSec / activeScrollDuration);

            songSheet.scrollTop = progress * maxScroll;

            if (progress < 1) {
                autoscrollAnimationId = requestAnimationFrame(step);
            } else {
                stopAutoscroll();
                if (statusVal) statusVal.textContent = "Finished";
                showToast("Autoscroll finished");
            }
        };

        autoscrollAnimationId = requestAnimationFrame(step);
    };

    if (preDelaySec > 0 && songSheet.scrollTop === 0) {
        preDelayTimeout = setTimeout(beginScrollAnimation, preDelaySec * 1000);
    } else {
        beginScrollAnimation();
    }
}

export function stopAutoscroll() {
    isAutoscrolling = false;

    if (preDelayTimeout) {
        clearTimeout(preDelayTimeout);
        preDelayTimeout = null;
    }

    if (autoscrollAnimationId) {
        cancelAnimationFrame(autoscrollAnimationId);
        autoscrollAnimationId = null;
    }

    const toggleBtn = document.getElementById("autoscroll-toggle-btn");
    const statusVal = document.getElementById("autoscroll-status-val");

    if (toggleBtn) {
        toggleBtn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i>`;
        createIcons({ icons });
    }

    if (statusVal && statusVal.textContent !== "Finished") {
        statusVal.textContent = "Ready";
    }
}
