function renderNoteSheet(noteObj, setObj, index) {
    activeSong = null;
    activeSet = setObj;
    activeSetSongIndex = index;

    // Hide floating capo button since it's a note
    if (elements.floatingCapoBtn) elements.floatingCapoBtn.classList.add("hidden");

    elements.emptyState.classList.add("hidden");
    document.getElementById("set-view-sheet").classList.add("hidden");
    elements.songSheet.classList.remove("hidden");

    // Set navigation banner setup
    document.getElementById("banner-set-title").textContent = activeSet.title;
    const totalSetSongs =
        activeSet.songs && activeSet.songs.length > 0
            ? activeSet.songs.length
            : activeSet.songTitles
              ? activeSet.songTitles.length
              : 0;
    document.getElementById("set-song-index-label").textContent = `${activeSetSongIndex + 1} / ${totalSetSongs}`;
    document.getElementById("set-navigation-banner").classList.remove("hidden");

    // Header info matching song sheet style
    elements.sheetTitle.textContent = "Note";
    elements.sheetAuthor.textContent = activeSet.title ? `Set: ${activeSet.title}` : "";
    elements.sheetFolderPath.textContent = "NOTE";
    elements.sheetKeyBadge.textContent = "—";
    elements.sheetCapoBadge.classList.add("hidden");

    elements.currentSongTitle.textContent = "Note";
    elements.currentSongAuthor.textContent = activeSet.title || "";
    elements.metaKey.textContent = "—";
    elements.metaTempo.textContent = "—";

    // Render note content nicely in the main sheet area
    elements.sheetContent.innerHTML = `
        <div class="w-full p-6 md:p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 shadow-xl">
            <div class="flex items-center gap-2.5 text-amber-400 font-extrabold text-sm uppercase tracking-wide">
                <i data-lucide="file-text" class="w-5 h-5"></i>
                <span>Set Note</span>
            </div>
            <div class="text-[var(--text-color)] text-base md:text-lg whitespace-pre-wrap leading-relaxed">${noteObj.notes || ""}</div>
        </div>
    `;

    lucide.createIcons();
}
