/* ── ui.js ── DOM rendering, state, events (v2, responsive) ── */

import {
  AUDIENCES, CHECKLIST, COPY, SIGNALS, SIGNAL_LABEL, SIGNAL_MSG,
  PRESETS, GLOSSARY, FIT_FIX, PERSONAS
} from './data.js';
import { scoreDraft, getBand, getSignalBand, splitSentences } from './scoring.js';
import { recommendAudience } from './recommend.js';
import { iconSVG } from './icons.js';

/* ── Shared app state ── */
export const state = {
  audienceKey: null,    // null means "not explicitly picked" → defaults to peer
  caption: "",
  checklist: {}         // { video: true, source: true, ... }
};

/* ── Utilities ── */

function $(id){ return document.getElementById(id); }

function debounce(fn, ms){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Detect prefers-reduced-motion. */
const reducedMotion = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : { matches: true };

/* ── Score animation ── */
let _prevScore = null;
let _activePresetIdx = null;

function animateNumber(el, from, to, color){
  if(reducedMotion.matches || from === to){
    el.textContent = to;
    el.style.color = color;
    return;
  }
  const duration = 250;
  const start = performance.now();
  const diff = to - from;
  function step(now){
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - t) * (1 - t);  // ease-out quad
    el.textContent = Math.round(from + diff * eased);
    el.style.color = color;
    if(t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/** Floating +N / -N that drifts up and fades, mirroring the Easy-mode dial. */
function fireScoreDelta(el, diff){
  if(!el || reducedMotion.matches || !diff) return;
  el.textContent = (diff > 0 ? "+" : "") + diff;
  el.classList.remove("up", "down", "fire");
  void el.offsetWidth;                 // restart the animation
  el.classList.add(diff > 0 ? "up" : "down");
  el.classList.add("fire");
  setTimeout(() => el.classList.remove("fire"), 850);
}

/** Brief scale pop on a score element when it changes. */
function popScore(el){
  if(!el || reducedMotion.matches) return;
  el.classList.remove("score-pop");
  void el.offsetWidth;
  el.classList.add("score-pop");
}

/* ── How-it-works modal ── */
export function initGuide(){
  const btn = $("guideToggle");
  const modal = $("guideModal");
  const closeBtn = $("guideModalClose");
  if(!btn || !modal) return;

  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("open"));
    document.body.style.overflow = "hidden";
    btn.setAttribute("aria-expanded", "true");
    if(closeBtn) closeBtn.focus();
  };

  const close = () => {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    btn.setAttribute("aria-expanded", "false");
    const finish = (e) => {
      if(e && e.target !== modal) return;
      modal.hidden = true;
      modal.removeEventListener("transitionend", finish);
    };
    if(reducedMotion.matches) modal.hidden = true;
    else modal.addEventListener("transitionend", finish);
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  };

  btn.addEventListener("click", open);
  if(closeBtn) closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if(e.target === modal) close(); });
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && !modal.hidden) close();
  });
}

/* ── Glossary toggle ── */
export function initGlossary(){
  const btn = $("glossaryToggle");
  const body = $("glossaryBody");
  if(!btn || !body) return;
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", !expanded);
    body.classList.toggle("open", !expanded);
  });
}

/* ── Persona Guide toggle ── */
export function initPersonaGuide(){
  const btn = $("personaToggle");
  const body = $("personaBody");
  const list = $("personaList");
  if(!btn || !body || !list) return;
  
  list.innerHTML = "";
  PERSONAS.forEach(p => {
    // The persona key maps onto an AUDIENCES entry, so this card doubles as a
    // second place to pick the audience.
    const selectable = !!AUDIENCES[p.key];
    const el = document.createElement("div");
    el.className = "persona-item" + (selectable ? " persona-selectable" : "");
    if(selectable) el.dataset.key = p.key;

    const header = document.createElement("div");
    header.className = "persona-header";
    const icon = document.createElement("span");
    icon.className = "persona-icon";
    icon.innerHTML = iconSVG(p.icon, { size: 22 });
    const nameAge = document.createElement("span");
    nameAge.className = "persona-name";
    nameAge.textContent = p.name + (p.age ? " (" + p.age + ")" : "");
    header.appendChild(icon);
    header.appendChild(nameAge);
    if(selectable){
      const pill = document.createElement("span");
      pill.className = "persona-selected-pill";
      pill.innerHTML = iconSVG("check", { size: 13 }) + " Selected";
      header.appendChild(pill);
    }
    el.appendChild(header);

    const bio = document.createElement("p");
    bio.className = "persona-bio";
    bio.textContent = p.bio;
    el.appendChild(bio);

    if(p.wants && p.wants.length){
      const wantsHead = document.createElement("div");
      wantsHead.className = "persona-sub green";
      wantsHead.innerHTML = iconSVG("checkCircle", { size: 15 }) + " What they respond to";
      el.appendChild(wantsHead);
      const wantsList = document.createElement("ul");
      wantsList.className = "persona-ul";
      p.wants.forEach(w => {
        const li = document.createElement("li");
        li.textContent = w;
        wantsList.appendChild(li);
      });
      el.appendChild(wantsList);
    }

    if(p.repels && p.repels.length){
      const repelsHead = document.createElement("div");
      repelsHead.className = "persona-sub red";
      repelsHead.innerHTML = iconSVG("alert", { size: 15 }) + " What turns them off";
      el.appendChild(repelsHead);
      const repelsList = document.createElement("ul");
      repelsList.className = "persona-ul";
      p.repels.forEach(r => {
        const li = document.createElement("li");
        li.textContent = r;
        repelsList.appendChild(li);
      });
      el.appendChild(repelsList);
    }

    if(selectable){
      const pick = document.createElement("button");
      pick.type = "button";
      pick.className = "persona-pick";
      pick.dataset.key = p.key;
      pick.addEventListener("click", () => selectPersonaAudience(p.key));
      el.appendChild(pick);
    }

    list.appendChild(el);
  });
  refreshPersonaSelection();

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", !expanded);
    body.classList.toggle("open", !expanded);
  });
}

/* ── Build audience picker (Grid) ── */
export function buildAudience(){
  const grid = $("audience");
  if(!grid) return;

  grid.innerHTML = "";
  Object.entries(AUDIENCES).forEach(([key, a]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "aud-card";
    btn.setAttribute("aria-pressed", String(key === state.audienceKey));
    btn.dataset.key = key;

    const label = document.createElement("span");
    label.className = "aud-label";
    label.textContent = a.label;

    const blurb = document.createElement("span");
    blurb.className = "aud-blurb";
    blurb.textContent = a.blurb;

    btn.appendChild(label);
    btn.appendChild(blurb);
    
    btn.addEventListener("click", () => {
      state.audienceKey = key;
      refreshAudienceButtons();
      render();
    });
    grid.appendChild(btn);
  });

  refreshAudienceButtons();
}

function refreshAudienceButtons(){
  const btns = document.querySelectorAll("#audience .aud-card");
  btns.forEach(b => {
    const selected = b.dataset.key === state.audienceKey;
    b.setAttribute("aria-pressed", String(selected));
    b.classList.toggle("active", selected);
  });
  refreshPersonaSelection();
}

/** Sync the "Selected" state across the persona research cards + pick buttons. */
function refreshPersonaSelection(){
  document.querySelectorAll("#personaList .persona-selectable").forEach(item => {
    const selected = item.dataset.key === state.audienceKey;
    item.classList.toggle("selected", selected);
    const pick = item.querySelector(".persona-pick");
    if(pick){
      pick.textContent = selected ? "Selected as your audience" : "Pick this audience";
      pick.classList.toggle("is-selected", selected);
      pick.setAttribute("aria-pressed", String(selected));
    }
  });
}

/** Pick an audience from the persona research panel (second selection point). */
function selectPersonaAudience(key){
  if(!AUDIENCES[key]) return;
  state.audienceKey = key;
  refreshAudienceButtons();
  render();
  // Mirror the picked audience up in the main grid so the choice is unmistakable.
  const card = document.querySelector(`#audience .aud-card[data-key="${key}"]`);
  if(card && !reducedMotion.matches){
    card.classList.remove("aud-flash");
    void card.offsetWidth;
    card.classList.add("aud-flash");
  }
}

/* ── Build checklist ── */
export function buildChecklist(){
  const el = $("checklist");
  if(!el) return;
  el.innerHTML = "";
  CHECKLIST.forEach(item => {
    // Wrapper div holds label + edu content as siblings
    const wrapper = document.createElement("div");
    wrapper.className = "check-card-wrap";

    const label = document.createElement("label");
    label.className = "check-card";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "toggle-input";
    cb.checked = !!state.checklist[item.id];

    const toggleSwitch = document.createElement("span");
    toggleSwitch.className = "toggle-switch";

    const txt = document.createElement("span");
    txt.className = "check-text";

    const main = document.createElement("span");
    main.className = "check-label";
    main.textContent = item.label;

    const help = document.createElement("span");
    help.className = "check-help";
    help.textContent = item.help;

    txt.appendChild(main);
    txt.appendChild(help);
    
    label.appendChild(cb);
    label.appendChild(toggleSwitch);
    label.appendChild(txt);
    wrapper.appendChild(label);

    // Education toggle - OUTSIDE the label to prevent checkbox interference
    const eduBtn = document.createElement("button");
    eduBtn.type = "button";
    eduBtn.className = "check-edu-btn";
    eduBtn.textContent = "What could BioSolveIT do with this? ▾";
    eduBtn.setAttribute("aria-expanded", "false");
    
    const eduContent = document.createElement("div");
    eduContent.className = "check-edu-content";
    
    const whatBlock = document.createElement("div");
    whatBlock.className = "edu-block";
    const whatLabel = document.createElement("span");
    whatLabel.className = "edu-label";
    whatLabel.textContent = "What this looks like for BioSolveIT";
    const whatBody = document.createElement("p");
    whatBody.className = "edu-body";
    whatBody.textContent = item.what;
    whatBlock.appendChild(whatLabel);
    whatBlock.appendChild(whatBody);
    
    const whyBlock = document.createElement("div");
    whyBlock.className = "edu-block";
    const whyLabel = document.createElement("span");
    whyLabel.className = "edu-label why";
    whyLabel.textContent = "Why it matters for the next 25 years";
    const whyBody = document.createElement("p");
    whyBody.className = "edu-body";
    whyBody.textContent = item.why;
    whyBlock.appendChild(whyLabel);
    whyBlock.appendChild(whyBody);
    
    eduContent.appendChild(whatBlock);
    eduContent.appendChild(whyBlock);
    
    // Glow entices the user to expand once they've toggled this format on,
    // but never while the panel is already open.
    const updateGlow = () => {
      const expanded = eduBtn.getAttribute("aria-expanded") === "true";
      eduBtn.classList.toggle("glow", cb.checked && !expanded);
    };

    cb.onchange = () => {
      state.checklist[item.id] = cb.checked;
      updateGlow();
      render();
    };

    eduBtn.addEventListener("click", () => {
      const expanded = eduBtn.getAttribute("aria-expanded") === "true";
      eduBtn.setAttribute("aria-expanded", String(!expanded));
      eduBtn.textContent = !expanded ? "Hide details ▴" : "What could BioSolveIT do with this? ▾";
      eduContent.classList.toggle("open", !expanded);
      updateGlow();
    });

    wrapper.appendChild(eduBtn);
    wrapper.appendChild(eduContent);
    el.appendChild(wrapper);
    updateGlow();
  });
}

/* ── Build presets ── */
export function buildPresets(){
  const host = $("presetGrid");
  if(!host) return;
  host.innerHTML = "";
  PRESETS.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-btn";
    btn.dataset.presetIdx = i;
    btn.setAttribute("aria-pressed", "false");

    const title = document.createElement("div");
    title.className = "p-title";
    title.textContent = p.title;

    const desc = document.createElement("div");
    desc.className = "p-desc";
    desc.textContent = p.desc;

    const preview = document.createElement("div");
    preview.className = "p-preview";
    preview.textContent = p.caption;

    btn.appendChild(title);
    btn.appendChild(desc);
    btn.appendChild(preview);
    btn.addEventListener("click", () => loadPreset(p, i));
    host.appendChild(btn);
  });
  refreshPresetButtons();

  // The slim "Example loaded" bar re-opens the gallery to switch examples.
  const bar = $("presetCollapsedBar");
  if(bar && !bar._wired){
    bar._wired = true;
    bar.addEventListener("click", expandPresets);
  }
}

/** Collapse the example gallery into its slim summary bar (desktop). */
function collapsePresets(){
  const sec = $("presetSection");
  if(!sec) return;
  const titleEl = $("presetActiveTitle");
  const p = (_activePresetIdx != null) ? PRESETS[_activePresetIdx] : null;
  if(titleEl) titleEl.textContent = p ? p.title : "Custom draft";
  sec.dataset.collapsed = "true";
  const bar = $("presetCollapsedBar");
  if(bar) bar.setAttribute("aria-expanded", "false");
}

/** Re-open the example gallery. */
function expandPresets(){
  const sec = $("presetSection");
  if(!sec) return;
  sec.dataset.collapsed = "false";
  const bar = $("presetCollapsedBar");
  if(bar) bar.setAttribute("aria-expanded", "true");
}

function refreshPresetButtons(){
  document.querySelectorAll("#presetGrid .preset-btn").forEach(btn => {
    const selected = Number(btn.dataset.presetIdx) === _activePresetIdx;
    btn.classList.toggle("active", selected);
    btn.setAttribute("aria-pressed", String(selected));
  });
}

function loadPreset(p, idx){
  _activePresetIdx = idx ?? null;
  state.audienceKey = AUDIENCES[p.audience] ? p.audience : null;
  state.caption = p.caption || "";
  state.checklist = { ...(p.checklist || {}) };

  const capEl = $("caption");
  if(capEl) capEl.value = state.caption;

  refreshAudienceButtons();
  refreshChecklistBoxes();
  refreshPresetButtons();
  render();

  // On mobile the wizard hides this step entirely; on desktop, collapse the
  // gallery into its slim bar so the work area gets the room.
  if(wizardActive) wizardAdvanceFromPreset();
  else collapsePresets();
}

function refreshChecklistBoxes(){
  const items = document.querySelectorAll("#checklist input[type=checkbox]");
  const ids = CHECKLIST.map(c => c.id);
  items.forEach((cb, i) => {
    if(ids[i]) cb.checked = !!state.checklist[ids[i]];
  });
  // Re-sync the "expand me" glow on each edu button after a bulk change.
  document.querySelectorAll("#checklist .check-card-wrap").forEach(wrap => {
    const cb = wrap.querySelector("input[type=checkbox]");
    const eduBtn = wrap.querySelector(".check-edu-btn");
    if(!cb || !eduBtn) return;
    const expanded = eduBtn.getAttribute("aria-expanded") === "true";
    eduBtn.classList.toggle("glow", cb.checked && !expanded);
  });
}

/* ── Wire caption with debounce ── */
export function wireCaption(){
  const capEl = $("caption");
  if(!capEl) return;
  const debouncedRender = debounce(() => render(), 150);
  capEl.addEventListener("input", e => {
    state.caption = e.target.value;
    debouncedRender();
  });
  capEl.value = state.caption;
}

/* ── Collapsible result panels (accordion) ── */

/** Set a .collapsible section open/closed and sync ARIA. */
function setCollapsed(sectionEl, collapsed){
  if(!sectionEl) return;
  sectionEl.dataset.collapsed = String(collapsed);
  const head = sectionEl.querySelector(".collap-head");
  if(head) head.setAttribute("aria-expanded", String(!collapsed));
}

function isCollapsed(sectionEl){
  return !sectionEl || sectionEl.dataset.collapsed === "true";
}

export function initResultPanels(){
  const detected = $("detectedArea");
  const compare  = $("compareArea");
  const detHead  = $("detectedHead");
  const cmpHead  = $("compareHead");

  if(detHead && detected){
    detHead.addEventListener("click", () => {
      const open = !isCollapsed(detected);
      setCollapsed(detected, open);          // toggle
      if(!open) setCollapsed(compare, true); // opening detected collapses compare
    });
  }

  if(cmpHead && compare){
    cmpHead.addEventListener("click", () => {
      const open = !isCollapsed(compare);
      setCollapsed(compare, open);            // toggle
      if(!open){
        setCollapsed(detected, true);         // opening compare collapses detected
        paintCompare();
      }
    });
  }
}

/* ── Compare mode ── */

function computeCompare(){
  const results = {};
  let bestKey = null, bestScore = -1;
  Object.keys(AUDIENCES).forEach(key => {
    const r = scoreDraft({ audienceKey: key, caption: state.caption, checklist: state.checklist });
    results[key] = r;
    if(!r.empty && r.score > bestScore){ bestScore = r.score; bestKey = key; }
  });
  return { results, bestKey, bestScore };
}

function updateCompareSummary(){
  const sumEl = $("compareSummary");
  if(!sumEl) return;
  const { bestKey, bestScore } = computeCompare();
  if(bestKey == null){
    sumEl.textContent = "See how every audience scores your draft";
    return;
  }
  sumEl.innerHTML = "";
  const chip = document.createElement("span");
  chip.className = "sum-chip lead";
  chip.innerHTML = iconSVG("award", { size: 13 }) + ` Best fit: ${AUDIENCES[bestKey].label} (${bestScore})`;
  sumEl.appendChild(chip);
}

function paintCompare(){
  const grid = $("compareGrid");
  if(!grid) return;
  grid.innerHTML = "";

  const { results, bestKey } = computeCompare();

  Object.entries(AUDIENCES).forEach(([key, aud]) => {
    const r = results[key];
    const cell = document.createElement("div");
    cell.className = "compare-cell" + (key === bestKey ? " best" : "");

    const lbl = document.createElement("div");
    lbl.className = "c-label";
    lbl.textContent = aud.label;

    const sc = document.createElement("div");
    sc.className = "c-score";
    if(r.empty){
      sc.textContent = "--";
      sc.style.color = "var(--muted)";
    } else {
      sc.textContent = r.score;
      sc.style.color = r.band.color;
    }

    const bd = document.createElement("div");
    bd.className = "c-band muted";
    bd.textContent = r.empty ? "" : r.band.label;

    cell.appendChild(lbl);
    cell.appendChild(sc);
    cell.appendChild(bd);
    grid.appendChild(cell);
  });
}

/* ── Copy result ── */
export function initCopyButton(){
  const btn = $("copyBtn");
  if(!btn) return;
  const textEl = btn.querySelector(".copy-btn-text") || btn;
  btn.addEventListener("click", () => {
    const audKey = state.audienceKey || "peer";
    const r = scoreDraft({ audienceKey: audKey, caption: state.caption, checklist: state.checklist });
    if(r.empty) return;

    const text = [
      `Caption: ${state.caption || "(none)"}`,
      `Audience: ${AUDIENCES[audKey]?.label || audKey}`,
      `Resonance Score: ${r.score}/100 -- ${r.band.label}`,
      `Top fix: ${r.topFix}`
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add("copied");
      textEl.textContent = "Copied!";
      setTimeout(() => {
        btn.classList.remove("copied");
        textEl.textContent = "Copy result";
      }, 1500);
    }).catch(() => {
      textEl.textContent = "Copy failed";
      setTimeout(() => { textEl.textContent = "Copy result"; }, 1500);
    });
  });
}

/* ── Draft metadata (word/char/sentence count) ── */
function updateDraftMeta(){
  const text = state.caption || "";
  const words = (text.match(/\S+/g) || []);
  const chars = text.length;
  const sents = text.trim() ? splitSentences(text).length : 0;

  const wordEl = $("wordCount");
  const charEl = $("charCount");
  const sentEl = $("sentCount");

  if(wordEl) wordEl.textContent = words.length + (words.length === 1 ? " word" : " words");
  if(charEl){
    charEl.textContent = chars.toLocaleString() + " / 3,000 chars";
    charEl.classList.toggle("over-limit", chars > 3000);
  }
  if(sentEl) sentEl.textContent = sents + (sents === 1 ? " sentence" : " sentences");
}

/* ── Contextual explanations for detected elements ── */
function getContextualTip(id, isFoundOrWarn, audienceKey) {
  const isAcademic = ["pi", "pharma", "peer"].includes(audienceKey || "peer");
  const ctx = isAcademic ? "academic" : "casual";
  
  const mapping = {
    number: {
      academic: "Analytical audiences scan for numbers first to verify your claims and check scientific credibility.",
      casual: "Helps anchor facts, but keep it brief so they do not lose interest.",
      positive: true
    },
    cta: {
      academic: "Guides busy professionals on the exact next step (e.g., read the paper, test the code).",
      casual: "Encourages active interaction like tagging, replying, or clicking to build community.",
      positive: true
    },
    result: {
      academic: "Verifiable outcome terms ('improved', 'reduced', 'outperformed') prove your claim has real substance.",
      casual: "Helps get the point across quickly in plain language.",
      positive: true
    },
    hype: {
      academic: "Superlatives ('revolutionary', 'world-class') trigger deep skepticism and damage scientific trust.",
      casual: "Corporate jargon and hard-sell hype feel fake and out of touch to media-savvy digital natives.",
      positive: false
    },
    hedge: {
      academic: "Vague terms ('we believe', 'perhaps') dilute authority and make findings sound speculative.",
      casual: "Weakens your voice. Speak with clear, conversational confidence instead.",
      positive: false
    },
    exclamation: {
      academic: "Over-excitement is a massive turn-off. It reads as marketing hype rather than objective peer science.",
      casual: "Too many exclamation marks feel forced or spammy. Keep it clean and natural.",
      positive: false
    },
    emdash: {
      academic: "Can disrupt the flow for speed-readers. Consider commas or splitting into shorter sentences.",
      casual: "Fragmented structure hurts readability. Snappy, linear text works best.",
      positive: false
    },
    shout: {
      academic: "Highly unprofessional. Shouty text has no place in peer reviews or research updates.",
      casual: "Feels aggressive and jarring. Use bold text or standard casing for emphasis.",
      positive: false
    }
  };

  const item = mapping[id];
  if (!item) return { status: null, text: "" };

  if (item.positive) {
    if (isFoundOrWarn) {
      return { status: "good", text: `**Include:** Good job including this! ${item[ctx]}` };
    } else {
      return { status: "suggest", text: `**Include:** Recommended here. ${item[ctx]}` };
    }
  } else {
    if (isFoundOrWarn) {
      return { status: "warn", text: `**Avoid:** Try to remove this. ${item[ctx]}` };
    } else {
      return { status: "good", text: `**Avoid:** Nice! Keeping this out helps. ${item[ctx]}` };
    }
  }
}

// status → { icon name, css modifier }
const TIP_STATUS = {
  good:    { icon: "checkCircle",    cls: "tip-good" },
  suggest: { icon: "lightbulb",      cls: "tip-suggest" },
  warn:    { icon: "alertTriangle",  cls: "tip-warn" }
};

/* ── Detection summary (collapsed-state teaser) ── */
function updateDetectedSummary(r){
  const sumEl = $("detectedSummary");
  if(!sumEl) return;
  sumEl.innerHTML = "";
  if(!r || r.empty) return;

  const f = r.facts;
  const positives = [];
  if(f.hasNumber)     positives.push("hash");
  if(f.hasCTA)        positives.push("click");
  if(f.hasResultCue)  positives.push("barchart");

  let issues = 0;
  if(f.hypeFound.length) issues++;
  if(f.hedgeHits > 0) issues++;
  if(f.exclamations >= 2) issues++;
  if(f.hasEmDash) issues++;
  if(f.shouting) issues++;

  if(positives.length){
    const chip = document.createElement("span");
    chip.className = "sum-chip ok";
    chip.innerHTML = positives.map(n => iconSVG(n, { size: 13 })).join("") + " present";
    sumEl.appendChild(chip);
  }
  const issueChip = document.createElement("span");
  if(issues > 0){
    issueChip.className = "sum-chip warn";
    issueChip.innerHTML = iconSVG("alertTriangle", { size: 13 }) + ` ${issues} issue${issues === 1 ? "" : "s"} to fix`;
  } else {
    issueChip.className = "sum-chip ok";
    issueChip.innerHTML = iconSVG("check", { size: 13 }) + " Clean tone";
  }
  sumEl.appendChild(issueChip);
}

/* ── Detection panel ──────────────────────────────────────────
   Eight raw signals, but stacking eight rows + paragraphs reads as
   a wall. Instead we sort them into two human buckets — what's
   "Working for you" and what's "Worth a look" — render each as a
   compact tappable chip, and surface the full why-it-matters tip
   for one chip at a time in a shared detail strip below. */
let _detActiveId = null;

function paintDetected(r){
  const area = $("detectedArea");
  const list = $("detectedList");
  if(!area || !list) return;

  if(!r || r.empty){
    area.style.display = "none";
    return;
  }
  area.style.display = "block";
  updateDetectedSummary(r);
  list.innerHTML = "";

  const f = r.facts;
  const audienceKey = state.audienceKey || "peer";

  const items = [
    { id: "number", icon: "hash", label: "Numbers", found: f.hasNumber, val: f.hasNumber ? "Detected" : "None found" },
    { id: "cta", icon: "click", label: "Call to action", found: f.hasCTA, val: f.hasCTA ? "Detected" : "None found" },
    { id: "result", icon: "barchart", label: "Result / comparison", found: f.hasResultCue, val: f.hasResultCue ? "Detected" : "None found" },
    { id: "hype", icon: "megaphone", label: "Hype words", found: false, warn: f.hypeFound.length > 0, val: f.hypeFound.length > 0 ? f.hypeFound.join(", ") : "Clean" },
    { id: "hedge", icon: "help", label: "Hedge phrases", found: false, warn: f.hedgeHits > 0, val: f.hedgeHits > 0 ? (f.hedgeHits + " found") : "Clean" },
    { id: "exclamation", icon: "alert", label: "Exclamation marks", found: false, warn: f.exclamations >= 2, val: f.exclamations >= 2 ? (f.exclamations + " found") : "Clean" },
    { id: "emdash", icon: "minus", label: "Em / en dashes", found: false, warn: f.hasEmDash, val: f.hasEmDash ? "Found" : "None" },
    { id: "shout", icon: "type", label: "ALL CAPS shouting", found: false, warn: f.shouting, val: f.shouting ? "Detected" : "None" },
  ];

  // Enrich each with its contextual verdict (good / suggest / warn).
  const enriched = items.map(item => {
    const active = item.found || item.warn;
    const tip = getContextualTip(item.id, active, audienceKey);
    return { ...item, tip, status: tip.status };
  });

  const strengths = enriched.filter(it => it.status === "good");
  const improve   = enriched.filter(it => it.status !== "good");

  // Shared detail strip — only one signal's "why" is shown at a time.
  const detail = document.createElement("div");
  detail.className = "det-detail";

  const renderDetail = (it) => {
    detail.innerHTML = "";
    const st = TIP_STATUS[it.status];
    const ic = document.createElement("span");
    ic.className = "det-detail-ic " + (st ? st.cls : "");
    if(st) ic.innerHTML = iconSVG(st.icon, { size: 18 });
    detail.appendChild(ic);

    const body = document.createElement("div");
    body.className = "det-detail-body";

    const titleRow = document.createElement("div");
    titleRow.className = "det-detail-title";
    const name = document.createElement("span");
    name.textContent = it.label;
    titleRow.appendChild(name);
    if(it.val){
      const val = document.createElement("span");
      val.className = "det-detail-val";
      val.textContent = it.val;
      titleRow.appendChild(val);
    }
    body.appendChild(titleRow);

    const text = document.createElement("p");
    text.className = "det-detail-text";
    const parts = it.tip.text.split("**");
    if(parts.length >= 3){
      const strongEl = document.createElement("strong");
      strongEl.textContent = parts[1];
      text.appendChild(strongEl);
      text.appendChild(document.createTextNode(parts[2]));
    } else {
      text.textContent = it.tip.text;
    }
    body.appendChild(text);
    detail.appendChild(body);
  };

  const selectChip = (it, chipEl) => {
    _detActiveId = it.id;
    list.querySelectorAll(".det-chip").forEach(c => c.classList.remove("active"));
    chipEl.classList.add("active");
    renderDetail(it);
  };

  const toneClass = (status) => status === "good" ? "good" : (status === "warn" ? "warn" : "suggest");

  const makeChip = (it) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "det-chip " + toneClass(it.status);
    const ic = document.createElement("span");
    ic.className = "dc-ico";
    ic.innerHTML = iconSVG(it.icon, { size: 15 });
    const lab = document.createElement("span");
    lab.className = "dc-label";
    lab.textContent = it.label;
    chip.appendChild(ic);
    chip.appendChild(lab);
    chip.addEventListener("click", () => selectChip(it, chip));
    return chip;
  };

  const makeGroup = (tone, iconName, heading, members) => {
    if(!members.length) return null;
    const group = document.createElement("div");
    group.className = "det-group";
    group.dataset.tone = tone;

    const head = document.createElement("div");
    head.className = "det-group-head";
    const hIco = document.createElement("span");
    hIco.className = "dg-ico";
    hIco.innerHTML = iconSVG(iconName, { size: 15 });
    head.appendChild(hIco);
    head.appendChild(document.createTextNode(heading));
    const count = document.createElement("span");
    count.className = "dg-count";
    count.textContent = members.length;
    head.appendChild(count);
    group.appendChild(head);

    const chips = document.createElement("div");
    chips.className = "det-chips";
    members.forEach(it => chips.appendChild(makeChip(it)));
    group.appendChild(chips);
    return group;
  };

  const groups = document.createElement("div");
  groups.className = "det-groups";
  const gImprove = makeGroup("improve", "target", "Worth a look", improve);
  const gStrength = makeGroup("good", "checkCircle", "Working for you", strengths);
  // Lead with the actionable bucket; strengths reassure underneath.
  if(gImprove) groups.appendChild(gImprove);
  if(gStrength) groups.appendChild(gStrength);
  list.appendChild(groups);
  list.appendChild(detail);

  // Pre-open the most useful signal: first thing worth fixing, else a strength.
  const ordered = [...improve, ...strengths];
  const initial = ordered.find(it => it.id === _detActiveId) || ordered[0];
  if(initial){
    const idx = ordered.indexOf(initial);
    const chipEls = list.querySelectorAll(".det-chip");
    if(chipEls[idx]) selectChip(initial, chipEls[idx]);
  }
}

/* ── Score ring (desktop) ── */
function paintScoreRing(r){
  const ringCircle = $("scoreRing");
  const ringNum = $("scoreRingNum");
  if(!ringCircle || !ringNum) return;

  const circumference = 2 * Math.PI * 52; // r=52

  if(!r || r.empty){
    ringCircle.style.strokeDashoffset = circumference;
    ringCircle.style.stroke = "var(--ring-track)";
    ringNum.textContent = "--";
    ringNum.style.color = "var(--muted)";
    return;
  }

  const offset = circumference - (r.score / 100) * circumference;
  ringCircle.style.strokeDashoffset = offset;
  ringCircle.style.stroke = r.band.color;
  
  if(_prevScore !== null && _prevScore !== r.score){
    animateNumber(ringNum, _prevScore, r.score, r.band.color);
    fireScoreDelta($("ringDelta"), r.score - _prevScore);
    popScore(ringNum);
  } else {
    ringNum.textContent = r.score;
    ringNum.style.color = r.band.color;
  }
}

/* ── Natural-fit recommendation (dictionary-driven, additive) ── */
const RECO_CONF_LABEL = { low: "tentative read", medium: "fairly confident", high: "strong signal" };

function paintRecommendation(){
  const card = $("recoCard");
  if(!card) return;

  const reco = recommendAudience({ caption: state.caption, checklist: state.checklist });
  if(!reco){ card.hidden = true; return; }
  card.hidden = false;

  const currentKey = state.audienceKey || "peer";
  const matches = reco.bestKey === currentKey;

  const audEl    = $("recoAud");
  const reasonEl = $("recoReason");
  const confEl   = $("recoConf");
  const meterEl  = $("recoMeter");
  const switchBtn = $("recoSwitch");
  const switchTxt = $("recoSwitchText");
  const matchEl  = $("recoMatch");

  if(audEl)    audEl.textContent = AUDIENCES[reco.bestKey] ? AUDIENCES[reco.bestKey].label : reco.bestKey;
  if(reasonEl) reasonEl.textContent = "Because " + reco.reason;
  if(confEl)   confEl.textContent = RECO_CONF_LABEL[reco.confidence] || "";

  // Affinity meter: one bar per audience, the winner highlighted.
  if(meterEl){
    meterEl.innerHTML = "";
    reco.ranked.forEach(r => {
      const row = document.createElement("div");
      row.className = "reco-bar-row" + (r.key === reco.bestKey ? " win" : "");
      const lbl = document.createElement("span");
      lbl.className = "reco-bar-label";
      lbl.textContent = r.label;
      const track = document.createElement("span");
      track.className = "reco-bar-track";
      const fill = document.createElement("span");
      fill.className = "reco-bar-fill";
      fill.style.width = Math.round(r.score) + "%";
      track.appendChild(fill);
      const val = document.createElement("span");
      val.className = "reco-bar-val";
      val.textContent = Math.round(r.score);
      row.appendChild(lbl); row.appendChild(track); row.appendChild(val);
      meterEl.appendChild(row);
    });
  }

  // Either confirm the match or offer a one-tap switch. When the writing
  // already matches the chosen audience, the card stays useful by offering the
  // runner-up as a one-tap alternative — so changing your mind always has
  // somewhere to go, instead of dead-ending on a single answer.
  if(switchBtn && matchEl){
    const alt = reco.runnerUp;
    if(matches){
      matchEl.hidden = false;
      if(alt && alt.score >= 45 && AUDIENCES[alt.key]){
        switchBtn.hidden = false;
        switchBtn.classList.add("reco-switch--alt");
        switchBtn.dataset.key = alt.key;
        if(switchTxt) switchTxt.textContent = `Also strong: ${alt.label} — tune for them`;
      } else {
        switchBtn.hidden = true;
        switchBtn.classList.remove("reco-switch--alt");
      }
    } else {
      matchEl.hidden = true;
      switchBtn.hidden = false;
      switchBtn.classList.remove("reco-switch--alt");
      switchBtn.dataset.key = reco.bestKey;
      if(switchTxt) switchTxt.textContent = `Switch to ${AUDIENCES[reco.bestKey].label}`;
    }
  }
}

export function initRecoSwitch(){
  const btn = $("recoSwitch");
  if(!btn) return;
  btn.addEventListener("click", () => {
    const key = btn.dataset.key;
    if(!key || !AUDIENCES[key]) return;
    state.audienceKey = key;
    refreshAudienceButtons();
    render();
    const card = document.querySelector(`#audience .aud-card[data-key="${key}"]`);
    if(card){
      if(!reducedMotion.matches){
        card.classList.remove("aud-flash");
        void card.offsetWidth;
        card.classList.add("aud-flash");
      }
      card.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
    }
  });
}

/* ── Main render ── */
export function render(){
  const audKey = state.audienceKey || "peer";
  const r = scoreDraft({
    audienceKey: audKey,
    caption: state.caption,
    checklist: state.checklist
  });

  const resultArea = $("resultArea");
  const emptyNote  = $("emptyNote");
  const scoreHeadline = $("scoreHeadline");
  const scoreSubhead  = $("scoreSubhead");
  const topFixEl      = $("topFix");
  const breakdownEl   = $("breakdown");
  const confNote      = $("confNote");
  const defNote       = $("defNote");

  // Update draft metadata
  updateDraftMeta();

  // empty state
  if(r.empty){
    if(resultArea) resultArea.style.display = "none";
    const compareArea = $("compareArea");
    if(compareArea) compareArea.style.display = "none";
    if(emptyNote){ emptyNote.style.display = "block"; emptyNote.textContent = r.message; }
    paintScoreBar(null);
    paintScoreRing(null);
    paintDetected(null);
    const recoCard = $("recoCard");
    if(recoCard) recoCard.hidden = true;
    return;
  }

  if(resultArea) resultArea.style.display = "block";
  if(emptyNote) emptyNote.style.display = "none";

  // score + band headline
  if(scoreHeadline) scoreHeadline.textContent = r.band.head;
  if(scoreSubhead)  scoreSubhead.textContent = `Biggest lever right now: ${SIGNAL_LABEL[r.focus]}.`;

  // audience fit overview
  const afAud = $("afAud");
  const afBlurb = $("afBlurb");
  const afBest = $("afBest");
  if(afAud && afBlurb && afBest){
    const aud = AUDIENCES[audKey];
    afAud.textContent = aud ? aud.label : audKey;
    afBlurb.textContent = aud ? aud.blurb : "";
    const { bestKey, bestScore } = computeCompare();
    if(bestKey && bestKey !== audKey && bestScore > r.score){
      afBest.hidden = false;
      afBest.className = "af-best af-best-alt";
      afBest.innerHTML = iconSVG("target", { size: 14 })
        + ` Lands best with <strong>${AUDIENCES[bestKey].label}</strong> (${bestScore})`;
    } else if(bestKey === audKey){
      afBest.hidden = false;
      afBest.className = "af-best";
      afBest.innerHTML = iconSVG("check", { size: 14 })
        + ` Best-matched audience for this draft`;
    } else {
      afBest.hidden = true;
    }
  }

  // top fix
  if(topFixEl) topFixEl.textContent = r.topFix;

  // breakdown: 4 signal bars
  if(breakdownEl){
    breakdownEl.innerHTML = "";
    SIGNALS.forEach(sig => {
      const val = r.signals[sig];
      const band = getSignalBand(val);
      const msg = SIGNAL_MSG[sig][band];

      const row = document.createElement("div");
      row.className = "signal-row";

      const lbl = document.createElement("span");
      lbl.className = "signal-label";
      lbl.textContent = SIGNAL_LABEL[sig];

      const barWrap = document.createElement("div");
      barWrap.className = "signal-bar-wrap";

      const barFill = document.createElement("div");
      barFill.className = "signal-bar-fill";
      barFill.style.width = Math.min(val, 100) + "%";
      barFill.style.background = val >= 70 ? "var(--green)" : (val >= 45 ? "var(--amber)" : "var(--red)");

      barWrap.appendChild(barFill);

      const valSpan = document.createElement("span");
      valSpan.className = "signal-val";
      valSpan.textContent = Math.round(val);

      row.appendChild(lbl);
      row.appendChild(barWrap);
      row.appendChild(valSpan);

      const msgRow = document.createElement("div");
      msgRow.className = "signal-msg-row";
      msgRow.textContent = msg;

      breakdownEl.appendChild(row);
      breakdownEl.appendChild(msgRow);
    });
  }

  // confidence note
  if(confNote){
    if(r.confidence === "low"){
      confNote.style.display = "block";
      confNote.textContent = COPY.confidenceLowNote;
    } else {
      confNote.style.display = "none";
    }
  }

  // default audience note
  if(defNote){
    if(r.usedDefault || !state.audienceKey){
      defNote.style.display = "block";
      defNote.textContent = COPY.defaultAudienceNote;
    } else {
      defNote.style.display = "none";
    }
  }

  // visuals
  paintScoreRing(r);
  paintScoreBar(r);
  paintDetected(r);
  paintRecommendation();

  // compare mode panel
  const compareArea = $("compareArea");
  if(compareArea){
    compareArea.style.display = "block";
    updateCompareSummary();
    if(compareArea.dataset.collapsed === "false") paintCompare();
  }

  // save state (localStorage only, no URL hash)
  saveDraft();
}

function paintScoreBar(r){
  const numEl = $("scoreNum");
  const fill  = $("scoreFill");
  const label = $("scoreLabel");
  const bar   = $("scorebar");
  if(!numEl || !fill || !label) return;

  if(!r || r.empty){
    numEl.textContent = "--";
    numEl.style.color = "var(--muted)";
    fill.style.width = "0%";
    label.textContent = "";
    if(bar) bar.classList.remove("show");
    _prevScore = null;
    return;
  }
  if(bar) bar.classList.add("show");

  const color = r.band.color;

  if(_prevScore !== null && _prevScore !== r.score){
    animateNumber(numEl, _prevScore, r.score, color);
    fireScoreDelta($("barDelta"), r.score - _prevScore);
    popScore(numEl);
  } else {
    numEl.textContent = r.score;
    numEl.style.color = color;
  }
  _prevScore = r.score;

  fill.style.width = r.score + "%";
  fill.style.background = color;
  label.textContent = r.band.label;
}

/* ── URL hash state ── */
// writeHash is intentionally a no-op: drafts are persisted via localStorage.
// Keeping the export so any external callers don't break.
export function writeHash(){ /* no-op */ }

export function readHash(){
  if(!location.hash) return false;
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
    if(s.a && AUDIENCES[s.a]) state.audienceKey = s.a;
    if(typeof s.c === "string") state.caption = s.c;
    if(s.k && typeof s.k === "object"){
      state.checklist = {};
      Object.keys(s.k).forEach(key => {
        if(s.k[key] === true) state.checklist[key] = true;
      });
    }
    // Clean the hash from the URL bar so old shared links don't leave a long trail
    try { history.replaceState(null, "", location.pathname + location.search); } catch(e2){}
    return true;
  } catch(e){
    return false;
  }
}

/* ── Theme (light / dark / auto) ── */
const THEME_KEY = "seestory_theme";

function resolveTheme(pref){
  if(pref === "dark") return "dark";
  if(pref === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(pref){
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePref = pref;
  const meta = $("themeColorMeta");
  if(meta) meta.setAttribute("content", resolved === "dark" ? "#0c3259" : "#104173");
}

export function initTheme(){
  const opts = document.querySelectorAll(".theme-opt");
  if(!opts.length) return;

  let pref = "auto";
  try { pref = localStorage.getItem(THEME_KEY) || "auto"; } catch(e){}

  const sync = () => {
    opts.forEach(o => {
      o.setAttribute("aria-pressed", String(o.dataset.themeSet === pref));
    });
  };

  applyTheme(pref);
  sync();

  opts.forEach(o => {
    o.addEventListener("click", () => {
      pref = o.dataset.themeSet;
      try { localStorage.setItem(THEME_KEY, pref); } catch(e){}
      applyTheme(pref);
      sync();
    });
  });

  // Follow the system when in "auto"
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => { if(pref === "auto") applyTheme("auto"); };
  if(mq.addEventListener) mq.addEventListener("change", onSystemChange);
  else if(mq.addListener) mq.addListener(onSystemChange);
}

/* ── Lift the sticky command bar once the hero scrolls past ── */
export function initHeaderScroll(){
  const bar = $("topbar");
  if(!bar) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    bar.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", () => {
    if(!ticking){ requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* ── Reveal cards on scroll ── */
export function initReveal(){
  const els = document.querySelectorAll(".reveal");
  if(!els.length) return;
  if(reducedMotion.matches || !("IntersectionObserver" in window)){
    els.forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  els.forEach(el => io.observe(el));
}

/* ── Mobile score bar: jump to results ── */
export function initScorebarJump(){
  const btn = $("scorebarJump");
  if(!btn) return;
  btn.addEventListener("click", () => {
    const target = $("resultArea");
    if(target && target.style.display !== "none"){
      target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    }
  });
}

/* ── localStorage draft ── */
const DRAFT_KEY = "seestory_v2_draft";

export function saveDraft(){
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      a: state.audienceKey,
      c: state.caption,
      k: state.checklist
    }));
  } catch(e){ /* localStorage may be blocked */ }
}

export function loadDraft(){
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if(!raw) return false;
    const s = JSON.parse(raw);
    if(s.a && AUDIENCES[s.a]) state.audienceKey = s.a;
    if(typeof s.c === "string") state.caption = s.c;
    if(s.k && typeof s.k === "object"){
      state.checklist = {};
      Object.keys(s.k).forEach(key => {
        if(s.k[key] === true) state.checklist[key] = true;
      });
    }
    return true;
  } catch(e){
    return false;
  }
}

/* ── Mobile wizard (step-by-step mode) ── */

const WIZARD_STEP_NAMES = [
  "Examples",
  "Audience",
  "Your draft",
  "Rich media",
  "Results"
];

// We only use steps 0–4 for the wizard; step 5 (glossary) is accessible
// from the results step but not a full wizard step.
const WIZARD_TOTAL_STEPS = 5;

let wizardStep = 0;
let wizardActive = false;
let wizardVisited = new Set([0]);

function isMobile(){ return window.innerWidth <= 600; }

/** Activate / deactivate the mobile wizard based on viewport. */
function setWizardMode(active){
  if(active === wizardActive) return;
  wizardActive = active;
  document.body.classList.toggle("wizard-active", active);
  const nav = $("wizardNav");
  if(nav) nav.hidden = !active;
  if(active){
    buildWizardDots();
    // Keep the long "What we detected" panel collapsed so the results step
    // stays scannable — score, audience fit, and top fix lead; detail is one tap away.
    setCollapsed($("detectedArea"), true);
    goToStep(wizardStep, "none");
  } else {
    // Restore all sections to visible
    document.querySelectorAll(".wizard-section").forEach(el => {
      el.classList.remove("wizard-active-step", "wizard-slide-back");
      el.style.display = "";
    });
    // Clean up glossary/footer wizard classes
    const glossary = document.querySelector(".wizard-glossary-wrap");
    const footer = document.querySelector(".site-footer");
    if(glossary) glossary.classList.remove("wizard-show");
    if(footer) footer.classList.remove("wizard-show");
  }
}

function buildWizardDots(){
  const host = $("wizardDots");
  if(!host) return;
  host.innerHTML = "";
  for(let i = 0; i < WIZARD_TOTAL_STEPS; i++){
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "wizard-dot";
    dot.setAttribute("aria-label", WIZARD_STEP_NAMES[i]);
    dot.addEventListener("click", () => {
      if(i <= Math.max(...wizardVisited) + 1) goToStep(i);
    });
    host.appendChild(dot);
  }
}

function syncWizardUI(){
  // Dots
  const dots = document.querySelectorAll(".wizard-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === wizardStep);
    dot.classList.toggle("visited", wizardVisited.has(i) && i !== wizardStep);
  });

  // Step label
  const label = $("wizardStepLabel");
  if(label) label.textContent = `${WIZARD_STEP_NAMES[wizardStep]} · ${wizardStep + 1}/${WIZARD_TOTAL_STEPS}`;

  // Prev / Next buttons
  const prev = $("wizardPrev");
  const next = $("wizardNext");
  if(prev) prev.disabled = (wizardStep === 0);
  if(next){
    const isLast = (wizardStep === WIZARD_TOTAL_STEPS - 1);
    next.classList.toggle("wizard-finish", isLast);
    // Update button text
    const textNode = next.childNodes[0];
    if(textNode && textNode.nodeType === 3){
      textNode.textContent = isLast ? "Done " : "Next ";
    }
  }
}

function goToStep(step, direction){
  if(step < 0 || step >= WIZARD_TOTAL_STEPS) return;
  const prevStep = wizardStep;
  wizardStep = step;
  wizardVisited.add(step);

  // Auto-direction based on prev→next
  if(direction === undefined){
    direction = step > prevStep ? "forward" : "back";
  }

  // Hide all sections, show the target
  const sections = document.querySelectorAll(".wizard-section");
  sections.forEach(el => {
    el.classList.remove("wizard-active-step", "wizard-slide-back");
    // Clear any inline animation override (set below for the "none" direction)
    // so the slide animation plays again on later visits.
    el.style.animation = "";
  });

  // Find the section(s) for this step
  const targets = document.querySelectorAll(`[data-wizard-step="${step}"]`);
  targets.forEach(el => {
    if(direction === "back"){
      el.classList.add("wizard-active-step", "wizard-slide-back");
    } else if(direction === "none"){
      el.classList.add("wizard-active-step");
      el.style.animation = "none"; // skip animation on initial load
    } else {
      el.classList.add("wizard-active-step");
    }
  });

  // Show glossary + footer on results step (step 4)
  const glossary = document.querySelector(".wizard-glossary-wrap");
  const footer = document.querySelector(".site-footer");
  if(glossary) glossary.classList.toggle("wizard-show", step === WIZARD_TOTAL_STEPS - 1);
  if(footer) footer.classList.toggle("wizard-show", step === WIZARD_TOTAL_STEPS - 1);

  syncWizardUI();
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
}

/** Advance wizard when a preset is clicked (mobile only). */
export function wizardAdvanceFromPreset(){
  if(wizardActive) goToStep(1, "forward");
}

export function initMobileWizard(){
  if(!$("wizardNav")) return;

  // Wire prev/next
  const prev = $("wizardPrev");
  const next = $("wizardNext");
  if(prev) prev.addEventListener("click", () => goToStep(wizardStep - 1, "back"));
  if(next) next.addEventListener("click", () => {
    if(wizardStep === WIZARD_TOTAL_STEPS - 1){
      // "Done" — invite the user to explore the science behind the score
      showFinishOverlay();
      return;
    }
    goToStep(wizardStep + 1, "forward");
  });

  // Activate / deactivate based on viewport
  const checkViewport = () => setWizardMode(isMobile());
  checkViewport();

  // Re-check on resize (debounced)
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkViewport, 200);
  });

  // Swipe left/right to move between steps (touch devices)
  wireWizardSwipe();
}

/** Horizontal swipe navigation for the wizard, scoped to the main content. */
function wireWizardSwipe(){
  const surface = document.querySelector(".wrap");
  if(!surface) return;

  let startX = 0, startY = 0, tracking = false;
  const THRESHOLD = 55; // px of horizontal travel to count as a swipe

  surface.addEventListener("touchstart", (e) => {
    if(!wizardActive || e.touches.length !== 1){ tracking = false; return; }
    // Don't hijack gestures on text fields or the horizontally-scrolling
    // preset strip — those own the horizontal axis.
    if(e.target.closest("textarea, input, select, .preset-grid")){ tracking = false; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  surface.addEventListener("touchend", (e) => {
    if(!tracking || !wizardActive) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    // Require a mostly-horizontal swipe past the threshold.
    if(Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if(dx < 0) goToStep(wizardStep + 1, "forward"); // swipe left → next
    else       goToStep(wizardStep - 1, "back");     // swipe right → back
  }, { passive: true });
}

/* ── Completion overlay (invites exploring the science) ── */

/** Reveal the completion overlay shown after the wizard's "Done". */
function showFinishOverlay(){
  const overlay = $("finishOverlay");
  if(!overlay) return;
  overlay.classList.remove("dismiss");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  const explore = $("finishExplore");
  requestAnimationFrame(() => { if(explore) explore.focus(); });
}

export function initFinishOverlay(){
  const overlay = $("finishOverlay");
  if(!overlay) return;
  const stay = $("finishStay");

  let closeTimer;
  const close = () => {
    if(overlay.hidden) return;
    document.body.style.overflow = "";
    if(reducedMotion.matches){
      overlay.hidden = true;
      return;
    }
    overlay.classList.add("dismiss");
    // Hide after the fade-out. We use a timer rather than `animationend`
    // because swapping animation-names on an already-shown element does not
    // reliably re-fire the event in every browser.
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      overlay.hidden = true;
      overlay.classList.remove("dismiss");
    }, 460);
  };

  // "Review my score" stays on the results step
  if(stay) stay.addEventListener("click", close);

  // Backdrop click dismisses
  overlay.addEventListener("click", (e) => { if(e.target === overlay) close(); });

  // Escape dismisses
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && !overlay.hidden) close();
  });

  // The "Explore the science" link is a plain anchor — it navigates on its own.
}

/* ── Splash screen ── */
const SPLASH_KEY = "seestory_splash_seen";

export function initSplash(){
  const overlay = $("splashOverlay");
  const cta = $("splashCta");
  if(!overlay || !cta) return;

  // Check if already dismissed this session
  let seen = false;
  try { seen = sessionStorage.getItem(SPLASH_KEY) === "yes"; } catch(e){}

  if(seen){
    overlay.hidden = true;
    return;
  }

  // Block body scroll while splash is visible
  document.body.style.overflow = "hidden";

  // Move focus into the dialog so keyboard/screen-reader users land on the CTA.
  const prevFocus = document.activeElement;
  requestAnimationFrame(() => cta.focus());

  let dismissed = false;
  const dismiss = () => {
    if(dismissed) return;
    dismissed = true;
    overlay.classList.add("dismiss");
    document.body.style.overflow = "";
    // Return focus to wherever it was before the splash took over.
    if(prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
    try { sessionStorage.setItem(SPLASH_KEY, "yes"); } catch(e){}
    // Hand off to the first-run guided tour (if it hasn't been seen yet).
    document.dispatchEvent(new CustomEvent("seestory:splash-dismissed"));

    const onEnd = () => {
      overlay.hidden = true;
      overlay.removeEventListener("animationend", onEnd);
    };
    if(reducedMotion.matches){
      overlay.hidden = true;
    } else {
      overlay.addEventListener("animationend", onEnd);
    }
  };

  cta.addEventListener("click", dismiss);

  // Also dismiss on clicking the overlay backdrop
  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) dismiss();
  });

  // Dismiss on Escape
  const onKey = (e) => {
    if(e.key === "Escape" && !overlay.hidden){
      dismiss();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
}

/* ── First-run guided tour (coach-mark spotlight) ──────────────
   A dimmed backdrop with a glowing "spotlight" hole over each
   target element, plus a floating dark-glass callout card. Step 0
   nudges users toward Easy mode (and reminds them how to return);
   the rest walk the four tool steps. Replayable from the
   "How it works" modal. Reduced-motion + mobile-wizard aware. */
const TOUR_KEY = "seestory_tour_seen";
let tourSeen = false;
try { tourSeen = localStorage.getItem(TOUR_KEY) === "yes"; } catch(e){}

let tourSteps = [];
let tourIdx = 0;
let tourTarget = null;
let tourActive = false;
let tourJustOpened = false;
let tourRaf = 0;

// Inline icons (kept local so the tour has no external dependency)
const TOUR_IC = {
  spark:   '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/></svg>',
  compass: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  arrow:   '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back:    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  check:   '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>'
};

function buildTourSteps(){
  return [
    {
      target: '.topbar .page-opt[data-page="easy"]',
      noScroll: true,
      spotPad: 6,
      eyebrow: "Welcome — first time?",
      title: "Prefer it in plain words?",
      body: "You've landed on the <strong>full tool</strong>. Not in sales or marketing? <strong>Easy mode</strong> tells the same story without the jargon — and has a quick game to play. Switch any time; this tab brings you right back.",
      kind: "entry"
    },
    {
      target: '[data-wizard-step="0"]', wizard: 0, expandPresets: true,
      eyebrow: "Step 1 of 5",
      title: "Start with an example",
      body: "New here? Load a ready-made draft and watch the engine work. Pick one and this panel <strong>tidies itself away</strong> — reopen it any time to switch."
    },
    {
      target: '[data-wizard-step="1"]', wizard: 1,
      eyebrow: "Step 2 of 5",
      title: "Pick who it's for",
      body: "Every future reader values different things. Choose an audience and the whole score re-tunes to <strong>their</strong> physics."
    },
    {
      target: '[data-wizard-step="2"]', wizard: 2,
      eyebrow: "Step 3 of 5",
      title: "Paste your draft",
      body: "Drop in a post, caption, or email. The engine reads it live for <strong>Clarity</strong> and <strong>Trust</strong> as you type."
    },
    {
      target: '[data-wizard-step="3"]', wizard: 3,
      eyebrow: "Step 4 of 5",
      title: "Add your rich media",
      body: "Tick the formats you'll include — video, a real face, a real number. Future readers reward <strong>showing</strong>, not just telling."
    },
    {
      target: ['#resultArea', '#emptyNote', '[data-wizard-step="4"]'], wizard: 4,
      eyebrow: "Step 5 of 5",
      title: "Read your resonance",
      body: "A score out of 100, the four signals, and the <strong>one fix</strong> that moves it most. Open <strong>What we detected</strong> to see exactly what the engine spotted in your words.",
      last: true
    }
  ];
}

function resolveTourTarget(step){
  const sels = Array.isArray(step.target) ? step.target : [step.target];
  for(const s of sels){
    const el = document.querySelector(s);
    if(el){
      const r = el.getBoundingClientRect();
      if(r.width > 1 && r.height > 1) return el;
    }
  }
  return null;
}

function renderTourCard(step, i){
  const total = tourSteps.length;
  const eyebrow = $("tourEyebrow");
  if(eyebrow) eyebrow.innerHTML = TOUR_IC.spark + "<span>" + step.eyebrow + "</span>";
  const title = $("tourTitle");
  if(title) title.innerHTML = step.title;
  const body = $("tourBody");
  if(body) body.innerHTML = step.body;

  // Progress dots
  const dots = $("tourDots");
  if(dots){
    dots.innerHTML = "";
    for(let d = 0; d < total; d++){
      const dot = document.createElement("span");
      dot.className = "tour-dot" + (d === i ? " active" : "");
      dots.appendChild(dot);
    }
  }

  // Action buttons
  const acts = $("tourActions");
  if(!acts) return;
  acts.innerHTML = "";
  let primaryEl = null;

  const mkBtn = (cls, html, onClick) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tour-btn " + cls;
    b.innerHTML = html;
    b.addEventListener("click", onClick);
    return b;
  };

  if(i > 0){
    acts.appendChild(mkBtn("tour-btn-ghost", TOUR_IC.back + "Back", () => goToTourStep(i - 1)));
  }

  if(step.kind === "entry"){
    acts.appendChild(mkBtn("tour-btn-ghost", "Show me around", () => goToTourStep(i + 1)));
    const easy = document.createElement("a");
    easy.className = "tour-btn tour-btn-primary";
    easy.href = "start.html";
    easy.innerHTML = TOUR_IC.compass + "Easy mode";
    acts.appendChild(easy);
    primaryEl = easy;
  } else if(step.last){
    primaryEl = mkBtn("tour-btn-primary", TOUR_IC.check + "Got it", endTour);
    acts.appendChild(primaryEl);
  } else {
    primaryEl = mkBtn("tour-btn-primary", "Next" + TOUR_IC.arrow, () => goToTourStep(i + 1));
    acts.appendChild(primaryEl);
  }

  // Land keyboard focus on the most likely next action
  if(primaryEl){
    requestAnimationFrame(() => { try { primaryEl.focus(); } catch(e){} });
  }
}

/** Position the spotlight + callout card around the current target. */
function layoutTour(){
  if(!tourActive) return;
  const step = tourSteps[tourIdx];
  const pop = $("tourPop");
  const spot = $("tourSpot");
  const arrow = $("tourArrow");
  if(!pop || !spot || !arrow) return;

  if(!tourTarget){
    pop.classList.add("centered");
    arrow.style.display = "none";
    return;
  }
  pop.classList.remove("centered");
  pop.style.transform = "";

  const r = tourTarget.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  const pad = (step && step.spotPad != null) ? step.spotPad : 8;

  const sx = Math.max(6, r.left - pad);
  const sy = Math.max(6, r.top - pad);
  const sr = Math.min(vw - 6, r.right + pad);
  const sb = Math.min(vh - 6, r.bottom + pad);
  spot.style.left = sx + "px";
  spot.style.top = sy + "px";
  spot.style.width = Math.max(0, sr - sx) + "px";
  spot.style.height = Math.max(0, sb - sy) + "px";

  const cw = pop.offsetWidth, ch = pop.offsetHeight;
  const gap = 14;
  const cx = (r.left + r.right) / 2;

  let place, top;
  if(vh - sb >= ch + gap + 8){ place = "below"; top = sb + gap; }
  else if(sy >= ch + gap + 8){ place = "above"; top = sy - gap - ch; }
  else { place = "pin"; top = Math.max(8, vh - ch - 10); }

  let left = cx - cw / 2;
  left = Math.max(10, Math.min(left, vw - cw - 10));
  pop.style.left = left + "px";
  pop.style.top = top + "px";

  if(place === "pin"){
    arrow.style.display = "none";
  } else {
    arrow.style.display = "";
    arrow.className = "tour-arrow " + (place === "below" ? "up" : "down");
    let ax = cx - left;
    ax = Math.max(20, Math.min(ax, cw - 20));
    arrow.style.left = ax + "px";
  }
}

function scrollTourTarget(el){
  if(!el) return;
  try {
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
  } catch(e){
    el.scrollIntoView();
  }
}

function goToTourStep(i){
  if(!tourActive) return;
  if(i < 0) i = 0;
  if(i >= tourSteps.length){ endTour(); return; }
  tourIdx = i;
  const step = tourSteps[i];

  // Some steps need their target un-collapsed before we can spotlight it
  // (the example gallery hides itself once a preset is chosen).
  if(step.expandPresets){ try { expandPresets(); } catch(e){} }

  // In the mobile wizard, reveal the section this step points at first.
  if(wizardActive && step.wizard != null){
    try { goToStep(step.wizard, "none"); } catch(e){}
  }

  const pop = $("tourPop");
  if(pop) pop.classList.remove("show");

  const run = () => {
    if(!tourActive) return;
    const target = resolveTourTarget(step);
    tourTarget = target;
    const tour = $("tour");
    if(tour) tour.classList.toggle("no-spot", !target);
    if(!step.noScroll && target) scrollTourTarget(target);
    renderTourCard(step, i);
    requestAnimationFrame(() => {
      reflowTour();
      if(pop) pop.classList.add("show");
      // Re-resolve + re-measure as layout settles (scroll easing, splash
      // fade-out, font metrics) so the spotlight never gets stranded.
      setTimeout(reflowTour, 90);
      setTimeout(reflowTour, 320);
    });
  };

  // First step renders immediately; later steps get a quick crossfade.
  setTimeout(run, tourJustOpened ? 0 : 150);
  tourJustOpened = false;
}

/** Re-resolve the current step's target (it may not have been laid out yet
 *  on the first pass) and re-position. Self-heals a stranded spotlight. */
function reflowTour(){
  if(!tourActive) return;
  const step = tourSteps[tourIdx];
  if(!step) return;
  const target = resolveTourTarget(step);
  const tour = $("tour");
  if(target){
    tourTarget = target;
    if(tour) tour.classList.remove("no-spot");
  } else if(tour){
    tour.classList.add("no-spot");
  }
  layoutTour();
}

function onTourReflow(){
  if(tourRaf) return;
  tourRaf = requestAnimationFrame(() => { tourRaf = 0; reflowTour(); });
}

function onTourKey(e){
  if(!tourActive) return;
  if(e.key === "Escape"){ e.preventDefault(); endTour(); return; }
  if(e.key === "ArrowRight"){ e.preventDefault(); goToTourStep(tourIdx + 1); return; }
  if(e.key === "ArrowLeft"){ e.preventDefault(); goToTourStep(tourIdx - 1); return; }
  if(e.key === "Tab"){
    const pop = $("tourPop");
    if(!pop) return;
    const f = pop.querySelectorAll("button:not([disabled]), a[href]");
    if(!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
}

function startTour(force){
  const tour = $("tour");
  if(!tour || tourActive) return;
  if(tourSeen && !force) return;

  // Persist immediately so a mid-tour reload won't replay it unprompted.
  try { localStorage.setItem(TOUR_KEY, "yes"); } catch(e){}
  tourSeen = true;

  tourSteps = buildTourSteps();
  tourIdx = 0;
  tourActive = true;
  tourJustOpened = true;

  tour.hidden = false;
  document.body.classList.add("tour-open");
  requestAnimationFrame(() => tour.classList.add("in"));

  window.addEventListener("resize", onTourReflow, { passive: true });
  window.addEventListener("scroll", onTourReflow, { passive: true });
  document.addEventListener("keydown", onTourKey, true);

  goToTourStep(0);
}

function endTour(){
  if(!tourActive) return;
  tourActive = false;
  const tour = $("tour");

  window.removeEventListener("resize", onTourReflow);
  window.removeEventListener("scroll", onTourReflow);
  document.removeEventListener("keydown", onTourKey, true);
  document.body.classList.remove("tour-open");

  // Leave the mobile wizard on a sensible starting step.
  if(wizardActive){ try { goToStep(0, "none"); } catch(e){} }

  if(!tour) return;
  tour.classList.remove("in");
  const finish = () => {
    tour.hidden = true;
    tour.classList.remove("no-spot");
    const pop = $("tourPop");
    if(pop) pop.classList.remove("show", "centered");
  };
  if(reducedMotion.matches) finish();
  else setTimeout(finish, 350);
}

export function initTour(){
  const tour = $("tour");
  if(!tour) return;

  // Clicking the dimmed backdrop is a no-op (avoids accidental dismissal);
  // Skip and Esc are the explicit exits.
  tour.addEventListener("click", (e) => { if(e.target === tour) e.stopPropagation(); });
  const skip = $("tourSkip");
  if(skip) skip.addEventListener("click", endTour);

  // Replay from the "How it works" modal.
  const replay = $("tourReplay");
  if(replay){
    replay.addEventListener("click", () => {
      const close = $("guideModalClose");
      if(close) close.click();
      setTimeout(() => startTour(true), reducedMotion.matches ? 0 : 300);
    });
  }

  if(tourSeen) return; // first-run auto-start only; replay stays available

  const overlay = $("splashOverlay");
  const splashVisible = overlay && !overlay.hidden;
  if(splashVisible){
    document.addEventListener("seestory:splash-dismissed", () => {
      setTimeout(() => startTour(false), reducedMotion.matches ? 0 : 500);
    }, { once: true });
  } else {
    setTimeout(() => startTour(false), reducedMotion.matches ? 100 : 650);
  }
}
