import { createIcons, icons } from "lucide";
import { showToast } from "../js/toast.js";
import { triggerFolderSelection } from "../js/storage.js";

export function getRootFolderModalHTML() {
    return `
        <!-- Storage Root Selector Modal -->
        <div
            id="folder-modal"
            class="hidden fixed inset-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
                class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <div class="flex items-center space-x-2 text-[var(--text-color)]">
                        <i data-lucide="folder-tree" class="w-5 h-5"></i>
                        <h3 class="font-bold text-lg text-[var(--text-color)]">Select OpenSong Root Folder</h3>
                    </div>
                    <button
                        id="close-folder-modal"
                        class="p-1 hover:bg-[var(--bg-surface-variant)] rounded text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <p class="text-sm text-[var(--text-hint)] leading-relaxed">
                    Choose your local OpenSong directory containing Songs, Sets, and Settings.
                </p>
                <div id="modal-progress-container" class="hidden text-center py-6 space-y-4">
                    <div class="relative inline-flex items-center justify-center">
                        <div
                            class="w-12 h-12 border-4 border-[var(--color-secondary)]/20 border-t-[var(--color-secondary)] rounded-full animate-spin"></div>
                        <i data-lucide="music" class="w-5 h-5 text-[var(--text-color)] absolute"></i>
                    </div>
                    <h4 class="text-base font-bold text-[var(--text-color)]">Scanning Directory...</h4>
                </div>
                <div id="modal-actions-container" class="space-y-3">
                    <div id="reconnect-folder-container" class="hidden">
                        <button
                            id="modal-reconnect-folder-btn"
                            class="w-full py-3 px-4 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-xl transition flex items-center justify-center space-x-2 mb-2">
                            <i data-lucide="check-circle" class="w-5 h-5"></i>
                            <span>Restore Permission to Saved Folder</span>
                        </button>
                    </div>

                    <button
                        id="modal-select-folder-btn"
                        class="w-full py-3 px-4 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-xl transition flex items-center justify-center space-x-2">
                        <i data-lucide="folder-open" class="w-5 h-5"></i>
                        <span>Select Root Folder</span>
                    </button>
                </div>
                <input type="file" id="fallback-folder-input" webkitdirectory directory multiple class="hidden" />
            </div>
        </div>
    `;
}

export function initRootFolder() {
    // TODO hook up the buttons

    if (document.getElementById("modal-select-folder-btn")) {
        document.getElementById("modal-select-folder-btn").addEventListener("click", triggerFolderSelection());
    }

    if (document.getElementById("fallback-folder-input")) {
        document.getElementById("fallback-folder-input").addEventListener("change", async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;
            for (const file of files) {
                const text = await file.text();
                const path = file.webkitRelativePath || file.name;
                const lower = path.toLowerCase();
                const parts = path.split("/");
                if (lower.endsWith(".pdf")) {
                    const blobUrl = URL.createObjectURL(file);
                    pdfBlobsMap[file.name] = blobUrl;
                    const songObj = {
                        id: "song_pdf_" + Math.random().toString(36).substring(2, 8),
                        filename: file.name,
                        folderPath: "PDFs",
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        isPdf: true,
                        pdfUrl: blobUrl,
                        key: "",
                        uuid: generateUUID(),
                        modified: new Date().toISOString()
                    };
                    addOrUpdateSong(songObj);
                } else if (lower.includes("sets/") || lower.endsWith(".osts")) {
                    const s = parseOpenSongSetXML(text, file.name);
                    if (s) {
                        state.loadedSets.push(s);
                        await writeSetToDisk(s);
                    }
                } else {
                    let folder = "MAIN";
                    const songsIdx = parts.findIndex((p) => p.toLowerCase() === "songs");
                    if (songsIdx !== -1 && parts.length > songsIdx + 2)
                        folder = parts.slice(songsIdx + 1, parts.length - 1).join("/");
                    const song = parseOpenSongXML(text, file.name, folder);
                    if (song) {
                        addOrUpdateSong(song);
                        await writeSongToDisk(song);
                    }
                }
            }

            document.getElementById("folder-status-text").textContent = "Root Folder Loaded";
            document.getElementById("folder-modal").classList.add("hidden");
            state.selectedFolderFilter = "ALL";
            updateTabCounts();
            updateFolderFilterDropdown();
            renderSidebarList();
            showToast("Folder scanned successfully!");
        });
    }

    // Initialize Lucide icons
    createIcons({ icons });
}
