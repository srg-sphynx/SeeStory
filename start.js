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

// Three friendly readers mapped to the real audience keys.
const READERS = [
  { key: "genz",   icon: "atom",      label: "A future scientist", sub: "Gen Z, learns from video" },
  { key: "pi",     icon: "microscope",label: "A busy lab leader",  sub: "wants proof, hates hype" },
  { key: "pharma", icon: "briefcase", label: "A pharma exec",      sub: "wants results and ROI" }
];

// Friendly switches. Each one rewrites the post and/or ticks a media plan.
// `on` is the starting state. "Drop the hype" starts OFF so the post begins messy.
const BOOSTS = [
  { id: "hype",   icon: "shield",    label: "Drop the hype words",      hint: "No more revolutionary, game-changing, world-class.", on: false },
  { id: "number", icon: "barchart",  label: "Show a real result",       hint: "A concrete number people can trust.",               on: false },
  { id: "source", icon: "database",  label: "Link the proof",           hint: "Point to a paper or page to verify.",               on: false },
  { id: "person", icon: "users",     label: "Put a real person on it",  hint: "A face and a voice, not a logo.",                   on: false },
  { id: "video",  icon: "video",     label: "Make it a short video",    hint: "A 30-second clip beats a wall of text.",            on: false },
  { id: "plain",  icon: "sparkles",  label: "Say it in plain language", hint: "One line anyone could understand.",                 on: false }
];

const LEVELS = [
  { min: 80, text: "Trusted and shared", cls: "lv-great" },
  { min: 60, text: "Worth a share",      cls: "lv-good"  },
  { min: 40, text: "Glanced at",         cls: "lv-mid"   },
  { min: 0,  text: "Scrolled past",      cls: "lv-low"   }
];

const RING_C = 326.73;     // 2 * PI * 52, matches the SVG dasharray
const state = { reader: "genz", boosts: {}, score: 0 };
BOOSTS.forEach(b => { state.boosts[b.id] = b.on; });

/** Assemble a real draft + media checklist from the friendly switches,
 *  then run it through the genuine engine. */
function computeScore(){
  const b = state.boosts;
  let caption = "Meet our new way to design molecules on a computer.";
  if(!b.hype){
    caption += " This revolutionary, game-changing, world-class breakthrough will supercharge your pipeline!";
  }
  if(b.number){
    caption += " We screened 2.4 million molecules in 48 hours and confirmed 37 real hits.";
  }
  if(b.plain){
    caption += " In plain words: the computer found the promising medicines so the lab did not have to test millions by hand.";
  }
  const checklist = {
    source: !!b.source,
    humanVoice: !!b.person,
    video: !!b.video,
    plainSummary: !!b.plain,
    resultData: !!b.number
  };
  return scoreDraft({ audienceKey: state.reader, caption, checklist });
}

function currentCaption(){
  const b = state.boosts;
  let parts = ["Meet our new way to design molecules on a computer."];
  if(!b.hype) parts.push("This revolutionary, game-changing, world-class breakthrough will supercharge your pipeline!");
  if(b.number) parts.push("We screened 2.4 million molecules in 48 hours and confirmed 37 real hits.");
  if(b.plain) parts.push("In plain words: the computer found the promising medicines so the lab did not have to test millions by hand.");
  return parts.join(" ");
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
      `<span class="boost-hint">${bt.hint}</span></span>` +
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
  if(b.video)  chips.push("video");
  if(b.person) chips.push("real person");
  if(b.source) chips.push("source linked");
  if(b.plain)  chips.push("plain language");
  if(b.number) chips.push("hard number");
  tags.innerHTML = chips.length
    ? chips.map(c => `<span class="pp-chip">${c}</span>`).join("")
    : `<span class="pp-chip pp-empty">just text, no extras</span>`;
}

/* ── Init ── */
function init(){
  initTheme();
  initHeaderScroll();
  initEraSlider();
  buildReaders();
  buildBoosts();
  buildMeters();
  buildSimpleSignals();
  render(false);

  const { handledReveal } = initMotion({ revealScroll: true });
  if(!handledReveal) initReveal();
}
document.addEventListener("DOMContentLoaded", init);
