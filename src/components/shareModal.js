export function getShareModalHTML() {
    return `
        <!-- Share Options Modal -->
        <div
            id="share-modal"
            class="hidden fixed inset-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
                class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                    <h3 class="font-bold text-sm text-[var(--text-color)] flex items-center gap-1.5">
                        <i data-lucide="share-2" class="w-4 h-4 text-[var(--text-color)]"></i> Export / Share File
                    </h3>
                    <button
                        id="close-share-modal"
                        class="p-1 text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="space-y-2">
                    <button
                        id="share-extless-btn"
                        class="w-full py-2.5 px-4 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-xl transition text-left flex justify-between items-center">
                        <span>Extensionless File</span>
                        <span id="share-name-extless" class="font-mono text-[var(--text-color)]"></span>
                    </button>
                    <button
                        id="share-ext-btn"
                        class="w-full py-2.5 px-4 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-xl transition text-left flex justify-between items-center">
                        <span id="share-ext-label">With extension</span>
                        <span id="share-name-ext" class="font-mono text-[var(--text-color)]"></span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Share Modal Close Button
if (elements.closeShareModal && elements.shareModal) {
    elements.closeShareModal.addEventListener("click", () => {
        elements.shareModal.classList.add("hidden");
    });

    // Optional: also close if clicking the dark backdrop outside the modal card
    elements.shareModal.addEventListener("click", (e) => {
        if (e.target === elements.shareModal) {
            elements.shareModal.classList.add("hidden");
        }
    });
}
