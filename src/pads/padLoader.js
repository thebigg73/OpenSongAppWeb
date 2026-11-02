// src/pads/padLoader.js

// Import each key's MIDI file
import padA from "./a.mid";
import padAsharp from "./asharp.mid";
import padB from "./b.mid";
import padC from "./c.mid";
import padCsharp from "./csharp.mid";
import padD from "./d.mid";
import padDsharp from "./dsharp.mid";
import padE from "./e.mid";
import padF from "./f.mid";
import padFsharp from "./fsharp.mid";
import padG from "./g.mid";
import padGsharp from "./gsharp.mid";
import padAm from "./am.mid";
import padAsharpm from "./asharpm.mid";
import padBm from "./bm.mid";
import padCm from "./cm.mid";
import padCsharpm from "./csharpm.mid";
import padDm from "./dm.mid";
import padDsharpm from "./dsharpm.mid";
import padEm from "./em.mid";
import padFm from "./fm.mid";
import padFsharpm from "./fsharpm.mid";
import padGm from "./gm.mid";
import padGsharpm from "./gsharpm.mid";

const padMap = {
    A: padA,
    "A#": padAsharp,
    Bb: padAsharp,
    B: padB,
    C: padC,
    "C#": padCsharp,
    Db: padCsharp,
    D: padD,
    "D#": padDsharp,
    Eb: padDsharp,
    E: padE,
    F: padF,
    "F#": padFsharp,
    Gb: padFsharp,
    G: padG,
    "G#": padGsharp,
    Ab: padGsharp,
    AM: padAm, // Support both 'Am' and 'AM' if casing varies
    Am: padAm,
    "A#m": padAsharpm,
    Bbm: padAsharpm,
    BM: padBm,
    Bm: padBm,
    CM: padCm,
    Cm: padCm,
    "C#m": padCsharpm,
    Dbm: padCsharpm,
    DM: padDm,
    Dm: padDm,
    "D#m": padDsharpm,
    Ebm: padDsharpm,
    EM: padEm,
    Em: padEm,
    FM: padFm,
    Fm: padFm,
    "F#m": padFsharpm,
    Gbm: padFsharpm,
    GM: padGm,
    Gm: padGm,
    "G#m": padGsharpm,
    Abm: padGsharpm
};

export function getPadDataUri(key) {
    if (!key) return padMap["C"];

    // Clean up key string: trim whitespace, keep sharp/flat and 'm' for minor
    const cleanKey = key.trim();

    // Direct lookup first (e.g. "Am", "Bb", "F#")
    if (padMap[cleanKey]) {
        return padMap[cleanKey];
    }

    // Fallback normalization if needed
    return padMap["C"];
}
