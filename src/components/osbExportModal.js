export function getOsbExportModalHTML() {
    return `
        <!-- OSB Folder Selection Export Modal -->
        <div
            id="osb-export-modal"
            class="hidden fixed inset-0 z-50 bg-[var(--bg-primary)]/85 backdrop-blur-md flex items-center justify-center p-4">
            <div
                class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
                    <div class="flex items-center space-x-2 text-[var(--text-color)]">
                        <i data-lucide="folder-output" class="w-5 h-5"></i>
                        <h3 class="font-bold text-lg text-[var(--text-color)]">Select Folders to Export (.osb)</h3>
                    </div>
                    <button
                        id="close-osb-export-modal"
                        class="p-1 hover:bg-[var(--bg-surface-variant)] rounded text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <p class="text-xs text-[var(--text-hint)] leading-relaxed shrink-0">
                    Choose which song folders from OpenSong/Songs/ to bundle into your .osb backup:
                </p>
                <div
                    id="osb-folders-checkbox-list"
                    class="flex-1 overflow-y-auto space-y-2 pr-1 text-xs divide-y divide-[var(--border-color)]"></div>
                <div class="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)] shrink-0">
                    <button
                        id="osb-export-cancel-btn"
                        class="px-4 py-2 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] font-bold text-xs rounded-xl border border-[var(--border-color)] transition">
                        Cancel
                    </button>
                    <button
                        id="osb-export-confirm-btn"
                        class="px-5 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] font-bold text-xs rounded-xl border border-[var(--border-color)] transition">
                        Export Selected (.osb)
                    </button>
                </div>
            </div>
        </div>
    `;
}
