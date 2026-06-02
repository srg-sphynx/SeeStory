/* ── main.js ── entry point (v3) ── */

import {
  readHash, loadDraft,
  buildAudience, buildChecklist, buildPresets,
  initGuide, initGlossary, initPersonaGuide, initCopyButton,
  wireCaption, initResultPanels,
  initTheme, initHeaderScroll, initReveal, initScorebarJump,
  render, state
} from './ui.js';
import { initMotion } from './motion.js';

function init(){
  // 1. Theme first (avoids any flash beyond the inline bootstrap)
  initTheme();

  // 2. Restore state: hash takes priority over localStorage
  const hasHash = readHash();
  if(!hasHash) loadDraft();

  // 3. Build all UI components
  buildAudience();
  buildChecklist();
  buildPresets();

  // 4. Wire interactive elements
  wireCaption();
  initGuide();
  initGlossary();
  initPersonaGuide();
  initCopyButton();
  initResultPanels();
  initHeaderScroll();
  initScorebarJump();

  // 5. Initial render
  render();

  // 6. Motion: GSAP hero/logo entrance (optional). Result cards toggle
  //    display:none, so keep the IntersectionObserver reveal for scroll.
  initMotion({ revealScroll: false });
  initReveal();
}

document.addEventListener("DOMContentLoaded", init);
