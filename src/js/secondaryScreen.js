// The Javascript used to deal with dual screen output
import { state } from "./state.js";
import { ensureSongContentLoaded } from "./song.js";
import { showToast } from "./toast.js";

let castWindow = null;
let castSettings = { showChords: true, fontScale: 1.4 };

export function formatSectionHeading(rawHeading) {
    if (!rawHeading) return "";
    let clean = rawHeading
        .replace(/[\[\]]/g, "")
        .trim()
        .toUpperCase();
    if (clean.startsWith("V")) return clean.slice(1) ? `Verse ${clean.slice(1)}` : "Verse";
    if (clean.startsWith("C")) return clean.slice(1) ? `Chorus ${clean.slice(1)}` : "Chorus";
    if (clean.startsWith("B")) return clean.slice(1) ? `Bridge ${clean.slice(1)}` : "Bridge";
    return rawHeading.replace(/[\[\]]/g, "").trim();
}

export function extractSectionContent(lyrics, targetSectionIndex) {
    if (!lyrics) return { heading: "SECTION", htmlContent: "<p class='text-slate-400'>No lyrics available</p>" };
    const lines = lyrics.split("\n");
    let currentIdx = -1;
    let sectionLines = [];
    let currentHeading = "SECTION";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith("[")) {
            if (currentIdx === targetSectionIndex) break;
            currentIdx++;
            if (currentIdx === targetSectionIndex) {
                currentHeading = formatSectionHeading(trimmed);
                continue;
            }
        }
        if (currentIdx === targetSectionIndex) sectionLines.push(line);
    }

    if (sectionLines.length === 0 && targetSectionIndex === 0) {
        sectionLines = lines.slice(0, 30);
    }

    let htmlOutput = "";
    for (let i = 0; i < sectionLines.length; i++) {
        const line = sectionLines[i];
        if (line.startsWith(".")) {
            const chordLine = line.slice(1);
            let nextLine =
                i + 1 < sectionLines.length && !sectionLines[i + 1].startsWith(".") ? sectionLines[i + 1] : "";
            if (nextLine) i++;
            htmlOutput += `<div class="my-3"><div class="chord-above" style="font-weight:700; color: #38bdf8; font-family: monospace; white-space: pre;">${chordLine}</div><div class="lyric-below text-slate-100" style="font-family: monospace; white-space: pre;">${nextLine}</div></div>`;
        } else {
            htmlOutput += `<div class="my-3"><div class="lyric-below text-slate-100 font-bold" style="white-space: pre-wrap;">${line}</div></div>`;
        }
    }

    return { heading: currentHeading, htmlContent: htmlOutput || `<p class="text-slate-400">Empty section</p>` };
}

export async function updateCastWindow(song, sectionIndex = 0, isManualClick = false) {
    if (song && !song.lyrics) await ensureSongContentLoaded(song);

    const currentSong = song || state.activeSong;
    const targetIndex = sectionIndex !== undefined ? sectionIndex : state.activeSectionIndex || 0;
    const extracted = extractCurrentSectionView(currentSong, targetIndex);

    if (castWindow && !castWindow.closed) {
        castWindow.postMessage(
            {
                type: "OPENSONG_CAST_UPDATE",
                title: currentSong ? currentSong.title : "OpenSong Stage Display",
                heading: extracted.heading,
                htmlContent: extracted.htmlContent,
                settings: castSettings
            },
            "*"
        );
        if (isManualClick && typeof showToast === "function") {
            showToast(`Casting: ${extracted.heading}`);
        }
    }
}

function extractCurrentSectionView(song, sectionIndex) {
    const sectionEls = document.querySelectorAll("#sheet-content > div");
    if (sectionEls && sectionEls.length > sectionIndex) {
        const targetEl = sectionEls[sectionIndex];
        const headingEl = targetEl.querySelector("h4, h2, h3");
        const heading = headingEl ? headingEl.textContent : "SECTION";

        const clone = targetEl.cloneNode(true);
        clone.querySelectorAll("h4, h2, h3").forEach((el) => el.remove());

        return {
            heading: heading,
            htmlContent: clone.innerHTML
        };
    }

    if (song && song.lyrics) {
        return extractSectionContent(song.lyrics, sectionIndex);
    }

    return {
        heading: "READY",
        htmlContent: `<p class="text-slate-400 text-xl italic">Select a section in the main window</p>`
    };
}

export function initCastButton() {
    const castBtn = document.getElementById("cast-display-btn");
    if (castBtn) {
        if (castBtn.dataset.castInitialized === "true") return;
        castBtn.dataset.castInitialized = "true";

        castBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const currentSong = state.activeSong;
            if (currentSong) await ensureSongContentLoaded(currentSong);
            if (typeof showToast === "function") showToast("Opening stage presentation window...");

            const targetIndex = state.activeSectionIndex || 0;
            const extracted = extractCurrentSectionView(currentSong, targetIndex);
            const songTitle = currentSong ? currentSong.title : "OpenSong Stage Display";
            const sectionHeading = extracted.heading || "SECTION";
            const initialHtml = extracted.htmlContent || "";

            // If a window already exists and isn't closed, focus it instead of spawning a new one
            if (castWindow && !castWindow.closed) {
                castWindow.focus();
                updateCastWindow(currentSong, targetIndex, false);
                return;
            }

            // Open window synchronously on user click
            castWindow = window.open("", "_blank", "width=1200,height=800");

            if (castWindow) {
                // Ensure the window context is active and focused immediately
                castWindow.focus();

                castWindow.document.open();
                castWindow.document.write(`<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-950 text-slate-100">
<head>
    <meta charset="UTF-8">
    <title>OpenSongApp Stage Display</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        .chord-lyric-pair-line { display: flex; flex-wrap: wrap; row-gap: 0.75rem; column-gap: 0.25rem; line-height: 1.5; }
        .chord-above { font-weight: 700; color: #38bdf8; font-family: monospace; white-space: pre; }
        .lyric-below { color: #f8fafc; font-family: monospace; white-space: pre; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    </style>
</head>
<body class="h-full flex flex-col overflow-hidden select-none bg-slate-950 text-slate-100 font-sans p-8 justify-between">

    <header class="w-full flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 id="song-title-display" class="text-xl font-bold text-slate-400 tracking-wide uppercase">${songTitle}</h1>
        <div id="section-badge" class="px-4 py-1.5 rounded-full bg-sky-950 border border-sky-800 text-sky-400 font-bold text-sm uppercase tracking-wider">${sectionHeading}</div>
    </header>

    <main class="w-full flex-1 flex items-center justify-center p-6 overflow-hidden" id="cast-viewport">
        <div id="cast-content" class="w-full max-w-6xl text-center space-y-4">
            ${initialHtml}
        </div>
    </main>

    <script>
        function applyStageScaling() {
            const viewport = document.getElementById('cast-viewport');
            const content = document.getElementById('cast-content');
            if (!viewport || !content) return;

            content.style.fontSize = '1rem';
            let currentSize = 1.0;
            const maxAllowedSize = 3.5;

            while (
                content.scrollHeight <= viewport.clientHeight &&
                content.scrollWidth <= viewport.clientWidth &&
                currentSize < maxAllowedSize
            ) {
                currentSize += 0.1;
                content.style.fontSize = currentSize + 'rem';
            }

            if (currentSize > 1.0) {
                currentSize -= 0.1;
                content.style.fontSize = currentSize + 'rem';
            }
        }

        window.addEventListener('DOMContentLoaded', applyStageScaling);
        window.addEventListener('load', applyStageScaling);

        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'OPENSONG_CAST_UPDATE') {
                document.getElementById('song-title-display').textContent = e.data.title || 'OpenSong Stage Display';
                document.getElementById('section-badge').textContent = e.data.heading || 'SECTION';

                const container = document.getElementById('cast-content');
                container.innerHTML = e.data.htmlContent;

                setTimeout(applyStageScaling, 20);
            }
        });

        window.addEventListener('resize', applyStageScaling);
    <\/script>
</body>
</html>`);
                castWindow.document.close();

                // Force an immediate postMessage check once the frame script loads
                setTimeout(() => {
                    updateCastWindow(currentSong, targetIndex, false);
                }, 50);
            }
        });
    }
}
