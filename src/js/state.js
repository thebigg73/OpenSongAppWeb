// Global variables the multiple functions need access to

// src/js/state.js
export const state = {
    loadedSongs: [],
    loadedSets: [],
    activeSong: null,
    activeSetSongIndex: -1,
    shareTarget: null,
    activeTab: "songs",
    selectedFolderFilter: localStorage.getItem("selectedFolderFilter") || "ALL",
    currentSet: {
        category: "MAIN",
        title: "New Set",
        filename: "New Set",
        songTitles: []
    }
};
