import { createIcons, icons } from "lucide";
import { state } from "./state.js";
import { showToast } from "./toast.js";
import { addOrUpdateSong, writeSongToDisk, renderSongSheet } from "./song.js";
import { renderSidebarList } from "./sidebar.js";

let capoDisplayMode = localStorage.getItem("capoDisplayMode") || "both";
let currentTransposeOffset = 0;

export function getTransposeModalHTML() {
    return `
        <!-- Transpose Modal Sheet -->
        <div
            id="transpose-modal"
            class="fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <h3 class="font-bold text-[var(--text-color)] text-sm flex items-center gap-2">
                        <i data-lucide="sliders-horizontal" class="w-4 h-4"></i> Transpose Song
                    </h3>
                    <button id="close-transpose-modal" class="text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Current & Transposed Key Info Box -->
                <div class="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)] space-y-1.5 text-xs">
                    <div class="flex justify-between items-center">
                        <span class="text-[var(--text-hint)]">Current Key:</span>
                        <span id="transpose-current-key" class="font-bold font-mono text-[var(--text-color)]">Not Set</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-[var(--text-hint)]">Transposed Key:</span>
                        <span id="transpose-new-key" class="font-bold font-mono text-[var(--color-secondary)]">—</span>
                    </div>
                </div>

                <!-- Range Slider Control (-12 to +12) -->
                <div class="space-y-2 py-1">
                    <div class="flex justify-between text-xs">
                        <span class="text-[var(--text-hint)] font-semibold">Semitone Steps:</span>
                        <span id="transpose-steps-val" class="font-mono font-bold text-[var(--text-color)]">0</span>
                    </div>
                    <input
                        type="range"
                        id="transpose-slider"
                        min="-12"
                        max="12"
                        step="1"
                        value="0"
                        class="w-full accent-[var(--color-secondary)] h-1.5 bg-[var(--bg-primary)] rounded-lg cursor-pointer" />
                    <div class="flex justify-between text-[10px] text-[var(--text-hint)] font-mono">
                        <span>-12</span>
                        <span>0</span>
                        <span>+12</span>
                    </div>
                </div>

                <!-- Modal Actions -->
                <div class="flex gap-2 pt-1">
                    <button
                        id="modal-reset-transpose"
                        class="flex-1 py-2 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] font-bold rounded-xl text-xs transition border border-[var(--border-color)]">
                        Reset
                    </button>
                    <button
                        id="modal-save-key-btn"
                        class="flex-1 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] font-bold rounded-xl text-xs transition border border-[var(--border-color)]">
                        Save Key
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function getCapoModalHTML() {
    return `
        <!-- Capo Value Modal Sheet -->
        <div
            id="capo-modal"
            class="fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <h3 class="font-bold text-[var(--text-color)] text-sm flex items-center gap-2">
                        <i data-lucide="sliders" class="w-4 h-4 text-[var(--color-secondary)]"></i> Set Capo Position
                    </h3>
                    <button id="close-capo-modal" class="text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-semibold text-[var(--text-hint)]">Capo Fret / Position:</label>
                    <select
                        id="capo-select-dropdown"
                        class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-color)] font-mono focus:outline-none focus:border-[var(--color-secondary)]">
                        <option value="0">0 (No Capo)</option>
                        <option value="1">Capo 1</option>
                        <option value="2">Capo 2</option>
                        <option value="3">Capo 3</option>
                        <option value="4">Capo 4</option>
                        <option value="5">Capo 5</option>
                        <option value="6">Capo 6</option>
                        <option value="7">Capo 7</option>
                        <option value="8">Capo 8</option>
                        <option value="9">Capo 9</option>
                        <option value="10">Capo 10</option>
                        <option value="11">Capo 11</option>
                        <option value="12">Capo 12</option>
                    </select>
                </div>

                <div class="flex gap-2 pt-1">
                    <button
                        id="modal-remove-capo-btn"
                        class="flex-1 py-2 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] font-bold rounded-xl text-xs transition border border-[var(--border-color)]">
                        Remove
                    </button>
                    <button
                        id="modal-save-capo-btn"
                        class="flex-1 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] font-bold rounded-xl text-xs transition border border-[var(--border-color)]">
                        Save Capo
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function openTransposeModal() {
    const modal = document.getElementById("transpose-modal");
    const slider = document.getElementById("transpose-slider");
    const stepsVal = document.getElementById("transpose-steps-val");
    const currentKeyEl = document.getElementById("transpose-current-key");
    const newKeyEl = document.getElementById("transpose-new-key");

    if (!modal) return;

    if (slider) slider.value = 0;
    if (stepsVal) stepsVal.textContent = "0";

    const origKey = state.activeSong && state.activeSong.key ? state.activeSong.key.trim() : "";
    if (currentKeyEl) {
        currentKeyEl.textContent = origKey ? origKey : "Not Set";
    }
    if (newKeyEl) {
        newKeyEl.textContent = origKey ? origKey : "Not Set";
    }

    modal.classList.remove("hidden");
    createIcons({ icons });
}

export function openCapoModal() {
    const modal = document.getElementById("capo-modal");
    const dropdown = document.getElementById("capo-select-dropdown");
    if (!modal) return;

    if (dropdown) {
        const currentCapo = state.activeSong && state.activeSong.capo ? parseInt(state.activeSong.capo, 10) : 0;
        dropdown.value = isNaN(currentCapo) ? "0" : currentCapo.toString();
    }

    modal.classList.remove("hidden");
    createIcons({ icons });
}

export function updateCapoBadge() {
    const modeBadge = document.getElementById("sheet-capo-mode-badge");
    if (!modeBadge) return;

    if (!state.activeSong || !state.activeSong.capo || state.activeSong.capo === "0") {
        modeBadge.classList.add("hidden");
        return;
    }

    modeBadge.classList.remove("hidden");
    const mode = getCapoDisplayMode();
    let modeLabel = "Native";
    if (mode === "capo") modeLabel = "Capo";
    else if (mode === "both") modeLabel = "Both";

    modeBadge.textContent = modeLabel;
}

export function transposeChord(chord, semitones) {
    if (!chord) return "";

    if (chord.includes("/")) {
        const parts = chord.split("/");
        return parts.map((part) => transposeChord(part, semitones)).join("/");
    }

    const notesSharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const notesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

    const match = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return chord;

    let root = match[1];
    let extension = match[2];

    let index = notesSharp.indexOf(root);
    if (index === -1) index = notesFlat.indexOf(root);
    if (index === -1) return chord;

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    let newRoot = root.includes("b") ? notesFlat[newIndex] : notesSharp[newIndex];
    return newRoot + extension;
}

export function transposeSongLyricsText(lyrics, semitones) {
    if (!lyrics) return "";
    const lines = lyrics.split("\n");
    return lines
        .map((line) => {
            if (line.startsWith(".")) {
                const chordLine = line.slice(1);
                const transposed = chordLine.replace(/([A-G][b#]?[^\s]*)/g, (match) => {
                    return transposeChord(match, semitones);
                });
                return "." + transposed;
            }
            return line;
        })
        .join("\n");
}

export function initChords() {
    const transposeModal = document.getElementById("transpose-modal");
    const closeTransposeBtn = document.getElementById("close-transpose-modal");
    const transposeSlider = document.getElementById("transpose-slider");
    const stepsVal = document.getElementById("transpose-steps-val");
    const newKeyEl = document.getElementById("transpose-new-key");
    const resetBtn = document.getElementById("modal-reset-transpose");
    const saveKeyBtn = document.getElementById("modal-save-key-btn");

    if (closeTransposeBtn && transposeModal) {
        closeTransposeBtn.addEventListener("click", () => transposeModal.classList.add("hidden"));
    }

    if (transposeSlider) {
        transposeSlider.addEventListener("input", (e) => {
            const steps = parseInt(e.target.value, 10);
            if (stepsVal) {
                stepsVal.textContent = steps > 0 ? `+${steps}` : `${steps}`;
            }

            if (state.activeSong) {
                state.activeSong.transposeOffset = steps;
                renderSongSheet(state.activeSong, state.activeSet);
            }

            const origKey = state.activeSong && state.activeSong.key ? state.activeSong.key.trim() : "";
            if (newKeyEl) {
                if (origKey) {
                    newKeyEl.textContent = transposeChord(origKey, steps);
                } else {
                    newKeyEl.textContent = "Not Set";
                }
            }
        });
    }

    if (resetBtn && transposeSlider) {
        resetBtn.addEventListener("click", () => {
            transposeSlider.value = 0;
            if (stepsVal) stepsVal.textContent = "0";
            if (state.activeSong) {
                state.activeSong.transposeOffset = 0;
                renderSongSheet(state.activeSong, state.activeSet);
            }
            const origKey = state.activeSong && state.activeSong.key ? state.activeSong.key.trim() : "";
            if (newKeyEl) newKeyEl.textContent = origKey ? origKey : "Not Set";
        });
    }

    if (saveKeyBtn) {
        saveKeyBtn.addEventListener("click", async () => {
            if (!state.activeSong) {
                showToast("No active song selected.");
                return;
            }

            const steps = transposeSlider ? parseInt(transposeSlider.value, 10) : 0;
            if (steps === 0) {
                transposeModal?.classList.add("hidden");
                return;
            }

            const origKey = state.activeSong.key ? state.activeSong.key.trim() : "";
            const newKey = origKey ? transposeChord(origKey, steps) : "";

            state.activeSong.lyrics = transposeSongLyricsText(state.activeSong.lyrics, steps);
            if (newKey) {
                state.activeSong.key = newKey;
            }
            state.activeSong.transposeOffset = 0;
            state.activeSong.modified = new Date().toISOString();

            addOrUpdateSong(state.activeSong);

            const searchInput = document.getElementById("song-search-input");
            renderSidebarList(searchInput ? searchInput.value.toLowerCase() : "");

            renderSongSheet(state.activeSong, state.activeSet);

            if (typeof writeSongToDisk === "function") {
                await writeSongToDisk(state.activeSong);
            }

            transposeModal?.classList.add("hidden");
            showToast(newKey ? `Key updated and saved as ${newKey}` : `Song transposed by ${steps} steps`);
        });
    }

    // Capo Modal listeners
    const capoModal = document.getElementById("capo-modal");
    const closeCapoBtn = document.getElementById("close-capo-modal");
    const saveCapoBtn = document.getElementById("modal-save-capo-btn");
    const removeCapoBtn = document.getElementById("modal-remove-capo-btn");
    const dropdown = document.getElementById("capo-select-dropdown");

    if (closeCapoBtn && capoModal) {
        closeCapoBtn.addEventListener("click", () => capoModal.classList.add("hidden"));
    }

    if (removeCapoBtn) {
        removeCapoBtn.addEventListener("click", () => {
            if (dropdown) dropdown.value = "0";
            saveCapoValue("0");
        });
    }

    if (saveCapoBtn) {
        saveCapoBtn.addEventListener("click", () => {
            const val = dropdown ? dropdown.value : "0";
            saveCapoValue(val);
        });
    }
}

function saveCapoValue(val) {
    if (!state.activeSong) {
        showToast("No active song selected.");
        return;
    }

    const trimmed = val.trim();
    state.activeSong.capo = trimmed === "0" || trimmed === "" ? "" : trimmed;
    state.activeSong.modified = new Date().toISOString();

    addOrUpdateSong(state.activeSong);

    const searchInput = document.getElementById("song-search-input");
    renderSidebarList(searchInput ? searchInput.value.toLowerCase() : "");
    renderSongSheet(state.activeSong, state.currentSet);

    if (typeof writeSongToDisk === "function") {
        writeSongToDisk(state.activeSong);
    }

    document.getElementById("capo-modal")?.classList.add("hidden");
    showToast(state.activeSong.capo ? `Capo set to ${state.activeSong.capo}` : "Capo removed");
}

export function getCapoDisplayMode() {
    return capoDisplayMode;
}

export function setCapoDisplayMode(newCapoDisplayMode) {
    capoDisplayMode = newCapoDisplayMode;
}

export function getCurrentTransposeOffset() {
    return currentTransposeOffset;
}

export function setCurrentTransposeOffset(newCurrentTransposeOffset) {
    currentTransposeOffset = newCurrentTransposeOffset;
}
