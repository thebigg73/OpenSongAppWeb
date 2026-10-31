export function getManageSetsModalHTML() {
    return `
        <!-- Manage Sets Modal -->
        <div
            id="manage-sets-modal"
            class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-primary)]/80 backdrop-blur-sm">
            <div
                class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl p-5 shadow-2xl max-w-lg w-full space-y-4 relative flex flex-col max-h-[85vh]">
                <!-- Header -->
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
                    <div class="flex items-center gap-2">
                        <i data-lucide="folder-archive" class="w-5 h-5 text-[var(--text-color)]"></i>
                        <h3 class="text-base font-extrabold text-[var(--text-color)]">Saved Sets Library</h3>
                    </div>
                    <button
                        id="close-manage-sets-btn"
                        class="p-1 text-[var(--text-hint)] hover:text-[var(--text-color)] rounded-lg hover:bg-[var(--bg-surface-variant)] transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Search / Filter input inside modal -->
                <div class="relative shrink-0">
                    <i data-lucide="search" class="w-4 h-4 text-[var(--text-hint)] absolute left-3 top-3"></i>
                    <input
                        type="text"
                        id="manage-sets-search"
                        placeholder="Filter saved sets..."
                        class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-3 text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)]" />
                </div>

                <!-- Saved Sets Scrollable List -->
                <div id="manage-sets-list" class="space-y-2 overflow-y-auto flex-1 pr-1">
                    <!-- Dynamically populated -->
                </div>

                <!-- Footer / Dismiss -->
                <div class="border-t border-[var(--border-color)] pt-3 flex justify-end shrink-0">
                    <button
                        id="cancel-manage-sets-btn"
                        class="px-4 py-2 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] font-bold text-xs rounded-xl border border-[var(--border-color)] transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Function to open the Manage Sets Popup Modal
function openManageSetsModal() {
    const modal = document.getElementById("manage-sets-modal");
    const listContainer = document.getElementById("manage-sets-list");
    const searchInput = document.getElementById("manage-sets-search");

    if (!modal || !listContainer) return;

    // Helper to render set items inside the modal
    const renderModalSets = (filter = "") => {
        listContainer.innerHTML = "";
        const query = filter.toLowerCase().trim();
        const filtered = loadedSets.filter(
            (s) => s.title.toLowerCase().includes(query) || (s.category && s.category.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            listContainer.innerHTML =
                '<div class="text-xs text-[var(--text-hint)] p-4 text-center italic">No saved sets found.</div>';
            return;
        }

        filtered.forEach((setObj) => {
            const card = document.createElement("div");
            card.className =
                "p-3 bg-[var(--bg-primary)]/80 hover:bg-[var(--bg-surface-variant)] border border-[var(--border-color)] hover:border-[var(--color-secondary)]/40 rounded-xl flex items-center justify-between cursor-pointer transition group";

            card.innerHTML = `
                <div class="truncate pr-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-[var(--text-color)] group-hover:text-[var(--text-color)] transition truncate">${setObj.title}</span>
                        <span class="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--bg-surface-variant)] text-[var(--text-hint)] rounded border border-[var(--border-color)]">${setObj.category || "MAIN"}</span>
                    </div>
                    <div class="text-[11px] text-[var(--text-hint)] font-mono mt-0.5">${setObj.songTitles ? setObj.songTitles.length : 0} songs</div>
                </div>
                <button class="px-3 py-1.5 bg-[var(--color-secondary)]/20 group-hover:bg-[var(--color-secondary)] text-[var(--text-color)] font-bold text-xs rounded-lg border border-[var(--border-color)] transition shrink-0 flex items-center gap-1">
                    Load Set <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
            `;

            card.addEventListener("click", () => {
                // 1. Resolve raw items array (supporting .songs, .items, or .songTitles)
                const rawItems = setObj.songs || setObj.items || setObj.songTitles || [];

                // 2. Map items safely into currentSet
                const processedSongs = rawItems.map((item) => {
                    // If it's a custom Divider or Note object, preserve it
                    if (item && typeof item === "object" && item.type === "custom") {
                        return { ...item };
                    }

                    // Handle object or string representation
                    const titleStr = typeof item === "string" ? item : item.title || item.name || "";
                    const folderStr = typeof item === "object" ? item.folder || "" : "";

                    const found = loadedSongs.find((s) => s.title && s.title.toLowerCase() === titleStr.toLowerCase());

                    return {
                        title: titleStr,
                        folder: folderStr,
                        prefKey: item.prefKey || item.overrideKey || (found ? found.key : "") || "",
                        overrideKey: item.overrideKey || item.prefKey || (found ? found.key : "") || ""
                    };
                });

                // 3. Set currentSet and activeSet
                currentSet = {
                    ...setObj,
                    songs: processedSongs,
                    items: processedSongs
                };

                activeSet = currentSet;

                // 4. Render main sheet set view & refresh sidebar current set
                renderSetSheet(currentSet);
                if (typeof renderSidebarList === "function") renderSidebarList();

                modal.classList.add("hidden");
                if (typeof closeMobileSidebar === "function") closeMobileSidebar();

                showToast(`Loaded set: ${setObj.title || setObj.name || "Untitled Set"}`);
            });

            listContainer.appendChild(card);
        });

        lucide.createIcons();
    };

    // Initial render & show modal
    if (searchInput) searchInput.value = "";
    renderModalSets();
    modal.classList.remove("hidden");

    // Search filter listener
    if (searchInput) {
        searchInput.oninput = (e) => renderModalSets(e.target.value);
    }
}

// Event Listeners for Closing the Manage Sets Modal
document.getElementById("close-manage-sets-btn")?.addEventListener("click", () => {
    document.getElementById("manage-sets-modal")?.classList.add("hidden");
});
document.getElementById("cancel-manage-sets-btn")?.addEventListener("click", () => {
    document.getElementById("manage-sets-modal")?.classList.add("hidden");
});
document.getElementById("manage-sets-modal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("manage-sets-modal")) {
        document.getElementById("manage-sets-modal").classList.add("hidden");
    }
});
