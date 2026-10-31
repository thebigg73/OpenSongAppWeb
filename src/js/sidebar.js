import { createIcons, icons } from "lucide";
import { showToast } from "./toast.js";
import { state } from "./state.js";
import { renderSetSheet, saveActiveSetToStorage, openSaveSetModal, openManageSetsModal } from "./set.js";
import { ensureSongContentLoaded, renderSongSheet } from "./song.js";
import { openNewSongEditor } from "./songEditor.js";

// Export the HTML template function
export function getSidebarHTML() {
    return `
        <div
            id="sidebar-backdrop"
            class="fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-10 hidden lg:hidden transition-opacity"></div>
        <aside
            id="sidebar"
            class="fixed lg:relative inset-y-0 left-0 w-80 bg-[var(--bg-primary-variant)] backdrop-blur-md border-r border-[var(--border-color)] flex flex-col transition-all duration-300 shrink-0 z-20 lg:z-10 shadow-2xl lg:shadow-none">

            <div class="p-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]/50">
                <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <i data-lucide="music" class="w-4 h-4 text-[var(--text-color)]"></i>
                        <span class="font-extrabold text-[var(--text-color)] text-sm tracking-wide">OpenSongApp Web</span>
                    </div>
                    <div
                        id="folder-status-text"
                        class="text-[10px] font-mono text-[var(--text-hint)] pl-6 -mt-0.5 truncate max-w-[190px]">
                        OpenSong
                    </div>
                </div>
                <span
                    id="app-version-badge"
                    class="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--bg-surface-variant)] text-[var(--text-hint)] border border-[var(--border-color)] rounded">
                </span>
            </div>

            <div
                id="sidebar-header-action"
                class="p-2 bg-[var(--bg-primary)] border-b border-[var(--border-color)] flex rounded-lg m-2 gap-1">
                <button
                    id="tab-songs-btn"
                    class="flex-1 py-1.5 text-xs font-bold rounded-md bg-[var(--color-secondary)] text-[var(--text-color)] flex items-center justify-center gap-1.5 transition">
                    <i data-lucide="music-2" class="w-3.5 h-3.5"></i> Songs
                    <span id="tab-songs-count" class="opacity-75 font-normal">(0)</span>
                </button>
                <button
                    id="tab-sets-btn"
                    class="flex-1 py-1.5 text-xs font-bold rounded-md text-[var(--text-hint)] hover:text-[var(--text-color)] hover:bg-[var(--bg-surface-variant)]/60 flex items-center justify-center gap-1.5 transition">
                    <i data-lucide="layers" class="w-3.5 h-3.5"></i> Set
                    <span id="sets-tab-count" class="opacity-75 font-normal">(0)</span>
                </button>
            </div>

            <div class="px-3 pb-2 border-b border-[var(--border-color)] flex flex-col gap-2">
                <div id="song-search-container" class="relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-[var(--text-hint)]"></i>
                    <input
                        type="text"
                        id="song-search-input"
                        placeholder="Search by title, author, or key..."
                        class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg pl-9 pr-8 py-2 text-sm text-[var(--text-color)] placeholder-[var(--text-hint)] focus:outline-none focus:border-[var(--color-secondary)] transition" />
                    <button
                        id="clear-search"
                        class="hidden absolute right-2.5 top-2.5 text-[var(--text-hint)] hover:text-[var(--text-color)]">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Folder / Category Filter Dropdown -->
                <div class="flex items-center gap-2">
                    <span id="filter-label" class="text-[11px] text-[var(--text-hint)] font-semibold uppercase">Folder:</span>
                    <select
                        id="folder-filter-select"
                        class="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-xs py-1 px-2 text-[var(--text-color)] font-mono focus:outline-none">
                        <option value="ALL">ALL FOLDERS</option>
                    </select>
                </div>

                <div class="flex justify-between items-center px-1 text-xs text-[var(--text-hint)]">
                    <span id="active-tab-label">Showing All Songs</span>
                    <button
                        id="rescan-btn"
                        class="text-[var(--text-color)] hover:underline flex items-center gap-1 font-medium">
                        <i data-lucide="refresh-cw" class="w-3 h-3"></i> Refresh
                    </button>
                </div>
            </div>

            <ul id="song-list" class="flex-1 overflow-y-auto p-2 space-y-1"></ul>

            <!-- FAB Button anchored to the bottom-right of the Sidebar Menu -->
            <button
                id="fab-actions-btn"
                class="absolute bottom-6 right-6 z-30 w-12 h-12 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] rounded-full shadow-2xl flex items-center justify-center transition transform hover:scale-105"
                title="Add New">
                <i data-lucide="plus" class="w-6 h-6"></i>
            </button>
        </aside>
    `;
}

// Get the floating action popup for the sidebar action button
export function getSidebarActionModalHTML() {
    return `
        <!-- Context-Aware Sidebar Action Modal -->
        <div
            id="sidebar-action-modal"
            class="fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div
                class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <h3 id="sidebar-modal-title" class="font-bold text-[var(--text-color)] text-sm">Actions</h3>
                    <button
                        id="close-sidebar-action-modal"
                        class="text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
                <div id="sidebar-modal-options" class="space-y-2">
                    <!-- Dynamically populated options -->
                </div>
            </div>
        </div>
    `;
}

// Initialise all of the listeners on boot
export function initSidebar() {
    // Search input typing handler
    const songSearchInput = document.getElementById("song-search-input");
    const clearSearchBtn = document.getElementById("clear-search");

    if (songSearchInput) {
        songSearchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            if (clearSearchBtn) {
                if (query.length > 0) {
                    clearSearchBtn.classList.remove("hidden");
                } else {
                    clearSearchBtn.classList.add("hidden");
                }
            }
            renderSidebarList(query.toLowerCase());
        });
    }

    // Clear search button handler
    if (clearSearchBtn && songSearchInput) {
        clearSearchBtn.addEventListener("click", () => {
            songSearchInput.value = "";
            clearSearchBtn.classList.add("hidden");
            songSearchInput.focus();
            renderSidebarList("");
        });
    }

    // Tab switching logic (Songs vs Sets)
    const tabSongsBtn = document.getElementById("tab-songs-btn");
    const tabSetsBtn = document.getElementById("tab-sets-btn");

    if (tabSongsBtn && tabSetsBtn) {
        tabSongsBtn.addEventListener("click", () => switchSidebarTab("songs"));
        tabSetsBtn.addEventListener("click", () => switchSidebarTab("sets"));
    }

    // The folder filter listener
    const folderFilterSelect = document.getElementById("folder-filter-select");
    if (folderFilterSelect) {
        folderFilterSelect.addEventListener("change", (e) => {
            state.selectedFolderFilter = e.target.value;
            localStorage.setItem("selectedFolderFilter", state.selectedFolderFilter);

            const query = songSearchInput ? songSearchInput.value.toLowerCase() : "";
            renderSidebarList(query);
        });
    }

    // Set up sidebar toggles and actions
    setupSidebarInteractions();

    // FAB Action Modal wiring
    const fabBtn = document.getElementById("fab-actions-btn");
    const actionModal = document.getElementById("sidebar-action-modal");
    const modalOptions = document.getElementById("sidebar-modal-options");
    const modalTitle = document.getElementById("sidebar-modal-title");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (fabBtn && actionModal && modalOptions) {
        fabBtn.addEventListener("click", () => {
            modalOptions.innerHTML = "";

            if (state.activeTab === "songs") {
                if (modalTitle) modalTitle.textContent = "Song Actions";
                const options = [
                    {
                        label: "Create new song",
                        icon: "file-plus",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            openNewSongEditor();
                        }
                    },
                    {
                        label: "Import song",
                        icon: "file-input",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            const fallbackInput = document.getElementById("fallback-folder-input");
                            if (fallbackInput) fallbackInput.click();
                        }
                    },
                    {
                        label: "Import backups",
                        icon: "archive",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            const importModal = document.getElementById("import-modal");
                            if (importModal) importModal.classList.remove("hidden");
                        }
                    },
                    {
                        label: "Import online",
                        icon: "globe",
                        color: "text-sky-400",
                        action: () => {
                            closeSidebarModal();
                            showToast("Online song import coming soon!");
                        }
                    },
                    {
                        label: "Share current song",
                        icon: "share-2",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            if (state.activeSong) {
                                state.shareTarget = state.activeSong;
                                const extless = document.getElementById("share-name-extless");
                                const ext = document.getElementById("share-name-ext");
                                const shareModal = document.getElementById("share-modal");
                                if (extless) extless.textContent = state.activeSong.filename || state.activeSong.title;
                                if (ext)
                                    ext.textContent = (state.activeSong.filename || state.activeSong.title) + ".ost";
                                if (shareModal) shareModal.classList.remove("hidden");
                            } else {
                                showToast("No song currently selected.");
                            }
                        }
                    },
                    {
                        label: "Export backup",
                        icon: "folder-output",
                        color: "text-purple-400",
                        action: () => {
                            closeSidebarModal();
                            const exportModal = document.getElementById("osb-export-modal");
                            if (exportModal) exportModal.classList.remove("hidden");
                        }
                    }
                ];

                options.forEach((opt) => {
                    const btn = document.createElement("button");
                    btn.className =
                        "w-full py-2.5 px-3 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-xl text-xs flex items-center gap-2.5 transition text-left " +
                        opt.color;
                    btn.innerHTML = `<i data-lucide="${opt.icon}" class="w-4 h-4 text-[var(--text-color)]"></i> ${opt.label}`;
                    btn.addEventListener("click", opt.action);
                    modalOptions.appendChild(btn);
                });
            } else {
                if (modalTitle) modalTitle.textContent = "Set Actions";

                const options = [
                    {
                        label: "Create new set",
                        icon: "layers",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            state.currentSet = {
                                category: "MAIN",
                                title: "New Set",
                                filename: "New Set",
                                songTitles: [],
                                items: []
                            };
                            showToast("New set created. Select checkboxes next to songs to add them.");
                            saveActiveSetToStorage(state.currentSet);
                            renderSidebarList();
                        }
                    },
                    {
                        label: "Add Divider",
                        icon: "minus",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            if (!state.currentSet) {
                                showToast("No active set to add a divider to.");
                                return;
                            }
                            if (!state.currentSet.songTitles) state.currentSet.songTitles = [];
                            state.currentSet.songTitles.push({ type: "custom", name: "# Divider #" });
                            showToast("Divider added to set.");
                            saveActiveSetToStorage(state.currentSet);
                            if (typeof renderSetSheet === "function") renderSetSheet(state.currentSet);
                            renderSidebarList();
                        }
                    },
                    {
                        label: "Add Note",
                        icon: "file-text",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            if (!state.currentSet) {
                                showToast("No active set to add a note to.");
                                return;
                            }
                            const noteText = prompt("Enter note text:");
                            if (noteText && noteText.trim() !== "") {
                                if (!state.currentSet.songTitles) state.currentSet.songTitles = [];
                                state.currentSet.songTitles.push({
                                    type: "custom",
                                    name: "# Note #",
                                    notes: noteText.trim()
                                });
                                showToast("Note added to set.");
                                saveActiveSetToStorage(state.currentSet);
                                if (typeof renderSetSheet === "function") renderSetSheet(state.currentSet);
                                renderSidebarList();
                            }
                        }
                    },
                    {
                        label: "Save current set",
                        icon: "save",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            if (typeof openSaveSetModal === "function") openSaveSetModal();
                        }
                    },
                    {
                        label: "Manage sets",
                        icon: "folder-archive",
                        color: "text-[var(--text-color)]",
                        action: () => {
                            closeSidebarModal();
                            if (typeof openManageSetsModal === "function") openManageSetsModal();
                        }
                    }
                ];

                options.forEach((opt) => {
                    const btn = document.createElement("button");
                    btn.className =
                        "w-full py-2.5 px-3 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-xl text-xs flex items-center gap-2.5 transition text-left " +
                        opt.color;
                    btn.innerHTML = `<i data-lucide="${opt.icon}" class="w-4 h-4 text-[var(--text-color)]"></i> ${opt.label}`;
                    btn.addEventListener("click", opt.action);
                    modalOptions.appendChild(btn);
                });
            }

            actionModal.classList.remove("hidden");
            if (backdrop && window.innerWidth < 1024) {
                backdrop.classList.remove("hidden");
            }
            createIcons({ icons });
        });

        const closeActionModalBtn = document.getElementById("close-sidebar-action-modal");
        if (closeActionModalBtn) {
            closeActionModalBtn.addEventListener("click", closeSidebarModal);
        }
        actionModal.addEventListener("click", (e) => {
            if (e.target === actionModal) closeSidebarModal();
        });
    }

    createIcons({ icons });
}

export function switchSidebarTab(tab) {
    state.activeTab = tab;

    const tabSongsBtn = document.getElementById("tab-songs-btn");
    const tabSetsBtn = document.getElementById("tab-sets-btn");

    if (tabSongsBtn && tabSetsBtn) {
        tabSongsBtn.className = `flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
            tab === "songs"
                ? "bg-[var(--color-secondary)] text-[var(--text-color)]"
                : "text-[var(--text-hint)] hover:text-[var(--text-color)] hover:bg-[var(--bg-surface-variant)]/60"
        }`;
        tabSetsBtn.className = `flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
            tab === "sets"
                ? "bg-[var(--color-secondary)] text-[var(--text-color)]"
                : "text-[var(--text-hint)] hover:text-[var(--text-color)] hover:bg-[var(--bg-surface-variant)]/60"
        }`;
    }

    const activeTabLabel = document.getElementById("active-tab-label");
    if (activeTabLabel) {
        activeTabLabel.textContent = tab === "songs" ? "Showing All Songs" : "Current Active Set";
    }

    const searchContainer = document.getElementById("song-search-container");
    const filterContainer = document.getElementById("folder-filter-select")?.closest(".flex");
    const refreshBtn = document.getElementById("rescan-btn");

    if (tab === "sets") {
        if (searchContainer) searchContainer.classList.add("hidden");
        if (filterContainer) filterContainer.classList.add("hidden");
        if (refreshBtn) refreshBtn.classList.add("hidden");
    } else {
        if (searchContainer) searchContainer.classList.remove("hidden");
        if (filterContainer) filterContainer.classList.remove("hidden");
        if (refreshBtn) refreshBtn.classList.remove("hidden");
    }

    const songSearchInput = document.getElementById("song-search-input");
    renderSidebarList(songSearchInput ? songSearchInput.value.toLowerCase() : "");
}

export function updateTabCounts() {
    const songsTab =
        document.getElementById("tab-songs-count") || document.querySelector("[data-tab='songs'] .tab-count");
    if (songsTab) {
        songsTab.textContent = `(${state.loadedSongs.length})`;
    }

    // 2. Update Sets tab label and counter to show active set song count
    const setsTabLabel = document.getElementById("sets-tab-label"); // or your sets tab button element
    const setsTabCount =
        document.getElementById("sets-tab-count") || document.querySelector("[data-tab='sets'] .tab-count");

    const activeSongCount = state.activeSet && state.activeSet.songs ? state.activeSet.songs.length : 0;

    if (setsTabCount) {
        setsTabCount.textContent = `(${activeSongCount})`;
    }
}

export function updateFolderFilterDropdown() {
    const filterSelect = document.getElementById("folder-filter-select");
    if (!filterSelect) return;

    const currentVal = state.selectedFolderFilter;

    filterSelect.innerHTML =
        '<option value="ALL">ALL ' + (state.activeTab === "songs" ? "FOLDERS" : "CATEGORIES") + "</option>";

    if (state.activeTab === "songs") {
        const foldersSet = new Set(["MAIN"]);
        state.loadedSongs.forEach((s) => foldersSet.add(s.folderPath || "MAIN"));
        Array.from(foldersSet)
            .sort()
            .forEach((f) => {
                const opt = document.createElement("option");
                opt.value = f;
                opt.textContent = f;
                filterSelect.appendChild(opt);
            });
    } else {
        const catsSet = new Set(["MAIN"]);
        state.loadedSets.forEach((s) => catsSet.add(s.category || "MAIN"));
        Array.from(catsSet)
            .sort()
            .forEach((c) => {
                const opt = document.createElement("option");
                opt.value = c;
                opt.textContent = c;
                filterSelect.appendChild(opt);
            });
    }

    const optionExists = Array.from(filterSelect.options).some((opt) => opt.value === currentVal);
    if (optionExists) {
        filterSelect.value = currentVal;
        state.selectedFolderFilter = currentVal;
    } else {
        filterSelect.value = "ALL";
        state.selectedFolderFilter = "ALL";
        localStorage.setItem("selectedFolderFilter", "ALL");
    }
}

export function renderSidebarList(query = "") {
    const songList = document.getElementById("song-list");
    if (!songList) return;

    songList.innerHTML = "";

    if (state.activeTab === "songs") {
        state.loadedSongs.sort((a, b) => a.title.localeCompare(b.title));
        state.loadedSongs
            .filter((song) => {
                const matchesQuery =
                    song.title.toLowerCase().includes(query) ||
                    (song.author && song.author.toLowerCase().includes(query));
                const matchesFolder =
                    state.selectedFolderFilter === "ALL" || (song.folderPath || "MAIN") === state.selectedFolderFilter;
                return matchesQuery && matchesFolder;
            })
            .forEach((song) => {
                const li = document.createElement("li");
                const isActive = state.activeSong && state.activeSong.id === song.id;

                const isInSet =
                    state.currentSet &&
                    state.currentSet.songs &&
                    state.currentSet.songs.some(
                        (s) =>
                            s &&
                            s.type !== "custom" &&
                            ((song.filename &&
                                s.filename === song.filename &&
                                s.folder === (song.folderPath || song.folder || "")) ||
                                (s.title && s.title.toLowerCase() === song.title.toLowerCase()))
                    );

                li.className = `p-3 rounded-xl transition flex items-center justify-between border ${isActive ? "bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]/40 text-[var(--text-color)] font-bold" : "hover:bg-[var(--bg-surface-variant)]/60 text-[var(--text-color)] border-transparent"}`;
                li.innerHTML = `
                <div class="truncate pr-2 flex-1 song-click-target cursor-pointer">
                    <div class="text-sm truncate">${song.title}</div>
                    <div class="text-xs text-[var(--text-hint)] font-normal">${song.author || ""} <span class="text-[10px] text-[var(--text-color)] font-mono">(${song.folderPath || "MAIN"})</span></div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-hint)] border border-[var(--border-color)]">${song.key || "C"}</span>
                    <input type="checkbox" class="set-membership-chk w-4 h-4 accent-[var(--color-secondary)] rounded cursor-pointer" ${isInSet ? "checked" : ""} title="Add to current set">
                </div>`;

                li.querySelector(".song-click-target").addEventListener("click", async () => {
                    await ensureSongContentLoaded(song);
                    renderSongSheet(song);
                    if (window.innerWidth < 1024) {
                        const sidebarEl = document.getElementById("sidebar");
                        const backdropEl = document.getElementById("sidebar-backdrop");
                        if (sidebarEl) sidebarEl.classList.add("closed");
                        if (backdropEl) backdropEl.classList.add("hidden");
                    }
                });

                li.querySelector(".set-membership-chk").addEventListener("change", (e) => {
                    e.stopPropagation();

                    if (!state.currentSet) {
                        state.currentSet = { title: "Untitled Set", songs: [], songTitles: [] };
                    }
                    if (!state.currentSet.songs) state.currentSet.songs = [];
                    if (!state.currentSet.songTitles) state.currentSet.songTitles = [];

                    const songItem = {
                        title: song.title,
                        filename: song.filename || "",
                        folder: song.folderPath || song.folder || "",
                        prefKey: song.prefKey || song.key || ""
                    };

                    if (e.target.checked) {
                        const exists = state.currentSet.songs.some(
                            (s) => s.filename === songItem.filename && s.folder === songItem.folder
                        );
                        if (!exists) {
                            state.currentSet.songs.push(songItem);
                        }
                        if (!state.currentSet.songTitles.includes(song.title)) {
                            state.currentSet.songTitles.push(song.title);
                        }
                    } else {
                        state.currentSet.songs = state.currentSet.songs.filter(
                            (s) => !(s.filename === songItem.filename && s.folder === songItem.folder)
                        );
                        state.currentSet.songTitles = state.currentSet.songTitles.filter((t) => t !== song.title);
                    }

                    if (typeof checkSetDirtyState === "function") checkSetDirtyState();
                    saveActiveSetToStorage(state.currentSet);
                });

                songList.appendChild(li);
            });
    } else {
        songList.innerHTML = "";

        if (typeof state.currentSet !== "undefined" && state.currentSet) {
            if (!state.currentSet.songs && state.currentSet.songTitles) {
                state.currentSet.songs = state.currentSet.songTitles.map((t) => {
                    const found = state.loadedSongs.find((s) => s.title.toLowerCase() === t.toLowerCase());
                    return {
                        title: t,
                        filename: found ? found.filename || "" : "",
                        folder: found ? found.folderPath || found.folder || "" : "",
                        prefKey: found ? found.key || "" : ""
                    };
                });
            }

            const setHeaderCard = document.createElement("li");
            setHeaderCard.className =
                "p-3 bg-[var(--bg-primary-variant)]/90 border border-[var(--border-color)] rounded-2xl space-y-3 mb-3 shadow-lg";

            setHeaderCard.innerHTML = `
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                    <div>
                        <div class="text-xs font-extrabold text-[var(--text-color)] uppercase tracking-wide">${state.currentSet.title || "Untitled Set"}</div>
                        <div id="set-count-info" class="text-[11px] text-[var(--text-hint)]">${(state.currentSet.songs || []).length} items in this set</div>
                    </div>
                    <button id="sidebar-set-save-btn" class="px-3.5 py-1.5 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition">
                        <i data-lucide="save" class="w-3.5 h-3.5"></i> SAVE
                    </button>
                </div>
            `;

            setHeaderCard.querySelector("#sidebar-set-save-btn").addEventListener("click", () => {
                if (typeof openSaveSetModal === "function") openSaveSetModal();
            });

            songList.appendChild(setHeaderCard);

            const setSongs = state.currentSet.songs || state.currentSet.songTitles || [];
            if (setSongs.length === 0) {
                const emptyItem = document.createElement("li");
                emptyItem.className = "text-xs text-[var(--text-hint)] italic p-3 text-center";
                emptyItem.textContent = "No items in current set. Add songs, dividers, or notes!";
                songList.appendChild(emptyItem);
            } else {
                setSongs.forEach((songObj, idx) => {
                    const itemDiv = document.createElement("li");
                    itemDiv.className =
                        "p-3 mb-2 rounded-xl bg-[var(--bg-primary-variant)]/60 border border-[var(--border-color)] flex items-center justify-between cursor-grab hover:border-[var(--color-secondary)]/40 transition select-none";
                    itemDiv.draggable = true;
                    itemDiv.dataset.index = idx;

                    if (typeof songObj === "object" && songObj.type === "custom") {
                        if (songObj.name === "# Divider #") {
                            itemDiv.className =
                                "p-2.5 my-1 rounded-xl bg-[var(--bg-primary)]/40 border border-dashed border-[var(--border-color)] flex items-center justify-between cursor-grab hover:border-[var(--color-secondary)]/40 transition select-none";
                            itemDiv.innerHTML = `
                                <div class="flex items-center gap-2.5 flex-1">
                                    <i data-lucide="grip-vertical" class="w-4 h-4 text-[var(--text-hint)] flex-shrink-0"></i>
                                    <i data-lucide="minus" class="w-4 h-4 text-[var(--text-hint)]"></i>
                                    <span class="text-xs font-bold uppercase tracking-wider text-[var(--text-hint)]">Divider</span>
                                </div>
                                <button class="text-[var(--text-hint)] hover:text-red-400 transition remove-set-song p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            `;
                        } else if (songObj.name === "# Note #") {
                            itemDiv.className =
                                "p-3 my-1 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between cursor-grab hover:border-amber-500/60 transition select-none";
                            itemDiv.innerHTML = `
                                <div class="flex items-start gap-2.5 flex-1 pr-2">
                                    <i data-lucide="grip-vertical" class="w-4 h-4 text-[var(--text-hint)] flex-shrink-0 mt-0.5"></i>
                                    <i data-lucide="file-text" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>
                                    <div>
                                        <div class="text-xs font-bold text-[var(--text-color)]">Note</div>
                                        <div class="text-[11px] text-[var(--text-hint)] mt-0.5 whitespace-pre-wrap">${songObj.notes || ""}</div>
                                    </div>
                                </div>
                                <button class="text-[var(--text-hint)] hover:text-red-400 transition remove-set-song p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            `;
                        }
                    } else {
                        const songTitle = typeof songObj === "object" ? songObj.title : songObj;
                        const foundSong = state.loadedSongs.find(
                            (s) => s.title.toLowerCase() === songTitle.toLowerCase()
                        );
                        const subtitleText = [songObj.folder, songObj.filename].filter(Boolean).join(" • ");
                        const displayKey = songObj.prefKey || (foundSong ? foundSong.key : "") || "";

                        itemDiv.innerHTML = `
                            <div class="flex items-center space-x-3 flex-1 truncate song-click-target cursor-pointer">
                                <i data-lucide="grip-vertical" class="w-4 h-4 text-[var(--text-hint)] flex-shrink-0"></i>
                                <span class="text-xs font-mono text-[var(--text-hint)] flex-shrink-0">${idx + 1}</span>
                                <div class="truncate flex flex-col">
                                    <span class="font-bold text-[var(--text-color)] text-sm truncate">${songTitle}</span>
                                    ${subtitleText ? `<span class="text-[10px] text-[var(--text-hint)] truncate">${subtitleText}</span>` : ""}
                                </div>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <span class="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--color-secondary)] font-semibold border border-[var(--border-color)]">${displayKey || "—"}</span>
                                <button class="text-[var(--text-hint)] hover:text-red-400 transition remove-set-song p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        `;

                        if (foundSong) {
                            itemDiv.querySelector(".song-click-target").addEventListener("click", async () => {
                                await ensureSongContentLoaded(foundSong);
                                renderSongSheet(foundSong, state.currentSet, idx);
                                if (window.innerWidth < 1024) {
                                    const sidebarEl = document.getElementById("sidebar");
                                    const backdropEl = document.getElementById("sidebar-backdrop");
                                    if (sidebarEl) sidebarEl.classList.add("closed");
                                    if (backdropEl) backdropEl.classList.add("hidden");
                                }
                            });
                        }
                    }

                    itemDiv.querySelector(".remove-set-song").addEventListener("click", (e) => {
                        e.stopPropagation();
                        if (state.currentSet.songs && state.currentSet.songs.length > idx)
                            state.currentSet.songs.splice(idx, 1);
                        if (state.currentSet.songTitles && state.currentSet.songTitles.length > idx)
                            state.currentSet.songTitles.splice(idx, 1);
                        if (typeof checkSetDirtyState === "function") checkSetDirtyState();
                        saveActiveSetToStorage(state.currentSet);
                        renderSidebarList();
                        showToast("Item removed from set");
                    });

                    itemDiv.addEventListener("dragstart", (e) => {
                        e.dataTransfer.setData("text/plain", idx);
                        itemDiv.classList.add("opacity-50", "border-[var(--color-secondary)]");
                    });
                    itemDiv.addEventListener("dragend", () => {
                        itemDiv.classList.remove("opacity-50", "border-[var(--color-secondary)]");
                    });
                    itemDiv.addEventListener("dragover", (e) => e.preventDefault());
                    itemDiv.addEventListener("drop", (e) => {
                        e.preventDefault();
                        const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                        const toIdx = idx;
                        if (fromIdx !== toIdx) {
                            const moved = state.currentSet.songs.splice(fromIdx, 1)[0];
                            state.currentSet.songs.splice(toIdx, 0, moved);

                            if (state.currentSet.songTitles) {
                                const movedTitle = state.currentSet.songTitles.splice(fromIdx, 1)[0];
                                state.currentSet.songTitles.splice(toIdx, 0, movedTitle);
                            }

                            if (typeof checkSetDirtyState === "function") checkSetDirtyState();
                            saveActiveSetToStorage(state.currentSet);
                            renderSidebarList();
                        }
                    });

                    songList.appendChild(itemDiv);
                });
            }
        }
    }
    createIcons({ icons });
}

function setupSidebarInteractions() {
    const toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");

    // On mobile (< 1024px), ensure sidebar starts closed by default
    if (window.innerWidth < 1024 && sidebar) {
        sidebar.classList.add("closed");
        if (backdrop) backdrop.classList.add("hidden");
    }

    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // Toggle the .closed class from styles.css (shrinks width on desktop)
            const isClosed = sidebar.classList.toggle("closed");

            // On mobile, correctly sync backdrop visibility with sidebar state
            if (backdrop && window.innerWidth < 1024) {
                if (isClosed) {
                    backdrop.classList.add("hidden");
                } else {
                    backdrop.classList.remove("hidden");
                }
            }

            setTimeout(() => {
                if (typeof applyTextScaling === "function" && state.activeSong) {
                    requestAnimationFrame(() => {
                        applyTextScaling();
                    });
                }
            }, 320);
        });
    }

    if (backdrop && sidebar) {
        backdrop.addEventListener("click", () => {
            sidebar.classList.add("closed");
            backdrop.classList.add("hidden");
        });
    }

    window.closeMobileSidebar = function () {
        if (window.innerWidth < 1024 && sidebar && backdrop) {
            sidebar.classList.add("closed");
            backdrop.classList.add("hidden");
        }
    };
}

function closeSidebarModal() {
    const actionModal = document.getElementById("sidebar-action-modal");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (actionModal) actionModal.classList.add("hidden");
    if (backdrop && window.innerWidth >= 1024) {
        backdrop.classList.add("hidden");
    }
}
