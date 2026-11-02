// Local module-scoped state for storage
export let rootDirectoryHandle = null;
let sqliteDb = null;

// Map to hold local blob URLs for PDFs and images
const pdfBlobsMap = {};

// Base function & state imports
import { state } from "./state.js";
import { showToast } from "./toast.js";
import { generateUUID } from "./utils.js";
import { parseOpenSongXML, addOrUpdateSong, writeSongToDisk, restoreLastLoadedSong } from "./song.js";
import { parseOpenSongSetXML, loadActiveSetFromStorage } from "./set.js";
import { switchSidebarTab, updateTabCounts, updateFolderFilterDropdown, renderSidebarList } from "./sidebar.js";

// Helper to ensure root/empty/songs folder references always normalize cleanly to "MAIN"
function normalizeFolder(f) {
    if (!f || f.trim() === "" || f.toLowerCase() === "songs" || f.toLowerCase() === "root") {
        return "MAIN";
    }
    return f.replace(/^songs\/?/i, "").trim() || "MAIN";
}

// The database of the songs directory for quick access
const DB_NAME = "OpenSongAppWebDB";
const STORE_NAME = "handles";
function openIdb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 2);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

// Your storage initialization function called from main.js
export async function initStorage() {
    try {
        const savedHandle = await getStoredDirectoryHandle();
        if (savedHandle) {
            const banner = document.getElementById("reconnect-banner");
            if (banner) {
                banner.classList.remove("hidden");
                const reconnectBtn = document.getElementById("reconnect-btn");
                if (reconnectBtn) {
                    reconnectBtn.onclick = () => handleReconnectClick(savedHandle);
                }
            }
        }

        const setupModal = document.getElementById("setup-modal");
        if ("showDirectoryPicker" in window) {
            const hasStoredFolder = await checkStoredDirectoryHandle();
            if (hasStoredFolder) {
                const reconnectContainer = document.getElementById("reconnect-folder-container");
                if (reconnectContainer) reconnectContainer.classList.remove("hidden");
            } else {
                if (setupModal) setupModal.classList.remove("hidden");
            }
        } else {
            if (setupModal) setupModal.classList.add("hidden");
        }
    } catch (err) {
        console.error("Error initializing storage:", err);
    }

    if (document.getElementById("modal-reconnect-folder-btn")) {
        document.getElementById("modal-reconnect-folder-btn").addEventListener("click", async () => {
            if (!rootDirectoryHandle) return;
            document.getElementById("modal-progress-container").classList.remove("hidden");
            document.getElementById("modal-actions-container").classList.add("hidden");
            try {
                const opts = { mode: "readwrite" };
                if ((await rootDirectoryHandle.queryPermission(opts)) !== "granted") {
                    if ((await rootDirectoryHandle.requestPermission(opts)) !== "granted") {
                        throw new Error("Permission denied");
                    }
                }
                await processRootDirectory(rootDirectoryHandle, false);
            } catch (err) {
                console.error(err);
                document.getElementById("modal-progress-container").classList.add("hidden");
                document.getElementById("modal-actions-container").classList.remove("hidden");
                document.getElementById("reconnect-folder-container").classList.add("hidden");
            }
        });
    }

    if (document.getElementById("rescan-btn")) {
        document.getElementById("rescan-btn").addEventListener("click", async () => {
            if (!rootDirectoryHandle) {
                showToast("No root folder connected.");
                return;
            }
            showToast("Re-indexing songs and rebuilding database...");
            await processRootDirectory(rootDirectoryHandle, true);
        });
    }

    if (document.getElementById("change-folder-btn")) {
        document.getElementById("change-folder-btn").addEventListener("click", async () => {
            document.getElementById("reconnect-folder-container").classList.add("hidden");
            await triggerFolderSelection();
        });
    }

    if (document.getElementById("close-folder-modal")) {
        document
            .getElementById("close-folder-modal")
            .addEventListener("click", () => document.getElementById("folder-modal").classList.add("hidden"));
    }
}

async function saveDirectoryHandle(handle) {
    try {
        const db = await openIdb();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(handle, "rootFolder");
        return tx.complete;
    } catch (err) {
        console.error("Failed to save handle:", err);
    }
}

async function getStoredDirectoryHandle() {
    try {
        const db = await openIdb();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const req = tx.objectStore(STORE_NAME).get("rootFolder");
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

async function checkStoredDirectoryHandle() {
    const handle = await getStoredDirectoryHandle();
    if (!handle) return false;
    rootDirectoryHandle = handle;
    return true;
}

async function saveSqlDbBuffer() {
    if (!sqliteDb) return;
    try {
        const binaryArray = sqliteDb.export();
        const db = await openIdb();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(binaryArray, "sqliteCache");
        return tx.complete;
    } catch (err) {
        console.error("Failed to save sqlite cache:", err);
    }
}

async function getStoredSqlDbBuffer() {
    try {
        const db = await openIdb();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const req = tx.objectStore(STORE_NAME).get("sqliteCache");
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

async function initSqlDatabase() {
    if (sqliteDb) return sqliteDb;
    try {
        const SQL = await initSqlJs({
            locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        if (cachedBuf) {
            sqliteDb = new SQL.Database(cachedBuf);
        } else {
            sqliteDb = new SQL.Database();
            sqliteDb.run(`CREATE TABLE IF NOT EXISTS songs (
                        filename TEXT,
                        folderPath TEXT,
                        title TEXT,
                        author TEXT,
                        copyright TEXT,
                        presentation TEXT,
                        hymn_number TEXT,
                        capo TEXT,
                        tempo INTEGER,
                        time_sig TEXT,
                        duration TEXT,
                        predelay TEXT,
                        ccli TEXT,
                        theme TEXT,
                        altheme TEXT,
                        user1 TEXT,
                        user2 TEXT,
                        user3 TEXT,
                        beatbuddysong TEXT,
                        beatbuddykit TEXT,
                        drummer TEXT,
                        drummerkit TEXT,
                        key TEXT,
                        keyoriginal TEXT,
                        preferedinstrument TEXT,
                        previewoverride TEXT,
                        aka TEXT,
                        midi TEXT,
                        midi_index TEXT,
                        notes TEXT,
                        lyrics TEXT,
                        pad TEXT,
                        custom_chords TEXT,
                        link_web TEXT,
                        link_audio TEXT,
                        loop_audio INTEGER,
                        abc_notation TEXT,
                        abc_transpose TEXT,
                        uuid TEXT,
                        modified TEXT,
                        PRIMARY KEY (filename, folderPath)
                    );`);
        }
        return sqliteDb;
    } catch (e) {
        console.error("Failed to init sql.js:", e);
        return null;
    }
}

async function handleReconnectClick(savedHandle) {
    try {
        const opts = { mode: "readwrite" };
        if ((await savedHandle.queryPermission(opts)) !== "granted") {
            if ((await savedHandle.requestPermission(opts)) !== "granted") {
                showToast("Permission denied.");
                return;
            }
        }
        rootDirectoryHandle = savedHandle;

        const banner = document.getElementById("reconnect-banner");
        if (banner) {
            banner.classList.add("hidden");
            banner.style.display = "none";
        }

        await processRootDirectory(savedHandle, false);
        showToast("Folder reconnected successfully!");
    } catch (err) {
        console.error("Reconnect failed:", err);
        showToast("Could not reconnect folder. Please reselect.");
    }
}

// Helper to handle NonOpenSongSongs.db creation, update, and integration
// Helper to handle NonOpenSongSongs.db creation, update, and integration
async function processNonOpenSongDatabase(rootHandle, mediaFileHandles) {
    try {
        const SQL = await initSqlJs({
            locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // Ensure Settings directory exists
        let settingsDir = await rootHandle.getDirectoryHandle("Settings", { create: true });

        let dbFileHandle;
        let dbExists = false;
        try {
            dbFileHandle = await settingsDir.getFileHandle("NonOpenSongSongs.db", { create: false });
            dbExists = true;
        } catch (e) {
            dbFileHandle = await settingsDir.getFileHandle("NonOpenSongSongs.db", { create: true });
        }

        let nonOpenSongDb;
        if (dbExists) {
            try {
                const file = await dbFileHandle.getFile();
                const buffer = await file.arrayBuffer();
                nonOpenSongDb = new SQL.Database(new Uint8Array(buffer));
            } catch (err) {
                console.warn("Failed to read NonOpenSongSongs.db, recreating:", err);
                nonOpenSongDb = new SQL.Database();
            }
        } else {
            nonOpenSongDb = new SQL.Database();
        }

        // Initialize table schema matching the NonOpenSongSongs.db structure
        nonOpenSongDb.run(`CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            songid TEXT UNIQUE,
            filename TEXT,
            folder TEXT,
            title TEXT,
            author TEXT,
            copyright TEXT,
            lyrics TEXT,
            hymn_num TEXT,
            ccli TEXT,
            theme TEXT,
            alttheme TEXT,
            user1 TEXT,
            user2 TEXT,
            user3 TEXT,
            key TEXT,
            timesig TEXT,
            aka TEXT,
            autoscrolldelay TEXT,
            autoscrolllength TEXT,
            tempo TEXT,
            padfile TEXT,
            padloop TEXT,
            midi TEXT,
            midiindex TEXT,
            capo TEXT,
            capoprint TEXT,
            customchords TEXT,
            notes TEXT,
            abc TEXT,
            linkyoutube TEXT,
            linkweb TEXT,
            linkaudio TEXT,
            linkother TEXT,
            presentationorder TEXT,
            filetype TEXT,
            abctranspose TEXT
        );`);

        // Check existing records in NonOpenSongSongs.db
        const existingRecords = new Set();
        try {
            const res = nonOpenSongDb.exec("SELECT filename, folder FROM songs");
            if (res && res.length > 0) {
                res[0].values.forEach((row) => existingRecords.add(`${normalizeFolder(row[1])}___${row[0]}`));
            }
        } catch (e) {}

        let dbUpdated = false;
        for (const item of mediaFileHandles) {
            const folderName = normalizeFolder(item.folder);
            const key = `${folderName}___${item.handle.name}`;
            if (!existingRecords.has(key)) {
                const title = item.handle.name.replace(/\.[^/.]+$/, "");
                const songid = generateUUID();
                const filetype = item.type.toUpperCase() === "PDF" ? "PDF" : "IMG";

                try {
                    const stmt = nonOpenSongDb.prepare(`
                        INSERT INTO songs (songid, filename, folder, title, author, filetype) VALUES (?, ?, ?, ?, ?, ?)
                    `);
                    stmt.run([songid, item.handle.name, folderName, title, "", filetype]); // Explicitly set author to blank ("")
                    stmt.free();
                    dbUpdated = true;
                } catch (err) {
                    console.warn("Failed to insert media into NonOpenSongSongs.db:", err);
                }
            }
        }

        if (dbUpdated || !dbExists) {
            try {
                const data = nonOpenSongDb.export();
                const writable = await dbFileHandle.createWritable();
                await writable.write(data);
                await writable.close();
            } catch (err) {
                console.warn("Failed to write NonOpenSongSongs.db to disk:", err);
            }
        }

        // Load all columns from NonOpenSongSongs.db into state and main sqliteDb
        const res = nonOpenSongDb.exec("SELECT * FROM songs");
        if (res && res.length > 0) {
            const cols = res[0].columns;
            for (const row of res[0].values) {
                const rowObj = {};
                cols.forEach((c, idx) => (rowObj[c] = row[idx]));

                const filename = rowObj.filename;
                const folder = normalizeFolder(rowObj.folder);

                const mediaItem = mediaFileHandles.find(
                    (m) =>
                        m.handle.name.toLowerCase() === filename.toLowerCase() && normalizeFolder(m.folder) === folder
                );
                let blobUrl = "";
                let fileHandle = mediaItem ? mediaItem.handle : null;

                if (mediaItem) {
                    try {
                        const f = await mediaItem.handle.getFile();
                        blobUrl = URL.createObjectURL(f);
                        pdfBlobsMap[filename] = blobUrl;
                    } catch (e) {}
                }

                const title = rowObj.title || filename.replace(/\.[^/.]+$/, "");
                const filetype = (rowObj.filetype || "").toUpperCase();
                const isPdf = filetype === "PDF" || filename.toLowerCase().endsWith(".pdf");
                const isImage = filetype === "IMG" || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

                // Sanitize author: default null, undefined, or "Loading..." to blank ("")
                const rawAuthor = rowObj.author;
                const author = !rawAuthor || rawAuthor === "Loading..." || rawAuthor === "null" ? "" : rawAuthor;

                const songObj = {
                    id: "song_media_" + Math.random().toString(36).substring(2, 8),
                    filename: filename,
                    folderPath: folder,
                    title: title,
                    author: author,
                    key: rowObj.key || "",
                    capo: rowObj.capo || "",
                    tempo: rowObj.tempo || "",
                    time_sig: rowObj.timesig || "",
                    notes: rowObj.notes || "",
                    copyright: rowObj.copyright || "",
                    theme: rowObj.theme || "",
                    presentation: rowObj.presentationorder || "",
                    isPdf: isPdf,
                    isImage: isImage,
                    pdfUrl: blobUrl,
                    imageUrl: blobUrl,
                    fileHandle: fileHandle,
                    isLoaded: true,
                    uuid: rowObj.songid || generateUUID(),
                    modified: new Date().toISOString()
                };

                const existingIdx = state.loadedSongs.findIndex(
                    (s) =>
                        s.filename.toLowerCase() === filename.toLowerCase() && normalizeFolder(s.folderPath) === folder
                );
                if (existingIdx !== -1) {
                    state.loadedSongs[existingIdx] = { ...state.loadedSongs[existingIdx], ...songObj };
                } else {
                    state.loadedSongs.push(songObj);
                }

                if (sqliteDb) {
                    try {
                        const stmt = sqliteDb.prepare(
                            "INSERT OR REPLACE INTO songs (filename, folderPath, title, author, key, capo, tempo, lyrics, modified, uuid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                        );
                        stmt.run([
                            filename,
                            folder,
                            title,
                            author,
                            rowObj.key || "",
                            rowObj.capo || "",
                            parseInt(rowObj.tempo) || 0,
                            "",
                            new Date().toISOString(),
                            rowObj.songid || generateUUID()
                        ]);
                        stmt.free();
                    } catch (e) {}
                }
            }
        }
    } catch (e) {
        console.error("Error processing NonOpenSongSongs database:", e);
    }
}

async function processRootDirectory(handle, forceRebuild = false) {
    document.getElementById("modal-progress-container").classList.remove("hidden");
    document.getElementById("modal-actions-container").classList.add("hidden");
    document.getElementById("folder-status-text").textContent = handle.name;

    state.loadedSongs = [];
    state.loadedSets = [];
    await initSqlDatabase();

    // Check if we can load instantly from SQLite cache without rescanning files
    if (!forceRebuild && sqliteDb) {
        try {
            const res = sqliteDb.exec("SELECT * FROM songs");
            if (res && res.length > 0 && res[0].values.length > 0) {
                const cols = res[0].columns;
                res[0].values.forEach((row) => {
                    const song = {};
                    cols.forEach((c, idx) => (song[c] = row[idx]));
                    song.id = "song_" + Math.random().toString(36).substring(2, 8);
                    song.folderPath = normalizeFolder(song.folderPath);
                    song.isLoaded = true;

                    // 💡 Auto-detect PDF and image files from cache based on extension
                    const lowerFn = (song.filename || "").toLowerCase();
                    song.isPdf = lowerFn.endsWith(".pdf");
                    song.isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(lowerFn);

                    state.loadedSongs.push(song);
                });

                // 💡 Re-bind live file handles so PDFs and file reads work immediately from cache!
                await rebindFileHandles(handle);

                // 💡 Ensure any media items re-bound from cache generate their object URLs immediately
                for (const song of state.loadedSongs) {
                    if ((song.isPdf || song.isImage) && song.fileHandle && !song.pdfUrl) {
                        try {
                            const f = await song.fileHandle.getFile();
                            const blobUrl = URL.createObjectURL(f);
                            song.pdfUrl = blobUrl;
                            song.imageUrl = blobUrl;
                        } catch (e) {}
                    }
                }

                await loadSetsOnly(handle);

                document.getElementById("modal-progress-container").classList.add("hidden");
                document.getElementById("modal-actions-container").classList.remove("hidden");
                document.getElementById("folder-modal").classList.add("hidden");
                const banner = document.getElementById("reconnect-banner");
                if (banner) {
                    banner.classList.add("hidden");
                    banner.style.display = "none";
                }

                loadActiveSetFromStorage();

                switchSidebarTab("songs");
                updateTabCounts();
                updateFolderFilterDropdown();
                renderSidebarList();
                await restoreLastLoadedSong();
                showToast(`Loaded ${state.loadedSongs.length} songs from cache!`);
                return;
            }
        } catch (e) {
            console.warn("Cache load fallback to full scan:", e);
        }
    }

    try {
        let songFileHandles = [];
        let setFileHandles = [];
        let mediaFileHandles = [];

        async function collectHandles(dirHandle, prefix) {
            for await (const entry of dirHandle.values()) {
                try {
                    if (entry.kind === "file") {
                        const lowerName = entry.name.toLowerCase();
                        if (
                            lowerName.startsWith(".") ||
                            lowerName === "thumbs.db" ||
                            lowerName === "desktop.ini" ||
                            lowerName.endsWith(".db")
                        ) {
                            continue;
                        }

                        if (
                            lowerName.endsWith(".pdf") ||
                            lowerName.endsWith(".jpg") ||
                            lowerName.endsWith(".jpeg") ||
                            lowerName.endsWith(".png") ||
                            lowerName.endsWith(".gif") ||
                            lowerName.endsWith(".webp")
                        ) {
                            mediaFileHandles.push({
                                handle: entry,
                                type: lowerName.endsWith(".pdf") ? "pdf" : "image",
                                folder: normalizeFolder(prefix)
                            });
                        } else if (
                            lowerName.endsWith(".osts") ||
                            lowerName.endsWith(".ost") ||
                            prefix.toLowerCase().includes("sets")
                        ) {
                            setFileHandles.push({ handle: entry, type: "set" });
                        } else {
                            songFileHandles.push({ handle: entry, type: "song", folder: normalizeFolder(prefix) });
                        }
                    } else if (entry.kind === "directory") {
                        const subName = entry.name.toLowerCase();
                        if (subName === "sets") {
                            await collectHandles(entry, "Sets");
                        } else if (subName === "settings") {
                            continue;
                        } else {
                            const subFolderName = prefix ? `${prefix}/${entry.name}` : entry.name;
                            await collectHandles(entry, subFolderName);
                        }
                    }
                } catch (e) {
                    console.warn("Handle error:", e);
                }
            }
        }

        let foundSongsDir = false;
        for await (const entry of handle.values()) {
            if (entry.kind === "directory" && entry.name.toLowerCase() === "songs") {
                foundSongsDir = true;
                await collectHandles(entry, "");
            } else if (entry.kind === "directory" && entry.name.toLowerCase() === "sets") {
                await collectHandles(entry, "Sets");
            }
        }

        if (!foundSongsDir && songFileHandles.length === 0 && mediaFileHandles.length === 0) {
            await collectHandles(handle, "");
        }

        // Reset SQLite table on full rebuild
        if (sqliteDb) {
            sqliteDb.run("DELETE FROM songs;");
        }

        // Phase 2: Instant skeleton population for OpenSong files
        songFileHandles.forEach((item, index) => {
            const cleanTitle = item.handle.name.replace(/\.[^/.]+$/, "");
            state.loadedSongs.push({
                id: "song_placeholder_" + index,
                filename: item.handle.name,
                folderPath: normalizeFolder(item.folder),
                title: cleanTitle,
                author: "",
                key: "",
                fileHandle: item.handle,
                isLoaded: false,
                uuid: generateUUID(),
                modified: new Date().toISOString()
            });
        });

        // Parse sets
        for (const item of setFileHandles) {
            try {
                const f = await item.handle.getFile();
                const text = await f.text();
                const setObj = parseOpenSongSetXML(text, item.handle.name);
                if (setObj) state.loadedSets.push(setObj);
            } catch (e) {
                console.warn("Set parse error:", e);
            }
        }

        // Process PDF and Image files via NonOpenSongSongs.db
        await processNonOpenSongDatabase(handle, mediaFileHandles);

        loadActiveSetFromStorage();

        updateTabCounts();
        updateFolderFilterDropdown();
        renderSidebarList();

        await restoreLastLoadedSong();

        document.getElementById("modal-progress-container").classList.add("hidden");
        document.getElementById("modal-actions-container").classList.remove("hidden");
        document.getElementById("folder-modal").classList.add("hidden");
        const banner = document.getElementById("reconnect-banner");
        if (banner) {
            banner.classList.add("hidden");
            banner.style.display = "none";
        }

        showToast(`Index skeleton ready: ${state.loadedSongs.length} songs/media indexed!`);

        // Phase 3: Background lazy-load parsing with percentage progress and SQLite caching
        backgroundLazyLoadAndCacheSongs(songFileHandles);
    } catch (e) {
        console.error("Directory scan error:", e);
        document.getElementById("modal-progress-container").classList.add("hidden");
        document.getElementById("modal-actions-container").classList.remove("hidden");
        showToast("Directory scan error.");
    } finally {
        showToast("Folder reconnected! Indexing songs in background...");
        const sidebar = document.getElementById("sidebar");
        const backdrop = document.getElementById("sidebar-backdrop");
        if (sidebar && backdrop && window.innerWidth < 1024) {
            sidebar.classList.remove("-translate-x-full");
            backdrop.classList.remove("hidden");
        }
    }
}

async function backgroundLazyLoadAndCacheSongs(songFileHandles) {
    let processed = 0;
    const total = songFileHandles.length;
    const statusEl = document.getElementById("folder-status-text");

    const cachedPaths = new Set();
    if (sqliteDb) {
        try {
            const res = sqliteDb.exec("SELECT filename, folderPath FROM songs");
            if (res && res.length > 0) {
                res[0].values.forEach((row) => cachedPaths.add(`${normalizeFolder(row[1])}___${row[0]}`));
            }
        } catch (e) {
            console.warn("Error reading cached paths:", e);
        }
        sqliteDb.run("BEGIN TRANSACTION;");
    }

    for (let i = 0; i < songFileHandles.length; i++) {
        const item = songFileHandles[i];
        const folderName = normalizeFolder(item.folder);
        const cacheKey = `${folderName}___${item.handle.name}`;

        if (cachedPaths.has(cacheKey)) {
            const song = state.loadedSongs.find(
                (s) =>
                    s.filename.toLowerCase() === item.handle.name.toLowerCase() &&
                    normalizeFolder(s.folderPath) === folderName
            );
            if (song) {
                song.isLoaded = true;
                try {
                    const stmt = sqliteDb.prepare(
                        "SELECT title, author, key, capo, tempo, lyrics, modified, uuid FROM songs WHERE filename=? AND folderPath=?"
                    );
                    stmt.bind([item.handle.name, folderName]);
                    if (stmt.step()) {
                        const row = stmt.get();
                        Object.assign(song, {
                            title: row[0],
                            author: row[1],
                            key: row[2],
                            capo: row[3],
                            tempo: row[4],
                            lyrics: row[5],
                            modified: row[6],
                            uuid: row[7],
                            folderPath: folderName,
                            isLoaded: true
                        });
                    }
                    stmt.free();
                } catch (e) {}
            }
            processed++;
            continue;
        }

        try {
            const f = await item.handle.getFile();
            const text = await f.text();
            const parsedSong = parseOpenSongXML(text, item.handle.name, folderName);

            // Graceful fallback: never delete songs if XML parsing is partial or returns null
            const songData = parsedSong
                ? {
                      ...parsedSong,
                      folderPath: folderName,
                      filename: item.handle.name,
                      fileHandle: item.handle,
                      isLoaded: true
                  }
                : {
                      filename: item.handle.name,
                      folderPath: folderName,
                      title: item.handle.name.replace(/\.[^/.]+$/, ""),
                      author: "",
                      key: "",
                      capo: "",
                      lyrics: text || "",
                      fileHandle: item.handle,
                      isLoaded: true,
                      uuid: generateUUID(),
                      modified: new Date().toISOString()
                  };

            const idx = state.loadedSongs.findIndex(
                (s) =>
                    s.filename.toLowerCase() === item.handle.name.toLowerCase() &&
                    normalizeFolder(s.folderPath) === folderName
            );
            if (idx !== -1) {
                state.loadedSongs[idx] = {
                    ...state.loadedSongs[idx],
                    ...songData
                };
            } else {
                state.loadedSongs.push(songData);
            }

            if (sqliteDb) {
                const stmt = sqliteDb.prepare(
                    "INSERT OR REPLACE INTO songs (filename, folderPath, title, author, key, capo, tempo, lyrics, modified, uuid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                );
                stmt.run([
                    songData.filename,
                    songData.folderPath,
                    songData.title,
                    songData.author || "",
                    songData.key || "",
                    songData.capo || "",
                    parseInt(songData.tempo) || 120,
                    songData.lyrics || "",
                    songData.modified || "",
                    songData.uuid || generateUUID()
                ]);
                stmt.free();
            }
        } catch (err) {
            console.warn(`Failed lazy loading file ${item.handle.name}:`, err);
            // Ensure song remains in list even if file read fails
            const idx = state.loadedSongs.findIndex(
                (s) =>
                    s.filename.toLowerCase() === item.handle.name.toLowerCase() &&
                    normalizeFolder(s.folderPath) === folderName
            );
            if (idx !== -1) {
                state.loadedSongs[idx].isLoaded = true;
            }
        }

        processed++;
        const percent = Math.round((processed / total) * 100);

        if (processed % 15 === 0 || processed === total) {
            if (statusEl) statusEl.textContent = `Indexing... ${percent}%`;
            updateTabCounts();
            renderSidebarList(document.getElementById("song-search-input").value.toLowerCase());
        }
    }

    if (sqliteDb) {
        sqliteDb.run("COMMIT;");
        await saveSqlDbBuffer();
    }

    if (statusEl) statusEl.textContent = rootDirectoryHandle ? rootDirectoryHandle.name : "Root Directory Loaded";
    showToast(`Indexing & resume complete: ${total} songs verified!`);
}

// Add this helper function in storage.js
async function rebindFileHandles(rootHandle) {
    let matchedCount = 0;
    let totalScanned = 0;

    try {
        // Match processRootDirectory behavior: check if a "Songs" directory exists at the root and start inside it
        let startDirHandle = rootHandle;
        for await (const entry of rootHandle.values()) {
            if (entry.kind === "directory" && entry.name.toLowerCase() === "songs") {
                startDirHandle = entry;
                break;
            }
        }

        async function scanDir(dirHandle, currentPath = "") {
            for await (const entry of dirHandle.values()) {
                if (entry.kind === "file") {
                    totalScanned++;
                    const normalizedFolder = normalizeFolder(currentPath);

                    const found = state.loadedSongs.find(
                        (s) =>
                            s.filename.toLowerCase() === entry.name.toLowerCase() &&
                            normalizeFolder(s.folderPath || s.folder) === normalizedFolder
                    );

                    if (found) {
                        matchedCount++;
                        found.fileHandle = entry;
                        const lowerFn = entry.name.toLowerCase();
                        found.isPdf = lowerFn.endsWith(".pdf");
                        found.isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(lowerFn);

                        if (found.isPdf || found.isImage) {
                            try {
                                const f = await entry.getFile();
                                const blobUrl = URL.createObjectURL(f);
                                found.pdfUrl = blobUrl;
                                found.imageUrl = blobUrl;
                            } catch (err) {
                                console.error(`[Rebind] Failed to create blob URL for ${entry.name}:`, err);
                            }
                        }
                    }
                } else if (entry.kind === "directory") {
                    const subName = entry.name.toLowerCase();
                    if (subName !== "sets" && subName !== "settings") {
                        try {
                            const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
                            const subPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
                            await scanDir(subDirHandle, subPath);
                        } catch (e) {
                            console.warn(`[Rebind] Could not access subdirectory ${entry.name}:`, e);
                        }
                    }
                }
            }
        }

        await scanDir(startDirHandle, "");
    } catch (e) {
        console.error("[Rebind] Critical error during file handle re-binding:", e);
    }
}

export function getRootDirectoryHandle() {
    return rootDirectoryHandle;
}

async function loadSetsOnly(rootHandle) {
    state.loadedSets = [];
    try {
        const setsDirHandle = await rootHandle.getDirectoryHandle("Sets", { create: false });
        for await (const entry of setsDirHandle.values()) {
            if (entry.kind === "file") {
                const lowerName = entry.name.toLowerCase();
                if (lowerName.startsWith(".") || lowerName === "thumbs.db" || lowerName === "desktop.ini") continue;
                try {
                    const f = await entry.getFile();
                    const text = await f.text();
                    const setObj = parseOpenSongSetXML(text, entry.name);
                    if (setObj) {
                        setObj.lastModified = f.lastModified || Date.now();
                        state.loadedSets.push(setObj);
                    }
                } catch (err) {
                    console.warn("Failed to parse set file:", err);
                }
            }
        }
    } catch (e) {
        // Sets folder may not exist yet
    }
}

export async function triggerFolderSelection() {
    if ("showDirectoryPicker" in window) {
        try {
            const handle = await window.showDirectoryPicker({ mode: "readwrite" });
            rootDirectoryHandle = handle;
            await saveDirectoryHandle(handle);
            await processRootDirectory(handle, true);
            return;
        } catch (err) {
            if (err.name === "AbortError") return;
        }
    }
}

export function getReconnectBannerHTML() {
    return `
        <div
            id="reconnect-banner"
            class="hidden bg-[var(--bg-surface-variant)] border-b border-[var(--border-color)] px-4 py-2 flex items-center justify-between text-sm text-[var(--text-color)] z-30 shrink-0">
            <div class="flex items-center gap-2">
                <svg
                    class="w-4 h-4 shrink-0 text-[var(--text-hint)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                </svg>
                <span>Previously connected folder found. Click to restore access:</span>
            </div>
            <button
                id="reconnect-btn"
                class="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-variant)] text-[var(--text-color)] font-bold px-3 py-1 rounded-lg text-xs transition-colors border border-[var(--border-color)]">
                Reconnect Folder
            </button>
        </div>
    `;
}
