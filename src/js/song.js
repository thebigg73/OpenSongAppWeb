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
import { getRootDirectoryHandle } from "./storage.js";
import { state } from "./state.js";

// Comprehensive OpenSong XML Parser capturing all fields and preserving raw desktop tags
export function parseOpenSongXML(xmlString, filename, folderPath) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "text/xml");
        const songEl = doc.querySelector("song") || doc.documentElement;
        if (!songEl) return null;

        const getTagText = (tag) => {
            const el = songEl.querySelector(tag);
            return el ? el.textContent : "";
        };

        // Capture all raw child elements so untouched desktop/custom tags remain preserved
        const rawTags = {};
        for (const child of songEl.children) {
            rawTags[child.nodeName.toLowerCase()] = child.outerHTML;
        }

        const song = {
            filename: filename,
            folderPath: folderPath || "MAIN",
            title: getTagText("title") || filename.replace(/\.[^/.]+$/, ""),
            author: getTagText("author"),
            copyright: getTagText("copyright"),
            presentation: getTagText("presentation"),
            hymn_number: getTagText("hymn_number"),
            capo: getTagText("capo"),
            tempo: parseInt(getTagText("tempo")) || 120,
            time_sig: getTagText("time_sig") || "4/4",
            duration: getTagText("duration"),
            predelay: getTagText("predelay"),
            ccli: getTagText("ccli"),
            theme: getTagText("theme"),
            altheme: getTagText("altheme"),
            user1: getTagText("user1"),
            user2: getTagText("user2"),
            user3: getTagText("user3"),
            beatbuddysong: getTagText("beatbuddysong"),
            beatbuddykit: getTagText("beatbuddykit"),
            drummer: getTagText("drummer"),
            drummerkit: getTagText("drummerkit"),
            key: getTagText("key"),
            keyoriginal: getTagText("keyoriginal"),
            preferedinstrument: getTagText("preferedinstrument"),
            previewoverride: getTagText("previewoverride"),
            aka: getTagText("aka"),
            midi: getTagText("midi"),
            midi_index: getTagText("midi_index"),
            notes: getTagText("notes"),
            lyrics: getTagText("lyrics"),
            pad_file: getTagText("pad_file") || getTagText("pad"),
            pad: getTagText("pad_file") || getTagText("pad"),
            custom_chords: getTagText("custom_chords"),
            link_web: getTagText("link_web"),
            link_audio: getTagText("link_audio"),
            loop_audio: getTagText("loop_audio") === "true" || getTagText("loop_audio") === "1",
            abc_notation: getTagText("abc_notation"),
            abc_transpose: getTagText("abc_transpose"),
            uuid: getTagText("uuid") || generateUUID(),
            last_modified: getTagText("last_modified") || new Date().toISOString(),
            rawTags: rawTags, // Preserves every untouched XML tag
            isLoaded: true
        };

        return song;
    } catch (e) {
        console.error("Error parsing OpenSong XML:", e);
        return null;
    }
}

export function formatSectionHeading(tag) {
    if (!tag) return "";
    const clean = tag
        .replace(/[\[\]]/g, "")
        .trim()
        .toUpperCase();

    // Match the alphabetic root and optional numeric suffix regardless of case or length
    const match = clean.match(/^([A-Z]+)(\d*)$/);
    if (!match) return tag.replace(/[\[\]]/g, "").trim();

    const type = match[1];
    const num = match[2];

    if (type.startsWith("V")) return num ? `Verse ${num}` : "Verse";
    if (type.startsWith("C")) return num ? `Chorus ${num}` : "Chorus";
    if (type.startsWith("B")) return num ? `Bridge ${num}` : "Bridge";
    if (type.startsWith("INT")) return num ? `Intro ${num}` : "Intro";
    if (type.startsWith("OUT")) return num ? `Outro ${num}` : "Outro";
    if (type.startsWith("PRE")) return num ? `Pre-Chorus ${num}` : "Pre-Chorus";
    if (type.startsWith("TAG")) return num ? `Tag ${num}` : "Tag";
    if (type.startsWith("INST") || type.startsWith("MUS")) return num ? `Instrumental ${num}` : "Instrumental";

    // Fallback: neatly capitalize custom headers (e.g. "SOLO" -> "Solo")
    return clean.charAt(0) + clean.slice(1).toLowerCase();
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

        // 💡 If there is no section container yet (e.g. comment or intro text at the very top of the song),
        // create a clean default wrapper container for it so it doesn't float into an unstyled void.
        if (!sectionContainer) {
            sectionCounter++;
            const thisSectionIdx = sectionCounter;
            sectionContainer = document.createElement("div");
            sectionContainer.className =
                "w-full p-4 md:p-6 rounded-2xl bg-[var(--bg-primary-variant)]/40 border border-[var(--border-color)] space-y-3";
            document.getElementById("sheet-content").appendChild(sectionContainer);
        }

        const div = document.createElement("div");

        // Combined handler for all comment lines starting with ';'
        if (trimmed.startsWith(";")) {
            const commentContent = trimmed.slice(1);

            if (commentContent.startsWith("#:")) {
                const abcData = commentContent.slice(2).replace(/\\n/g, "\n");
                div.className =
                    "song-inline-abc my-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]";
                div.innerHTML = `<div class="text-xs font-bold text-[var(--hint-color)] mb-1 uppercase tracking-wider">Inline ABC Notation</div><pre class="font-mono text-xs text-[var(--text-color)] whitespace-pre-wrap overflow-x-auto">${abcData}</pre>`;
            } else if (commentContent.startsWith("MIDI")) {
                const midiCmd = commentContent.trim();
                div.className = "song-midi-command my-2";
                div.innerHTML = `<div class="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800/60 inline-flex items-center space-x-2"><span class="px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 text-[10px] uppercase font-bold">MIDI</span><span>${midiCmd}</span></div>`;
            } else if (commentContent.includes("|")) {
                div.className = "song-tab-comment-line my-0.5";
                div.innerHTML = `<div class="font-mono text-xs md:text-sm tracking-wider text-[var(--hint-color)] whitespace-pre overflow-x-auto">${commentContent}</div>`;
            } else {
                const commentText = commentContent.trim();
                div.className = "song-comment-line my-2";
                div.innerHTML = `<div class="text-sm italic font-medium px-3 py-1.5 rounded-lg bg-[var(--bg-primary)]/80 text-[var(--hint-color)] border border-[var(--border-color)] inline-block">${commentText}</div>`;
            }
        } else if (line.startsWith(".")) {
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

export async function writeSongToDisk(song) {
    if (!song) {
        console.error("[WriteSong] Error: song object is null or undefined.");
        return;
    }

    if (!song.uuid) song.uuid = generateUUID();
    song.last_modified = new Date().toISOString();
    if (!song.filename) song.filename = (song.title || "Untitled").replace(/[^a-zA-Z0-9_-]/g, "_") + ".xml";

    console.log(
        `[WriteSong] Attempting to save "${song.title}" (filename: ${song.filename}, folder: ${song.folderPath || "MAIN"})`
    );

    const rawTags = song.rawTags || {};

    const setTagXML = (tagName, val) => {
        const safeVal = (val !== undefined && val !== null) ? String(val) : "";
        return `  <${tagName}>${escapeXml(safeVal)}</${tagName}>\n`;
    };

    let xml = `<song>\n`;

    // Complete list of all OpenSong and OpenSongApp fields to be explicitly outputted
    const fields = [
        "title",
        "author",
        "copyright",
        "presentation",
        "hymn_number",
        "capo",
        "tempo",
        "time_sig",
        "duration",
        "predelay",
        "ccli",
        "theme",
        "altheme",
        "user1",
        "user2",
        "user3",
        "beatbuddysong",
        "beatbuddykit",
        "drummer",
        "drummerkit",
        "key",
        "keyoriginal",
        "preferedinstrument",
        "previewoverride",
        "aka",
        "midi",
        "midi_index",
        "notes",
        "lyrics",
        "pad",
        "custom_chords",
        "link_web",
        "link_audio",
        "loop_audio",
        "abc_notation",
        "abc_transpose",
        "uuid",
        "last_modified"
    ];

    const handledTags = new Set(fields);

    fields.forEach((field) => {
        let val = song[field];
        xml += setTagXML(field, val !== undefined && val !== null ? val : "");
    });

    for (const [tag, outerHtml] of Object.entries(rawTags)) {
        if (!handledTags.has(tag) && tag !== "song") {
            xml += `  ${outerHtml}\n`;
        }
    }

    xml += `</song>`;

    let writeSuccess = false;
    let targetFileHandle = song.fileHandle;
    let activeRootHandle = window.rootDirectoryHandle || getRootDirectoryHandle();

    console.log(`[WriteSong] Initial song.fileHandle status:`, targetFileHandle ? "Present" : "Missing/Null");
    console.log(`[WriteSong] activeRootHandle status:`, activeRootHandle ? "Connected" : "Not Connected");

    if ((!targetFileHandle || typeof targetFileHandle.createWritable !== "function") && activeRootHandle) {
        try {
            let currentDir = activeRootHandle;

            for await (const [name, handle] of activeRootHandle.entries()) {
                if (name.toLowerCase() === "songs" && handle.kind === "directory") {
                    currentDir = handle;
                    break;
                }
            }

            const folderPath = song.folderPath || "MAIN";
            if (folderPath && folderPath !== "MAIN") {
                const parts = folderPath.split("/");
                for (const part of parts) {
                    if (part) {
                        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
                    }
                }
            }

            targetFileHandle = await currentDir.getFileHandle(song.filename, { create: true });
            song.fileHandle = targetFileHandle;
            console.log(`[WriteSong] Successfully re-resolved targetFileHandle for ${song.filename}`);
        } catch (err) {
            console.error("[WriteSong] Failed to re-resolve file handle from root directory:", err);
        }
    }

    // --- CRITICAL FIX: Actually write the file stream to disk here! ---
    try {
        if (targetFileHandle && typeof targetFileHandle.createWritable === "function") {
            const writable = await targetFileHandle.createWritable();
            await writable.write(xml);
            await writable.close();
            writeSuccess = true;
            console.log(`[WriteSong] Successfully wrote XML data to disk via createWritable().`);
        } else {
            console.warn("[WriteSong] Target file handle is missing or createWritable is unavailable.");
        }
    } catch (err) {
        console.error("[WriteSong] Exception caught during fileHandle.createWritable():", err);
    }

    if (window.sqliteDb) {
        try {
            const stmt = window.sqliteDb.prepare(
                `INSERT OR REPLACE INTO songs (
                    filename, folderPath, title, author, copyright, presentation,
                    hymn_number, capo, tempo, time_sig, duration, predelay, ccli,
                    theme, altheme, user1, user2, user3, beatbuddysong, beatbuddykit,
                    drummer, drummerkit, key, keyoriginal, preferedinstrument,
                    previewoverride, aka, midi, midi_index, notes, lyrics, pad,
                    custom_chords, link_web, link_audio, loop_audio, abc_notation,
                    abc_transpose, uuid, modified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );
            stmt.run([
                song.filename,
                song.folderPath || "MAIN",
                song.title || "",
                song.author || "",
                song.copyright || "",
                song.presentation || "",
                song.hymn_number || "",
                song.capo || "",
                parseInt(song.tempo) || 120,
                song.time_sig || "4/4",
                song.duration || "",
                song.predelay || "",
                song.ccli || "",
                song.theme || "",
                song.altheme || "",
                song.user1 || "",
                song.user2 || "",
                song.user3 || "",
                song.beatbuddysong || "",
                song.beatbuddykit || "",
                song.drummer || "",
                song.drummerkit || "",
                song.key || "",
                song.keyoriginal || "",
                song.preferedinstrument || "",
                song.previewoverride || "",
                song.aka || "",
                song.midi || "",
                song.midi_index || "",
                song.notes || "",
                song.lyrics || "",
                song.pad || "",
                song.custom_chords || "",
                song.link_web || "",
                song.link_audio || "",
                song.loop_audio ? 1 : 0,
                song.abc_notation || "",
                song.abc_transpose || "",
                song.uuid,
                song.last_modified
            ]);
            stmt.free();
            if (typeof window.saveSqlDbBuffer === "function") {
                await window.saveSqlDbBuffer();
            }
            console.log(`[WriteSong] Successfully updated SQLite cache with all fields.`);
        } catch (e) {
            console.error("[WriteSong] Failed to update SQLite cache on save:", e);
        }
    }

    if (writeSuccess) {
        showToast(`Saved "${song.title}" to disk successfully!`);
    } else {
        showToast(`Error: Could not write to disk. Check console logs.`);
    }
}

function escapeXml(unsafe) {
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "'":
                return "&apos;";
            case '"':
                return "&quot;";
        }
    });
}
