/* ── start.js ── Easy mode: plain-words tour + a glowing, gamified mini-scorer.
   It drives the REAL scoring engine (scoring.js) with a handful of friendly
   switches, so every point the dial shows is honest, not faked. */

import { scoreDraft } from './scoring.js';
import { SIGNAL_LABEL } from './data.js';
import { iconSVG } from './icons.js';
import { initMotion } from './motion.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ───────────────────────────────────────────
   Theme (light / dark / auto), mirrors the other pages
   ─────────────────────────────────────────── */
const THEME_KEY = "seestory_theme";
function resolveTheme(pref){
  if(pref === "dark") return "dark";
  if(pref === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(pref){
  const resolved = resolveTheme(pref);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePref = pref;
  const meta = $("themeColorMeta");
  if(meta) meta.setAttribute("content", resolved === "dark" ? "#0c3259" : "#104173");
}
function initTheme(){
  const opts = document.querySelectorAll(".theme-opt");
  if(!opts.length) return;
  let pref = "auto";
  try { pref = localStorage.getItem(THEME_KEY) || "auto"; } catch(e){}
  const sync = () => opts.forEach(o => o.setAttribute("aria-pressed", String(o.dataset.themeSet === pref)));
  applyTheme(pref); sync();
  opts.forEach(o => o.addEventListener("click", () => {
    pref = o.dataset.themeSet;
    try { localStorage.setItem(THEME_KEY, pref); } catch(e){}
    applyTheme(pref); sync();
  }));
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => { if(pref === "auto") applyTheme("auto"); };
  if(mq.addEventListener) mq.addEventListener("change", onChange);
  else if(mq.addListener) mq.addListener(onChange);
}

/* ── Lift the sticky bar once the hero scrolls past ── */
function initHeaderScroll(){
  const bar = $("topbar");
  if(!bar) return;
  let ticking = false;
  const update = () => { ticking = false; bar.classList.toggle("scrolled", window.scrollY > 24); };
  window.addEventListener("scroll", () => { if(!ticking){ requestAnimationFrame(update); ticking = true; } }, { passive: true });
  update();
}

/* ── Reveal on scroll (fallback if GSAP is unavailable) ── */
function initReveal(){
  const els = document.querySelectorAll(".reveal");
  if(!els.length) return;
  if(reducedMotion.matches || !("IntersectionObserver" in window)){
    els.forEach(el => el.classList.add("in")); return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  els.forEach(el => io.observe(el));
}

/* ───────────────────────────────────────────
   The "then / next" era slider
   ─────────────────────────────────────────── */
function initEraSlider(){
  const range = $("eraRange");
  const past = $("eraPast");
  const future = $("eraFuture");
  const stage = $("eraStage");
  if(!range || !past || !future || !stage) return;
  const update = () => {
    const t = Number(range.value) / 100;            // 0 = then, 1 = next
    // Clean swap at the midpoint; CSS opacity transition does the cross-fade,
    // so the two texts never ghost on top of each other.
    const showFuture = t >= 0.5;
    past.style.opacity = showFuture ? "0" : "1";
    future.style.opacity = showFuture ? "1" : "0";
    future.setAttribute("aria-hidden", showFuture ? "false" : "true");
    past.setAttribute("aria-hidden", showFuture ? "true" : "false");
    // hue drifts continuously from steady navy (past) toward living green (next)
    stage.style.setProperty("--era-t", String(t));
    range.style.setProperty("--era-fill", (t * 100) + "%");
  };
  range.addEventListener("input", update);
  update();
}

/* ───────────────────────────────────────────
   The gamified mini-scorer
   ─────────────────────────────────────────── */

// Three friendly readers mapped to the real audience keys. They deliberately
// span the spectrum the real engine models: a media-first young reader, a
// proof-first expert, and an ROI-first decision-maker. Switching between them
// is the whole lesson — the same post lands very differently for each.
const READERS = [
  { key: "genz",   icon: "atom",      label: "A future scientist", sub: "Gen Z, learns from video" },
  { key: "pi",     icon: "microscope",label: "A busy lab leader",  sub: "wants proof, hates hype" },
  { key: "pharma", icon: "briefcase", label: "A pharma exec",      sub: "wants results and ROI" }
];

// Friendly switches. Each one rewrites the post and/or ticks a media plan, and
// together they cover everything ALL three readers can ask for — so every
// reader has a clean path into the green (no want is left unreachable).
// `on` is the starting state. They all start OFF so the post begins messy and
// every flip is a visible win. Two switches are deliberately bundled so six
// toggles can satisfy a reader who wants five different things at once:
//   • "visual"  ticks a short clip AND an image
//   • "human"   shows a real face AND invites people to reply
//   • "plain"   adds a plain-language line AND a clear next step
const BOOSTS = [
  { id: "hype",   icon: "shield",   label: "Drop the hype words",      hint: "No more revolutionary, game-changing, world-class.", on: false },
  { id: "number", icon: "barchart", label: "Show a real result",       hint: "A concrete number people can trust.",               on: false },
  { id: "source", icon: "database", label: "Link the proof",           hint: "Point to a paper or page to verify.",               on: false },
  { id: "visual", icon: "video",    label: "Show it, don't just say it",hint: "A short clip and an image beat a wall of text.",    on: false },
  { id: "human",  icon: "users",    label: "Make it human and social", hint: "A real face, and invite people to reply.",          on: false },
  { id: "plain",  icon: "sparkles", label: "Say it plainly, point somewhere", hint: "One line anyone gets, plus a clear next step.", on: false }
];

// How much each switch moves the dial for the *currently selected* reader.
// Recomputed from the real engine whenever the reader changes (see
// refreshRelevance) so the labels can never drift from the actual scoring.
const REL_TIERS = [
  { min: 10, cls: "rel-high", text: "Big win for them" },
  { min: 4,  cls: "rel-med",  text: "Helps here" },
  { min: 0,  cls: "rel-low",  text: "They barely notice" }
];
function relTier(delta){ return REL_TIERS.find(t => delta >= t.min) || REL_TIERS[REL_TIERS.length - 1]; }

const LEVELS = [
  { min: 80, text: "Trusted and shared", cls: "lv-great" },
  { min: 60, text: "Worth a share",      cls: "lv-good"  },
  { min: 40, text: "Glanced at",         cls: "lv-mid"   },
  { min: 0,  text: "Scrolled past",      cls: "lv-low"   }
];

const RING_C = 326.73;     // 2 * PI * 52, matches the SVG dasharray
const state = { reader: "genz", boosts: {}, score: 0, relevance: {} };
BOOSTS.forEach(b => { state.boosts[b.id] = b.on; });

// The sentences each switch contributes to the post. Single source of truth so
// the scored draft and the "your post right now" preview can never drift apart.
// The number line carries real result cues ("cut … down to") so it lands as
// genuine substance, not just a stray digit; the plain line carries a real
// call to action ("See … try it") so decision-makers get their next step.
const BASE_LINE   = "We built a new way to find promising medicines on a computer.";
const HYPE_LINE   = "It is a revolutionary, game-changing, world-class breakthrough that will supercharge your whole pipeline!";
const NUMBER_LINE = "In one run it searched 2.4 billion molecules in 48 hours and cut months of lab work down to days.";
const PLAIN_LINE  = "In plain words: the computer does the early guessing, so the lab only tests the molecules most likely to work. See the benchmark and try it yourself.";

/** The exact text the engine reads (and the preview shows), for a given switch set. */
function captionFor(b){
  const parts = [BASE_LINE];
  if(!b.hype) parts.push(HYPE_LINE);   // hype words present until "Drop the hype" is on
  if(b.number) parts.push(NUMBER_LINE);
  if(b.plain) parts.push(PLAIN_LINE);  // includes the call to action
  return parts.join(" ");
}
function currentCaption(){ return captionFor(state.boosts); }

/** Media plans a given switch set ticks. Bundled switches set two ingredients
 *  each, so the six toggles between them can cover every reader's full wish list. */
function checklistFor(b){
  return {
    source:        !!b.source,
    resultData:    !!b.number,
    video:         !!b.visual,   // "show it" = a short clip …
    visual:        !!b.visual,   // … and an image
    humanVoice:    !!b.human,    // "make it human" = a real face …
    communityHook: !!b.human,    // … and an invitation to reply
    plainSummary:  !!b.plain
  };
}

/** Run a switch set through the genuine scoring engine for the current reader. */
function scoreFor(b){
  return scoreDraft({ audienceKey: state.reader, caption: captionFor(b), checklist: checklistFor(b) });
}

/** Run the live switches through the genuine scoring engine. */
function computeScore(){ return scoreFor(state.boosts); }

/** For the current reader, how much each switch alone lifts the score from the
 *  all-off baseline. Honest (straight from the engine) and stable while a reader
 *  is selected, so the per-switch "Big win / Helps / Barely" labels mean what
 *  they say — and a reader who shrugs at video reads as a lesson, not a bug. */
function refreshRelevance(){
  const off = {}; BOOSTS.forEach(b => { off[b.id] = false; });
  const base = scoreFor(off).score;
  const rel = {};
  BOOSTS.forEach(b => {
    const solo = { ...off, [b.id]: true };
    rel[b.id] = scoreFor(solo).score - base;
  });
  state.relevance = rel;
}

function bandColor(score){
  if(score >= 80) return "var(--green)";
  if(score >= 60) return "var(--amber)";
  if(score >= 40) return "var(--amber)";
  return "var(--red)";
}

function levelFor(score){ return LEVELS.find(l => score >= l.min); }

/* ── Build the reader picker ── */
function buildReaders(){
  const host = $("gameAud");
  if(!host) return;
  host.innerHTML = "";
  READERS.forEach(r => {
    const btn = document.createElement("button");
    btn.className = "ga-opt" + (r.key === state.reader ? " active" : "");
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(r.key === state.reader));
    btn.dataset.key = r.key;
    btn.innerHTML =
      `<span class="ga-ico">${iconSVG(r.icon, { size: 22 })}</span>` +
      `<span class="ga-txt"><span class="ga-name">${r.label}</span>` +
      `<span class="ga-sub">${r.sub}</span></span>`;
    btn.addEventListener("click", () => {
      if(state.reader === r.key) return;
      state.reader = r.key;
      host.querySelectorAll(".ga-opt").forEach(o => {
        const on = o.dataset.key === r.key;
        o.classList.toggle("active", on);
        o.setAttribute("aria-pressed", String(on));
      });
      // A new reader cares about different things — re-read the switch labels.
      refreshRelevance();
      updateBoostRelevance();
      render(true);
    });
    host.appendChild(btn);
  });
}

/* ── Build the switches ── */
function buildBoosts(){
  const host = $("boostList");
  if(!host) return;
  host.innerHTML = "";
  BOOSTS.forEach(bt => {
    const row = document.createElement("button");
    row.className = "boost" + (state.boosts[bt.id] ? " on" : "");
    row.type = "button";
    row.setAttribute("role", "switch");
    row.setAttribute("aria-checked", String(state.boosts[bt.id]));
    row.dataset.id = bt.id;
    row.innerHTML =
      `<span class="boost-ico">${iconSVG(bt.icon, { size: 20 })}</span>` +
      `<span class="boost-body"><span class="boost-label">${bt.label}</span>` +
      `<span class="boost-hint">${bt.hint}</span>` +
      `<span class="boost-rel" data-rel-for="${bt.id}"></span></span>` +
      `<span class="boost-switch" aria-hidden="true"><span class="boost-knob"></span></span>`;
    row.addEventListener("click", () => {
      state.boosts[bt.id] = !state.boosts[bt.id];
      row.classList.toggle("on", state.boosts[bt.id]);
      row.setAttribute("aria-checked", String(state.boosts[bt.id]));
      if(state.boosts[bt.id] && !reducedMotion.matches){
        row.classList.remove("pulse"); void row.offsetWidth; row.classList.add("pulse");
      }
      render(true);
    });
    host.appendChild(row);
  });
  updateBoostRelevance();
}

/* ── Paint the per-reader "how much this reader cares" tag on each switch ── */
function updateBoostRelevance(){
  BOOSTS.forEach(bt => {
    const pill = document.querySelector(`.boost-rel[data-rel-for="${bt.id}"]`);
    if(!pill) return;
    const tier = relTier(state.relevance[bt.id] || 0);
    pill.className = "boost-rel " + tier.cls;
    pill.textContent = tier.text;
  });
}

/* ── Build the four signal meters ── */
function buildMeters(){
  const host = $("sigMeters");
  if(!host) return;
  host.innerHTML = "";
  ["clarity","trust","substance","fit"].forEach(k => {
    const row = document.createElement("div");
    row.className = "meter";
    row.dataset.k = k;
    row.innerHTML =
      `<span class="meter-name">${SIGNAL_LABEL[k]}</span>` +
      `<span class="meter-track"><span class="meter-fill" id="meter-${k}"></span></span>` +
      `<span class="meter-val" id="meterval-${k}">0</span>`;
    host.appendChild(row);
  });
}

/* ── Build the four-signal explainer cards ── */
const SIMPLE_SIGNALS = [
  { icon: "eye",      name: "Clarity",   line: "Can I read it fast? Short sentences win. A wall of words loses." },
  { icon: "shield",   name: "Trust",     line: "Does it sound honest or salesy? Hype and SHOUTING cost you." },
  { icon: "barchart", name: "Substance", line: "Is there a real fact under it? A number or result earns belief." },
  { icon: "target",   name: "Fit",       line: "Is it shaped for this reader? A teen wants video; a boss wants proof." }
];
function buildSimpleSignals(){
  const host = $("simpleSignals");
  if(!host) return;
  SIMPLE_SIGNALS.forEach(s => {
    const card = document.createElement("article");
    card.className = "ss-card reveal";
    card.innerHTML =
      `<span class="ss-ico">${iconSVG(s.icon, { size: 24 })}</span>` +
      `<h3 class="ss-name">${s.name}</h3>` +
      `<p class="ss-line">${s.line}</p>`;
    host.appendChild(card);
  });
}

/* ── Animate the dial number from a to b ── */
let dialAnim = null;
function animateDial(from, to){
  const numEl = $("dialNum");
  const ring = $("dialRing");
  const color = bandColor(to);
  if(ring){
    ring.style.stroke = color;
    ring.style.strokeDashoffset = String(RING_C * (1 - to / 100));
  }
  const dial = $("dial");
  if(dial) dial.style.setProperty("--dial-glow", color);

  if(reducedMotion.matches){ if(numEl) numEl.textContent = String(to); return; }
  if(dialAnim) cancelAnimationFrame(dialAnim);
  const dur = 600, start = performance.now();
  function step(now){
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const v = Math.round(from + (to - from) * eased);
    if(numEl) numEl.textContent = String(v);
    if(t < 1) dialAnim = requestAnimationFrame(step);
    else if(numEl) numEl.textContent = String(to);
  }
  dialAnim = requestAnimationFrame(step);
}

/* ── Floating +N / -N delta near the dial ── */
function showDelta(diff){
  const el = $("dialDelta");
  if(!el || diff === 0 || reducedMotion.matches) return;
  el.textContent = (diff > 0 ? "+" : "") + diff;
  el.className = "dial-delta " + (diff > 0 ? "up" : "down");
  void el.offsetWidth;            // restart the animation
  el.classList.add("fire");
  setTimeout(() => el.classList.remove("fire"), 900);
}

/* ── Pop the dial on improvement ── */
function popDial(){
  const dial = $("dial");
  if(!dial || reducedMotion.matches) return;
  dial.classList.remove("pop"); void dial.offsetWidth; dial.classList.add("pop");
}

/* ── Main render ── */
function render(animate){
  const result = computeScore();
  const score = result.empty ? 0 : result.score;
  const prev = state.score;

  // dial + level
  animateDial(prev, score);
  const lvl = levelFor(score);
  const badge = $("levelBadge");
  const levelText = $("levelText");
  if(badge){ badge.className = "level-badge " + lvl.cls; }
  if(levelText) levelText.textContent = lvl.text;

  if(animate){
    showDelta(score - prev);
    if(score > prev) popDial();
  }

  // signal meters
  const sig = result.signals || { clarity:0, trust:0, substance:0, fit:0 };
  ["clarity","trust","substance","fit"].forEach(k => {
    const fill = $("meter-" + k);
    const val = $("meterval-" + k);
    const v = Math.round(sig[k] || 0);
    if(fill){
      fill.style.width = v + "%";
      fill.style.background = v >= 70 ? "var(--green)" : (v >= 45 ? "var(--amber)" : "var(--red)");
    }
    if(val) val.textContent = String(v);
  });

  // live coaching line from the real engine
  const fixText = $("gameFixText");
  if(fixText) fixText.textContent = result.empty ? "Flip a switch to begin." : result.topFix;

  // live post preview
  renderPreview();

  state.score = score;
}

/* ── Live preview of the post being built ── */
function renderPreview(){
  const txt = $("ppText");
  const tags = $("ppTags");
  if(txt) txt.textContent = currentCaption();
  if(!tags) return;
  const b = state.boosts;
  const chips = [];
  if(b.number) chips.push("hard number");
  if(b.source) chips.push("source linked");
  if(b.visual){ chips.push("short video"); chips.push("image"); }
  if(b.human){ chips.push("real person"); chips.push("invites replies"); }
  if(b.plain){ chips.push("plain language"); chips.push("clear next step"); }
  tags.innerHTML = chips.length
    ? chips.map(c => `<span class="pp-chip">${c}</span>`).join("")
    : `<span class="pp-chip pp-empty">just text, no extras</span>`;
}

/* ── Init ── */
function init(){
  initTheme();
  initHeaderScroll();
  initEraSlider();
  refreshRelevance();      // seed the per-switch labels for the starting reader
  buildReaders();
  buildBoosts();
  buildMeters();
  buildSimpleSignals();
  render(false);

  const { handledReveal } = initMotion({ revealScroll: true });
  if(!handledReveal) initReveal();
}
document.addEventListener("DOMContentLoaded", init);
