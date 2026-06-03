/* ── learn.js ── Explore page: theme, counters, accordion, tabs, reveal ── */

import { AUDIENCES, PERSONAS, MEDIA_LABEL } from './data.js';
import { initMotion } from './motion.js';
import { iconSVG } from './icons.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ── Theme (light / dark / auto) — standalone, mirrors the tool ── */
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

/* ── Lift the sticky command bar once the hero scrolls past ── */
function initHeaderScroll(){
  const bar = $("topbar");
  if(!bar) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    bar.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", () => { if(!ticking){ requestAnimationFrame(update); ticking = true; } }, { passive: true });
  update();
}

/* ── Count-up stats ── */
function formatNum(value, decimals, prefix, suffix){
  const n = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return prefix + n + suffix;
}
function animateCount(el){
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const decimals = (String(el.dataset.count).split(".")[1] || "").length;

  if(reducedMotion.matches){ el.textContent = formatNum(target, decimals, prefix, suffix); return; }

  const duration = 1200;
  const start = performance.now();
  function step(now){
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = formatNum(target * eased, decimals, prefix, suffix);
    if(t < 1) requestAnimationFrame(step);
    else el.textContent = formatNum(target, decimals, prefix, suffix);
  }
  requestAnimationFrame(step);
}
function initCounters(){
  const nums = document.querySelectorAll(".stat-num");
  if(!nums.length) return;
  if(!("IntersectionObserver" in window)){ nums.forEach(animateCount); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){ animateCount(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  nums.forEach(n => io.observe(n));
}

/* ── Reveal on scroll ── */
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

/* ── The four signals ── */
const SIGNALS_INFO = [
  {
    key: "clarity", icon: "eye", label: "Clarity",
    chem: "shape complementarity",
    blurb: "Can it be read at a glance? SeeSTORY watches sentence length and long-word density, penalising sentences that run past ~28 words and jargon that a non-expert audience would stumble on.",
    example: "“We reduced docking time by 40%.” lands. A 45-word sentence with five nested clauses does not."
  },
  {
    key: "trust", icon: "shield", label: "Trust",
    chem: "binding stability",
    blurb: "Does it read as honest or as hype? Superlatives, exclamation pile-ups, ALL-CAPS shouting and em-dash theatrics all subtract. Analytical audiences punish them hardest.",
    example: "“revolutionary, world-class, game-changing!!!” reads as marketing. A plain, specific claim reads as science."
  },
  {
    key: "substance", icon: "barchart", label: "Substance",
    chem: "scoring with HYDE",
    blurb: "Is there something concrete to point at? A real number, a result or comparison, and a verifiable source each add weight. Vague enthusiasm does not.",
    example: "“37 hits confirmed in dose-response” beats “promising early signals.”"
  },
  {
    key: "fit", icon: "target", label: "Fit",
    chem: "the right binding pocket",
    blurb: "Does it carry what this specific audience wants? Gen Z weights video and a human voice; a PI weights numbers and sources. Fit re-weights everything by who is reading.",
    example: "A face-to-camera reel scores high for Gen Z and low for a pharma decision-maker chasing ROI."
  }
];

function buildSignalAccordion(){
  const host = $("signalAccordion");
  if(!host) return;
  SIGNALS_INFO.forEach((s, i) => {
    const item = document.createElement("div");
    item.className = "sig-item";
    item.dataset.open = "false";

    const head = document.createElement("button");
    head.className = "sig-head";
    head.setAttribute("aria-expanded", "false");
    head.innerHTML =
      `<span class="sig-icon">${iconSVG(s.icon, { size: 24 })}</span>` +
      `<span class="sig-titles"><span class="sig-name">${s.label}</span>` +
      `<span class="sig-chem">like ${s.chem}</span></span>` +
      `<span class="sig-chev" aria-hidden="true">&rsaquo;</span>`;

    const body = document.createElement("div");
    body.className = "sig-wrap";
    const inner = document.createElement("div");
    inner.className = "sig-inner";
    inner.innerHTML =
      `<p class="sig-blurb">${s.blurb}</p>` +
      `<p class="sig-example"><span class="sig-eg-label">In practice</span>${s.example}</p>`;
    body.appendChild(inner);

    head.addEventListener("click", () => {
      const open = item.dataset.open === "true";
      item.dataset.open = String(!open);
      head.setAttribute("aria-expanded", String(!open));
    });

    item.appendChild(head);
    item.appendChild(body);
    host.appendChild(item);
    if(i === 0){ item.dataset.open = "true"; head.setAttribute("aria-expanded", "true"); }
  });
}

/* ── Audience signal weights (reuse the engine's real numbers) ── */
const SIGNAL_ORDER = [
  { k: "clarity", label: "Clarity" },
  { k: "trust", label: "Trust" },
  { k: "substance", label: "Substance" },
  { k: "fit", label: "Fit" }
];

/* ── Interactive persona deck: swipeable cards, animated weight
      "fingerprint", count-up of the dominant signal, and a collapsible
      media-diet built from the engine's real per-audience weights. ── */
function buildPersonaDeck(){
  const deck = $("personaDeck");
  const track = $("deckTrack");
  const nav = $("deckNav");
  const dots = $("deckDots");
  const viewport = $("deckViewport");
  const prevBtn = $("deckPrev");
  const nextBtn = $("deckNext");
  if(!deck || !track || !nav || !dots || !viewport) return;

  const total = PERSONAS.length;
  const cards = [];
  let active = 0;

  PERSONAS.forEach((p, i) => {
    const aud = AUDIENCES[p.key] || { weights: {}, wants: {} };
    const weights = aud.weights || {};
    const max = Math.max(...SIGNAL_ORDER.map(s => weights[s.k] || 0)) || 1;
    const topSignal = SIGNAL_ORDER.reduce((a, b) => (weights[b.k] || 0) > (weights[a.k] || 0) ? b : a);
    const topPct = Math.round((weights[topSignal.k] || 0) * 100);

    const bars = SIGNAL_ORDER.map(s => {
      const w = weights[s.k] || 0;
      const pct = Math.round(w * 100);
      const lead = s.k === topSignal.k ? " lead" : "";
      const target = Math.round((w / max) * 100);
      return `<div class="wbar-row${lead}">
        <span class="wbar-label">${s.label}</span>
        <span class="wbar-track"><span class="wbar-fill" data-w="${target}" style="width:0"></span></span>
        <span class="wbar-val">${pct}%</span>
      </div>`;
    }).join("");

    // Media diet — sorted, highest preference first.
    const media = Object.entries(aud.wants || {}).sort((a, b) => b[1] - a[1]);
    const mediaMax = media.length ? media[0][1] : 1;
    const mediaRows = media.map(([k, v]) => {
      const pct = Math.round(v * 100);
      return `<div class="mbar-row">
        <span class="mbar-label">${MEDIA_LABEL[k] || k}</span>
        <span class="mbar-track"><span class="mbar-fill" data-w="${Math.round((v / mediaMax) * 100)}" style="width:0"></span></span>
        <span class="mbar-val">${pct}%</span>
      </div>`;
    }).join("");

    const wants = p.wants.map(w => `<li>${w}</li>`).join("");
    const repels = p.repels.map(r => `<li>${r}</li>`).join("");

    const card = document.createElement("article");
    card.className = "pcard";
    card.setAttribute("role", "tabpanel");
    card.setAttribute("aria-label", p.name);
    card.innerHTML =
      `<div class="pcard-top">
        <span class="pcard-avatar">${iconSVG(p.icon, { size: 28 })}</span>
        <div class="pcard-id">
          <h4>${p.name}</h4>
          <span class="pcard-age">Ages ${p.age}</span>
        </div>
        <span class="pcard-count">${String(i + 1).padStart(2, "0")}<span class="pc-sep">/</span>${String(total).padStart(2, "0")}</span>
      </div>
      <p class="pcard-tagline">${iconSVG("sparkles", { size: 14 })} ${p.tagline}</p>
      <p class="pcard-bio">${p.bio}</p>

      <div class="pcard-fingerprint">
        <div class="fp-head">
          <span class="fp-label">Signal fingerprint</span>
          <span class="fp-top">Leads on <strong>${topSignal.label}</strong> · <span class="fp-top-num" data-count="${topPct}" data-suffix="%">0%</span></span>
        </div>
        <div class="wbar-set">${bars}</div>
      </div>

      <button class="media-toggle" aria-expanded="false">
        ${iconSVG("video", { size: 16 })}
        <span>What this reader actually consumes</span>
        <span class="mt-chev" aria-hidden="true">&rsaquo;</span>
      </button>
      <div class="media-wrap"><div class="media-inner">
        <div class="mbar-set">${mediaRows}</div>
        <p class="media-note">Higher bars mean a stronger pull. SeeSTORY rewards drafts that carry what sits near the top.</p>
      </div></div>

      <div class="pcard-cols">
        <div class="pcol pcol-want">
          <span class="pcol-head green">${iconSVG("checkCircle", { size: 15 })} What they respond to</span>
          <ul>${wants}</ul>
        </div>
        <div class="pcol pcol-repel">
          <span class="pcol-head red">${iconSVG("alert", { size: 15 })} What turns them off</span>
          <ul>${repels}</ul>
        </div>
      </div>`;

    // Per-card media-diet dropdown
    const mToggle = card.querySelector(".media-toggle");
    mToggle.addEventListener("click", () => {
      const open = mToggle.getAttribute("aria-expanded") === "true";
      mToggle.setAttribute("aria-expanded", String(!open));
      card.classList.toggle("media-open", !open);
      if(!open) animateMedia(card);
    });

    track.appendChild(card);
    cards.push(card);

    // Top nav chip
    const chip = document.createElement("button");
    chip.className = "deck-chip";
    chip.setAttribute("role", "tab");
    chip.innerHTML = `<span class="chip-ic">${iconSVG(p.icon, { size: 17 })}</span><span class="chip-name">${p.name}</span>`;
    chip.addEventListener("click", () => go(i));
    nav.appendChild(chip);

    // Bottom dot
    const dot = document.createElement("button");
    dot.className = "deck-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", p.name);
    dot.addEventListener("click", () => go(i));
    dots.appendChild(dot);
  });

  function animateBars(card){
    card.querySelectorAll(".wbar-fill").forEach(f => { f.style.width = (f.dataset.w || 0) + "%"; });
    const numEl = card.querySelector(".fp-top-num");
    if(numEl) animateCount(numEl);
  }
  function animateMedia(card){
    card.querySelectorAll(".mbar-fill").forEach(f => { f.style.width = (f.dataset.w || 0) + "%"; });
  }

  function go(i){
    active = (i + total) % total;
    track.style.transform = `translateX(-${active * 100}%)`;
    [...nav.children].forEach((c, idx) => c.setAttribute("aria-selected", String(idx === active)));
    [...dots.children].forEach((d, idx) => { d.classList.toggle("on", idx === active); d.setAttribute("aria-selected", String(idx === active)); });
    cards.forEach((c, idx) => c.classList.toggle("active", idx === active));
    animateBars(cards[active]);
  }

  if(prevBtn) prevBtn.addEventListener("click", () => go(active - 1));
  if(nextBtn) nextBtn.addEventListener("click", () => go(active + 1));

  // Keyboard arrows when the deck has focus / is hovered
  deck.tabIndex = 0;
  deck.addEventListener("keydown", (e) => {
    if(e.key === "ArrowLeft"){ go(active - 1); e.preventDefault(); }
    else if(e.key === "ArrowRight"){ go(active + 1); e.preventDefault(); }
  });

  // Touch swipe
  let startX = 0, startY = 0, swiping = false;
  viewport.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; swiping = true;
  }, { passive: true });
  viewport.addEventListener("touchend", (e) => {
    if(!swiping) return; swiping = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if(Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)){
      go(dx < 0 ? active + 1 : active - 1);
    }
  }, { passive: true });

  go(0);
}

/* ── Competitive landscape ── */
const COMPANIES = [
  {
    name: "BioSolveIT", tag: "The host of this poster",
    founded: "2001", hq: "Sankt Augustin, Germany", model: "Private",
    flagship: "SeeSAR · infiniSee · FlexX",
    focus: "Interactive 3D molecular design, ultra-large chemical-space search, and visual docking.",
    comms: "Deep, beautiful 3D science. The opportunity for the next 25 years: move those visuals out from behind a download button and into the feeds, decks and reels where the next generation already lives."
  },
  {
    name: "Schrödinger", tag: "Public (NASDAQ: SDGR)",
    founded: "1990", hq: "New York, USA", model: "Public · IPO 2020",
    flagship: "Maestro · FEP+",
    focus: "Physics-based computational platform for therapeutics and materials, plus its own drug-discovery pipeline.",
    comms: "Sets the bar for credibility: peer-reviewed validation, investor-grade clarity, and named pharma collaborations (Novartis, Lilly, Otsuka). Substance and Trust, dialled to maximum."
  },
  {
    name: "Molsoft", tag: "Boutique specialist",
    founded: "1994", hq: "La Jolla, USA", model: "Private",
    flagship: "ICM-Pro",
    focus: "Internal-coordinates modelling, docking and cheminformatics with a famously compact, expert toolset.",
    comms: "A small team with outsized technical depth. Its early work bringing publications to life in interactive 3D is exactly the clarity-with-substance bet SeeSTORY rewards."
  },
  {
    name: "OpenEye, Cadence", tag: "Cloud-native",
    founded: "1997", hq: "Santa Fe, USA", model: "Acquired by Cadence (2022)",
    flagship: "Orion · ROCS · OEDocking",
    focus: "Shape-based design and large-scale computation delivered through the Orion cloud platform.",
    comms: "Leans into a cloud, platform-first story - the kind of accessible, on-demand framing that travels well to a younger, software-native audience."
  },
  {
    name: "Chemical Computing Group", tag: "Academic favourite",
    founded: "1994", hq: "Montreal, Canada", model: "Private",
    flagship: "MOE",
    focus: "An integrated molecular-modelling environment widely taught and used across academia and pharma.",
    comms: "Trusted because it is everywhere in training. Strong Fit with the peer-scientist and PI audiences who learned on it."
  },
  {
    name: "Cresset", tag: "Field-based design",
    founded: "2001", hq: "Cambridge, UK", model: "Private",
    flagship: "Flare · Spark · Forge",
    focus: "Electrostatic / field-based ligand and structure-based design tools.",
    comms: "Approachable, application-led storytelling - case studies over equations - which fits a broad working-scientist audience."
  }
];

function buildCompanies(){
  const tabs = $("companyTabs");
  const panel = $("companyPanel");
  if(!tabs || !panel) return;

  const render = (c) => {
    panel.innerHTML =
      `<div class="company-head">
        <h4>${c.name}</h4>
        <span class="company-tag">${c.tag}</span>
      </div>
      <div class="company-facts">
        <div class="fact"><span class="fact-k">Founded</span><span class="fact-v">${c.founded}</span></div>
        <div class="fact"><span class="fact-k">HQ</span><span class="fact-v">${c.hq}</span></div>
        <div class="fact"><span class="fact-k">Model</span><span class="fact-v">${c.model}</span></div>
        <div class="fact"><span class="fact-k">Flagship</span><span class="fact-v">${c.flagship}</span></div>
      </div>
      <p class="company-focus">${c.focus}</p>
      <div class="company-comms">
        <span class="comms-label">Communication signal</span>
        <p>${c.comms}</p>
      </div>`;
  };

  COMPANIES.forEach((c, i) => {
    const tab = document.createElement("button");
    tab.className = "company-tab";
    tab.setAttribute("role", "tab");
    tab.textContent = c.name;
    tab.setAttribute("aria-selected", String(i === 0));
    tab.addEventListener("click", () => {
      tabs.querySelectorAll(".company-tab").forEach(t => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");
      render(c);
    });
    tabs.appendChild(tab);
  });
  render(COMPANIES[0]);
}

/* ── Schrödinger revenue bar chart (illustrative of the real split) ── */
function buildChart(){
  const host = $("sdgrChart");
  if(!host) return;
  const data = [
    { label: "Software", value: 199.5, color: "var(--green)" },
    { label: "Drug discovery", value: 56.4, color: "var(--blue)" }
  ];
  const max = 199.5;
  data.forEach(d => {
    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      `<span class="chart-label">${d.label}</span>
       <span class="chart-bar-track"><span class="chart-bar-fill" data-w="${Math.round((d.value / max) * 100)}" style="width:0;background:${d.color}"></span></span>
       <span class="chart-val">$${d.value}M</span>`;
    host.appendChild(row);
  });
  // animate widths when the chart scrolls into view
  const fills = host.querySelectorAll(".chart-bar-fill");
  const grow = () => fills.forEach(f => { f.style.width = f.dataset.w + "%"; });
  if(reducedMotion.matches || !("IntersectionObserver" in window)){ grow(); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ grow(); io.disconnect(); } });
  }, { threshold: 0.3 });
  io.observe(host);
}

/* ── Init ── */
function init(){
  initTheme();
  initHeaderScroll();
  buildSignalAccordion();
  buildPersonaDeck();
  buildCompanies();
  buildChart();
  initCounters();
  // GSAP owns the staggered scroll reveals here (no display:none reveal targets);
  // falls back to the IntersectionObserver version if GSAP/motion is unavailable.
  const { handledReveal } = initMotion({ revealScroll: true });
  if(!handledReveal) initReveal();
}
document.addEventListener("DOMContentLoaded", init);
