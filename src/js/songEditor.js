import { createIcons, icons } from "lucide";
import { state } from "./state.js";
import { showToast } from "./toast.js";
import { addOrUpdateSong, renderSongSheet, writeSongToDisk, ensureSongContentLoaded } from "./song.js";
import { renderSidebarList } from "./sidebar.js";

export function getSongEditorHTML() {
    return `
        <!-- Comprehensive Tabbed Song Editor Modal (Virtually Full Screen) -->
        <div
            id="song-editor-modal"
            class="hidden fixed inset-0 z-50 bg-[var(--bg-primary)]/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
            <div
                class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl w-full h-full max-w-none max-h-none p-4 sm:p-6 shadow-2xl space-y-4 flex flex-col">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
                    <h3 id="song-editor-title" class="font-bold text-base sm:text-lg text-[var(--text-color)]">Create / Edit Song</h3>
                    <button
                        id="close-song-editor"
                        class="p-1.5 hover:bg-[var(--bg-surface-variant)] rounded-lg text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <div
                    class="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-color)] shrink-0 gap-1 overflow-x-auto">
                    <button
                        data-editors-tab="lyrics"
                        class="editor-tab-btn flex-1 py-2 px-4 text-xs sm:text-sm font-bold rounded-lg bg-[var(--color-secondary)] text-[var(--text-color)] transition">
                        Lyrics
                    </button>
                    <button
                        data-editors-tab="main"
                        class="editor-tab-btn flex-1 py-2 px-4 text-xs sm:text-sm font-bold rounded-lg text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        Main
                    </button>
                    <button
                        data-editors-tab="features"
                        class="editor-tab-btn flex-1 py-2 px-4 text-xs sm:text-sm font-bold rounded-lg text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        Song features
                    </button>
                    <button
                        data-editors-tab="tags"
                        class="editor-tab-btn flex-1 py-2 px-4 text-xs sm:text-sm font-bold rounded-lg text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        Tags
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto space-y-4 pr-1 flex flex-col">
                    <div id="editor-pane-lyrics" class="editor-pane space-y-3 text-xs sm:text-sm flex flex-col flex-1">
                        <div>
                            <label class="font-bold text-[var(--text-color)] block mb-1"
                                >Presentation Order e.g. V1 C V2 C</label
                            ><input
                                type="text"
                                id="edit-song-presentation-input"
                                class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] font-mono text-xs sm:text-sm" />
                        </div>
                        <div class="flex flex-col flex-1">
                            <label class="font-bold text-[var(--text-color)] block mb-1"
                                >Lyrics & Chords (OpenSong Format)</label
                            >
                            <textarea
                                id="edit-song-lyrics-input"
                                class="w-full flex-1 min-h-[350px] sm:min-h-[450px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 font-mono text-xs sm:text-sm text-[var(--text-color)] resize-none"
                                placeholder="[V1]&#10;.C      G&#10;Amazing grace..."></textarea>
                        </div>
                    </div>

                    <div id="editor-pane-main" class="editor-pane hidden space-y-4 text-xs sm:text-sm">
                        <div>
                            <label class="font-bold text-[var(--text-color)] block mb-1">Title *</label
                            ><input
                                type="text"
                                id="edit-song-title-input"
                                class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] text-xs sm:text-sm" />
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="font-bold text-[var(--text-color)] block mb-1">Folder</label>
                                <select
                                    id="edit-song-folder-select"
                                    class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] font-mono text-xs sm:text-sm">
                                    <option value="MAIN">MAIN</option>
                                    <option value="NEW_FOLDER">+ Create New Folder...</option>
                                </select>
                                <input
                                    type="text"
                                    id="edit-song-new-folder-input"
                                    placeholder="Enter new folder name..."
                                    class="hidden mt-2 w-full bg-[var(--bg-primary)] border border-[var(--color-secondary)]/50 rounded-lg p-2.5 text-[var(--text-color)] font-mono text-xs sm:text-sm" />
                            </div>
                            <div>
                                <label class="font-bold text-[var(--text-color)] block mb-1"
                                    >Filename (No Extension)</label
                                ><input
                                    type="text"
                                    id="edit-song-filename-input"
                                    class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] font-mono text-xs sm:text-sm" />
                            </div>
                        </div>
                    </div>

                    <div id="editor-pane-features" class="editor-pane hidden space-y-4 text-xs sm:text-sm">
                        <div>
                            <label class="font-bold text-[var(--text-color)] block mb-1">Author / Artist</label
                            ><input
                                type="text"
                                id="edit-song-author-input"
                                class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] text-xs sm:text-sm" />
                        </div>
                        <div>
                            <label class="font-bold text-[var(--text-color)] block mb-1">Copyright</label
                            ><input
                                type="text"
                                id="edit-song-copyright-input"
                                class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] text-xs sm:text-sm" />
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class="font-bold text-[var(--text-color)] block mb-1">Key</label>
                                <select
                                    id="edit-song-key-input"
                                    class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] font-mono text-xs sm:text-sm">
                                    <option value="C">C</option>
                                    <option value="C#">C#</option>
                                    <option value="Db">Db</option>
                                    <option value="D">D</option>
                                    <option value="D#">D#</option>
                                    <option value="Eb">Eb</option>
                                    <option value="E">E</option>
                                    <option value="F">F</option>
                                    <option value="F#">F#</option>
                                    <option value="Gb">Gb</option>
                                    <option value="G">G</option>
                                    <option value="G#">G#</option>
                                    <option value="Ab">Ab</option>
                                    <option value="A">A</option>
                                    <option value="A#">A#</option>
                                    <option value="Bb">Bb</option>
                                    <option value="B">B</option>
                                </select>
                            </div>
                            <div>
                                <label class="font-bold text-[var(--text-color)] block mb-1">Capo Fret</label>
                                <select
                                    id="edit-song-capo-input"
                                    class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] font-mono text-xs sm:text-sm">
                                    <option value="">None</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                    <option value="6">6</option>
                                    <option value="7">7</option>
                                </select>
                            </div>
                            <div>
                                <label class="font-bold text-[var(--text-color)] block mb-1">Tempo (BPM)</label>
                                <input
                                    type="number"
                                    id="edit-song-tempo-input"
                                    class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] text-xs sm:text-sm"
                                    value="120" />
                            </div>
                        </div>
                        <div>
                            <label class="font-bold text-[var(--text-color)] block mb-1">Time Signature</label
                            ><input
                                type="text"
                                id="edit-song-timesig-input"
                                class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] font-mono text-xs sm:text-sm"
                                value="4/4" />
                        </div>
                        <div>
                            <label class="font-bold text-[var(--text-color)] block mb-1"
                                >Sticky Notes / Popup Notes</label
                            ><textarea
                                id="edit-song-notes-input"
                                rows="3"
                                class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] text-xs sm:text-sm"></textarea>
                        </div>
                    </div>

                    <div id="editor-pane-tags" class="editor-pane hidden space-y-4 text-xs sm:text-sm">
                        <div>
                            <label class="font-bold text-[var(--text-color)] block mb-1">Themes</label
                            ><input
                                type="text"
                                id="edit-song-themes-input"
                                class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] text-xs sm:text-sm"
                                placeholder="e.g. Worship, Grace" />
                        </div>
                        <div>
                            <label class="font-bold text-[var(--text-color)] block mb-1">BeatBuddy / Drummer</label
                            ><input
                                type="text"
                                id="edit-song-beatbuddy-input"
                                class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-color)] text-xs sm:text-sm"
                                placeholder="e.g. Rock 4/4" />
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)] shrink-0">
                    <button
                        id="save-song-btn"
                        class="px-6 py-3 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] font-bold text-xs sm:text-sm rounded-xl transition shadow-lg">
                        Save Song
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function openNewSongEditor() {
    const titleInput = document.getElementById("edit-song-title-input");
    const authorInput = document.getElementById("edit-song-author-input");
    const copyrightInput = document.getElementById("edit-song-copyright-input");
    const filenameInput = document.getElementById("edit-song-filename-input");
    const presentationInput = document.getElementById("edit-song-presentation-input");
    const keyInput = document.getElementById("edit-song-key-input");
    const capoInput = document.getElementById("edit-song-capo-input");
    const tempoInput = document.getElementById("edit-song-tempo-input");
    const timesigInput = document.getElementById("edit-song-timesig-input");
    const notesInput = document.getElementById("edit-song-notes-input");
    const themesInput = document.getElementById("edit-song-themes-input");
    const beatbuddyInput = document.getElementById("edit-song-beatbuddy-input");
    const newFolderInput = document.getElementById("edit-song-new-folder-input");
    const lyricsInput = document.getElementById("edit-song-lyrics-input");
    const modal = document.getElementById("song-editor-modal");

    if (titleInput) titleInput.value = "";
    if (authorInput) authorInput.value = "";
    if (copyrightInput) copyrightInput.value = "";
    if (filenameInput) filenameInput.value = "";
    if (presentationInput) presentationInput.value = "";
    if (keyInput) keyInput.value = "C";
    if (capoInput) capoInput.value = "";
    if (tempoInput) tempoInput.value = "120";
    if (timesigInput) timesigInput.value = "4/4";
    if (notesInput) notesInput.value = "";
    if (themesInput) themesInput.value = "";
    if (beatbuddyInput) beatbuddyInput.value = "";
    if (newFolderInput) {
        newFolderInput.value = "";
        newFolderInput.classList.add("hidden");
    }

    populateFolderDropdown();

    if (lyricsInput) lyricsInput.value = "[V1]\n.C     G\nLyrics here...";
    state.activeSong = null;
    if (modal) modal.classList.remove("hidden");
    createIcons({ icons });
}

export async function openEditSongEditor(song) {
    if (!song) return;
    await ensureSongContentLoaded(song);

    const titleInput = document.getElementById("edit-song-title-input");
    const authorInput = document.getElementById("edit-song-author-input");
    const copyrightInput = document.getElementById("edit-song-copyright-input");
    const filenameInput = document.getElementById("edit-song-filename-input");
    const presentationInput = document.getElementById("edit-song-presentation-input");
    const keyInput = document.getElementById("edit-song-key-input");
    const capoInput = document.getElementById("edit-song-capo-input");
    const tempoInput = document.getElementById("edit-song-tempo-input");
    const timesigInput = document.getElementById("edit-song-timesig-input");
    const notesInput = document.getElementById("edit-song-notes-input");
    const themesInput = document.getElementById("edit-song-themes-input");
    const beatbuddyInput = document.getElementById("edit-song-beatbuddy-input");
    const folderSelect = document.getElementById("edit-song-folder-select");
    const newFolderInput = document.getElementById("edit-song-new-folder-input");
    const lyricsInput = document.getElementById("edit-song-lyrics-input");
    const modal = document.getElementById("song-editor-modal");

    if (titleInput) titleInput.value = song.title || "";
    if (authorInput) authorInput.value = song.author || "";
    if (copyrightInput) copyrightInput.value = song.copyright || "";
    if (filenameInput) filenameInput.value = song.filename || song.title || "";
    if (presentationInput) presentationInput.value = song.presentation || "";
    if (keyInput) keyInput.value = song.key || "C";
    if (capoInput) capoInput.value = song.capo || "";
    if (tempoInput) tempoInput.value = song.tempo || 120;
    if (timesigInput) timesigInput.value = song.time_sig || "4/4";
    if (notesInput) notesInput.value = song.notes || "";
    if (themesInput) themesInput.value = song.theme || "";
    if (beatbuddyInput) beatbuddyInput.value = song.beatbuddysong || "";

    populateFolderDropdown();
    if (folderSelect) folderSelect.value = song.folderPath || "MAIN";
    if (newFolderInput) newFolderInput.classList.add("hidden");
    if (lyricsInput) lyricsInput.value = song.lyrics || "";

    if (modal) modal.classList.remove("hidden");
    createIcons({ icons });
}

function populateFolderDropdown() {
    const folderSelect = document.getElementById("edit-song-folder-select");
    if (!folderSelect) return;

    const folders = new Set(["MAIN"]);
    if (state.loadedSongs) {
        state.loadedSongs.forEach((s) => {
            if (s.folderPath) folders.add(s.folderPath);
        });
    }

    folderSelect.innerHTML = "";
    folders.forEach((f) => {
        const opt = document.createElement("option");
        opt.value = f;
        opt.textContent = f;
        folderSelect.appendChild(opt);
    });

    const newOpt = document.createElement("option");
    newOpt.value = "NEW_FOLDER";
    newOpt.textContent = "+ Create New Folder...";
    folderSelect.appendChild(newOpt);
}

export function initSongEditor() {
    const modal = document.getElementById("song-editor-modal");
    const closeBtn = document.getElementById("close-song-editor");
    const saveBtn = document.getElementById("save-song-btn");
    const folderSelect = document.getElementById("edit-song-folder-select");
    const newFolderInput = document.getElementById("edit-song-new-folder-input");
    const tabBtns = document.querySelectorAll(".editor-tab-btn");
    const panes = document.querySelectorAll(".editor-pane");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-editors-tab");

            tabBtns.forEach((b) => {
                b.classList.remove("bg-[var(--color-secondary)]", "text-[var(--text-color)]");
                b.classList.add("text-[var(--text-hint)]");
            });
            btn.classList.add("bg-[var(--color-secondary)]", "text-[var(--text-color)]");
            btn.classList.remove("text-[var(--text-hint)]");

            panes.forEach((pane) => {
                pane.classList.add("hidden");
            });
            const activePane = document.getElementById(`editor-pane-${targetTab}`);
            if (activePane) activePane.classList.remove("hidden");
        });
    });

    if (folderSelect && newFolderInput) {
        folderSelect.addEventListener("change", (e) => {
            if (e.target.value === "NEW_FOLDER") {
                newFolderInput.classList.remove("hidden");
                newFolderInput.focus();
            } else {
                newFolderInput.classList.add("hidden");
            }
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            let folderPath = folderSelect ? folderSelect.value : "MAIN";
            if (folderPath === "NEW_FOLDER") {
                folderPath = newFolderInput ? newFolderInput.value.trim() || "MAIN" : "MAIN";
                newFolderInput?.classList.add("hidden");
            }

            const title = document.getElementById("edit-song-title-input")?.value.trim() || "Untitled";
            const filename = document.getElementById("edit-song-filename-input")?.value.trim() || title;

            const newSongData = {
                id: state.activeSong ? state.activeSong.id : "song_" + Math.random().toString(36).substring(2, 8),
                filename: filename,
                folderPath: folderPath,
                title: title,
                author: document.getElementById("edit-song-author-input")?.value || "",
                copyright: document.getElementById("edit-song-copyright-input")?.value || "",
                presentation: document.getElementById("edit-song-presentation-input")?.value || "",
                key: document.getElementById("edit-song-key-input")?.value || "C",
                capo: document.getElementById("edit-song-capo-input")?.value || "",
                tempo: document.getElementById("edit-song-tempo-input")?.value || 120,
                time_sig: document.getElementById("edit-song-timesig-input")?.value || "4/4",
                notes: document.getElementById("edit-song-notes-input")?.value || "",
                theme: document.getElementById("edit-song-themes-input")?.value || "",
                beatbuddysong: document.getElementById("edit-song-beatbuddy-input")?.value || "",
                isLoaded: true,
                uuid: state.activeSong ? state.activeSong.uuid || crypto.randomUUID() : crypto.randomUUID(),
                modified: new Date().toISOString(),
                lyrics: document.getElementById("edit-song-lyrics-input")?.value || ""
            };

            addOrUpdateSong(newSongData);
            modal?.classList.add("hidden");

            const searchInput = document.getElementById("song-search-input");
            renderSidebarList(searchInput ? searchInput.value.toLowerCase() : "");
            renderSongSheet(newSongData);

            if (typeof writeSongToDisk === "function") {
                await writeSongToDisk(newSongData);
            }

            showToast("Song saved successfully!");
        });
    }

    createIcons({ icons });
}
