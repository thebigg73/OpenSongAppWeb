// The settings modal
const settingsBtn = document.getElementById("open-settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");

export function getSettingsModalHTML() {
    return `
        <!-- Settings Modal -->
        <div
            id="settings-modal"
            class="fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-50 flex items-center justify-center hidden">
            <div
                class="bg-[var(--bg-primary-variant)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                    <h3 class="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                        <i data-lucide="settings" class="w-5 h-5 text-[var(--text-color)]"></i> App Settings
                    </h3>
                    <button
                        id="close-settings-btn"
                        class="text-[var(--text-hint)] hover:text-[var(--text-color)] transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="p-6 overflow-y-auto space-y-6 text-[var(--text-color)]">
                    <div class="space-y-4">
                        <h4 class="text-sm font-semibold text-[var(--text-color)] uppercase tracking-wider">
                            Typography & Scaling
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-[var(--text-hint)] mb-1"
                                    >Chord Font Size</label
                                >
                                <input
                                    type="range"
                                    id="setting-chord-scale"
                                    min="0.75"
                                    max="1.5"
                                    step="0.05"
                                    class="w-full accent-[var(--color-secondary)] cursor-pointer" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-[var(--text-hint)] mb-1"
                                    >Heading Font Size</label
                                >
                                <input
                                    type="range"
                                    id="setting-heading-scale"
                                    min="0.7"
                                    max="1.3"
                                    step="0.05"
                                    class="w-full accent-[var(--color-secondary)] cursor-pointer" />
                            </div>
                            <div class="space-y-4 pt-2">
                                <label class="flex items-center justify-between cursor-pointer">
                                    <span class="text-sm font-semibold text-[var(--text-color)]"
                                        >Auto-scale song text to screen width</span
                                    >
                                    <input
                                        type="checkbox"
                                        id="setting-auto-scale"
                                        class="w-4 h-4 accent-[var(--color-secondary)] rounded cursor-pointer"
                                        checked />
                                </label>

                                <div id="max-font-size-container" class="flex items-center justify-between">
                                    <span class="text-sm font-semibold text-[var(--text-color)]"
                                        >Max Font Size (px):</span
                                    >
                                    <input
                                        type="number"
                                        id="setting-max-font-size"
                                        value="24"
                                        min="12"
                                        max="48"
                                        class="w-20 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-[var(--text-color)] text-center font-mono" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                        <label for="theme-select" class="text-xs font-bold text-[var(--text-color)]">App Theme</label>
                        <select
                            id="theme-select"
                            class="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-xs py-1.5 px-3 text-[var(--text-color)] focus:outline-none focus:border-[var(--color-secondary)]">
                            <option value="system">System Default</option>
                            <option value="dark">Dark Theme</option>
                            <option value="light">Light Theme</option>
                        </select>
                    </div>
                    <hr class="border-[var(--border-color)]" />

                    <div class="space-y-4">
                        <h4 class="text-sm font-semibold text-[var(--text-color)] uppercase tracking-wider">
                            Autoscroll Defaults
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-[var(--text-hint)] mb-1"
                                    >Default Duration (seconds)</label
                                >
                                <input
                                    type="number"
                                    id="setting-autoscroll-duration"
                                    value="180"
                                    class="w-full bg-[var(--bg-surface-variant)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-color)] text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-[var(--text-hint)] mb-1"
                                    >Default Predelay (seconds)</label
                                >
                                <input
                                    type="number"
                                    id="setting-autoscroll-predelay"
                                    value="5"
                                    class="w-full bg-[var(--bg-surface-variant)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-color)] text-sm" />
                            </div>
                        </div>
                    </div>

                    <hr class="border-[var(--border-color)]" />

                    <div class="space-y-4">
                        <h4 class="text-sm font-semibold text-[var(--text-color)] uppercase tracking-wider">
                            WebSockets (Client / Host)
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-[var(--text-hint)] mb-1"
                                    >WebSocket Mode</label
                                >
                                <select
                                    id="setting-ws-mode"
                                    class="w-full bg-[var(--bg-surface-variant)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-color)] text-sm">
                                    <option value="disabled">Disabled</option>
                                    <option value="host">Host Stage Display</option>
                                    <option value="client">Client Receiver</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-[var(--text-hint)] mb-1"
                                    >Host / Server URL</label
                                >
                                <input
                                    type="text"
                                    id="setting-ws-url"
                                    placeholder="ws://localhost:8080"
                                    class="w-full bg-[var(--bg-surface-variant)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-color)] text-sm" />
                            </div>
                        </div>
                    </div>

                    <hr class="border-[var(--border-color)]" />

                    <div class="space-y-4">
                        <h4 class="text-sm font-semibold text-[var(--text-color)] uppercase tracking-wider">
                            MIDI Device Options
                        </h4>
                        <div>
                            <label class="block text-xs font-medium text-[var(--text-hint)] mb-1"
                                >Preferred MIDI Input Port</label
                            >
                            <select
                                id="setting-midi-port"
                                class="w-full bg-[var(--bg-surface-variant)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-color)] text-sm">
                                <option value="">-- No MIDI Device Connected --</option>
                            </select>
                        </div>
                    </div>

                    <hr class="border-[var(--border-color)]" />

                    <!-- Group 5: Stage Display / Cast Options -->
                    <div class="space-y-4">
                        <h4 class="text-sm font-semibold text-[var(--text-color)] uppercase tracking-wider">
                            Stage Display / Cast Options
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="setting-cast-show-chords"
                                    checked
                                    class="accent-[var(--color-secondary)] w-4 h-4 rounded cursor-pointer" />
                                <label
                                    for="setting-cast-show-chords"
                                    class="text-xs font-medium text-[var(--text-color)] cursor-pointer"
                                    >Show Chords on Stage Cast</label
                                >
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-[var(--text-hint)] mb-1"
                                    >Stage Cast Font Scale</label
                                >
                                <input
                                    type="range"
                                    id="setting-cast-font-scale"
                                    min="1"
                                    max="2.5"
                                    step="0.1"
                                    value="1.4"
                                    class="w-full accent-[var(--color-secondary)] cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="flex items-center justify-end px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/40 gap-3">
                    <button
                        id="save-settings-btn"
                        class="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] border border-[var(--border-color)] px-4 py-2 rounded-lg text-sm font-semibold transition">
                        Save & Apply
                    </button>
                </div>
            </div>
        </div>
    `;
}

if (settingsBtn && settingsModal) settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
if (closeSettingsBtn && settingsModal)
    closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
// Update settings save button listener
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", () => {
        const autoScaleInput = document.getElementById("setting-auto-scale");
        const maxFontInput = document.getElementById("setting-max-font-size");

        if (autoScaleInput && maxFontInput) {
            userSettings.autoScale = autoScaleInput.checked;
            userSettings.maxFontSize = parseInt(maxFontInput.value, 10) || 24;

            localStorage.setItem("openSong_autoScale", userSettings.autoScale);
            localStorage.setItem("openSong_maxFontSize", userSettings.maxFontSize);
        }

        if (activeSong) {
            renderSongSheet(activeSong);
            applyTextScaling();
        }

        document.getElementById("settings-modal").classList.add("hidden");
        showToast("Display preferences updated!");
    });
}
