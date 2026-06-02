/* ── learn.js ── Explore page: theme, counters, accordion, tabs, reveal ── */

import { AUDIENCES } from './data.js';

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
    key: "clarity", icon: "🔍", label: "Clarity",
    chem: "shape complementarity",
    blurb: "Can it be read at a glance? SeeSTORY watches sentence length and long-word density, penalising sentences that run past ~28 words and jargon that a non-expert audience would stumble on.",
    example: "“We reduced docking time by 40%.” lands. A 45-word sentence with five nested clauses does not."
  },
  {
    key: "trust", icon: "🛡️", label: "Trust",
    chem: "binding stability",
    blurb: "Does it read as honest or as hype? Superlatives, exclamation pile-ups, ALL-CAPS shouting and em-dash theatrics all subtract. Analytical audiences punish them hardest.",
    example: "“revolutionary, world-class, game-changing!!!” reads as marketing. A plain, specific claim reads as science."
  },
  {
    key: "substance", icon: "📊", label: "Substance",
    chem: "scoring with HYDE",
    blurb: "Is there something concrete to point at? A real number, a result or comparison, and a verifiable source each add weight. Vague enthusiasm does not.",
    example: "“37 hits confirmed in dose-response” beats “promising early signals.”"
  },
  {
    key: "fit", icon: "🎯", label: "Fit",
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
      `<span class="sig-icon">${s.icon}</span>` +
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

/* ── Audience cards (reuse the engine's real weights) ── */
const SIGNAL_ORDER = [
  { k: "clarity", label: "Clarity" },
  { k: "trust", label: "Trust" },
  { k: "substance", label: "Substance" },
  { k: "fit", label: "Fit" }
];

function buildAudienceCards(){
  const host = $("audienceCards");
  if(!host) return;
  Object.values(AUDIENCES).forEach(aud => {
    const card = document.createElement("article");
    card.className = "aud-explain reveal";

    const top = `<h4>${aud.label}</h4><p class="aud-explain-blurb">${aud.blurb}</p>`;

    const max = Math.max(...SIGNAL_ORDER.map(s => aud.weights[s.k]));
    const bars = SIGNAL_ORDER.map(s => {
      const w = aud.weights[s.k];
      const pct = Math.round(w * 100);
      const lead = w === max ? " lead" : "";
      return `<div class="wbar-row${lead}">
        <span class="wbar-label">${s.label}</span>
        <span class="wbar-track"><span class="wbar-fill" style="width:${Math.round((w / max) * 100)}%"></span></span>
        <span class="wbar-val">${pct}%</span>
      </div>`;
    }).join("");

    card.innerHTML = top + `<div class="wbar-set">${bars}</div>`;
    host.appendChild(card);
  });
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
    { label: "Software", value: 180, color: "var(--green)" },
    { label: "Drug discovery", value: 27, color: "var(--blue)" }
  ];
  const max = 180;
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
  buildAudienceCards();
  buildCompanies();
  buildChart();
  initCounters();
  initReveal();
}
document.addEventListener("DOMContentLoaded", init);
