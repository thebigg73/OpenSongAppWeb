import { createIcons, icons } from "lucide";

// 1. Export the HTML template function
export function getAbcPopupHTML() {
    return `
        <div
            id="abc-popup"
            class="hidden draggable-popup absolute z-40 bg-[var(--bg-primary-variant)]/95 border border-[var(--border-color)] backdrop-blur-md rounded-xl p-4 shadow-2xl max-w-md text-xs text-[var(--text-color)]">
            <div
                class="flex justify-between items-center font-bold mb-2 border-b border-[var(--border-color)] pb-1 cursor-grab active:cursor-grabbing select-none"
                id="abc-drag-handle">
                <span class="text-[var(--text-color)]">
                    <i data-lucide="music" class="w-3.5 h-3.5 inline mr-1"></i> ABC Notation Score
                </span>
                <button
                    id="close-abc-popup-btn"
                    class="text-[var(--text-hint)] hover:text-[var(--text-color)] transition p-1">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            </div>
            <pre
                id="abc-popup-content"
                class="font-mono text-[11px] bg-[var(--bg-primary)] p-2 rounded border border-[var(--border-color)] overflow-x-auto text-[var(--text-color)]"></pre>
        </div>
    `;
}

// 2. Export the initialization function to wire up events and drag mechanics
export function initAbcPopup() {
    const popup = document.getElementById("abc-popup");
    const dragHandle = document.getElementById("abc-drag-handle");
    const closeBtn = document.getElementById("close-abc-popup-btn");

    // Close button handler (replaces inline onclick)
    if (closeBtn && popup) {
        closeBtn.addEventListener("click", () => {
            popup.classList.add("hidden");
        });
    }

    // Drag-and-drop popup functionality
    if (popup && dragHandle) {
        let isDragging = false;
        let startX = 0,
            startY = 0,
            initialX = 0,
            initialY = 0;

        dragHandle.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = popup.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            // Lock position using absolute coordinates so it moves freely
            popup.style.left = `${initialX}px`;
            popup.style.top = `${initialY}px`;
            popup.style.right = "auto";
            popup.style.bottom = "auto";

            dragHandle.classList.add("cursor-grabbing");
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            popup.style.left = `${initialX + dx}px`;
            popup.style.top = `${initialY + dy}px`;
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                dragHandle.classList.remove("cursor-grabbing");
            }
        });
    }

    // Initialize Lucide icons for the injected markup
    createIcons({ icons });
}
