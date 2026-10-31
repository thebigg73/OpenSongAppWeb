import { createIcons, icons } from "lucide";
import { openTransposeModal } from "./chords.js";
import { showToast } from "./toast.js";

// Fixed quick actions list
const ACTIVE_ACTIONS = [
    { id: "metronome", label: "Metronome", icon: "play" },
    { id: "autoscroll", label: "Auto-Scroll", icon: "arrow-down-circle" },
    { id: "pad", label: "Pad Player", icon: "waves" },
    { id: "transpose", label: "Transpose", icon: "sliders-horizontal" }
];

let isOpen = false;

export function getPageButtonHTML() {
    return `
        <!-- Floating Stage Controller Toolbar Widget -->
        <div id="floating-toolbar" class="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2.5">

            <!-- Vertical Quick Actions Menu Stack -->
            <div
                id="quick-actions-menu"
                class="flex flex-col items-end gap-2 opacity-0 translate-y-3 pointer-events-none transition-all duration-300">
                <!-- Quick action buttons will be injected here -->
            </div>

            <!-- Main Interactive FAB -->
            <button
                id="floating-main-btn"
                class="w-14 h-14 bg-[var(--color-secondary)] text-[var(--text-color)] border border-[var(--border-color)] font-bold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center">
                <i data-lucide="plus" id="floating-main-icon" class="w-6 h-6 transition-transform duration-300"></i>
            </button>
        </div>
    `;
}

export function initPageButton() {
    const mainBtn = document.getElementById("floating-main-btn");
    const mainIcon = document.getElementById("floating-main-icon");
    const menuStack = document.getElementById("quick-actions-menu");

    renderQuickActionButtons();

    // Toggle FAB menu open/close with smooth rotation
    if (mainBtn && menuStack && mainIcon) {
        mainBtn.addEventListener("click", () => {
            isOpen = !isOpen;
            if (isOpen) {
                menuStack.classList.remove("opacity-0", "translate-y-3", "pointer-events-none");
                menuStack.classList.add("opacity-100", "translate-y-0");
                mainBtn.style.backgroundColor = "var(--color-error)";
                mainIcon.classList.add("rotate-45"); // Rotates '+' into '×' smoothly
            } else {
                menuStack.classList.add("opacity-0", "translate-y-3", "pointer-events-none");
                menuStack.classList.remove("opacity-100", "translate-y-0");
                mainBtn.style.backgroundColor = "var(--color-secondary)";
                mainIcon.classList.remove("rotate-45");
            }
        });
    }

    createIcons({ icons });
}

function renderQuickActionButtons() {
    const menuStack = document.getElementById("quick-actions-menu");
    if (!menuStack) return;

    menuStack.innerHTML = "";

    ACTIVE_ACTIONS.forEach((action) => {
        const btn = document.createElement("button");
        btn.className =
            "flex items-center gap-2 px-3.5 py-2 bg-[var(--bg-primary-variant)]/95 backdrop-blur-md hover:bg-[var(--color-secondary)]/30 text-[var(--text-color)] border border-[var(--border-color)] rounded-xl shadow-lg text-xs font-bold transition transform hover:scale-105 active:scale-95";
        btn.innerHTML = `<i data-lucide="${action.icon}" class="w-4 h-4 text-[var(--color-secondary)]"></i> <span>${action.label}</span>`;

        btn.addEventListener("click", () => {
            handleQuickAction(action.id);
            document.getElementById("floating-main-btn")?.click();
        });

        menuStack.appendChild(btn);
    });

    createIcons({ icons });
}

function handleQuickAction(actionId) {
    switch (actionId) {
        case "metronome":
            document.getElementById("metronome-toggle-btn")?.click();
            break;
        case "autoscroll":
            document.getElementById("autoscroll-toggle-btn")?.click();
            break;
        case "pad":
            document.getElementById("pad-toggle-btn")?.click();
            break;
        case "transpose":
            openTransposeModal();
            break;
        default:
            showToast(`Triggered ${actionId}`);
    }
}
