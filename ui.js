/* ── ui.js ── DOM rendering, state, events (v2) ── */

import {
  AUDIENCES, CHECKLIST, COPY, SIGNALS, SIGNAL_LABEL, SIGNAL_MSG,
  PRESETS, GLOSSARY, FIT_FIX
} from './data.js';
import { scoreDraft, getBand, getSignalBand } from './scoring.js';

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

/** XSS-safe: escapes HTML entities. */
function esc(str){
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/** Detect prefers-reduced-motion. */
const reducedMotion = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : { matches: true };

/* ── Score animation ── */
let _prevScore = null;

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

/* ── Guide toggle ── */
export function initGuide(){
  const btn = $("guideToggle");
  const body = $("guideBody");
  if(!btn || !body) return;
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", !expanded);
    body.classList.toggle("open", !expanded);
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
  
  // Populate
  list.innerHTML = "";
  import('./data.js').then(({ PERSONAS }) => {
    PERSONAS.forEach(p => {
      const el = document.createElement("div");
      el.className = "persona-item";
      
      const title = document.createElement("div");
      title.className = "persona-title";
      title.textContent = p.name;
      
      const desc = document.createElement("div");
      desc.className = "persona-desc";
      desc.textContent = p.desc;
      
      el.appendChild(title);
      el.appendChild(desc);
      list.appendChild(el);
    });
  });

  // Toggle
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", !expanded);
    body.classList.toggle("open", !expanded);
  });
}

/* ── Build audience picker (Grid) ── */
export function buildAudience(){
  const menu = $("audience");
  if(!menu) return;

  // Populate menu
  menu.innerHTML = "";
  Object.entries(AUDIENCES).forEach(([key, a]) => {
    const btn = document.createElement("button");
    btn.className = "aud-card";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", key === state.audienceKey);
    btn.dataset.key = key;

    const label = document.createElement("span");
    label.className = "aud-label";
    label.textContent = a.label;

    const blurb = document.createElement("span");
    blurb.className = "aud-blurb";
    blurb.textContent = a.blurb;

    btn.appendChild(label);
    btn.appendChild(blurb);
    
    btn.onclick = () => {
      state.audienceKey = key;
      refreshAudienceButtons();
      render();
    };
    menu.appendChild(btn);
  });

  // Initialize trigger label
  refreshAudienceButtons();
}

function refreshAudienceButtons(){
  const btns = document.querySelectorAll("#audience .aud-card");
  btns.forEach(b => {
    b.setAttribute("aria-selected", b.dataset.key === state.audienceKey);
  });
}

/* ── Build checklist ── */
export function buildChecklist(){
  const el = $("checklist");
  if(!el) return;
  el.innerHTML = "";
  CHECKLIST.forEach(item => {
    const label = document.createElement("label");
    label.className = "check-card"; // new class for styling

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "toggle-input";
    cb.checked = !!state.checklist[item.id];
    cb.onchange = () => {
      state.checklist[item.id] = cb.checked;
      render();
    };

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
    el.appendChild(label);
  });
}

/* ── Build presets ── */
export function buildPresets(){
  const host = $("presetGrid");
  if(!host) return;
  host.innerHTML = "";
  PRESETS.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";

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
    btn.onclick = () => loadPreset(p);
    host.appendChild(btn);
  });
}

function loadPreset(p){
  state.audienceKey = AUDIENCES[p.audience] ? p.audience : null;
  state.caption = p.caption || "";
  state.checklist = { ...(p.checklist || {}) };

  const capEl = $("caption");
  if(capEl) capEl.value = state.caption;

  refreshAudienceButtons();
  refreshChecklistBoxes();
  render();
}

function refreshChecklistBoxes(){
  const items = document.querySelectorAll("#checklist input[type=checkbox]");
  const ids = CHECKLIST.map(c => c.id);
  items.forEach((cb, i) => {
    if(ids[i]) cb.checked = !!state.checklist[ids[i]];
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

/* ── Compare mode ── */
export function wireCompare(){
  const btn = $("compareToggle");
  const grid = $("compareGrid");
  if(!btn || !grid) return;
  btn.addEventListener("click", () => {
    const visible = grid.style.display !== "none";
    grid.style.display = visible ? "none" : "grid";
    btn.textContent = visible ? "Compare all audiences" : "Hide comparison";
    if(!visible) paintCompare();
  });
}

function paintCompare(){
  const grid = $("compareGrid");
  if(!grid) return;
  grid.innerHTML = "";

  const results = {};
  let bestKey = null, bestScore = -1;

  Object.keys(AUDIENCES).forEach(key => {
    const r = scoreDraft({ audienceKey: key, caption: state.caption, checklist: state.checklist });
    results[key] = r;
    if(!r.empty && r.score > bestScore){ bestScore = r.score; bestKey = key; }
  });

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
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.textContent = "Copy result";
      }, 1500);
    }).catch(() => {
      btn.textContent = "Copy failed";
      setTimeout(() => { btn.textContent = "Copy result"; }, 1500);
    });
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

  // empty state
  if(r.empty){
    if(resultArea) resultArea.style.display = "none";
    if(emptyNote){ emptyNote.style.display = "block"; emptyNote.textContent = r.message; }
    paintScoreBar(null);
    return;
  }

  if(resultArea) resultArea.style.display = "block";
  if(emptyNote) emptyNote.style.display = "none";

  // score + band headline
  if(scoreHeadline) scoreHeadline.textContent = r.band.head;
  if(scoreSubhead)  scoreSubhead.textContent = `Biggest lever right now: ${SIGNAL_LABEL[r.focus]}.`;

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

      const msgSpan = document.createElement("span");
      msgSpan.className = "signal-msg";
      msgSpan.textContent = msg;

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

  // sticky scorebar
  paintScoreBar(r);

  // compare mode (if visible)
  const compareGrid = $("compareGrid");
  if(compareGrid && compareGrid.style.display !== "none"){
    paintCompare();
  }

  // save state
  writeHash();
  saveDraft();
}

function paintScoreBar(r){
  const numEl = $("scoreNum");
  const fill  = $("scoreFill");
  const label = $("scoreLabel");
  if(!numEl || !fill || !label) return;

  if(!r || r.empty){
    numEl.textContent = "--";
    numEl.style.color = "var(--muted)";
    fill.style.width = "0%";
    label.textContent = "";
    _prevScore = null;
    return;
  }

  const color = r.band.color;

  // animate number
  if(_prevScore !== null && _prevScore !== r.score){
    animateNumber(numEl, _prevScore, r.score, color);
    if(!reducedMotion.matches){
      numEl.classList.remove("score-pop");
      void numEl.offsetWidth;
      numEl.classList.add("score-pop");
    }
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
export function writeHash(){
  try {
    const s = {
      a: state.audienceKey,
      c: state.caption,
      k: state.checklist
    };
    location.replace("#" + btoa(unescape(encodeURIComponent(JSON.stringify(s)))));
  } catch(e){ /* silently fail */ }
}

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
    return true;
  } catch(e){
    /* silently ignore bad hash */
    return false;
  }
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
