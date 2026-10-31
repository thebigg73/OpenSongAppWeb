export function getImportExportModalHTML() {
    return `
        <!-- Import / Export Modal -->
        <div
            id="import-modal"
            class="hidden fixed inset-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
                class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
                <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <div class="flex items-center space-x-2 text-[var(--text-color)]">
                        <i data-lucide="repeat" class="w-5 h-5"></i>
                        <h3 class="font-bold text-lg text-[var(--text-color)]">Import & Export Archives</h3>
                    </div>
                    <button
                        id="close-import-modal"
                        class="p-1 hover:bg-[var(--bg-surface-variant)] rounded text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="space-y-4 text-xs">
                    <div>
                        <h4 class="font-bold text-[var(--text-color)] mb-2">Import Backups or Files</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                id="modal-import-archive-btn"
                                class="py-3 px-4 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-xl transition flex items-center justify-center space-x-2">
                                <i data-lucide="file-archive" class="w-4 h-4"></i><span>Import .osb / .osbs / Zip</span>
                            </button>
                            <button
                                id="modal-import-files-btn"
                                class="py-3 px-4 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-xl transition flex items-center justify-center space-x-2">
                                <i data-lucide="file-plus" class="w-4 h-4"></i><span>Import Songs / PDFs / DB</span>
                            </button>
                        </div>
                    </div>

                    <div class="border-t border-[var(--border-color)] pt-3">
                        <h4 class="font-bold text-[var(--text-color)] mb-2">Export Library</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                id="modal-export-osb-btn"
                                class="py-3 px-4 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] font-bold rounded-xl border border-[var(--border-color)] transition flex items-center justify-center space-x-2">
                                <i data-lucide="folder-output" class="w-4 h-4"></i><span>Export Songs Folders (.osb)</span>
                            </button>
                            <button
                                id="modal-export-osbs-btn"
                                class="py-3 px-4 bg-[var(--bg-surface-variant)] hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] font-bold rounded-xl border border-[var(--border-color)] transition flex items-center justify-center space-x-2">
                                <i data-lucide="archive" class="w-4 h-4"></i><span>Export Sets Backup (.osbs)</span>
                            </button>
                        </div>
                    </div>
                </div>

                <input type="file" id="archive-file-input" accept=".osb,.osbs,.zip" multiple class="hidden" />
                <input
                    type="file"
                    id="individual-files-input"
                    accept=".xml,.ost,.osts,.pdf,.db,.csv"
                    multiple
                    class="hidden" />
            </div>
        </div>
    `;
}
