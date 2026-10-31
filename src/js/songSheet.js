import { createIcons, icons } from "lucide";
import { showToast } from "./toast.js";
import { openNewSongEditor, openEditSongEditor } from "./songEditor.js";
import { state } from "./state.js";

// 1. Export the HTML template getter
export function getSongSheetHTML() {
    return `
        <article
            id="song-sheet"
            class="hidden flex-1 flex flex-col h-full w-full overflow-y-auto p-4 bg-[var(--bg-primary)]"
            style="touch-action: pan-y">

            <!-- Set Navigation Banner -->
            <div
                id="set-navigation-banner"
                class="hidden bg-[var(--bg-surface-variant)] border border-[var(--border-color)] rounded-xl p-3 flex items-center justify-between mb-4">
                <button
                    id="back-to-set-btn"
                    class="text-xs text-[var(--text-color)] hover:text-[var(--text-hint)] flex items-center gap-1 font-semibold">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i> Back to Set:
                    <span id="banner-set-title" class="underline">--</span>
                </button>
                <div class="flex items-center gap-1">
                    <button
                        id="prev-set-song-btn"
                        class="p-1 bg-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/40 rounded text-[var(--text-color)] transition">
                        <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    </button>
                    <span id="set-song-index-label" class="text-xs font-mono text-[var(--text-hint)] px-2">1 / 5</span>
                    <button
                        id="next-set-song-btn"
                        class="p-1 bg-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/40 rounded text-[var(--text-color)] transition">
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <!-- Header Info -->
            <div class="border-b border-[var(--border-color)] pb-4 mb-4">
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                    <h2
                        id="sheet-title"
                        class="text-3xl font-extrabold text-[var(--text-color)] tracking-tight">
                        --
                    </h2>
                    <div class="flex items-center gap-2">
                        <span
                            id="sheet-folder-path"
                            class="px-2 py-0.5 text-xs rounded bg-[var(--bg-surface-variant)] text-[var(--text-hint)] border border-[var(--border-color)] truncate max-w-[200px]"
                            >MAIN</span
                        >
                        <span
                            id="sheet-key-badge"
                            class="px-2.5 py-1 text-xs font-bold rounded-md bg-[var(--bg-surface-variant)] text-[var(--chord-color)] border border-[var(--border-color)]"
                            >Key: -</span
                        >
                        <span
                            id="sheet-capo-badge"
                            class="hidden px-2.5 py-1 text-xs font-bold rounded-md bg-[var(--bg-surface-variant)] text-[var(--capo-color)] border border-[var(--border-color)]"
                            >Capo: 2</span
                        >
                        <button
                            id="open-notes-popup-btn"
                            class="hidden p-1.5 bg-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title="Show Sticky Notes">
                            <i data-lucide="sticky-note" class="w-3.5 h-3.5"></i>
                        </button>
                        <button
                            id="open-abc-popup-btn"
                            class="hidden p-1.5 bg-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title="Show ABC Notation">
                            <i data-lucide="music" class="w-3.5 h-3.5"></i>
                        </button>
                        <button
                            id="share-song-btn"
                            class="px-3 py-1.5 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] rounded-lg text-xs font-bold flex items-center gap-1.5 transition">
                            <i data-lucide="share-2" class="w-3.5 h-3.5"></i> Share Song
                        </button>
                        <button
                            id="edit-song-btn"
                            class="p-1.5 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] border border-[var(--border-color)] rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title="Edit Song">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
                <p id="sheet-author" class="text-sm text-[var(--text-hint)] mt-1">--</p>
            </div>

            <!-- Expanded full-width content container -->
            <div id="sheet-content" class="w-full flex-1 space-y-4 pb-20"></div>

            <!-- Footer Meta -->
            <footer
                id="sheet-footer"
                class="border-t border-[var(--border-color)] pt-4 text-xs text-[var(--text-hint)] space-y-1 mt-auto">
                <div id="sheet-copyright"></div>
                <div id="sheet-ccli"></div>
            </footer>
        </article>
    `;
}

// 2. Export initialization logic for DOM handlers
export function initSongSheet() {
    const backToSetBtn = document.getElementById("back-to-set-btn");
    const prevSongBtn = document.getElementById("prev-set-song-btn");
    const nextSongBtn = document.getElementById("next-set-song-btn");
    const notesBtn = document.getElementById("open-notes-popup-btn");
    const abcBtn = document.getElementById("open-abc-popup-btn");
    const shareBtn = document.getElementById("share-song-btn");
    const editBtn = document.getElementById("edit-song-btn");

    if (backToSetBtn) {
        backToSetBtn.addEventListener("click", () => {
            const setSheet = document.getElementById("set-view-sheet");
            const songSheet = document.getElementById("song-sheet");
            if (setSheet && songSheet) {
                songSheet.classList.add("hidden");
                setSheet.classList.remove("hidden");
            }
        });
    }

    if (prevSongBtn) {
        prevSongBtn.addEventListener("click", () => {
            if (typeof window.navigateSetSong === "function") {
                window.navigateSetSong(-1);
            }
        });
    }

    if (nextSongBtn) {
        nextSongBtn.addEventListener("click", () => {
            if (typeof window.navigateSetSong === "function") {
                window.navigateSetSong(1);
            }
        });
    }

    if (notesBtn) {
        notesBtn.addEventListener("click", () => {
            const stickyNote = document.getElementById("sticky-note-popup");
            if (stickyNote) stickyNote.classList.toggle("hidden");
        });
    }

    if (abcBtn) {
        abcBtn.addEventListener("click", () => {
            const abcPopup = document.getElementById("abc-popup");
            if (abcPopup) abcPopup.classList.toggle("hidden");
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            const shareModal = document.getElementById("share-modal");
            if (shareModal) {
                shareModal.classList.remove("hidden");
            } else {
                showToast("Share modal opened");
            }
        });
    }

    if (editBtn) {
        editBtn.addEventListener("click", () => {
            openEditSongEditor(state.activeSong);
        });
    }

    createIcons({ icons });
}
