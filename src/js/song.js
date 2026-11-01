// The Javascript that deals with song processing and display
import {
    getCapoDisplayMode,
    setCapoDisplayMode,
    updateCapoBadge,
    transposeChord,
    openTransposeModal,
    openCapoModal
} from "./chords.js";
import { applyTextScaling } from "./scaling.js";
import { updateCastWindow } from "./secondaryScreen.js";
import { loadSongFromActiveSet, updateSetSidebarHighlighting } from "./set.js";
import { renderSidebarList } from "./sidebar.js";
import { generateUUID } from "./utils.js";
import { showToast } from "./toast.js";
import { state } from "./state.js";

export function parseOpenSongXML(xmlString, filename, folderPath) {
    try {
        if (!xmlString) return null;

        const cleanFilename = filename.endsWith(".ost") ? filename.slice(0, -4) : filename;

        // Robust regex extractor for OpenSong XML tags
        const extractTag = (tagName) => {
            const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
            const match = xmlString.match(regex);
            if (match && match[1] !== undefined) {
                return match[1]
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&amp;/g, "&")
                    .replace(/&apos;/g, "'")
                    .replace(/&quot;/g, '"')
                    .trim();
            }
            return "";
        };

        const title = extractTag("title") || cleanFilename;
        const lyrics = extractTag("lyrics");

        // Ensure it's a valid OpenSong file
        if (!lyrics && !xmlString.includes("<song>")) {
            return null;
        }

        return {
            id: "song_" + Math.random().toString(36).substring(2, 8),
            filename: cleanFilename,
            folderPath: folderPath || "MAIN",
            title: title,
            author: extractTag("author"),
            copyright: extractTag("copyright"),
            presentation: extractTag("presentation"),
            key: extractTag("key") || "",
            keyoriginal: extractTag("keyoriginal"),
            capo: extractTag("capo"),
            tempo: parseInt(extractTag("tempo"), 10) || 120,
            time_sig: extractTag("time_sig") || "4/4",
            hymn_number: extractTag("hymn_number"),
            duration: extractTag("duration"),
            predelay: extractTag("predelay"),
            ccli: extractTag("ccli"),
            theme: extractTag("theme"),
            altheme: extractTag("altheme"),
            user1: extractTag("user1"),
            user2: extractTag("user2"),
            user3: extractTag("user3"),
            beatbuddysong: extractTag("beatbuddysong"),
            beatbuddykit: extractTag("beatbuddykit"),
            drummer: extractTag("drummer"),
            drummerkit: extractTag("drummerkit"),
            preferedinstrument: extractTag("preferedinstrument"),
            previewoverride: extractTag("previewoverride"),
            aka: extractTag("aka"),
            midi: extractTag("midi"),
            midi_index: extractTag("midi_index"),
            notes: extractTag("notes"),
            pad_file: extractTag("pad_file"),
            custom_chords: extractTag("custom_chords"),
            link_web: extractTag("link_web"),
            link_audio: extractTag("link_audio"),
            loop_audio: extractTag("loop_audio") === "true",
            abc_notation: extractTag("abc_notation"),
            abc_transpose: extractTag("abc_transpose"),
            uuid: extractTag("uuid") || generateUUID(),
            modified: extractTag("modified") || new Date().toISOString(),
            lyrics: lyrics
        };
    } catch (e) {
        console.warn("Failed to parse OpenSong XML for:", filename, e);
        return null;
    }
}

export function formatSectionHeading(tag) {
    if (!tag) return "";
    const clean = tag
        .replace(/[\[\]]/g, "")
        .trim()
        .toUpperCase();
    if (clean.startsWith("V")) return clean.slice(1) ? `Verse ${clean.slice(1)}` : "Verse";
    if (clean.startsWith("C")) return clean.slice(1) ? `Chorus ${clean.slice(1)}` : "Chorus";
    if (clean.startsWith("B")) return clean.slice(1) ? `Bridge ${clean.slice(1)}` : "Bridge";
    return tag.replace(/[\[\]]/g, "").trim();
}

export function renderSongLyrics(rawLyrics, capoFret, transposeOffset = 0, isNote = false) {
    const sheetContent = document.getElementById("sheet-content");
    sheetContent.innerHTML = "";
    if (!rawLyrics) return;

    // 💡 If it's a note, render it as a single clean card containing the plain text
    if (isNote) {
        const sectionContainer = document.createElement("div");
        sectionContainer.className =
            "w-full p-6 md:p-8 rounded-2xl bg-[var(--bg-primary-variant)]/60 border border-[var(--border-color)] space-y-4";

        sectionContainer.innerHTML = `
            <div class="font-sans text-xl whitespace-pre-wrap leading-relaxed text-[var(--text-color)]">
                ${rawLyrics}
            </div>
        `;
        sheetContent.appendChild(sectionContainer);
        applyTextScaling();
        return;
    }

    const lines = rawLyrics.split("\n");
    let sectionContainer = null;
    const capoSteps = capoFret ? -parseInt(capoFret, 10) : 0;
    let sectionCounter = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith("[")) {
            sectionCounter++;
            const thisSectionIdx = sectionCounter;

            sectionContainer = document.createElement("div");
            sectionContainer.className =
                "w-full p-4 md:p-6 rounded-2xl bg-[var(--bg-primary-variant)]/60 border border-[var(--border-color)] space-y-3 cursor-pointer hover:border-[var(--color-secondary)]/40 transition";
            const prettyName = formatSectionHeading(trimmed);
            sectionContainer.innerHTML = `<h4 class="section-heading text-[var(--hint-color)] font-extrabold text-sm tracking-wide mb-2">${prettyName}</h4>`;

            sectionContainer.addEventListener("click", () => {
                document
                    .querySelectorAll("#sheet-content > div")
                    .forEach((el) => el.classList.remove("ring-2", "ring-[var(--color-secondary)]"));
                sectionContainer.classList.add("ring-2", "ring-[var(--color-secondary)]");
                updateCastWindow(state.activeSong, thisSectionIdx, true);
            });

            document.getElementById("sheet-content").appendChild(sectionContainer);
            continue;
        }

        if (!sectionContainer) {
            sectionCounter++;
            const thisSectionIdx = sectionCounter;
            sectionContainer = document.createElement("div");
            sectionContainer.className =
                "w-full p-4 md:p-6 rounded-2xl bg-[var(--bg-primary-variant)]/40 border border-[var(--border-color)]bg-[var(--bg-primary-variant)] space-y-3";
            document.getElementById("sheet-content").appendChild(sectionContainer);
        }

        const div = document.createElement("div");

        if (line.startsWith(".")) {
            const chordLine = line.slice(1);
            const nextLine =
                i + 1 < lines.length && !lines[i + 1].startsWith(".") && !lines[i + 1].trim().startsWith("[")
                    ? lines[i + 1]
                    : "";
            if (nextLine) i++;

            div.className = "chord-lyric-pair-line my-1";
            div.innerHTML = buildChordLyricPairs(
                chordLine,
                nextLine,
                capoFret,
                capoSteps,
                getCapoDisplayMode(),
                transposeOffset
            );
        } else {
            // Pure lyric line without chords gets its own clean class
            div.className = "pure-lyric-line my-1";
            div.innerHTML = `<div class="lyric-below text-[var(--text-color)]">${line}</div>`;
        }
        sectionContainer.appendChild(div);

        //const div = document.createElement('div');
        //div.className = 'py-0.5 space-y-0.5';
    }

    // Trigger global text scaling across all rendered sections
    applyTextScaling();
}

function buildChordLyricPairs(chordLine, lyricLine, capoFret, capoSteps, mode, transposeOffset) {
    // Define clean display rules
    const showNative = !capoFret || mode === "native" || mode === "both";
    const showCapo = capoFret && (mode === "capo" || mode === "both");

    if (!lyricLine) {
        let nativeChordLine = chordLine;
        let html = "";
        if (showNative) {
            html += `<div class="chord-above" style="white-space: pre; font-weight:700; color: var(--chord-color, #ffff00);">${nativeChordLine}</div>`;
        }
        if (showCapo) {
            let capoChordLine = capoFret ? transposeChord(nativeChordLine, capoSteps) : nativeChordLine;
            html += `<div class="chord-above" style="white-space: pre; font-weight:700; color: var(--capo-color, #ff0000);">${capoChordLine}</div>`;
        }
        return html;
    }

    const normalizedChordLine = chordLine.replace(/\xA0/g, " ");
    const chordRegex = /([A-G][b#]?[^\s]*)/g;
    let match,
        chordsMap = [];
    while ((match = chordRegex.exec(normalizedChordLine)) !== null) {
        chordsMap.push({ text: match[1], index: match.index });
    }

    if (chordsMap.length === 0)
        return `<div class="lyric-below text-[var(--text-color)]" style="white-space: pre-wrap;">${lyricLine}</div>`;

    let html = "";
    if (chordsMap[0].index > 0) {
        let leadingText = lyricLine.slice(0, chordsMap[0].index);
        let hiddenPlaceholders = "";
        if (showNative) {
            hiddenPlaceholders += `<div class="chord-above" style="visibility: hidden;">&nbsp;</div>`;
        }
        if (showCapo) {
            hiddenPlaceholders += `<div class="chord-above" style="visibility: hidden;">&nbsp;</div>`;
        }
        html += `<span class="chord-lyric-pair" style="display: inline-flex; flex-direction: column; vertical-align: top;"><span style="width: 0; overflow: visible; white-space: nowrap; display: flex; flex-direction: column;">${hiddenPlaceholders}</span><span class="lyric-below text-[var(--text-color)]" style="white-space: pre;">${leadingText}</span></span>`;
    }

    chordsMap.forEach((c, i) => {
        let nextChordIndex = i + 1 < chordsMap.length ? chordsMap[i + 1].index : lyricLine.length;
        let chunk = lyricLine.slice(c.index, nextChordIndex);
        let nativeChord = transposeChord(c.text, transposeOffset);
        let capoChord = capoFret ? transposeChord(nativeChord, capoSteps) : nativeChord;

        let topHtml = "";
        if (showNative) {
            topHtml += `<div class="chord-above" style="white-space: pre; font-weight:700; color: var(--chord-color, #ffff00);">${nativeChord}</div>`;
        }
        if (showCapo) {
            topHtml += `<div class="chord-above" style="white-space: pre; font-weight:700; color: var(--capo-color, #ff0000);">${capoChord}</div>`;
        }

        html += `<span class="chord-lyric-pair" style="display: inline-flex; flex-direction: column; vertical-align: top;"><span style="width: 0; overflow: visible; white-space: nowrap; display: flex; flex-direction: column; transform: translateX(4px);">${topHtml}</span><span class="lyric-below text-[var(--text-color)]" style="white-space: pre;">${chunk}</span></span>`;
    });
    return html;
}

// Universal Song Navigation Helper (supports Sets & Filtered Library Lists)
export function navigateSong(direction) {
    if (state.activeSet) {
        const totalSongs =
            state.activeSet.songs && state.activeSet.songs.length > 0
                ? state.activeSet.songs.length
                : state.activeSet.songTitles
                  ? state.activeSet.songTitles.length
                  : 0;

        const currentIndex = state.activeSetSongIndex !== undefined ? state.activeSetSongIndex : 0;
        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < totalSongs) {
            state.activeSetSongIndex = newIndex;
            loadSongFromActiveSet(newIndex);
        } else {
            showToast(direction > 0 ? "End of set reached" : "Start of set reached");
        }
    } else if (state.activeSong) {
        // Navigate within the currently active sidebar list / filter
        const query = document.getElementById("song-search-input")
            ? document.getElementById("song-search-input").value.toLowerCase()
            : "";
        const filteredSongs = state.loadedSongs.filter((song) => {
            const matchesQuery =
                song.title.toLowerCase().includes(query) || (song.author && song.author.toLowerCase().includes(query));
            const matchesFolder =
                state.selectedFolderFilter === "ALL" || (song.folderPath || "MAIN") === state.selectedFolderFilter;
            return matchesQuery && matchesFolder;
        });

        const currentIndex = filteredSongs.findIndex((s) => s.id === state.activeSong.id);
        if (currentIndex !== -1) {
            const newIndex = currentIndex + direction;
            if (newIndex >= 0 && newIndex < filteredSongs.length) {
                const targetSong = filteredSongs[newIndex];
                ensureSongContentLoaded(targetSong).then(() => {
                    renderSongSheet(targetSong);
                });
            } else {
                showToast(direction > 0 ? "End of song list reached" : "Start of song list reached");
            }
        }
    }
}

export async function restoreLastLoadedSong() {
    const saved = localStorage.getItem("lastSong");
    if (!saved || !state.loadedSongs || state.loadedSongs.length === 0) return;

    try {
        const target = JSON.parse(saved);

        // Match by filename and folder first, with fallback to title
        let foundSong = state.loadedSongs.find(
            (s) => s.filename === target.filename && (s.folderPath || s.folder || "") === (target.folder || "")
        );

        if (!foundSong) {
            foundSong = state.loadedSongs.find((s) => s.title.toLowerCase() === (target.title || "").toLowerCase());
        }

        // If the song still exists in the library, load it up!
        if (foundSong) {
            if (typeof ensureSongContentLoaded === "function") {
                await ensureSongContentLoaded(foundSong);
            }
            renderSongSheet(foundSong);
        }
    } catch (e) {
        console.error("Failed to restore last loaded song:", e);
    }
}

// Lazy-load song content on demand if a placeholder hasn't been parsed yet
export async function ensureSongContentLoaded(song) {
    if (song.isLoaded || !song.fileHandle) return song;
    try {
        const f = await song.fileHandle.getFile();

        // Handle PDF or Image files directly
        if (song.isPdf || song.isImage || /\.(pdf|jpg|jpeg|png|gif)$/i.test(song.filename)) {
            const blobUrl = URL.createObjectURL(f);
            song.isPdf = song.filename.toLowerCase().endsWith(".pdf");
            song.isImage = /\.(jpg|jpeg|png|gif)$/i.test(song.filename);
            song.pdfUrl = blobUrl;
            song.imageUrl = blobUrl;
            song.isLoaded = true;
            return song;
        }

        const text = await f.text();
        const parsed = parseOpenSongXML(text, song.filename, song.folderPath);
        if (parsed) {
            Object.assign(song, parsed, { isLoaded: true });
        }
    } catch (e) {
        console.warn("Failed lazy-loading individual song file:", e);
    }
    return song;
}

/**state.activeSet
 *
 * @param {*} song
 * @param {*} fromSetContext
 * @param {*} songIndexInSet
 */
export async function renderSongSheet(song, fromSetContext = null, songIndexInSet = -1) {
    // 💡 Handle custom notes gracefully by skipping lazy-loading disk files
    if (!song.isNote) {
        await ensureSongContentLoaded(song);
    }

    state.activeSong = song;
    saveLastLoadedSong(song);

    // Auto-detect if song belongs to active set even if opened from library list
    if (!fromSetContext && state.activeSet && state.activeSet.songs) {
        const setIndex = state.activeSet.songs.findIndex((entry) => {
            if (!entry || (typeof entry === "object" && entry.type === "custom")) return false;
            const title = typeof entry === "object" ? entry.title : entry;
            return title && title.toLowerCase() === song.title.toLowerCase();
        });
        if (setIndex !== -1) {
            fromSetContext = state.activeSet;
            songIndexInSet = setIndex;
        }
    }

    // Update the song list to highlight this song
    if (typeof renderSidebarList === "function") {
        const query = document.getElementById("song-search-input")
            ? document.getElementById("song-search-input").value.toLowerCase()
            : "";
        renderSidebarList(query);
    }

    // Update sidebar set item highlighting if active set exists
    if (typeof updateSetSidebarHighlighting === "function") {
        updateSetSidebarHighlighting();
    }

    updateCapoBadge();

    document.getElementById("empty-state").classList.add("hidden");
    document.getElementById("set-view-sheet").classList.add("hidden");
    document.getElementById("song-sheet").classList.remove("hidden");

    const songSheetEl = document.getElementById("song-sheet");
    if (songSheetEl) songSheetEl.scrollTop = 0;

    const mainScrollContainer = document.getElementById("main-scroll-container");
    if (mainScrollContainer) mainScrollContainer.scrollTop = 0;

    if (fromSetContext) {
        state.activeSet = fromSetContext;
        state.activeSetSongIndex = songIndexInSet;

        const bannerTitleEl = document.getElementById("banner-set-title");
        if (bannerTitleEl) {
            bannerTitleEl.textContent = fromSetContext.title || "Set";
        }

        const totalSetSongs =
            fromSetContext.songs && fromSetContext.songs.length > 0
                ? fromSetContext.songs.length
                : fromSetContext.songTitles
                  ? fromSetContext.songTitles.length
                  : 0;

        const indexLabel = document.getElementById("set-song-index-label");
        if (indexLabel) {
            indexLabel.textContent = `${state.activeSetSongIndex + 1} / ${totalSetSongs}`;
        }

        const bannerEl = document.getElementById("set-navigation-banner");
        if (bannerEl) {
            bannerEl.classList.remove("hidden");
        }

        // Wire up "Back to Set" Button (Opens sidebar only, keeps song sheet visible)
        const backBtn = document.getElementById("back-to-set-btn");
        if (backBtn) {
            backBtn.onclick = () => {
                const sidebar = document.getElementById("sidebar");
                if (sidebar) {
                    sidebar.classList.remove("closed", "-translate-x-full");
                }

                const setsTabBtn =
                    document.getElementById("sidebar-sets-tab") ||
                    document.querySelector("[data-sidebar-tab='sets']") ||
                    document.getElementById("sets-tab-btn");

                if (setsTabBtn) {
                    setsTabBtn.click();
                }

                const songSheet = document.getElementById("song-sheet");
                if (songSheet) {
                    songSheet.classList.remove("hidden");
                }
                const setViewSheet = document.getElementById("set-view-sheet");
                if (setViewSheet) {
                    setViewSheet.classList.add("hidden");
                }
            };
        }

        const prevBtn = document.getElementById("prev-set-song-btn");
        if (prevBtn) {
            prevBtn.onclick = () => navigateSong(-1);
        }

        const nextBtn = document.getElementById("next-set-song-btn");
        if (nextBtn) {
            nextBtn.onclick = () => navigateSong(1);
        }
    } else {
        const bannerEl = document.getElementById("set-navigation-banner");
        if (bannerEl) {
            bannerEl.classList.add("hidden");
        }
    }

    const currentOffset = song.transposeOffset || 0;
    const displayedKey = currentOffset !== 0 ? transposeChord(song.key || "C", currentOffset) : song.key || "C";

    // 💡 Populate header titles safely for notes vs normal songs
    document.getElementById("sheet-title").textContent = song.title;
    document.getElementById("sheet-author").textContent = song.author || (song.isNote ? "Custom Note" : "");
    document.getElementById("sheet-folder-path").textContent = song.folderPath || (song.isNote ? "Note" : "MAIN");

    // Hide or adapt badges if it's a note
    const keyBadge = document.getElementById("sheet-key-badge");
    const capoBadge = document.getElementById("sheet-capo-badge");
    let capoModeBadge = document.getElementById("sheet-capo-mode-badge");

    if (song.isNote) {
        console.log("isNote!!!");
        if (keyBadge) keyBadge.classList.add("hidden");
        if (capoBadge) capoBadge.classList.add("hidden");
        if (capoModeBadge) capoModeBadge.classList.add("hidden");
    } else {
        if (keyBadge) keyBadge.classList.remove("hidden");
        if (capoBadge) capoBadge.classList.remove("hidden");
        keyBadge.textContent = displayedKey ? `Key: ${displayedKey}` : "Key: —";
        keyBadge.className = `song-badge song-badge-interactive ${!displayedKey ? "song-badge-muted" : ""}`;
        keyBadge.title = "Click to transpose song";
        keyBadge.onclick = () => openTransposeModal();
    }

    // 2. Capo Value Badge (Subtle, fixed border)
    const hasCapo = Boolean(song.capo && song.capo !== "0" && song.capo !== "");
    if (capoBadge && !song.isNote) {
        capoBadge.textContent = `Capo: ${hasCapo ? song.capo : "0"}`;
        capoBadge.className = `song-badge song-badge-interactive ${!hasCapo ? "song-badge-muted" : ""}`;
        capoBadge.title = "Click to set capo value";
        capoBadge.onclick = () => openCapoModal();
    }

    // 3. Capo Mode Badge (Subtle, fixed border)
    if (!capoModeBadge && capoBadge && capoBadge.parentNode) {
        capoModeBadge = document.createElement("button");
        capoModeBadge.id = "sheet-capo-mode-badge";
        capoBadge.parentNode.insertBefore(capoModeBadge, capoBadge.nextSibling);
    }
    if (capoModeBadge) {
        if (!hasCapo) {
            capoModeBadge.classList.add("hidden");
        } else {
            capoModeBadge.classList.remove("hidden");
            const mode = getCapoDisplayMode();
            let modeText = "Native";
            if (mode === "capo") modeText = "Capo Chords";
            else if (mode === "both") modeText = "Both chords";

            capoModeBadge.textContent = modeText;
            capoModeBadge.className = "song-badge song-badge-interactive";
            capoModeBadge.title = "Click to cycle capo display mode";
            capoModeBadge.onclick = () => {
                let m = getCapoDisplayMode();
                if (m === "native") m = "capo";
                else if (m === "capo") m = "both";
                else m = "native";

                setCapoDisplayMode(m);
                localStorage.setItem("capoDisplayMode", m);
                updateCapoBadge();
                renderSongSheet(song, fromSetContext, songIndexInSet);
                showToast(`Capo display mode: ${m}`);
            };
        }
    }

    // Render PDF or Image viewer if media file, otherwise render normal OpenSong lyrics
    const sheetContentEl = document.getElementById("sheet-content");
    if (song.isPdf && song.pdfUrl) {
        sheetContentEl.innerHTML = `
            <div class="w-full h-[80vh] flex flex-col items-center justify-center bg-[var(--bg-primary-variant)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                <iframe src="${song.pdfUrl}" class="w-full h-full border-0"></iframe>
            </div>
        `;
    } else if (song.isImage && song.imageUrl) {
        sheetContentEl.innerHTML = `
            <div class="w-full h-[80vh] flex flex-col items-center justify-center bg-[var(--bg-primary-variant)] rounded-2xl border border-[var(--border-color)] p-4 overflow-auto">
                <img src="${song.imageUrl}" alt="${song.title}" class="max-w-full max-h-full object-contain rounded-lg shadow-md" />
            </div>
        `;
    } else {
        renderSongLyrics(song.lyrics, song.capo, currentOffset);
    }

    setTimeout(() => {
        applyTextScaling();
    }, 320);

    updateCastWindow(song);
}

function saveLastLoadedSong(song) {
    if (!song) return;
    const songData = {
        title: song.title,
        filename: song.filename || "",
        folder: song.folderPath || song.folder || ""
    };
    localStorage.setItem("lastSong", JSON.stringify(songData));
}

export function addOrUpdateSong(songObj) {
    const existingIdx = state.loadedSongs.findIndex(
        (s) =>
            s.filename.toLowerCase() === songObj.filename.toLowerCase() &&
            (s.folderPath || "MAIN") === (songObj.folderPath || "MAIN")
    );
    if (existingIdx !== -1) state.loadedSongs[existingIdx] = { ...state.loadedSongs[existingIdx], ...songObj };
    else state.loadedSongs.push(songObj);
}

export function writeSongToDisk(songObk) {
    // TODO code was removed by AI?
}
