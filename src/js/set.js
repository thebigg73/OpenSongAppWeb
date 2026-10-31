// The JavaScript file to deal with sets
import { state } from "./state.js";
import { showToast } from "./toast.js";
import { ensureSongContentLoaded, renderSongSheet } from "./song.js";
import { getRootDirectoryHandle } from "./storage.js";
import { generateUUID } from "./utils.js";

// Render Modal HTML structures directly inside set.js with backdrop click support
function getModalsHTML() {
    return `
        <!-- Save Set Modal Dialog -->
        <div id="save-set-modal" class="modal-backdrop fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden flex items-center justify-center p-4">
            <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <h3 id="save-modal-title" class="text-base font-extrabold text-[var(--text-color)] uppercase tracking-wider flex items-center gap-2">
                        <i data-lucide="save" class="w-4 h-4 text-[var(--color-secondary)]"></i> Save Set
                    </h3>
                    <button id="close-save-modal-btn" class="text-[var(--text-hint)] hover:text-[var(--text-color)] transition p-1">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-[var(--text-hint)] mb-1.5">Set Title</label>
                        <input type="text" id="save-modal-title-input" class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)] transition" placeholder="e.g., Sunday Morning Worship" />
                        <p id="save-modal-warning" class="text-xs text-amber-400 mt-1.5 hidden">
                            A set with this name already exists. Saving will overwrite it.
                        </p>
                    </div>

                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-[var(--text-hint)] mb-1.5">Category / Folder</label>
                        <select id="save-modal-category-select" class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)] transition mb-2">
                            <option value="">(No Category)</option>
                            <option value="__new__">+ New Category...</option>
                        </select>
                        <input type="text" id="save-modal-new-category-input" class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)] transition hidden" placeholder="Enter new category name..." />
                    </div>
                </div>

                <div class="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-color)]">
                    <button id="cancel-save-modal-btn" class="px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-variant)] text-[var(--text-color)] text-xs font-bold rounded-xl border border-[var(--border-color)] transition">
                        Cancel
                    </button>
                    <button id="confirm-save-modal-btn" class="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5">
                        <i data-lucide="check" class="w-4 h-4"></i> Save Set
                    </button>
                </div>
            </div>
        </div>

        <!-- Manage Sets Modal Dialog (Larger View) -->
        <div id="manage-sets-modal" class="modal-backdrop fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden flex items-center justify-center p-4">
            <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
                    <h3 class="text-base font-extrabold text-[var(--text-color)] uppercase tracking-wider flex items-center gap-2">
                        <i data-lucide="folder-kanban" class="w-4 h-4 text-[var(--color-secondary)]"></i> Manage Sets (OpenSong/Sets/)
                    </h3>
                    <button id="close-manage-sets-btn" class="text-[var(--text-hint)] hover:text-[var(--text-color)] transition p-1">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Filters and Sorting Controls -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                        <label class="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)] mb-1">Filter Category</label>
                        <select id="sets-filter-category" class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)]">
                            <option value="">All Categories</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)] mb-1">Sort By</label>
                        <select id="sets-sort-by" class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)]">
                            <option value="alpha">Alphabetical</option>
                            <option value="date">Last Edit Date</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button id="load-merged-sets-btn" class="w-full py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5">
                            <i data-lucide="list-plus" class="w-3.5 h-3.5"></i> Load & Merge Selected
                        </button>
                    </div>
                </div>

                <!-- Sets List Container -->
                <div id="manage-sets-list" class="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-[var(--border-color)]/40">
                    <!-- Populated dynamically -->
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-between pt-4 border-t border-[var(--border-color)] mt-4">
                    <span id="manage-sets-count" class="text-xs text-[var(--text-hint)]">0 sets found</span>
                    <button id="close-manage-sets-footer-btn" class="px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-variant)] text-[var(--text-color)] text-xs font-bold rounded-xl border border-[var(--border-color)] transition">
                        Close
                    </button>
                </div>
            </div>
        </div>

        <!-- Confirm Delete Set Modal Sub-Dialog -->
        <div id="delete-set-confirm-modal" class="modal-backdrop fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm hidden flex items-center justify-center p-4">
            <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
                <h4 class="text-sm font-extrabold text-red-400 uppercase tracking-wider">Are you sure?</h4>
                <p id="delete-set-confirm-text" class="text-xs text-[var(--text-color)]"></p>
                <div class="flex items-center justify-end gap-2 pt-2">
                    <button id="cancel-delete-set-btn" class="px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--text-color)] text-xs font-bold rounded-lg border border-[var(--border-color)]">Cancel</button>
                    <button id="confirm-delete-set-btn" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow">Delete</button>
                </div>
            </div>
        </div>

        <!-- Edit Set Meta Modal Sub-Dialog -->
        <div id="edit-set-meta-modal" class="modal-backdrop fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm hidden flex items-center justify-center p-4">
            <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <h4 class="text-sm font-extrabold text-[var(--text-color)] uppercase tracking-wider">Edit Set Details</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)] mb-1">Title</label>
                        <input type="text" id="edit-set-title-input" class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)]" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)] mb-1">Category / Folder</label>
                        <input type="text" id="edit-set-category-input" class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)]" />
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 pt-2">
                    <button id="cancel-edit-set-btn" class="px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--text-color)] text-xs font-bold rounded-lg border border-[var(--border-color)]">Cancel</button>
                    <button id="confirm-edit-set-btn" class="px-3 py-1.5 bg-[var(--color-secondary)] text-[var(--text-color)] text-xs font-bold rounded-lg shadow">Save Changes</button>
                </div>
            </div>
        </div>
    `;
}

function parseSetFilename(filename) {
    let clean = filename.endsWith(".osts")
        ? filename.slice(0, -5)
        : filename.endsWith(".ost")
          ? filename.slice(0, -4)
          : filename;
    if (clean.includes("__")) {
        const parts = clean.split("__");
        return { category: parts[0], title: parts.slice(1).join("__"), filename: clean };
    }
    return { category: "MAIN", title: clean, filename: clean };
}

async function writeSetToDisk(setObj) {
    if (!setObj) return false;

    const rawTitle = (setObj.title || setObj.name || "Untitled_Set").trim();
    const cleanTitle = rawTitle.replace(/[\/\\?%*:|"<>]/g, "_");

    const category = setObj.category || setObj.folder || "";
    const filename = category && category !== "MAIN" ? `${category}__${cleanTitle}` : cleanTitle;
    const setNameAttr = category && category !== "MAIN" ? `${category}__${cleanTitle}` : rawTitle;

    const setUuid = setObj.uuid || generateUUID();
    const lastModifiedIso = new Date().toISOString();
    setObj.uuid = setUuid;
    setObj.lastModified = new Date(lastModifiedIso).getTime();
    const setNotes = setObj.notes || "";

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<set name="${escapeXml(setNameAttr)}">\n`;
    xmlContent += `  <uuid>${setUuid}</uuid>\n`;
    xmlContent += `  <lastModified>${lastModifiedIso}</lastModified>\n`;
    xmlContent += `  <notes>${escapeXml(setNotes)}</notes>\n`;
    xmlContent += `<slide_groups>\n`;

    const items = setObj.songs || setObj.items || setObj.songTitles || [];
    items.forEach((item) => {
        if (typeof item === "object" && item.type === "custom") {
            if (item.name === "# Divider #") {
                xmlContent += `  <slide_group name="# Divider #" type="custom" print="true">\n    <notes></notes>\n    <slides></slides>\n  </slide_group>\n`;
            } else if (item.name === "# Note #" || (item.name && item.name.startsWith("# Note #"))) {
                const noteTitle = escapeXml(item.name);
                const noteText = escapeXml(item.notes || "");
                xmlContent += `  <slide_group name="${noteTitle}" type="custom" print="true" seconds="" loop="" transition="">\n    <title></title>\n    <subtitle></subtitle>\n    <notes>${noteText}</notes>\n    <slides></slides>\n  </slide_group>\n`;
            } else if (item.name && item.name.startsWith("# Variation #")) {
                const varTitle = escapeXml(item.name);
                const notesVal = escapeXml(item.notes || "");
                xmlContent += `  <slide_group name="${varTitle}" type="custom" print="true" seconds="" loop="" transition="">\n    <title>${escapeXml(item.title || "")}</title>\n    <subtitle>${escapeXml(item.subtitle || "")}</subtitle>\n    <notes>${notesVal}</notes>\n    <slides>\n`;
                if (item.slides && Array.isArray(item.slides)) {
                    item.slides.forEach((slide) => {
                        xmlContent += `      <slide><body>${escapeXml(slide.body || slide)}</body></slide>\n`;
                    });
                }
                xmlContent += `    </slides>\n  </slide_group>\n`;
            }
        } else if (typeof item === "object" && item.type === "scripture") {
            xmlContent += `  <slide_group type="scripture" name="${escapeXml(item.title || "Scripture")}" print="true">\n`;
            xmlContent += `    <title>${escapeXml(item.title || "")}</title>\n    <slides>\n`;
            if (item.slides && Array.isArray(item.slides)) {
                item.slides.forEach((slide) => {
                    xmlContent += `      <slide><body>${escapeXml(slide.body || slide)}</body></slide>\n`;
                });
            }
            xmlContent += `    </slides>\n    <subtitle></subtitle>\n    <notes />\n  </slide_group>\n`;
        } else {
            const title = typeof item === "string" ? item : item.title;
            const folder =
                typeof item === "object" && (item.folder || item.folderPath) ? item.folder || item.folderPath : "";
            const pathVal = !folder || folder === "MAIN" ? "" : folder.endsWith("/") ? folder : folder + "/";
            const pathAttr = ` path="${escapeXml(pathVal)}"`;
            const presentationAttr = ` presentation=""`;
            const prefKeyVal = typeof item === "object" && item.prefKey ? item.prefKey : "";
            const prefKeyAttr = prefKeyVal ? ` prefKey="${escapeXml(prefKeyVal)}"` : "";

            xmlContent += `  <slide_group name="${escapeXml(title)}" type="song"${presentationAttr}${pathAttr}${prefKeyAttr}/>\n`;
        }
    });
    xmlContent += `</slide_groups>\n</set>`;

    const rootHandle = getRootDirectoryHandle() || window.rootDirectoryHandle;

    if (rootHandle) {
        try {
            let setsDirHandle;
            try {
                setsDirHandle = await rootHandle.getDirectoryHandle("Sets", { create: true });
            } catch (e) {
                setsDirHandle = rootHandle;
            }

            const fileHandle = await setsDirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(xmlContent);
            await writable.close();

            showToast(`Saved set to Sets/${filename}`);
            return true;
        } catch (err) {
            console.error("Failed to write set to disk via File System Access API:", err);
            showToast(`Write failed: ${err.message}`);
        }
    } else {
        console.warn("No rootDirectoryHandle connected. Triggering file download fallback.");
    }

    try {
        const blob = new Blob([xmlContent], { type: "text/xml;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        return true;
    } catch (e) {
        console.error("Download fallback failed:", e);
    }

    return false;
}

function escapeXml(str) {
    return (str || "").replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "'":
                return "&apos;";
            case '"':
                return "&quot;";
        }
    });
}

export function parseOpenSongSetXML(xmlString, filename) {
    try {
        const doc = new DOMParser().parseFromString(xmlString, "text/xml");
        const setNode = doc.querySelector("set");
        if (!setNode) return null;

        const uuid = setNode.querySelector(":scope > uuid")?.textContent || generateUUID();
        const lastModifiedStr = setNode.querySelector(":scope > lastModified")?.textContent || "";
        const lastModified = lastModifiedStr ? new Date(lastModifiedStr).getTime() : Date.now();
        const notes = setNode.querySelector(":scope > notes")?.textContent || "";

        const songs = [];
        const songTitles = [];

        doc.querySelectorAll("slide_group").forEach((g) => {
            const name = g.getAttribute("name") || g.querySelector("title")?.textContent || "";
            const type = g.getAttribute("type") || "song";
            const path = g.getAttribute("path") || g.getAttribute("folder") || "";
            const prefKey = g.getAttribute("prefKey") || "";

            if (type === "scripture") {
                const slides = [];
                g.querySelectorAll("slide").forEach((s) => {
                    slides.push({ body: s.querySelector("body")?.textContent || s.textContent || "" });
                });
                const scriptureObj = { type: "scripture", title: name, slides };
                songs.push(scriptureObj);
                songTitles.push(scriptureObj);
            } else if (type === "custom" || name.startsWith("#")) {
                const slideGroupNotes = g.querySelector("notes")?.textContent || "";
                const titleNode = g.querySelector("title")?.textContent || "";
                const subtitleNode = g.querySelector("subtitle")?.textContent || "";
                const slides = [];
                g.querySelectorAll("slide").forEach((s) => {
                    slides.push({ body: s.querySelector("body")?.textContent || s.textContent || "" });
                });

                const customObj = {
                    type: "custom",
                    name: name,
                    title: titleNode,
                    subtitle: subtitleNode,
                    notes: slideGroupNotes,
                    slides: slides
                };
                songs.push(customObj);
                songTitles.push(customObj);
            } else {
                const folderName =
                    !path || path.trim() === "" || path.toLowerCase() === "main" ? "MAIN" : path.replace(/\/$/, "");
                const songObj = {
                    title: name,
                    filename: "",
                    folder: folderName,
                    prefKey: prefKey
                };
                songs.push(songObj);
                songTitles.push(songObj);
            }
        });

        const parsed = parseSetFilename(filename);
        const setNameAttr = setNode.getAttribute("name") || "";
        let category = parsed.category;
        let title = parsed.title;

        if (setNameAttr.includes("__")) {
            const parts = setNameAttr.split("__");
            category = parts[0];
            title = parts.slice(1).join("__");
        } else if (setNameAttr) {
            title = setNameAttr;
        }

        return {
            id: uuid,
            filename: parsed.filename,
            title: title,
            category: category,
            folder: category,
            uuid: uuid,
            lastModified: lastModified,
            notes: notes,
            songs,
            songTitles
        };
    } catch (e) {
        console.error("Error parsing OpenSong set XML:", e);
        return null;
    }
}

export function renderSetSheet(setObj) {
    console.log(
        "%c[renderSetSheet EXECUTING from set.js]",
        "color: #10b981; font-weight: bold; font-size: 14px;",
        setObj
    );

    state.activeSet = setObj;
    state.currentSet = JSON.parse(JSON.stringify(setObj));

    saveActiveSetToStorage(setObj);

    const container = document.getElementById("song-list");
    if (!container) return;
    container.innerHTML = "";

    const setHeaderCard = document.createElement("li");
    setHeaderCard.className =
        "p-3 bg-[var(--bg-primary-variant)]/90 border border-[var(--border-color)] rounded-2xl space-y-3 mb-3 shadow-lg";

    setHeaderCard.innerHTML = `
        <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
            <div class="truncate pr-2">
                <div class="text-xs font-extrabold text-[var(--text-color)] uppercase tracking-wide truncate">${setObj.title || "Untitled Set"}</div>
                <div id="set-count-info" class="text-[11px] text-[var(--text-hint)]">${(setObj.songs || []).length} items in this set</div>
            </div>
            <button id="sidebar-set-save-btn" class="px-3.5 py-1.5 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition shrink-0">
                <i data-lucide="save" class="w-3.5 h-3.5"></i> SAVE
            </button>
        </div>
    `;

    setHeaderCard.querySelector("#sidebar-set-save-btn").addEventListener("click", () => {
        openSaveSetModal();
    });

    container.appendChild(setHeaderCard);

    if (!setObj.songs || setObj.songs.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "text-xs text-[var(--text-hint)] italic p-3 text-center";
        emptyItem.textContent = "No items in current set. Tick songs in the Song tab!";
        container.appendChild(emptyItem);
        if (typeof lucide !== "undefined") lucide.createIcons();
        return;
    }

    setObj.songs.forEach((songObj, idx) => {
        const isCustom = songObj && songObj.type === "custom";
        const isScripture = songObj && songObj.type === "scripture";

        const itemDiv = document.createElement("li");
        itemDiv.className =
            "p-3 mb-2 rounded-xl bg-[var(--bg-primary-variant)]/60 border border-[var(--border-color)] flex items-center justify-between cursor-grab hover:border-[var(--color-secondary)]/40 transition select-none";
        itemDiv.draggable = true;
        itemDiv.dataset.index = idx;

        if (isScripture) {
            itemDiv.className =
                "p-3 my-1 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between cursor-grab hover:border-blue-500/60 transition select-none";
            itemDiv.innerHTML = `
                <div class="flex items-center gap-2.5 flex-1 pr-2 song-click-target cursor-pointer">
                    <i data-lucide="grip-vertical" class="w-4 h-4 text-[var(--text-hint)] flex-shrink-0"></i>
                    <i data-lucide="book-open" class="w-4 h-4 text-blue-400 shrink-0"></i>
                    <div>
                        <div class="text-xs font-bold text-[var(--text-color)]">${songObj.title || "Scripture"}</div>
                        <div class="text-[10px] text-[var(--text-hint)]">Scripture Block</div>
                    </div>
                </div>
                <button class="text-[var(--text-hint)] hover:text-red-400 transition remove-set-song p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            `;
        } else if (isCustom) {
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
            } else if (songObj.name === "# Note #" || (songObj.name && songObj.name.startsWith("# Note #"))) {
                const noteText = songObj.notes || songObj.title || "Note";
                itemDiv.className =
                    "p-3 my-1 rounded-xl bg-[var(--bg-primary-variant)]/60 border border-[var(--border-color)] flex items-start justify-between cursor-grab hover:border-[var(--color-secondary)]/40 transition select-none";
                itemDiv.innerHTML = `
                    <div class="flex items-start gap-2.5 flex-1 pr-2 cursor-pointer">
                        <i data-lucide="grip-vertical" class="w-4 h-4 text-[var(--text-hint)] flex-shrink-0 mt-0.5"></i>
                        <i data-lucide="file-text" class="w-4 h-4 text-[var(--text-hint)] shrink-0 mt-0.5"></i>
                        <div class="truncate flex flex-col">
                            <span class="font-bold text-[var(--text-color)] text-sm truncate">${noteText}</span>
                            <span class="text-[10px] text-[var(--text-hint)] truncate">Note</span>
                        </div>
                    </div>
                    <button class="text-[var(--text-hint)] hover:text-red-400 transition remove-set-song p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                `;
            } else {
                itemDiv.className =
                    "p-3 my-1 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start justify-between cursor-grab hover:border-purple-500/60 transition select-none";
                itemDiv.innerHTML = `
                    <div class="flex items-start gap-2.5 flex-1 pr-2 song-click-target cursor-pointer">
                        <i data-lucide="grip-vertical" class="w-4 h-4 text-[var(--text-hint)] flex-shrink-0 mt-0.5"></i>
                        <i data-lucide="music" class="w-4 h-4 text-purple-400 shrink-0 mt-0.5"></i>
                        <div>
                            <div class="text-xs font-bold text-[var(--text-color)]">${songObj.name || "Variation"}</div>
                            <div class="text-[11px] text-[var(--text-hint)] mt-0.5">${songObj.title || ""}</div>
                        </div>
                    </div>
                    <button class="text-[var(--text-hint)] hover:text-red-400 transition remove-set-song p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                `;
            }
        } else {
            const foundSong = state.loadedSongs.find(
                (s) =>
                    (songObj.filename && s.filename.toLowerCase() === songObj.filename.toLowerCase()) ||
                    (s.title && songObj.title && s.title.toLowerCase() === songObj.title.toLowerCase())
            );
            const subtitleText = [songObj.folder !== "MAIN" ? songObj.folder : "", songObj.filename]
                .filter(Boolean)
                .join(" • ");
            const displayKey = songObj.prefKey || (foundSong ? foundSong.key : "") || "";

            itemDiv.innerHTML = `
                <div class="flex items-center space-x-3 flex-1 truncate song-click-target cursor-pointer">
                    <i data-lucide="grip-vertical" class="w-4 h-4 text-[var(--text-hint)] flex-shrink-0"></i>
                    <span class="text-xs font-mono text-[var(--text-hint)] flex-shrink-0">${idx + 1}</span>
                    <div class="truncate flex flex-col">
                        <span class="font-bold text-[var(--text-color)] text-sm truncate">${songObj.title}</span>
                        ${subtitleText ? `<span class="text-[10px] text-[var(--text-hint)] truncate">${subtitleText}</span>` : ""}
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--color-secondary)] font-semibold border border-[var(--border-color)]">${displayKey || "—"}</span>
                    <button class="text-[var(--text-hint)] hover:text-red-400 transition remove-set-song p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
        }

        // 💡 ONE SINGLE UNIFIED CLICK LISTENER FOR ALL ITEM TYPES
        // 💡 Attach the click listener directly to the row item (itemDiv)
        itemDiv.addEventListener("click", async (e) => {
            console.log(`%c[UI Click] Row clicked for index: ${idx}`, "color: #38bdf8; font-weight: bold;", songObj);
            await loadSongFromActiveSet(idx);
            if (window.innerWidth < 1024 && typeof window.closeMobileSidebar === "function") {
                window.closeMobileSidebar();
            }
        });

        // Ensure clicking the delete button does NOT trigger the row click
        const deleteBtn = itemDiv.querySelector(".remove-set-song");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                state.activeSet.songs.splice(idx, 1);
                if (state.activeSet.songTitles) {
                    state.activeSet.songTitles.splice(idx, 1);
                }
                saveActiveSetToStorage(state.activeSet);
                checkSetDirtyState();
                renderSetSheet(state.activeSet);

                if (state.activeSetSongIndex === idx) {
                    state.activeSetSongIndex = -1;
                    document.getElementById("set-navigation-banner")?.classList.add("hidden");
                } else if (state.activeSetSongIndex > idx) {
                    state.activeSetSongIndex--;
                }
                showToast(`Removed item from set`);
            });
        }

        // Drag & drop handlers...
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
                const moved = state.activeSet.songs.splice(fromIdx, 1)[0];
                state.activeSet.songs.splice(toIdx, 0, moved);
                if (state.activeSet.songTitles) {
                    const movedTitle = state.activeSet.songTitles.splice(fromIdx, 1)[0];
                    state.activeSet.songTitles.splice(toIdx, 0, movedTitle);
                }
                saveActiveSetToStorage(state.activeSet);
                if (state.activeSetSongIndex === fromIdx) {
                    state.activeSetSongIndex = toIdx;
                } else if (fromIdx < state.activeSetSongIndex && toIdx >= state.activeSetSongIndex) {
                    state.activeSetSongIndex--;
                } else if (fromIdx > state.activeSetSongIndex && toIdx <= state.activeSetSongIndex) {
                    state.activeSetSongIndex++;
                }
                checkSetDirtyState();
                renderSetSheet(state.activeSet);
            }
        });

        container.appendChild(itemDiv);
    });

    updateSetSidebarHighlighting();
    if (typeof lucide !== "undefined") lucide.createIcons();
}

export function updateSetSidebarHighlighting() {
    // Search both #song-list and any rendered set item elements globally across the page
    const container = document.getElementById("song-list");
    let items = container ? container.querySelectorAll("[data-index]") : [];

    if (items.length === 0) {
        items = document.querySelectorAll("[data-index]");
    }

    if (items.length === 0) {
        return; // Silent return if elements aren't rendered yet
    }

    items.forEach((item) => {
        const idx = parseInt(item.dataset.index, 10);
        const isCurrent = state.activeSetSongIndex === idx;

        if (isCurrent) {
            item.classList.add("ring-2", "ring-[var(--color-secondary)]", "bg-[var(--bg-primary-variant)]");
        } else {
            item.classList.remove("ring-2", "ring-[var(--color-secondary)]", "bg-[var(--bg-primary-variant)]");
        }
    });
}

// Render custom Note/Variation sheet view in main content area
export function renderNoteSheetView(noteObj, setObj, index) {
    state.activeSet = setObj;
    state.activeSetSongIndex = index;
    saveActiveSetToStorage(setObj);

    const noteContent = noteObj.notes || noteObj.title || "(No content)";

    const pseudoSong = {
        title: "Note",
        folderPath: "Note",
        lyrics: noteContent,
        isNote: true
    };

    if (typeof renderSongSheet === "function") {
        renderSongSheet(pseudoSong, setObj, index);
    } else {
        console.error("[renderNoteSheetView] renderSongSheet is not defined.");
    }

    const bannerEl = document.getElementById("set-navigation-banner");
    if (bannerEl) bannerEl.classList.remove("hidden");
    const bannerTitleEl = document.getElementById("banner-set-title");
    if (bannerTitleEl) bannerTitleEl.textContent = setObj.title || "Set";

    updateSetIndexDisplay();
    updateSetSidebarHighlighting();
    if (typeof lucide !== "undefined") lucide.createIcons();
}

window.renderNoteSheet = renderNoteSheetView;

window.renderNoteSheet = renderNoteSheetView;

// Render Scripture sheet view in main content area
export function renderScriptureSheetView(scriptureObj, setObj, index) {
    state.activeSet = setObj;
    state.activeSetSongIndex = index;
    saveActiveSetToStorage(setObj);

    const container =
        document.getElementById("song-content") ||
        document.getElementById("main-content") ||
        document.getElementById("song-view-sheet");
    if (!container) return;

    let slidesHtml = "";
    if (scriptureObj.slides && scriptureObj.slides.length > 0) {
        slidesHtml = scriptureObj.slides
            .map(
                (s, sIdx) => `
            <div class="p-4 bg-[var(--bg-primary)]/40 border border-[var(--border-color)] rounded-xl space-y-1">
                <div class="text-[10px] font-mono text-[var(--color-secondary)] uppercase">Slide ${sIdx + 1}</div>
                <div class="text-sm text-[var(--text-color)] whitespace-pre-wrap">${s.body || s}</div>
            </div>
        `
            )
            .join("");
    } else {
        slidesHtml = `<div class="text-xs text-[var(--text-hint)] italic">No slides available</div>`;
    }

    container.innerHTML = `
        <div class="max-w-3xl mx-auto p-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-xl space-y-4">
            <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div class="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <i data-lucide="book-open" class="w-5 h-5"></i> ${scriptureObj.title || "Scripture"}
                </div>
                <span class="text-xs text-[var(--text-hint)]">Item ${index + 1} of ${(setObj.songs || []).length}</span>
            </div>
            <div class="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                ${slidesHtml}
            </div>
        </div>
    `;

    const bannerEl = document.getElementById("set-navigation-banner");
    if (bannerEl) bannerEl.classList.remove("hidden");
    const bannerTitleEl = document.getElementById("banner-set-title");
    if (bannerTitleEl) bannerTitleEl.textContent = setObj.title || "Set";

    updateSetIndexDisplay();
    updateSetSidebarHighlighting();
    if (typeof lucide !== "undefined") lucide.createIcons();
}

window.renderScriptureSheet = renderScriptureSheetView;

export function checkSetDirtyState() {
    const activeSet = state.activeSet || state.currentSet;
    if (!activeSet || !state.currentSet) return;

    const activeItems = activeSet.songs || activeSet.items || activeSet.songTitles || [];
    const currentItems = state.currentSet.songs || state.currentSet.items || state.currentSet.songTitles || [];

    const isChanged = JSON.stringify(activeItems) !== JSON.stringify(currentItems);

    const headerActions = document.querySelector("#set-view-sheet .flex.items-center.gap-2");
    const existingBtn = document.getElementById("dynamic-save-set-btn");

    if (isChanged && !existingBtn && headerActions) {
        const btn = document.createElement("button");
        btn.id = "dynamic-save-set-btn";
        btn.className =
            "px-3 py-1.5 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] rounded-lg text-xs font-bold flex items-center gap-1.5 transition animate-pulse";
        btn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i> Save Changes';
        btn.onclick = async () => {
            const existingIdx = state.loadedSets.findIndex(
                (s) => s.filename.toLowerCase() === activeSet.filename.toLowerCase()
            );

            state.activeSet = JSON.parse(JSON.stringify(state.currentSet));
            if (existingIdx !== -1) state.loadedSets[existingIdx] = { ...state.activeSet };

            btn.remove();
            saveActiveSetToStorage(state.activeSet);
            await writeSetToDisk(state.activeSet);
            showToast(`Set "${state.activeSet.title}" updated and saved!`);
        };
        headerActions.prepend(btn);
        if (typeof lucide !== "undefined") lucide.createIcons();
    } else if (!isChanged && existingBtn) {
        existingBtn.remove();
    }
}

export async function loadSongFromActiveSet(index) {
    if (!state.activeSet) return;
    sanitizeSet(state.activeSet);

    console.log(
        `%c[loadSongFromActiveSet] START index: ${index} (prev activeSetSongIndex: ${state.activeSetSongIndex})`,
        "color: #facc15; font-weight: bold;"
    );

    state.activeSetSongIndex = index;
    updateSetIndexDisplay();
    updateSetSidebarHighlighting();

    const setSongs = state.activeSet.songs || [];
    const targetEntry = setSongs[index] || (state.activeSet.songTitles ? state.activeSet.songTitles[index] : null);

    console.log("[loadSongFromActiveSet] Target entry found:", targetEntry);

    if (!targetEntry) {
        console.warn("[loadSongFromActiveSet] No target entry found for index:", index);
        return;
    }

    if (typeof targetEntry === "object") {
        const itemType = targetEntry.type || "";
        const itemName = targetEntry.name || targetEntry.title || "";

        console.log(`[loadSongFromActiveSet] Object item detected. type: "${itemType}", name/title: "${itemName}"`);

        if (itemType === "custom" || itemName.startsWith("#") || itemName === "Note") {
            if (itemName === "# Divider #") {
                showToast("Skipped Divider");
                return;
            }
            console.log("[loadSongFromActiveSet] Routing to renderNoteSheetView");
            renderNoteSheetView(targetEntry, state.activeSet, index);
            return;
        } else if (itemType === "scripture") {
            console.log("[loadSongFromActiveSet] Routing to renderScriptureSheetView");
            renderScriptureSheetView(targetEntry, state.activeSet, index);
            return;
        }
    }

    const songTitle = typeof targetEntry === "object" ? targetEntry.title || targetEntry.name : targetEntry;
    if (!songTitle) return;

    const songFolder = typeof targetEntry === "object" ? targetEntry.folder : "";

    let foundSong =
        state.loadedSongs.find(
            (s) =>
                s.title &&
                s.title.toLowerCase() === songTitle.toLowerCase() &&
                (!songFolder || songFolder === "MAIN" || (s.folderPath || s.folder) === songFolder)
        ) || state.loadedSongs.find((s) => s.title && s.title.toLowerCase() === songTitle.toLowerCase());

    if (!foundSong && typeof targetEntry === "object" && targetEntry.filename) {
        foundSong = state.loadedSongs.find((s) => s.filename.toLowerCase() === targetEntry.filename.toLowerCase());
    }

    console.log("[loadSongFromActiveSet] Found standard song in library:", foundSong);

    if (foundSong) {
        await ensureSongContentLoaded(foundSong);
        renderSongSheet(foundSong, state.activeSet, index);
    } else {
        showToast(`Song "${songTitle}" not found in loaded library.`);
    }

    updateSetIndexDisplay();
    updateSetSidebarHighlighting();
}

export function openSaveSetModal() {
    const targetSet = state.currentSet || state.activeSet;
    if (!targetSet) {
        showToast("No active set to save.");
        return;
    }

    const modal = document.getElementById("save-set-modal");
    if (!modal) return;

    const titleInput = document.getElementById("save-modal-title-input");
    const categorySelect = document.getElementById("save-modal-category-select");
    const newCategoryInput = document.getElementById("save-modal-new-category-input");
    const warningEl = document.getElementById("save-modal-warning");

    titleInput.value = targetSet.title || targetSet.name || "";
    warningEl.classList.add("hidden");

    const existingCategories = [
        ...new Set((state.loadedSets || []).map((s) => s.category || s.folder).filter(Boolean))
    ].sort();

    categorySelect.innerHTML = '<option value="">(No Category)</option>';
    existingCategories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });

    const newOpt = document.createElement("option");
    newOpt.value = "__new__";
    newOpt.textContent = "+ New Category...";
    categorySelect.appendChild(newOpt);

    const currentCategory = targetSet.category || targetSet.folder || "";
    if (currentCategory && existingCategories.includes(currentCategory)) {
        categorySelect.value = currentCategory;
        newCategoryInput.value = "";
        newCategoryInput.classList.add("hidden");
    } else if (currentCategory) {
        const opt = document.createElement("option");
        opt.value = currentCategory;
        opt.textContent = currentCategory;
        categorySelect.insertBefore(opt, newOpt);
        categorySelect.value = currentCategory;
        newCategoryInput.value = "";
        newCategoryInput.classList.add("hidden");
    } else {
        categorySelect.value = "";
        newCategoryInput.value = "";
        newCategoryInput.classList.add("hidden");
    }

    categorySelect.onchange = () => {
        if (categorySelect.value === "__new__") {
            newCategoryInput.classList.remove("hidden");
            newCategoryInput.focus();
        } else {
            newCategoryInput.classList.add("hidden");
            newCategoryInput.value = "";
        }
    };

    titleInput.oninput = () => {
        const typedTitle = titleInput.value.trim().toLowerCase();
        const existing = (state.loadedSets || []).find(
            (s) => (s.title || s.name || "").toLowerCase() === typedTitle && s !== targetSet
        );
        if (existing) {
            warningEl.classList.remove("hidden");
        } else {
            warningEl.classList.add("hidden");
        }
    };

    modal.classList.remove("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();
}

// --- Manage Sets Popup Modal Logic ---

export function openManageSetsModal() {
    let modal = document.getElementById("manage-sets-modal");
    if (!modal) {
        document.body.insertAdjacentHTML("beforeend", getModalsHTML());
        initManageSetsModalEvents();
        modal = document.getElementById("manage-sets-modal");
    }

    populateCategoryFilter();
    renderManageSetsList();
    modal.classList.remove("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function populateCategoryFilter() {
    const select = document.getElementById("sets-filter-category");
    if (!select) return;
    const currentVal = select.value;
    const categories = [
        ...new Set((state.loadedSets || []).map((s) => s.category || s.folder || "MAIN").filter(Boolean))
    ].sort();

    select.innerHTML = '<option value="">All Categories</option>';
    categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
    select.value = currentVal;
}

export function renderManageSetsList() {
    const container = document.getElementById("manage-sets-list");
    const countEl = document.getElementById("manage-sets-count");
    const filterCat = document.getElementById("sets-filter-category")?.value || "";
    const sortBy = document.getElementById("sets-sort-by")?.value || "alpha";

    if (!container) return;
    container.innerHTML = "";

    let sets = [...(state.loadedSets || [])];

    if (filterCat) {
        sets = sets.filter((s) => {
            const cat = s.category || s.folder || "MAIN";
            return cat === filterCat;
        });
    }

    sets.sort((a, b) => {
        if (sortBy === "date") {
            return (b.lastModified || 0) - (a.lastModified || 0);
        } else {
            return (a.title || "").localeCompare(b.title || "");
        }
    });

    if (countEl) countEl.textContent = `${sets.length} sets found`;

    if (sets.length === 0) {
        container.innerHTML = `<div class="text-xs text-[var(--text-hint)] italic text-center py-6">No sets found matching criteria.</div>`;
        return;
    }

    sets.forEach((setObj) => {
        const itemDiv = document.createElement("div");
        itemDiv.className =
            "flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary-variant)] transition";

        const dateStr = setObj.lastModified ? new Date(setObj.lastModified).toLocaleDateString() : "Unknown date";
        const catName = setObj.category && setObj.category !== "MAIN" ? setObj.category : "MAIN";
        const catBadge = `<span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-[var(--color-secondary)]/30 text-[var(--text-color)] border border-[var(--color-secondary)]/50">${catName}</span>`;
        const songCount = (setObj.songs || setObj.songTitles || []).length;

        itemDiv.innerHTML = `
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <input type="checkbox" class="set-select-checkbox w-4 h-4 rounded border-[var(--border-color)] accent-[var(--color-secondary)] cursor-pointer" data-filename="${setObj.filename}">
                <div class="truncate flex flex-col gap-0.5">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-bold text-[var(--text-color)] truncate">${setObj.title || "Untitled Set"}</span>
                        ${catBadge}
                    </div>
                    <span class="text-[10px] text-[var(--text-hint)]">${songCount} items • Edited: ${dateStr}</span>
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <button class="load-single-set px-3 py-1 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] text-xs font-extrabold rounded-lg shadow-sm transition" title="Load Set">Load</button>
                <button class="edit-set-meta p-1.5 text-[var(--text-hint)] hover:text-[var(--text-color)] transition rounded-lg hover:bg-[var(--bg-primary)]" title="Edit Properties"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                <button class="delete-set-btn p-1.5 text-[var(--text-hint)] hover:text-red-400 transition rounded-lg hover:bg-[var(--bg-primary)]" title="Delete Set"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
        `;

        itemDiv.querySelector(".load-single-set").addEventListener("click", () => {
            loadAndMergeSets([setObj]);
            document.getElementById("manage-sets-modal").classList.add("hidden");
        });

        itemDiv.querySelector(".edit-set-meta").addEventListener("click", () => {
            openEditSetModal(setObj);
        });

        itemDiv.querySelector(".delete-set-btn").addEventListener("click", () => {
            confirmDeleteSet(setObj);
        });

        container.appendChild(itemDiv);
    });

    if (typeof lucide !== "undefined") lucide.createIcons();
}

function loadAndMergeSets(selectedSetObjs) {
    if (!selectedSetObjs || selectedSetObjs.length === 0) return;

    let mergedSongs = [];
    let primaryTitle = selectedSetObjs[0].title;

    selectedSetObjs.forEach((s, idx) => {
        const items = s.songs || s.songTitles || [];
        mergedSongs.push(...items);
        if (idx > 0) {
            primaryTitle += ` + ${s.title}`;
        }
    });

    const mergedSet = {
        id: "set_" + Math.random().toString(36).substring(2, 8),
        title: primaryTitle,
        category: selectedSetObjs[0].category || "MAIN",
        folder: selectedSetObjs[0].category || "MAIN",
        filename: selectedSetObjs[0].filename,
        songs: mergedSongs,
        songTitles: mergedSongs
    };

    sanitizeSet(mergedSet);
    state.activeSet = mergedSet;
    state.currentSet = JSON.parse(JSON.stringify(mergedSet));
    state.activeSetSongIndex = 0;

    saveActiveSetToStorage(mergedSet);
    renderSetSheet(mergedSet);

    const bannerEl = document.getElementById("set-navigation-banner");
    if (bannerEl) bannerEl.classList.remove("hidden");
    const bannerTitleEl = document.getElementById("banner-set-title");
    if (bannerTitleEl) bannerTitleEl.textContent = mergedSet.title;

    if (typeof updateTabCounts === "function") updateTabCounts();
    if (typeof renderSidebarList === "function") renderSidebarList();

    showToast(`Loaded and merged ${selectedSetObjs.length} sets successfully!`);
}

function confirmDeleteSet(setObj) {
    const confirmModal = document.getElementById("delete-set-confirm-modal");
    const textEl = document.getElementById("delete-set-confirm-text");
    textEl.textContent = `Are you sure you want to delete "${setObj.title}" from disk? This cannot be undone.`;
    confirmModal.classList.remove("hidden");

    const confirmBtn = document.getElementById("confirm-delete-set-btn");
    const cancelBtn = document.getElementById("cancel-delete-set-btn");

    const cleanup = () => {
        confirmModal.classList.add("hidden");
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    cancelBtn.onclick = cleanup;
    confirmBtn.onclick = async () => {
        cleanup();
        await deleteSetFileFromDisk(setObj);
    };
}

async function deleteSetFileFromDisk(setObj) {
    const rootHandle = getRootDirectoryHandle() || window.rootDirectoryHandle;
    if (rootHandle) {
        try {
            const setsDirHandle = await rootHandle.getDirectoryHandle("Sets", { create: false });
            await setsDirHandle.removeEntry(setObj.filename);
        } catch (e) {
            console.warn("Could not delete file from Sets directory handle:", e);
        }
    }

    state.loadedSets = (state.loadedSets || []).filter((s) => s.filename !== setObj.filename);
    renderManageSetsList();
    populateCategoryFilter();
    showToast(`Deleted set "${setObj.title}"`);
}

let currentEditingSet = null;
function openEditSetModal(setObj) {
    currentEditingSet = setObj;
    const editModal = document.getElementById("edit-set-meta-modal");
    document.getElementById("edit-set-title-input").value = setObj.title || "";
    document.getElementById("edit-set-category-input").value =
        setObj.category && setObj.category !== "MAIN" ? setObj.category : "";
    editModal.classList.remove("hidden");
}

function initManageSetsModalEvents() {
    document.getElementById("close-manage-sets-btn")?.addEventListener("click", () => {
        document.getElementById("manage-sets-modal").classList.add("hidden");
    });
    document.getElementById("close-manage-sets-footer-btn")?.addEventListener("click", () => {
        document.getElementById("manage-sets-modal").classList.add("hidden");
    });

    document.getElementById("sets-filter-category")?.addEventListener("change", renderManageSetsList);
    document.getElementById("sets-sort-by")?.addEventListener("change", renderManageSetsList);

    document.getElementById("load-merged-sets-btn")?.addEventListener("click", () => {
        const checkboxes = document.querySelectorAll(".set-select-checkbox:checked");
        if (checkboxes.length === 0) {
            showToast("Please select at least one set using the checkboxes.");
            return;
        }

        const selectedFilenames = Array.from(checkboxes).map((cb) => cb.dataset.filename);
        const selectedSets = selectedFilenames
            .map((fn) => (state.loadedSets || []).find((s) => s.filename === fn))
            .filter(Boolean);

        loadAndMergeSets(selectedSets);
        document.getElementById("manage-sets-modal").classList.add("hidden");
    });

    document.getElementById("cancel-edit-set-btn")?.addEventListener("click", () => {
        document.getElementById("edit-set-meta-modal").classList.add("hidden");
    });

    document.getElementById("confirm-edit-set-btn")?.addEventListener("click", async () => {
        if (!currentEditingSet) return;
        const newTitle = document.getElementById("edit-set-title-input").value.trim();
        const newCategory = document.getElementById("edit-set-category-input").value.trim();

        if (!newTitle) {
            showToast("Title cannot be empty.");
            return;
        }

        document.getElementById("edit-set-meta-modal").classList.add("hidden");

        const oldFilename = currentEditingSet.filename;
        const cleanTitle = newTitle.replace(/[\/\\?%*:|"<>]/g, "_");
        const newFilename = newCategory && newCategory !== "MAIN" ? `${newCategory}__${cleanTitle}` : cleanTitle;

        currentEditingSet.title = newTitle;
        currentEditingSet.category = newCategory || "MAIN";
        currentEditingSet.folder = newCategory || "MAIN";
        currentEditingSet.filename = newFilename;
        currentEditingSet.lastModified = Date.now();

        const rootHandle = getRootDirectoryHandle() || window.rootDirectoryHandle;
        if (rootHandle && oldFilename !== newFilename) {
            try {
                const setsDirHandle = await rootHandle.getDirectoryHandle("Sets", { create: true });
                try {
                    await setsDirHandle.removeEntry(oldFilename);
                } catch (e) {}
                await writeSetToDisk(currentEditingSet);
            } catch (err) {
                console.warn("Failed to rename set file on disk:", err);
            }
        } else {
            await writeSetToDisk(currentEditingSet);
        }

        renderManageSetsList();
        populateCategoryFilter();
        showToast(`Updated set "${newTitle}" successfully!`);
    });

    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) {
                backdrop.classList.add("hidden");
            }
        });
    });
}

// --- End Manage Sets Modal Logic ---

export function sanitizeSet(setObj) {
    if (!setObj) return setObj;

    if (!setObj.songTitles && setObj.songs && Array.isArray(setObj.songs)) {
        setObj.songTitles = [...setObj.songs];
    }

    if (setObj.songTitles && Array.isArray(setObj.songTitles)) {
        setObj.songTitles = setObj.songTitles.filter((item) => {
            if (!item) return false;
            if (typeof item === "object") return true;
            return typeof item === "string" && item.trim() !== "";
        });

        setObj.songs = setObj.songTitles.map((item) => {
            if (typeof item === "object" && (item.type === "custom" || item.type === "scripture")) return item;
            if (typeof item === "object" && item.title) {
                const t = item.title;
                const found =
                    state.loadedSongs && state.loadedSongs.length > 0
                        ? state.loadedSongs.find(
                              (s) =>
                                  s.title.toLowerCase() === t.toLowerCase() &&
                                  (!item.folder || item.folder === "MAIN" || (s.folderPath || s.folder) === item.folder)
                          )
                        : null;
                return {
                    title: t,
                    filename: item.filename || (found ? found.filename || "" : ""),
                    folder: item.folder || (found ? found.folderPath || found.folder || "MAIN" : "MAIN"),
                    prefKey: item.prefKey || (found ? found.key || "" : "")
                };
            }
            const t = typeof item === "string" ? item : item.title || "";
            const found =
                state.loadedSongs && state.loadedSongs.length > 0
                    ? state.loadedSongs.find((s) => s.title.toLowerCase() === t.toLowerCase())
                    : null;
            return {
                title: t,
                filename: found ? found.filename || "" : "",
                folder: found ? found.folderPath || found.folder || "MAIN" : "MAIN",
                prefKey: found ? found.key || "" : ""
            };
        });
    }
    return setObj;
}

export function initSet() {
    if (!document.getElementById("save-set-modal")) {
        document.body.insertAdjacentHTML("beforeend", getModalsHTML());
        initManageSetsModalEvents();
    }

    // 💡 Add Event Delegation on #song-list so it never loses click listeners on re-render
    const songListContainer = document.getElementById("song-list");
    if (songListContainer && !songListContainer.dataset.delegated) {
        songListContainer.dataset.delegated = "true";
        songListContainer.addEventListener("click", async (e) => {
            const deleteBtn = e.target.closest(".remove-set-song");
            if (deleteBtn) {
                return; // Handled separately or let delete logic handle it
            }

            const itemRow = e.target.closest("li[data-index], div[data-index]");
            if (itemRow) {
                const idx = parseInt(itemRow.dataset.index, 10);
                console.log(`%c[Delegated Click] Item index ${idx} clicked`, "color: #38bdf8; font-weight: bold;");
                await loadSongFromActiveSet(idx);
                if (window.innerWidth < 1024 && typeof window.closeMobileSidebar === "function") {
                    window.closeMobileSidebar();
                }
            }
        });
    }

    document.getElementById("close-save-modal-btn")?.addEventListener("click", closeSaveModal);
    document.getElementById("cancel-save-modal-btn")?.addEventListener("click", closeSaveModal);

    document.getElementById("confirm-save-modal-btn")?.addEventListener("click", async () => {
        const titleInput = document.getElementById("save-modal-title-input");
        const categorySelect = document.getElementById("save-modal-category-select");
        const newCategoryInput = document.getElementById("save-modal-new-category-input");

        if (!titleInput) {
            showToast("Error: Save modal title input missing from HTML.");
            return;
        }

        const newTitle = titleInput.value.trim();
        if (!newTitle) {
            showToast("Please enter a title for the set.");
            titleInput.focus();
            return;
        }

        let finalCategory = "";
        if (categorySelect && categorySelect.value === "__new__") {
            finalCategory = newCategoryInput ? newCategoryInput.value.trim() : "";
        } else if (categorySelect) {
            finalCategory = categorySelect.value;
        }

        const workingSet = state.currentSet || state.activeSet || {};
        workingSet.title = newTitle;
        workingSet.name = newTitle;
        workingSet.category = finalCategory;
        workingSet.folder = finalCategory;

        const cleanTitle = newTitle.replace(/[\/\\?%*:|"<>]/g, "_");
        workingSet.filename =
            finalCategory && finalCategory !== "MAIN" ? `${finalCategory}__${cleanTitle}` : cleanTitle;

        state.activeSet = JSON.parse(JSON.stringify(workingSet));
        state.currentSet = JSON.parse(JSON.stringify(workingSet));

        const existingIdx = (state.loadedSets || []).findIndex(
            (s) =>
                (s.filename && s.filename.toLowerCase() === workingSet.filename.toLowerCase()) ||
                (s.title || s.name || "").toLowerCase() === newTitle.toLowerCase()
        );

        if (existingIdx !== -1) {
            state.loadedSets[existingIdx] = { ...state.activeSet };
        } else {
            state.loadedSets.push({ ...state.activeSet });
        }

        closeSaveModal();

        saveActiveSetToStorage(state.activeSet);

        const bannerTitleEl = document.getElementById("banner-set-title");
        if (bannerTitleEl) bannerTitleEl.textContent = newTitle;

        await writeSetToDisk(state.activeSet);
        renderSetSheet(state.activeSet);

        if (typeof renderSidebarList === "function") renderSidebarList();
        if (typeof checkSetDirtyState === "function") checkSetDirtyState();

        showToast(`Set "${newTitle}" saved successfully to Sets/`);
    });

    document
        .querySelectorAll("#sidebar-set-save-btn, #sidebar-save-set-btn, [data-action='save-set']")
        .forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                openSaveSetModal();
            });
        });

    document.querySelectorAll("#sidebar-manage-sets-btn, [data-action='manage-sets']").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            openManageSetsModal();
        });
    });
}

export function closeSaveModal() {
    document.getElementById("save-set-modal")?.classList.add("hidden");
}

export function loadActiveSetFromStorage() {
    const saved = localStorage.getItem("opensong_active_set");
    if (saved) {
        try {
            let parsedSet = JSON.parse(saved);
            parsedSet = sanitizeSet(parsedSet);

            state.activeSet = parsedSet;
            state.currentSet = JSON.parse(JSON.stringify(parsedSet));

            if (parsedSet.activeSongIndex !== undefined) {
                state.activeSetSongIndex = parsedSet.activeSongIndex;
            } else if (state.activeSetSongIndex === undefined || state.activeSetSongIndex === -1) {
                state.activeSetSongIndex = 0;
            }

            const bannerEl = document.getElementById("set-navigation-banner");
            if (bannerEl) {
                bannerEl.classList.remove("hidden");
            }
            const bannerTitleEl = document.getElementById("banner-set-title");
            if (bannerTitleEl) {
                bannerTitleEl.textContent = parsedSet.title || "Set";
            }

            // 💡 CRITICAL FIX: Render the set sheet so the sidebar HTML elements actually get created in #song-list!
            renderSetSheet(parsedSet);

            updateSetIndexDisplay();

            if (typeof updateSetSidebarHighlighting === "function") {
                updateSetSidebarHighlighting();
            }
        } catch (e) {
            console.error("Failed to load saved active set from storage:", e);
        }
    }

    if (typeof updateTabCounts === "function") {
        updateTabCounts();
    }
}

export function saveActiveSetToStorage(setObj) {
    const targetSet = setObj || state.currentSet || state.activeSet;
    if (targetSet) {
        sanitizeSet(targetSet);
        state.currentSet = targetSet;
        state.activeSet = targetSet;
        localStorage.setItem("opensong_active_set", JSON.stringify(targetSet));
    }

    if (typeof updateTabCounts === "function") {
        updateTabCounts();
    }

    if (typeof updateSetIndexDisplay === "function") {
        updateSetIndexDisplay();
    }
}

export function updateSetIndexDisplay() {
    const activeSet = state.activeSet;
    if (!activeSet) return;
    const totalSongs =
        activeSet.songs && activeSet.songs.length > 0
            ? activeSet.songs.length
            : activeSet.songTitles
              ? activeSet.songTitles.length
              : 0;

    const indexLabel = document.getElementById("set-song-index-label");
    if (indexLabel && state.activeSetSongIndex >= 0) {
        indexLabel.textContent = `${state.activeSetSongIndex + 1} / ${totalSongs}`;
    }
}
