/* ── main.js ── entry point (v2) ── */

import {
  readHash, loadDraft,
  buildAudience, buildChecklist, buildPresets,
  initGuide, initGlossary, initCopyButton,
  wireCaption, wireCompare,
  render, state
} from './ui.js';

function init(){
  // 1. Restore state: hash takes priority over localStorage
  const hasHash = readHash();
  if(!hasHash) loadDraft();

  // 2. Build all UI components
  buildAudience();
  buildChecklist();
  buildPresets();

  // 3. Wire interactive elements
  wireCaption();
  initGuide();
  initGlossary();
  initCopyButton();
  wireCompare();

  // 4. Initial render
  render();
}

document.addEventListener("DOMContentLoaded", init);
