// Export the HTML snippet to be injected into your document (e.g. during app startup)
export function getToastHTML() {
    return `
        <div
            id="toast-notification"
            class="fixed top-1/2 left-1/2 z-50 transform -translate-x-1/2 -translate-y-1/2 scale-95 opacity-0 pointer-events-none transition-all duration-300 bg-[var(--color-secondary)] text-[var(--text-color)] px-6 py-4 rounded-2xl shadow-2xl border border-[var(--border-color)]/30 backdrop-blur-md flex items-center space-x-3 text-sm font-extrabold max-w-sm text-center">
            <i data-lucide="bell" class="w-5 h-5 text-[var(--text-color)] shrink-0"></i>
            <span id="toast-message">Notification message</span>
        </div>
    `;
}

// Export the showToast function
export function showToast(message) {
    const toastNotification = document.getElementById("toast-notification");
    const toastMessage = document.getElementById("toast-message");

    if (!toastNotification || !toastMessage) return;

    toastMessage.textContent = message;

    // Pop in and fade in centered
    toastNotification.classList.remove("scale-95", "opacity-0", "pointer-events-none");
    toastNotification.classList.add("scale-100", "opacity-100");

    // Clear any existing timeout to prevent overlapping timeouts
    if (toastNotification.timeoutId) {
        clearTimeout(toastNotification.timeoutId);
    }

    toastNotification.timeoutId = setTimeout(() => {
        // Pop out and fade out
        toastNotification.classList.remove("scale-100", "opacity-100");
        toastNotification.classList.add("scale-95", "opacity-0", "pointer-events-none");
    }, 2500);
}
