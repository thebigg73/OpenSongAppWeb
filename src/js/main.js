// This file deals with cueing up all of the required scripts

import './css/styles.css';
import { initStorage } from './js/storage.js';
import { initSongM } from './js/song.js';
import { initSet } from './js/song.js';
import { initPad } from './js/pad.js';
import { initAutoscroll } from './js/autoscroll.js';
import { initScaling } from './js/scaling.js';
import { initMetronome } from '.js/metronome.js';

document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    initSetManager();
    initUI();
});
