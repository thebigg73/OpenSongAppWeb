import { getPadDataUri } from "../pads/padLoader.js";
import { state } from "./state.js";
import { showToast } from "./toast.js";
import MidiPlayer from "midi-player-js";

let audioCtx = null;
let midiPlayer = null;
let activeSynthVoices = {};
let standardAudio = null;
let isPlaying = false;
let currentTrackDuration = 120;
let currentTrackTime = 0;
let progressInterval = null;

function getCustomPadMapping(key) {
    try {
        const customMaps = JSON.parse(localStorage.getItem("opensong_custom_pads") || "{}");
        return customMaps[key] || null;
    } catch (e) {
        return null;
    }
}

export function resolveSongPadSource(song) {
    if (!song) song = state.activeSong || { key: "C", pad: "auto" };

    const padTag = (song.pad || "").trim().toLowerCase();
    const keyTag = (song.key || "C").trim();
    const linkAudio = song.linkAudio || song.link_audio || song.linkAudioPath || "";

    if (padTag === "link" && linkAudio) {
        return {
            type: "link",
            source: linkAudio,
            label: linkAudio.split("/").pop() || "Linked Audio"
        };
    }

    const customPadUrl = getCustomPadMapping(keyTag);
    if (customPadUrl) {
        return {
            type: "custom",
            source: customPadUrl,
            label: `Custom Pad (${keyTag})`
        };
    }

    if (padTag === "auto" || padTag === "" || padTag === "midi") {
        if (!keyTag) {
            return { type: "none", source: null, label: "No Key Set" };
        }
        const midiDataUri = getPadDataUri(keyTag);
        if (midiDataUri) {
            return {
                type: "bundled",
                source: midiDataUri,
                label: `Auto Pad (${keyTag})`
            };
        }
    }

    return { type: "none", source: null, label: "No Pad Configured" };
}

export function togglePadPlayback(song) {
    if (isPlaying) {
        stopPad();
    } else {
        playPad(song);
    }
}

async function getArrayBufferFromSource(source) {
    if (!source) return new ArrayBuffer(0);

    if (source.startsWith("data:")) {
        const base64 = source.split(",")[1].replace(/\s/g, "");
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
    return await response.arrayBuffer();
}

export async function playPad(song) {
    stopPad();
    if (!song) song = state.activeSong;
    const padInfo = resolveSongPadSource(song);

    if (!padInfo.source) {
        showToast("No valid pad source found.");
        return;
    }

    if (padInfo.type === "link" || padInfo.type === "custom") {
        playStandardAudio(padInfo);
        return;
    }

    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") {
            await audioCtx.resume();
        }

        const arrayBuffer = await getArrayBufferFromSource(padInfo.source);

        midiPlayer = new MidiPlayer.Player((event) => {
            if (event.name === "Note on" && event.velocity > 0) {
                startSynthVoice(event.noteNumber, event.velocity);
            } else if (event.name === "Note off" || (event.name === "Note on" && event.velocity === 0)) {
                stopSynthVoice(event.noteNumber);
            }
        });

        midiPlayer.on("endOfFile", () => {
            if (isPlaying && midiPlayer) {
                midiPlayer.play();
                currentTrackTime = 0;
            }
        });

        midiPlayer.loadArrayBuffer(arrayBuffer);
        currentTrackDuration = midiPlayer.getSongTime() || 120;
        midiPlayer.play();

        isPlaying = true;
        currentTrackTime = 0;
        startProgressTicker();
        updatePadWidgetState(padInfo, true);
        showToast(`Playing: ${padInfo.label}`);
    } catch (err) {
        console.warn("Synthesizer playback blocked or failed:", err);
        isPlaying = false;
        updatePadWidgetState(padInfo, false);
        showToast("Playback blocked. Tap Play to Authorize.");
    }
}

function startProgressTicker() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        if (isPlaying) {
            currentTrackTime += 1;
            if (currentTrackTime > currentTrackDuration) currentTrackTime = 0;
            updateProgressUI();
        }
    }, 1000);
}

function startSynthVoice(noteNumber, velocity) {
    if (!audioCtx) return;
    stopSynthVoice(noteNumber);

    const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
    const now = audioCtx.currentTime;

    const voiceGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, now);

    const peakVol = (velocity / 127) * 0.12;
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(peakVol, now + 0.6);

    const osc1 = audioCtx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = audioCtx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(freq * 1.003, now);

    const osc3 = audioCtx.createOscillator();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(freq * 0.5, now);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    activeSynthVoices[noteNumber] = { oscillators: [osc1, osc2, osc3], gainNode: voiceGain };
}

function stopSynthVoice(noteNumber) {
    const voice = activeSynthVoices[noteNumber];
    if (voice && audioCtx) {
        const now = audioCtx.currentTime;
        try {
            voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
            voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
            setTimeout(() => {
                voice.oscillators.forEach((osc) => {
                    try {
                        osc.stop();
                    } catch (e) {}
                });
            }, 1300);
        } catch (e) {}
        delete activeSynthVoices[noteNumber];
    }
}

function playStandardAudio(padInfo) {
    let resolvedSource = padInfo.source;
    if (window._localAudioBlobCache && window._localAudioBlobCache[padInfo.source]) {
        resolvedSource = window._localAudioBlobCache[padInfo.source];
    }

    standardAudio = new Audio(resolvedSource);
    standardAudio.loop = true;
    standardAudio.volume = 0.8;
    standardAudio
        .play()
        .then(() => {
            isPlaying = true;
            currentTrackTime = 0;
            currentTrackDuration = standardAudio.duration || 180;
            startProgressTicker();
            updatePadWidgetState(padInfo, true);
            showToast(`Playing: ${padInfo.label}`);
        })
        .catch(() => {
            isPlaying = false;
            updatePadWidgetState(padInfo, false);
            showToast("Playback blocked. Tap Play to authorize.");
        });
}

export function stopPad() {
    clearInterval(progressInterval);
    if (midiPlayer) {
        midiPlayer.stop();
        midiPlayer = null;
    }
    if (standardAudio) {
        standardAudio.pause();
        standardAudio = null;
    }
    Object.keys(activeSynthVoices).forEach((noteNumber) => {
        stopSynthVoice(Number(noteNumber));
    });
    activeSynthVoices = {};
    isPlaying = false;
    currentTrackTime = 0;
    const currentSong = state.activeSong || { key: "C", pad: "auto" };
    updatePadWidgetState(resolveSongPadSource(currentSong), false);
}

// Narrow Draggable Floating Pad Widget with Interactive Seekbar
export function openPadModal() {
    let widget = document.getElementById("pad-control-widget");
    const currentSong = state.activeSong || { title: "No Song Selected", key: "C", pad: "auto" };
    const padInfo = resolveSongPadSource(currentSong);

    if (!widget) {
        widget = document.createElement("div");
        widget.id = "pad-control-widget";
        // Narrower width (w-60)
        widget.className =
            "fixed top-20 right-6 z-40 w-60 bg-[var(--bg-primary)]/95 border border-[var(--border-color)] rounded-xl shadow-2xl backdrop-blur-md p-2.5 text-[var(--text-color)] select-none";
        document.body.appendChild(widget);

        makeElementDraggable(widget);
    }

    renderWidgetContent(widget, padInfo, currentSong);

    if (!isPlaying) {
        playPad(currentSong);
    }
}

function renderWidgetContent(widget, padInfo, currentSong) {
    widget.innerHTML = `
        <div id="pad-drag-handle" class="flex justify-between items-center pb-1.5 mb-1.5 border-b border-[var(--border-color)] cursor-move">
            <div class="flex items-center space-x-1.5">
                <div id="modal-status-dot" class="w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}"></div>
                <span class="font-bold text-[10px] uppercase tracking-wider text-[var(--text-hint)]">Pad Player</span>
            </div>
            <button id="pad-widget-close" class="p-1 rounded hover:bg-[var(--bg-primary-variant)] text-[var(--text-hint)] hover:text-[var(--text-color)]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div class="space-y-2 text-xs">
            <div class="font-semibold truncate text-[var(--text-color)] text-[11px]" title="${padInfo.label}">${padInfo.label}</div>

            <!-- Draggable / Clickable Progress Slider -->
            <div class="space-y-0.5">
                <input
                    type="range"
                    id="pad-progress-slider"
                    min="0"
                    max="100"
                    value="0"
                    class="w-full h-1 bg-[var(--bg-primary-variant)] rounded-lg appearance-none cursor-pointer accent-sky-500" />
                <div class="flex justify-between text-[9px] text-[var(--text-hint)] font-mono">
                    <span id="pad-time-current">0:00</span>
                    <span id="pad-time-total">0:00</span>
                </div>
            </div>

            <!-- Mini Transport Controls -->
            <div class="flex items-center space-x-1.5 pt-0.5">
                <button id="pad-widget-toggle" class="flex-1 py-1 px-2 rounded-lg font-bold text-white text-[11px] shadow transition flex items-center justify-center space-x-1 ${isPlaying ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"}">
                    <span>${isPlaying ? "Pause" : "Play"}</span>
                </button>
                <button id="pad-widget-stop" class="py-1 px-2.5 rounded-lg bg-[var(--bg-primary-variant)] hover:bg-[var(--border-color)] border border-[var(--border-color)] font-bold transition text-[11px]">
                    Stop
                </button>
            </div>
        </div>
    `;

    document.getElementById("pad-widget-close").addEventListener("click", () => {
        stopPad();
        widget.remove();
    });

    document.getElementById("pad-widget-toggle").addEventListener("click", () => {
        togglePadPlayback(currentSong);
    });

    document.getElementById("pad-widget-stop").addEventListener("click", () => {
        stopPad();
    });

    // Seek/Drag interaction on slider - stop propagation so window doesn't drag
    const slider = document.getElementById("pad-progress-slider");
    if (slider) {
        slider.addEventListener("mousedown", (e) => e.stopPropagation());
        slider.addEventListener("touchstart", (e) => e.stopPropagation());

        slider.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            if (currentTrackDuration > 0) {
                currentTrackTime = (val / 100) * currentTrackDuration;
                if (standardAudio && padInfo.type !== "bundled") {
                    standardAudio.currentTime = currentTrackTime;
                }
                updateProgressUI();
            }
        });
    }
}

function updatePadWidgetState(padInfo, playing) {
    const widget = document.getElementById("pad-control-widget");
    if (!widget) return;

    const toggleBtn = document.getElementById("pad-widget-toggle");
    const dotEl = document.getElementById("modal-status-dot");

    if (toggleBtn) {
        toggleBtn.textContent = playing ? "Pause" : "Play";
        toggleBtn.className = `flex-1 py-1 px-2 rounded-lg font-bold text-white text-[11px] shadow transition flex items-center justify-center space-x-1 ${playing ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"}`;
    }
    if (dotEl) {
        dotEl.className = `w-2 h-2 rounded-full ${playing ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`;
    }
}

function updateProgressUI() {
    const slider = document.getElementById("pad-progress-slider");
    const timeCurrent = document.getElementById("pad-time-current");
    const timeTotal = document.getElementById("pad-time-total");
    if (!slider || !timeCurrent || !timeTotal) return;

    const pct = currentTrackDuration > 0 ? (currentTrackTime / currentTrackDuration) * 100 : 0;
    slider.value = pct;

    timeCurrent.textContent = formatTime(currentTrackTime);
    timeTotal.textContent = formatTime(currentTrackDuration);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function makeElementDraggable(elmnt) {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    const handle = document.getElementById("pad-drag-handle") || elmnt;

    handle.onmousedown = dragMouseDown;
    handle.ontouchstart = dragTouchDown;

    function dragMouseDown(e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function dragTouchDown(e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementTouchDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";
        elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
        elmnt.style.bottom = "auto";
        elmnt.style.right = "auto";
    }

    function elementTouchDrag(e) {
        const touch = e.touches[0];
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";
        elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
        elmnt.style.bottom = "auto";
        elmnt.style.right = "auto";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}
