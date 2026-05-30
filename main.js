/* ── main.js ── entry point, init, event wiring (ES module) ── */

import { state } from './scoring.js';
import {
  readHash, loadDraft,
  buildAudience, buildAnchors, buildFragments, buildPresets,
  initGuide, initCopyButton, wireCaption, wireCompareToggle,
  syncAll
} from './ui.js';

function init(){
  // 1. Restore state: hash takes priority over localStorage draft
  const hasHash = readHash();
  if(!hasHash) loadDraft();

  // 2. Build all UI components
  buildAudience();
  buildAnchors();
  buildFragments();
  buildPresets();

  // 3. Wire interactive elements
  wireCaption();
  initGuide();
  initCopyButton();
  wireCompareToggle();

  // 4. Initial render
  syncAll();
}

document.addEventListener("DOMContentLoaded", init);
