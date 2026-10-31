// This file deals with cueing up all of the required scripts

import { createIcons, icons } from "lucide";

// Call this once on app startup (and anytime you dynamically inject new modals/components)
createIcons({ icons });

// Get the views needed
import "./css/styles.css";
import { getHeaderHTML, initHeader } from "./components/header.js";
import { getRootFolderModalHTML, initRootFolder } from "./components/rootFolderModal.js";
import { getSongSheetHTML, initSongSheet } from "./js/songSheet.js";
import { getSetViewHTML, initSetView } from "./js/setView.js";
import { getPageButtonHTML, initPageButton } from "./js/pageButton.js";
import { getSongEditorHTML, initSongEditor } from "./js/songEditor.js";
import { getAbcPopupHTML, initAbcPopup } from "./js/abcPopup.js";
import { getTransposeModalHTML, getCapoModalHTML, initChords } from "./js/chords.js";

// Storage imports
import { getReconnectBannerHTML, initStorage } from "./js/storage.js";

import { getSidebarHTML, getSidebarActionModalHTML, initSidebar } from "./js/sidebar.js";
import { initSet } from "./js/set.js";
import { initScaling } from "./js/scaling.js";
import { getToastHTML, showToast } from "./js/toast.js";
import { getStickyNoteHTML, initStickyNote } from "./js/stickyNote.js";

document.addEventListener("DOMContentLoaded", () => {
    // First up prepare the header
    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
        headerContainer.innerHTML = getHeaderHTML();
        initHeader();
    }

    const reconnectBannerContainer = document.getElementById("reconnect-banner-container");
    if (reconnectBannerContainer) {
        reconnectBannerContainer.innerHTML = getReconnectBannerHTML();
    }

    // Now the sidebar
    const sidebarActionContainer = document.getElementById("sidebar-action-container");
    if (sidebarActionContainer) {
        sidebarActionContainer.innerHTML = getSidebarActionModalHTML();
    }

    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
        sidebarContainer.innerHTML = getSidebarHTML() + getSidebarActionModalHTML();
        initSidebar();
    }

    const pageButtonContainer = document.getElementById("page-button-container");
    if (pageButtonContainer) {
        pageButtonContainer.innerHTML = getPageButtonHTML();
        initPageButton();
    }

    // The song view
    const songViewContainer = document.getElementById("song-sheet-container");
    if (songViewContainer) {
        songViewContainer.innerHTML = getSongSheetHTML();
        initSongSheet();
    }

    // Finally the other views
    const stickyNoteContainer = document.getElementById("sticky-note-container");
    if (stickyNoteContainer) {
        stickyNoteContainer.innerHTML = getStickyNoteHTML();
        initStickyNote();
    }

    const abcPopupContainer = document.getElementById("abc-popup-container");
    if (abcPopupContainer) {
        abcPopupContainer.innerHTML = getAbcPopupHTML();
        initAbcPopup();
    }

    const transposeContainer = document.getElementById("transpose-container");
    if (transposeContainer) {
        transposeContainer.innerHTML = getTransposeModalHTML() + getCapoModalHTML();
        initChords();
    }

    const setViewContainer = document.getElementById("set-view-container");
    if (setViewContainer) {
        setViewContainer.innerHTML = getSetViewHTML();
        initSetView();
    }

    const rootFolderContainer = document.getElementById("root-folder-container");
    if (rootFolderContainer) {
        rootFolderContainer.innerHTML = getRootFolderModalHTML();
        initRootFolder();
    }

    const songEditorContainer = document.getElementById("song-editor-container");
    if (songEditorContainer) {
        songEditorContainer.innerHTML = getSongEditorHTML();
        initSongEditor();
    }

    const toastNotificationContainer = document.getElementById("toast-notification-container");
    if (toastNotificationContainer) {
        toastNotificationContainer.innerHTML = getToastHTML();
    }

    initStorage();
    initSet();
    initScaling();
});
