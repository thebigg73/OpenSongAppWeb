// The Javascript used to deal with dual screen output
import { state } from "./state.js";
import { ensureSongContentLoaded } from "./song.js";

let castWindow = null;
let castSettings = { showChords: true, fontScale: 1.4 };

export function extractSectionContent(lyrics, targetSectionIndex) {
    if (!lyrics) return { heading: "", content: "" };
    const lines = lyrics.split("\n");
    let currentIdx = -1;
    let sectionLines = [];
    let currentHeading = "";

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
    return { heading: currentHeading, content: sectionLines.join("\n") };
}

export async function updateCastWindow(song, sectionIndex = 0, isManualClick = false) {
    if (song) await ensureSongContentLoaded(song);
    if (castWindow && !castWindow.closed && song) {
        const extracted = extractSectionContent(song.lyrics, sectionIndex);
        castWindow.postMessage(
            {
                type: "OPENSONG_CAST_UPDATE",
                title: song.title,
                heading: extracted.heading,
                lyrics: extracted.content,
                settings: castSettings
            },
            "*"
        );
        if (isManualClick) showToast(`Casting: ${extracted.heading}`);
    }
}

const castBtn = document.getElementById("cast-display-btn");
if (castBtn) {
    castBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (activeSong) await ensureSongContentLoaded(activeSong);
        showToast("Opening stage presentation window...");
        castWindow = window.open("", "_blank", "width=1024,height=768");
        if (castWindow) {
            castWindow.document.open();
            castWindow.document.write(`<!DOCTYPE html>
<html lang="en" class="h-full bg-[var(--bg-primary)] text-[var(--text-color)]">
<head>
    <meta charset="UTF-8">
    <title>OpenSongApp Stage Display</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        .chord-lyric-pair-line { display: flex; flex-wrap: wrap; row-gap: 0.5rem; line-height: 1.4; max-width: 100%; word-break: break-word; }
        .chord-lyric-pair { display: inline-flex; flex-direction: column; vertical-align: top; position: relative; }
        .chord-above { font-weight: 700; color: var(--color-secondary); line-height: 1.1; white-space: pre; }
        .lyric-below { color: var(--text-color); white-space: pre; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg-primary); }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
    </style>
</head>
<body class="h-full flex flex-col overflow-hidden select-none bg-[var(--bg-primary)] text-[var(--text-color)] font-sans p-8 justify-center items-center">
    <main class="w-full max-w-4xl flex-1 overflow-y-auto space-y-6" id="cast-viewport">
        <div id="cast-content" class="space-y-6"></div>
    </main>

    <script>
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'OPENSONG_CAST_UPDATE') {
                const container = document.getElementById('cast-content');
                container.innerHTML = '';
                document.getElementById('cast-viewport').style.fontSize = (e.data.settings.fontScale || 1.4) + 'rem';

                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'p-8 rounded-3xl bg-[var(--bg-primary-variant)]/90 border border-[var(--border-color)] space-y-6 shadow-2xl';
                sectionDiv.innerHTML = '<h2 class="text-[var(--text-color)] font-extrabold text-2xl uppercase tracking-wider mb-4 border-b border-[var(--border-color)] pb-3">' + e.data.heading + '</h2>';

                const lines = e.data.lyrics.split('\\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const div = document.createElement('div');
                    if (line.startsWith('.')) {
                        if (e.data.settings.showChords) {
                            div.className = 'chord-lyric-pair-line mb-3';
                            div.textContent = line.slice(1);
                        }
                    } else {
                        div.innerHTML = '<div class="lyric-below text-2xl mb-3">' + line + '</div>';
                    }
                    sectionDiv.appendChild(div);
                }
                container.appendChild(sectionDiv);
            }
        });
    <\/script>
</body>
</html>`);
            castWindow.document.close();
            if (activeSong) updateCastWindow(activeSong);
        }
    });
}
