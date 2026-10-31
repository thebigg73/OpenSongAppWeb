import { createIcons, icons } from "lucide";
import { showToast } from "../js/toast.js";

// 1. Export the HTML template function (Getter pattern)
export function getHeaderHTML() {
    return `
        <header
            class="h-16 bg-[var(--bg-primary-variant)] border-b border-[var(--border-color)] px-4 flex items-center justify-between z-20 shrink-0">
            <div class="flex items-center space-x-3">
                <button
                    id="toggle-sidebar-btn"
                    class="p-2 hover:bg-[var(--bg-surface-variant)] rounded-lg text-[var(--text-hint)] hover:text-[var(--text-color)] transition"
                    title="Toggle Sidebar">
                    <i data-lucide="menu" class="w-5 h-5"></i>
                </button>
                <div class="flex items-center space-x-2">
                    <div class="p-2 bg-[var(--color-secondary)]/20 text-[var(--text-color)] rounded-lg flex items-center gap-1.5 font-bold text-xs">
                        <i data-lucide="music" class="w-5 h-5"></i> BETA
                    </div>
                </div>
            </div>



            <!-- Top Control Bar Container -->
            <div class="flex items-center gap-2 overflow-x-auto py-2 shrink-0 no-scrollbar">
                <button
                    id="cast-display-btn"
                    class="p-2 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-hint)] hover:text-[var(--text-color)] rounded-lg transition border border-[var(--border-color)]"
                    title="Open Stage Secondary Display Window">
                    <i data-lucide="monitor-play" class="w-5 h-5"></i>
                </button>

                <button
                    id="fullscreen-toggle-btn"
                    class="p-2 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-hint)] hover:text-[var(--text-color)] rounded-lg transition border border-[var(--border-color)]"
                    title="Fullscreen toggle">
                    <i data-lucide="maximize" class="w-5 h-5"></i>
                </button>

                <button
                    id="open-settings-btn"
                    class="p-2 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-hint)] hover:text-[var(--text-color)] rounded-lg transition border border-[var(--border-color)]"
                    title="Application Settings">
                    <i data-lucide="settings" class="w-5 h-5"></i>
                </button>

                <button
                    id="change-folder-btn"
                    class="p-2 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-hint)] hover:text-[var(--text-color)] rounded-lg transition border border-[var(--border-color)]"
                    title="Change Storage Directory">
                    <i data-lucide="folder-open" class="w-5 h-5"></i>
                </button>
            </div>
        </header>
    `;
}

// 2. Export the initialization logic to wire up its actions and icons
export function initHeader() {
    const castBtn = document.getElementById("cast-display-btn");
    const fullscreenBtn = document.getElementById("fullscreen-toggle-btn");
    const settingsBtn = document.getElementById("open-settings-btn");

    if (castBtn) {
        castBtn.addEventListener("click", () => {
            // Trigger your secondary display / cast logic here
            showToast("Secondary display window toggled");
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => {
                    showToast(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            // Trigger your settings modal open logic here
            const settingsModal = document.getElementById("settings-modal");
            if (settingsModal) settingsModal.classList.remove("hidden");
        });
    }

    // Initialize Lucide icons for the injected header buttons
    createIcons({ icons });
}
