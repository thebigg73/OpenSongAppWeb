// Theme selection
const themeSelect = document.getElementById("theme-select");
if (themeSelect) {
    themeSelect.value = localStorage.getItem("app-theme") || "system";

    themeSelect.addEventListener("change", (e) => {
        const selected = e.target.value;
        localStorage.setItem("app-theme", selected);
        applyTheme(selected);
        showToast(`Theme updated to ${selected}`);
    });
}
