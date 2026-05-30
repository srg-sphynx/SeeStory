/* ── ui.js ── DOM rendering + state sync (ES module) ── */

import {
  AUDIENCES, ANCHORS, FRAGMENTS, CLASSES, CLASS_LABEL, CLASS_COLOR, PRESETS
} from './data.js';
import { state, resonance, band, suggestions } from './scoring.js';

/* ── Debounce utility ── */
function debounce(fn, ms){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(()=> fn(...args), ms);
  };
}

/* ── XSS-safe HTML escaping ── */
function escapeHTML(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ── Null-safe DOM query ── */
function $(id){ return document.getElementById(id); }

/* ── Guide toggle ── */
export function initGuide(){
  const btn = $("guideToggle");
  const body = $("guideBody");
  if(!btn || !body) return;
  btn.addEventListener("click", ()=>{
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", !expanded);
    body.classList.toggle("open", !expanded);
  });
}

/* ── Builders (run once) ── */
export function buildAudience(){
  const el = $("audience");
  if(!el) return;
  el.innerHTML = "";
  Object.entries(AUDIENCES).forEach(([key,a])=>{
    const b = document.createElement("button");
    b.textContent = a.label;
    b.setAttribute("aria-pressed", key===state.audience);
    b.onclick = ()=>{ state.audience = key; syncAll(); };
    el.appendChild(b);
  });
}

export function buildAnchors(){
  const el = $("anchors");
  if(!el) return;
  el.innerHTML = "";
  ANCHORS.forEach(a=>{
    const c = document.createElement("button");
    c.className = "chip";
    c.textContent = a.text;
    c.setAttribute("role","radio");
    c.setAttribute("aria-pressed", a.id===state.anchor);
    c.onclick = ()=>{ state.anchor = a.id; syncAll(); };
    el.appendChild(c);
  });
}

export function buildFragments(){
  const host = $("fragments");
  if(!host) return;
  host.innerHTML = "";
  CLASSES.forEach(cls=>{
    const wrap = document.createElement("div");
    wrap.style.margin = "0 0 12px";
    const label = document.createElement("div");
    label.textContent = CLASS_LABEL[cls];
    label.style.cssText = `font-weight:700;color:${CLASS_COLOR[cls]};margin:0 0 6px`;
    wrap.appendChild(label);
    const chips = document.createElement("div");
    chips.className = "chips";
    FRAGMENTS.filter(f=>f.class===cls).forEach(f=>{
      const c = document.createElement("button");
      c.className = "chip";
      c.textContent = f.text;
      c.setAttribute("aria-pressed", state.selected.has(f.id));
      c.onclick = ()=>{
        state.selected.has(f.id) ? state.selected.delete(f.id) : state.selected.add(f.id);
        c.setAttribute("aria-pressed", state.selected.has(f.id));
        scoreAndPaint();           // toggle does not need a full rebuild
      };
      chips.appendChild(c);
    });
    wrap.appendChild(chips);
    host.appendChild(wrap);
  });
}

/* ── Preset gallery ── */
export function buildPresets(){
  const host = $("presetGrid");
  if(!host) return;
  host.innerHTML = "";
  PRESETS.forEach(p=>{
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    const title = document.createElement("div");
    title.className = "p-title";
    title.textContent = p.title;
    const preview = document.createElement("div");
    preview.className = "p-preview";
    preview.textContent = p.caption;
    btn.appendChild(title);
    btn.appendChild(preview);
    btn.onclick = ()=> loadPreset(p);
    host.appendChild(btn);
  });
}

function loadPreset(p){
  state.audience = AUDIENCES[p.audience] ? p.audience : "genz";
  state.anchor = ANCHORS.find(a=>a.id===p.anchor) ? p.anchor : ANCHORS[0].id;
  state.selected = new Set(p.fragments.filter(id=> FRAGMENTS.some(f=>f.id===id)));
  state.caption = p.caption || "";
  const capEl = $("caption");
  if(capEl) capEl.value = state.caption;
  buildAudience();
  buildAnchors();
  buildFragments();
  syncAll();
}

/* ── Paint dynamic output ── */
function paintSpotter(text){
  const el = $("spotter");
  if(!el) return;
  el.innerHTML = "";

  if(text.drivers.length === 0 && text.stoppers.length === 0 && !state.caption.trim()){
    const li = document.createElement("li");
    li.style.color = "var(--muted)";
    li.textContent = "Start typing to see live feedback...";
    el.appendChild(li);
    return;
  }

  text.drivers.forEach(d=>{
    const li = document.createElement("li");
    li.className = "driver";
    li.textContent = d;
    el.appendChild(li);
  });
  text.stoppers.forEach(s=>{
    // XSS-safe: use textContent, not innerHTML
    const li = document.createElement("li");
    li.className = "stopper";
    const labelSpan = document.createTextNode(s.label + ": ");
    const markEl = document.createElement("mark");
    markEl.textContent = s.snippet;
    li.appendChild(labelSpan);
    li.appendChild(markEl);
    el.appendChild(li);
  });
}

function paintBreakdown(breakdown){
  const el = $("breakdown");
  if(!el) return;
  el.innerHTML = "";
  CLASSES.forEach(c=>{
    const pct = Math.round((breakdown[c] / 0.35) * 100); // 0.35 ~ a strong single-class contribution
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:10px;margin:8px 0";

    const lbl = document.createElement("span");
    lbl.style.cssText = "width:90px;font-size:.9rem";
    lbl.textContent = CLASS_LABEL[c];

    const barOuter = document.createElement("span");
    barOuter.style.cssText = "flex:1;height:12px;border-radius:999px;background:#eef1f4;overflow:hidden";

    const barInner = document.createElement("span");
    barInner.style.cssText = `display:block;height:100%;width:${Math.min(pct,100)}%;background:${CLASS_COLOR[c]};transition:width .25s`;

    barOuter.appendChild(barInner);
    row.appendChild(lbl);
    row.appendChild(barOuter);
    el.appendChild(row);
  });
}

function paintTips(tips){
  const el = $("tips");
  if(!el) return;
  el.innerHTML = "";
  tips.forEach(t=>{
    const li = document.createElement("li");
    li.className = "driver";
    li.textContent = t;
    el.appendChild(li);
  });
}

/* ── Score animation (respects prefers-reduced-motion) ── */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let _prevScore = null;

function paintScore(score){
  const b = band(score);
  const numEl = $("scoreNum");
  const fill  = $("scoreFill");
  const label = $("scoreLabel");
  if(!numEl || !fill || !label) return;

  // Animate the number counting up/down if motion is allowed
  if(!prefersReducedMotion.matches && _prevScore !== null && _prevScore !== score){
    animateScoreNumber(numEl, _prevScore, score, b.color);
    numEl.classList.remove("score-pop");
    void numEl.offsetWidth; // force reflow to restart animation
    numEl.classList.add("score-pop");
  } else {
    numEl.textContent = score;
  }
  _prevScore = score;

  numEl.style.color = b.color;
  fill.style.width = score + "%";
  fill.style.background = b.color;
  label.textContent = b.label;
}

function animateScoreNumber(el, from, to, color){
  const duration = 250;
  const start = performance.now();
  const diff = to - from;
  function step(now){
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease out quad
    const eased = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(from + diff * eased);
    el.textContent = current;
    el.style.color = color;
    if(progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── Compare mode ── */
function paintCompare(){
  const el = $("compareGrid");
  if(!el) return;
  el.innerHTML = "";

  const results = {};
  let bestKey = null;
  let bestScore = -1;

  Object.keys(AUDIENCES).forEach(key=>{
    const r = resonance(key, state.anchor, state.selected, state.caption);
    results[key] = r;
    if(r.score > bestScore){ bestScore = r.score; bestKey = key; }
  });

  Object.entries(AUDIENCES).forEach(([key, aud])=>{
    const r = results[key];
    const b = band(r.score);
    const cell = document.createElement("div");
    cell.className = "compare-cell" + (key === bestKey ? " best" : "");

    const lbl = document.createElement("div");
    lbl.className = "c-label";
    lbl.textContent = aud.label;

    const sc = document.createElement("div");
    sc.className = "c-score";
    sc.textContent = r.score;
    sc.style.color = b.color;

    const bd = document.createElement("div");
    bd.className = "c-band muted";
    bd.textContent = b.label;

    cell.appendChild(lbl);
    cell.appendChild(sc);
    cell.appendChild(bd);
    el.appendChild(cell);
  });
}

/* ── Copy result ── */
export function initCopyButton(){
  const btn = $("copyBtn");
  if(!btn) return;
  btn.addEventListener("click", ()=>{
    const r = resonance(state.audience, state.anchor, state.selected, state.caption);
    const tips = suggestions(r, state.audience);
    const text = [
      `Caption: ${state.caption || "(none)"}`,
      `Audience: ${AUDIENCES[state.audience]?.label || state.audience}`,
      `Resonance Score: ${r.score}/100 — ${band(r.score).label}`,
      `Top suggestion: ${tips[0]}`
    ].join("\n");

    navigator.clipboard.writeText(text).then(()=>{
      btn.classList.add("copied");
      btn.textContent = "Copied!";
      setTimeout(()=>{
        btn.classList.remove("copied");
        btn.textContent = "Copy result";
      }, 1500);
    }).catch(()=>{
      // Fallback for older browsers
      btn.textContent = "Copy failed";
      setTimeout(()=>{ btn.textContent = "Copy result"; }, 1500);
    });
  });
}

/* ── The render loop ── */
export function scoreAndPaint(){
  const r = resonance(state.audience, state.anchor, state.selected, state.caption);
  paintScore(r.score);
  paintSpotter(r.text);
  paintBreakdown(r.breakdown);
  paintTips(suggestions(r, state.audience));
  paintCompare();
  writeHash();
  saveDraft();
}

export function syncAll(){
  const hintEl = $("audHint");
  if(hintEl && AUDIENCES[state.audience]){
    hintEl.textContent = AUDIENCES[state.audience].hint;
  }
  // refresh pressed states on the two single-select groups
  const audBtns = document.querySelectorAll("#audience button");
  if(audBtns.length){
    const keys = Object.keys(AUDIENCES);
    audBtns.forEach((b,i)=>{
      b.setAttribute("aria-pressed", keys[i]===state.audience);
    });
  }
  const ancBtns = document.querySelectorAll("#anchors button");
  if(ancBtns.length){
    ancBtns.forEach((b,i)=>{
      if(ANCHORS[i]) b.setAttribute("aria-pressed", ANCHORS[i].id===state.anchor);
    });
  }
  scoreAndPaint();
}

/* ── Caption input with debounce ── */
export function wireCaption(){
  const capEl = $("caption");
  if(!capEl) return;
  const debouncedScore = debounce(()=> scoreAndPaint(), 150);
  capEl.addEventListener("input", e=>{
    state.caption = e.target.value;
    debouncedScore();
  });
  capEl.value = state.caption;
}

/* ── Compare mode toggle ── */
export function wireCompareToggle(){
  const btn = $("compareToggle");
  const grid = $("compareGrid");
  if(!btn || !grid) return;
  btn.addEventListener("click", ()=>{
    const visible = grid.style.display !== "none";
    grid.style.display = visible ? "none" : "grid";
    btn.textContent = visible ? "Compare all audiences" : "Hide comparison";
  });
}

/* ── URL hash (shareable state) ── */
export function writeHash(){
  try {
    const s = {
      a: state.audience,
      n: state.anchor,
      f: [...state.selected],
      c: state.caption
    };
    location.replace("#" + btoa(unescape(encodeURIComponent(JSON.stringify(s)))));
  } catch(e){ /* silently fail */ }
}

export function readHash(){
  if(!location.hash) return false;
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
    // Validate audience key exists
    if(s.a && AUDIENCES[s.a]) state.audience = s.a;
    // Validate anchor id exists
    if(s.n && ANCHORS.find(a=>a.id===s.n)) state.anchor = s.n;
    // Validate fragment ids
    if(Array.isArray(s.f)){
      state.selected = new Set(s.f.filter(id=> FRAGMENTS.some(f=>f.id===id)));
    }
    if(typeof s.c === "string") state.caption = s.c;
    return true;
  } catch(e){
    /* silently ignore bad hash */
    return false;
  }
}

/* ── localStorage draft save/restore ── */
const DRAFT_KEY = "seestory_draft";

export function saveDraft(){
  try {
    const s = {
      a: state.audience,
      n: state.anchor,
      f: [...state.selected],
      c: state.caption
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
  } catch(e){ /* localStorage may be blocked in sandboxed iframes */ }
}

export function loadDraft(){
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if(!raw) return false;
    const s = JSON.parse(raw);
    if(s.a && AUDIENCES[s.a]) state.audience = s.a;
    if(s.n && ANCHORS.find(a=>a.id===s.n)) state.anchor = s.n;
    if(Array.isArray(s.f)){
      state.selected = new Set(s.f.filter(id=> FRAGMENTS.some(f=>f.id===id)));
    }
    if(typeof s.c === "string") state.caption = s.c;
    return true;
  } catch(e){
    return false;
  }
}
