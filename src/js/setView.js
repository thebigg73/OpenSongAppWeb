import { createIcons, icons } from "lucide";
import { showToast } from "./toast.js";
import { state } from "./state.js";

// 1. Export the HTML template getter
export function getSetViewHTML() {
    return `
        <article id="set-view-sheet" class="hidden space-y-6 pb-20">
            <div
                class="border-b border-[var(--border-color)] pb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div class="flex items-center gap-2">
                        <span
                            class="px-2 py-0.5 rounded bg-[var(--color-secondary)]/20 text-[var(--text-color)] border border-[var(--color-secondary)]/40 text-xs font-bold"
                            >OpenSong Set</span
                        >
                        <h2 id="set-title" class="text-2xl font-extrabold text-[var(--text-color)]">--</h2>
                    </div>
                    <p id="set-count-info" class="text-sm text-[var(--text-hint)] mt-1">0 Songs in this set</p>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        id="share-set-btn"
                        class="px-3 py-1.5 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] rounded-lg text-xs font-bold flex items-center gap-1.5 transition">
                        <i data-lucide="share-2" class="w-3.5 h-3.5"></i> Share / Export Set
                    </button>
                    <button
                        id="edit-set-btn"
                        class="px-3 py-1.5 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] border border-[var(--border-color)] rounded-lg text-xs font-bold flex items-center gap-1.5 transition">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit Set
                    </button>
                </div>
            </div>
            <div id="set-songs-container" class="space-y-2"></div>
        </article>
    `;
}

// 2. Export the initialization handler for event listeners
export function initSetView() {
    const shareBtn = document.getElementById("share-set-btn");
    const editBtn = document.getElementById("edit-set-btn");

    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            const shareModal = document.getElementById("share-modal");
            if (shareModal) {
                shareModal.classList.remove("hidden");
            } else {
                showToast("Share options opened");
            }
        });
    }

    if (editBtn) {
        editBtn.addEventListener("click", () => {
            // Trigger switching to the set editor tab or opening the set manager
            const setEditorTab = document.getElementById("tab-sets-btn");
            if (setEditorTab) setEditorTab.click();
            showToast("Editing set...");
        });
    }

    // Render initial Lucide icons
    createIcons({ icons });
}

// 3. Export render/populate helper for displaying set content
export function renderSetSheet(setObj) {
    const sheet = document.getElementById("set-view-sheet");
    const titleEl = document.getElementById("set-title");
    const countEl = document.getElementById("set-count-info");
    const container = document.getElementById("set-songs-container");

    if (!sheet || !container) return;

    if (!setObj) {
        sheet.classList.add("hidden");
        return;
    }

    // Set active item in state
    state.activeSet = setObj;

    if (titleEl) titleEl.textContent = setObj.title || setObj.name || "Untitled Set";

    const items = setObj.songs || setObj.songTitles || [];
    if (countEl) countEl.textContent = `${items.length} item${items.length === 1 ? "" : "s"} in this set`;

    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-sm text-[var(--text-hint)] italic">This set is currently empty.</div>`;
    } else {
        items.forEach((item, idx) => {
            const itemDiv = document.createElement("div");
            itemDiv.className =
                "p-3 rounded-xl bg-[var(--bg-primary-variant)] border border-[var(--border-color)] flex items-center justify-between hover:border-[var(--color-secondary)]/40 transition cursor-pointer";

            // Check custom note/divider vs regular song
            if (typeof item === "object" && item.type === "custom") {
                if (item.name === "# Divider #") {
                    itemDiv.className =
                        "p-2.5 rounded-xl bg-[var(--bg-primary)]/40 border border-dashed border-[var(--border-color)] flex items-center gap-2";
                    itemDiv.innerHTML = `
                        <i data-lucide="minus" class="w-4 h-4 text-[var(--text-hint)]"></i>
                        <span class="text-xs font-bold uppercase tracking-wider text-[var(--text-hint)]">Divider</span>
                    `;
                } else if (item.name === "# Note #") {
                    itemDiv.className =
                        "p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5";
                    itemDiv.innerHTML = `
                        <i data-lucide="file-text" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>
                        <div>
                            <div class="text-xs font-bold text-[var(--text-color)]">Note</div>
                            <div class="text-xs text-[var(--text-hint)] mt-0.5 whitespace-pre-wrap">${item.notes || ""}</div>
                        </div>
                    `;
                }
            } else {
                const songTitle = typeof item === "object" ? item.title : item;
                const foundSong = state.loadedSongs.find((s) => s.title.toLowerCase() === songTitle.toLowerCase());
                const key = (typeof item === "object" ? item.prefKey : null) || (foundSong ? foundSong.key : "--");

                itemDiv.innerHTML = `
                    <div class="flex items-center space-x-3 truncate">
                        <span class="text-xs font-mono text-[var(--text-hint)] shrink-0">${idx + 1}</span>
                        <div class="truncate">
                            <div class="font-bold text-sm text-[var(--text-color)] truncate">${songTitle}</div>
                            <div class="text-xs text-[var(--text-hint)] truncate">${foundSong ? foundSong.author || "Unknown Author" : "Song in set"}</div>
                        </div>
                    </div>
                    <span class="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--color-secondary)] font-semibold border border-[var(--border-color)]">${key}</span>
                `;

                if (foundSong) {
                    itemDiv.addEventListener("click", () => {
                        // Open song sheet logic
                        if (typeof window.renderSongSheet === "function") {
                            window.renderSongSheet(foundSong, setObj, idx);
                        }
                    });
                }
            }

            container.appendChild(itemDiv);
        });
    }

    sheet.classList.remove("hidden");
    createIcons({ icons });
}
