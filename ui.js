/* ── ui.js ── DOM rendering, state, events (v2, responsive) ── */

import {
  AUDIENCES, CHECKLIST, COPY, SIGNALS, SIGNAL_LABEL, SIGNAL_MSG,
  PRESETS, GLOSSARY, FIT_FIX, PERSONAS
} from './data.js';
import { scoreDraft, getBand, getSignalBand, splitSentences } from './scoring.js';
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
    const el = document.createElement("div");
    el.className = "persona-item";
    
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
    
    list.appendChild(el);
  });

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
    
    eduBtn.addEventListener("click", () => {
      const expanded = eduBtn.getAttribute("aria-expanded") === "true";
      eduBtn.setAttribute("aria-expanded", String(!expanded));
      eduBtn.textContent = !expanded ? "Hide details ▴" : "What could BioSolveIT do with this? ▾";
      eduContent.classList.toggle("open", !expanded);
    });

    wrapper.appendChild(eduBtn);
    wrapper.appendChild(eduContent);
    el.appendChild(wrapper);
  });
}

/* ── Build presets ── */
export function buildPresets(){
  const host = $("presetGrid");
  if(!host) return;
  host.innerHTML = "";
  PRESETS.forEach(p => {
    const btn = document.createElement("button");
    btn.type = "button";
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
    btn.addEventListener("click", () => loadPreset(p));
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

/* ── Detection panel ── */
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
    { id: "number", icon: "hash", label: "Numbers in text", found: f.hasNumber, val: f.hasNumber ? "Detected" : "None found" },
    { id: "cta", icon: "click", label: "Call to action", found: f.hasCTA, val: f.hasCTA ? "Detected" : "None found" },
    { id: "result", icon: "barchart", label: "Result or comparison", found: f.hasResultCue, val: f.hasResultCue ? "Detected" : "None found" },
    { id: "hype", icon: "megaphone", label: "Hype words", found: false, warn: f.hypeFound.length > 0, val: f.hypeFound.length > 0 ? f.hypeFound.join(", ") : "Clean" },
    { id: "hedge", icon: "help", label: "Hedge phrases", found: false, warn: f.hedgeHits > 0, val: f.hedgeHits > 0 ? (f.hedgeHits + " found") : "Clean" },
    { id: "exclamation", icon: "alert", label: "Exclamation marks", found: false, warn: f.exclamations >= 2, val: f.exclamations >= 2 ? (f.exclamations + " found") : "Clean" },
    { id: "emdash", icon: "minus", label: "Em / en dashes", found: false, warn: f.hasEmDash, val: f.hasEmDash ? "Found" : "None" },
    { id: "shout", icon: "type", label: "ALL CAPS shouting", found: false, warn: f.shouting, val: f.shouting ? "Detected" : "None" },
  ];

  items.forEach(item => {
    const container = document.createElement("div");
    container.className = "detected-item-container";

    const row = document.createElement("div");
    row.className = "detected-row " + (item.warn ? "warn" : (item.found ? "found" : "missing"));

    const iconEl = document.createElement("span");
    iconEl.className = "detected-icon";
    iconEl.innerHTML = iconSVG(item.icon, { size: 18 });

    const labelEl = document.createElement("span");
    labelEl.className = "detected-label";
    labelEl.textContent = item.label;

    const valEl = document.createElement("span");
    valEl.className = "detected-val";
    valEl.textContent = item.val;

    row.appendChild(iconEl);
    row.appendChild(labelEl);
    row.appendChild(valEl);
    container.appendChild(row);

    const expEl = document.createElement("div");
    expEl.className = "detected-explanation";
    const tip = getContextualTip(item.id, item.found || item.warn, audienceKey);
    const st = TIP_STATUS[tip.status];
    if(st){
      const ic = document.createElement("span");
      ic.className = "tip-status " + st.cls;
      ic.innerHTML = iconSVG(st.icon, { size: 15 });
      expEl.appendChild(ic);
    }
    const parts = tip.text.split("**");
    if(parts.length >= 3){
      const strongEl = document.createElement("strong");
      strongEl.textContent = parts[1];
      const span2 = document.createElement("span");
      span2.textContent = parts[2];
      expEl.appendChild(strongEl);
      expEl.appendChild(span2);
    } else {
      const span = document.createElement("span");
      span.textContent = tip.text;
      expEl.appendChild(span);
    }

    container.appendChild(expEl);
    list.appendChild(container);
  });
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
  } else {
    ringNum.textContent = r.score;
    ringNum.style.color = r.band.color;
  }
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
