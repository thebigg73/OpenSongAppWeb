import { createIcons, icons } from "lucide";

// 1. Export the HTML template function
export function getStickyNoteHTML() {
    return `
        <div
            id="sticky-note-popup"
            class="hidden draggable-popup absolute z-40 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/40 backdrop-blur-md rounded-xl p-4 shadow-2xl max-w-xs text-xs text-[var(--text-color)]">
            <div
                class="flex justify-between items-center font-bold mb-1 border-b border-[var(--color-secondary)]/30 pb-1 cursor-grab active:cursor-grabbing select-none"
                id="sticky-drag-handle">
                <span>
                    <i data-lucide="sticky-note" class="w-3.5 h-3.5 inline mr-1 text-[var(--text-color)]"></i>
                    Sticky Note
                </span>
                <button
                    id="close-sticky-note-btn"
                    class="text-[var(--text-hint)] hover:text-[var(--text-color)] transition p-1">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            </div>
            <p id="sticky-note-text" class="whitespace-pre-wrap mt-2"></p>
        </div>
    `;
}

// 2. Export the initialization function to wire up events and drag mechanics
export function initStickyNote() {
    const popup = document.getElementById("sticky-note-popup");
    const dragHandle = document.getElementById("sticky-drag-handle");
    const closeBtn = document.getElementById("close-sticky-note-btn");

    // Close button handler
    if (closeBtn && popup) {
        closeBtn.addEventListener("click", () => {
            popup.classList.add("hidden");
        });
    }

    // Drag-and-drop popup functionality
    if (popup && dragHandle) {
        let isDragging = false;
        let startX = 0, startY = 0, initialX = 0, initialY = 0;

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
