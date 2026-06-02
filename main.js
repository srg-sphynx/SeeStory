/* ── main.js ── entry point (v3) ── */

import {
  readHash, loadDraft,
  buildAudience, buildChecklist, buildPresets,
  initGuide, initGlossary, initPersonaGuide, initCopyButton,
  wireCaption, initResultPanels,
  initTheme, initHeaderScroll, initReveal, initScorebarJump,
  render, state,
  initMobileWizard, initSplash
} from './ui.js';
import { initMotion } from './motion.js';

function init(){
  // 1. Theme first (avoids any flash beyond the inline bootstrap)
  initTheme();

  // 2. Splash screen (blocks interaction until dismissed, sessionStorage-gated)
  initSplash();

  // 3. Restore state: hash takes priority over localStorage
  const hasHash = readHash();
  if(!hasHash) loadDraft();

  // 4. Build all UI components
  buildAudience();
  buildChecklist();
  buildPresets();

  // 5. Wire interactive elements
  wireCaption();
  initGuide();
  initGlossary();
  initPersonaGuide();
  initCopyButton();
  initResultPanels();
  initHeaderScroll();
  initScorebarJump();

  // 6. Initial render
  render();

  // 7. Motion: GSAP hero/logo entrance (optional). Result cards toggle
  //    display:none, so keep the IntersectionObserver reveal for scroll.
  initMotion({ revealScroll: false });
  initReveal();

  // 8. Mobile wizard (step-by-step mode for ≤600px)
  initMobileWizard();
}

document.addEventListener("DOMContentLoaded", init);
