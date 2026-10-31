// Everything to do with the navigation bar

// Set Navigation Wiring (<, >, Back to Set)
function setupSetNavigationListeners() {
    const backToSetBtn = document.getElementById("back-to-set-btn");
    const prevBtn = document.getElementById("prev-set-song-btn");
    const nextBtn = document.getElementById("next-set-song-btn");

    // Hook up your "Back to set" button click handler
    if (backToSetBtn) {
        backToSetBtn.addEventListener("click", () => {
            // 1. Switch the sidebar tab state to "sets"
            activeTab = "sets";

            // Update tab button UI classes
            const songsTabBtn = document.getElementById("tab-songs-btn");
            const setsTabBtn = document.getElementById("tab-sets-btn");
            if (songsTabBtn && setsTabBtn) {
                songsTabBtn.className =
                    "flex-1 py-1.5 text-xs font-bold rounded-md text-[var(--text-hint)] hover:text-[var(--text-color)] hover:bg-[var(--bg-surface-variant)]/60 flex items-center justify-center gap-1.5 transition";
                setsTabBtn.className =
                    "flex-1 py-1.5 text-xs font-bold rounded-md bg-[var(--color-secondary)] text-[var(--text-color)] flex items-center justify-center gap-1.5 transition";
            }

            // 2. Properly open the sidebar and remove closed/off-screen classes
            const sidebar = document.getElementById("sidebar");
            const backdrop = document.getElementById("sidebar-backdrop");
            if (sidebar) {
                sidebar.classList.remove("closed", "-translate-x-full");
                sidebar.style.width = ""; // Reset inline width override if any
            }
            if (backdrop) {
                backdrop.classList.remove("hidden");
            }

            // 3. Render the current active set inside the sidebar
            if (typeof currentSet !== "undefined" && currentSet) {
                renderSetSheet(currentSet);
            } else if (typeof renderSidebarList === "function") {
                renderSidebarList();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (!activeSet || activeSetSongIndex <= 0) return;
            activeSetSongIndex--;
            loadSongFromActiveSet(activeSetSongIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (!activeSet || activeSetSongIndex >= activeSet.songTitles.length - 1) return;
            activeSetSongIndex++;
            loadSongFromActiveSet(activeSetSongIndex);
        });
    }
}
