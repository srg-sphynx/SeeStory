# SeeSTORY: The Resonance Engine

**A build guide for the interactive companion site to the Story-Activity Relationships poster.**
Author: Saketa, Sales & Marketing, BioSolveIT
Status: concept piece and portfolio demo (not an official BioSolveIT product)

---

## 0. What you are building, in one sentence

A single-page, mobile-first web app where a visitor picks an **audience** (the binding pocket), assembles a piece of content from **fragments** (anchor-and-grow), pastes an optional **caption**, and the page returns a live **Resonance Score** with a HYDE-style breakdown and a Story-Activity Spotter that flags drivers and show-stoppers.

It is the playable version of the poster. No backend, no framework, no login. Everything runs in the browser so you can host it as a static file and point a QR code at it.

> The "model" is a transparent, rule-based scorer. That is on purpose and on-brand: the poster jokes about GPU-free evaluation, so the logic stays honest, explainable, and fast.

---

## 1. Design principles

1. **Mobile first.** Most QR scans happen on a phone. Design for a 360 to 430 px viewport, then let it breathe on larger screens. One column always.
2. **Live feedback.** The score updates on every toggle and keystroke. Nothing is hidden behind a submit button.
3. **Explainable.** Every point in the score traces back to a visible reason. No black boxes.
4. **Brand-true.** BioSolveIT green `#178A38` and blue `#104173`, white background, clean sans type, no hyperbole in the copy.
5. **Featherweight.** Vanilla HTML, CSS, and JS. No build step. Target under 60 KB total before the optional font.

---

## 2. Tech choices

| Concern | Choice | Why |
|---|---|---|
| Framework | None (vanilla JS) | Nothing here needs React. Keeps it tiny and host-anywhere. |
| Files | One `index.html`, or split into 4 | Single file is simplest. Split version is given for tidiness. |
| Styling | Plain CSS with custom properties | Theming via `--brand-green` etc. Easy to keep on-brand. |
| State sharing | URL hash | A shareable link with no server. Optional `localStorage` for drafts. |
| Fonts | System stack, optional self-hosted BioSans | The poster font is licensed, so default to a clean fallback and only swap in BioSans if you have web rights. |
| QR | Generate offline, drop the image in | The site does not need to know its own QR. |

---

## 3. File structure

Start with the single-file version. Promote to the split version only if it grows.

**Single file**
```
seestory/
  index.html        # HTML + CSS + JS all inline
  favicon.svg
  /fonts/           # optional, only if you have BioSans web rights
```

**Split version (optional)**
```
seestory/
  index.html        # markup only
  styles.css        # design system + components
  data.js           # audiences, fragments, lexicon
  app.js            # scoring engine + UI wiring
  favicon.svg
```

---

## 4. Design system (mobile-first CSS)

Define everything as tokens so the whole site stays consistent and easy to retheme.

```css
:root{
  /* brand */
  --green:#178A38;
  --green-soft:#178A3814;     /* 8% tint for fills */
  --blue:#104173;
  --blue-soft:#10417314;
  --red:#C0392B;              /* show-stopper marker only */
  --ink:#1d2733;              /* body text */
  --muted:#5a6573;
  --line:#d7dde3;
  --bg:#ffffff;
  --card:#ffffff;

  /* type: swap the first name for BioSans if self-hosted */
  --font: "BioSans", "Inter", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;

  /* spacing scale */
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:32px; --s7:48px;

  --radius:14px;
  --tap:48px;                 /* minimum touch target */
  --shadow:0 2px 10px rgba(16,65,115,.10);
}

*{box-sizing:border-box}
html,body{margin:0}
body{
  font-family:var(--font);
  color:var(--ink);
  background:var(--bg);
  line-height:1.45;
  -webkit-text-size-adjust:100%;
}

/* container: phone-first, capped on desktop */
.wrap{
  width:100%;
  max-width:600px;
  margin:0 auto;
  padding:var(--s4) var(--s4) 120px;   /* bottom pad clears the sticky score bar */
}

/* headings */
h1{font-size:1.5rem;line-height:1.15;color:var(--blue);margin:0 0 var(--s2)}
h2{font-size:1.15rem;color:var(--blue);margin:var(--s6) 0 var(--s3)}
.sub{color:var(--green);font-weight:600;margin:0 0 var(--s5)}

/* card */
.card{
  background:var(--card);
  border:2px solid var(--line);
  border-radius:var(--radius);
  padding:var(--s4);
  margin-bottom:var(--s4);
}
.card.green{border-color:var(--green)}
.card.blue{border-color:var(--blue)}

/* chips: the toggle fragments */
.chips{display:flex;flex-wrap:wrap;gap:var(--s2)}
.chip{
  min-height:var(--tap);
  display:inline-flex;align-items:center;
  padding:0 var(--s4);
  border:2px solid var(--line);
  border-radius:999px;
  background:#fff;color:var(--ink);
  font-size:.95rem;cursor:pointer;
  user-select:none;
  transition:background .12s,border-color .12s,color .12s;
}
.chip[aria-pressed="true"]{
  background:var(--green-soft);
  border-color:var(--green);
  color:var(--blue);
  font-weight:600;
}

/* segmented control: audience picker */
.seg{display:flex;flex-wrap:wrap;gap:var(--s2)}
.seg button{
  flex:1 1 45%;
  min-height:var(--tap);
  border:2px solid var(--line);border-radius:var(--radius);
  background:#fff;color:var(--ink);font-size:.95rem;cursor:pointer;
}
.seg button[aria-pressed="true"]{
  border-color:var(--blue);background:var(--blue-soft);color:var(--blue);font-weight:600;
}

/* textarea */
textarea{
  width:100%;min-height:120px;resize:vertical;
  border:2px solid var(--line);border-radius:var(--radius);
  padding:var(--s3);font:inherit;color:var(--ink);
}
textarea:focus{outline:none;border-color:var(--blue)}

/* sticky score bar (mobile anchor) */
.scorebar{
  position:fixed;left:0;right:0;bottom:0;
  background:#fff;border-top:2px solid var(--line);
  padding:var(--s3) var(--s4);
  display:flex;align-items:center;gap:var(--s4);
  max-width:600px;margin:0 auto;
}
.scorebar .num{font-size:2rem;font-weight:800;line-height:1}
.scorebar .bar{flex:1;height:12px;border-radius:999px;background:#eef1f4;overflow:hidden}
.scorebar .fill{height:100%;width:0;background:var(--green);transition:width .25s}

/* spotter lists */
.spot li{list-style:none;margin:var(--s2) 0;padding-left:1.6em;position:relative}
.spot .driver::before{content:"+";color:var(--green);font-weight:800;position:absolute;left:0}
.spot .stopper::before{content:"\00D7";color:var(--red);font-weight:800;position:absolute;left:0}
mark{background:#ffe9e6;color:var(--red);padding:0 .15em;border-radius:3px}

/* respect user motion + larger desktop */
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
@media (min-width:601px){
  .wrap{padding-top:var(--s6)}
  .scorebar{border:2px solid var(--line);border-radius:var(--radius);bottom:var(--s4);}
}
```

Notes that matter on phones:
- Every tappable thing is at least 48 px tall.
- The score bar is `position:fixed` at the bottom so the number is always in thumb reach while the user toggles fragments higher up.
- `max-width:600px` keeps lines readable on tablets and desktop without a second layout.

---

## 5. Data model (`data.js`)

Three objects drive everything: **audiences**, **fragments**, and the **show-stopper lexicon**.

### 5.1 Audiences (the binding pockets)

Each audience has a weight vector over the four Resonance Classes. Weights sum to 1. They tilt the score toward what that audience actually responds to.

```js
const AUDIENCES = {
  genz: {
    label: "Gen Z chemist",
    weights: { clarity:0.20, voice:0.25, visual:0.30, community:0.25 },
    hint: "Short, visual, community-led. Jargon walls repel."
  },
  genalpha: {
    label: "Gen Alpha student",
    weights: { clarity:0.20, voice:0.15, visual:0.35, community:0.30 },
    hint: "Playful and interactive wins. Formality loses."
  },
  pi: {
    label: "Academic PI",
    weights: { clarity:0.35, voice:0.30, visual:0.15, community:0.20 },
    hint: "Precision and proof. Hype is a turn-off."
  },
  pharma: {
    label: "Pharma decision-maker",
    weights: { clarity:0.30, voice:0.30, visual:0.20, community:0.20 },
    hint: "Concrete results and clear value. No vagueness."
  }
};
```

### 5.2 Fragments (anchor-and-grow library)

The visitor picks one **anchor** and then grows the draft with optional fragments. Every fragment carries a `class` (one of the four) and a `value` from 0 to 1 that is its intrinsic strength before the audience weighting is applied.

```js
// Anchors: the seed of the message. Pick exactly one.
const ANCHORS = [
  { id:"a_result",  text:"We found active molecules faster.",         class:"clarity", value:0.9 },
  { id:"a_story",   text:"Here is how one screen actually went.",      class:"voice",   value:0.8 },
  { id:"a_visual",  text:"Watch the pose appear in real time.",        class:"visual",  value:0.85 },
  { id:"a_invite",  text:"Bring your target, we will screen it live.", class:"community",value:0.8 }
];

// Grow fragments: toggle any number on.
const FRAGMENTS = [
  // Clarity
  { id:"f_number",  text:"Add a concrete number",        class:"clarity", value:0.8 },
  { id:"f_oneidea", text:"Keep one idea only",           class:"clarity", value:0.7 },
  { id:"f_plain",   text:"Plain-language summary",       class:"clarity", value:0.75 },
  // Voice
  { id:"f_human",   text:"First-person, human tone",     class:"voice",   value:0.75 },
  { id:"f_nohype",  text:"Strip the hyperbole",          class:"voice",   value:0.85 },
  { id:"f_cta",     text:"One clear call to action",     class:"voice",   value:0.7 },
  // Visual
  { id:"f_short",   text:"Short-form video clip",        class:"visual",  value:0.85 },
  { id:"f_palette", text:"Green and blue layout",        class:"visual",  value:0.6 },
  { id:"f_face",    text:"A real face on screen",        class:"visual",  value:0.7 },
  // Community
  { id:"f_reply",   text:"Invite replies",               class:"community",value:0.7 },
  { id:"f_takeover",text:"Scientist takeover",           class:"community",value:0.75 },
  { id:"f_share",   text:"Shareable workflow",           class:"community",value:0.65 }
];

const CLASSES = ["clarity","voice","visual","community"];
const CLASS_LABEL = { clarity:"Clarity", voice:"Voice", visual:"Visual", community:"Community" };
const CLASS_COLOR = { clarity:"#178A38", voice:"#104173", visual:"#178A38", community:"#104173" };
```

### 5.3 Show-stopper lexicon (Story-Activity Spotter inputs)

This is where your real brand rules live. Edit these lists freely.

```js
const HYPE_WORDS = [
  "revolutionary","game-changing","game changer","world-class","cutting-edge",
  "cutting edge","unprecedented","best-in-class","best in class","synergy",
  "leverage","disruptive","next-generation","next generation","groundbreaking",
  "state-of-the-art","seamless","robust","paradigm","supercharge","unlock",
  "skyrocket","mind-blowing","ultimate"
];

const DRIVER_RULES = {
  shortSentenceMax: 15,    // avg words per sentence at or under this earns points
  rewardNumbers: true,     // a digit or % in the text earns points
  rewardCTA: true          // a question mark or imperative opener earns points
};

const STOPPER_RULES = {
  longSentenceMin: 30,     // any sentence over this is flagged
  emDash: true,            // flag the em dash and the en dash
  shouting: true           // flag ALL-CAPS runs of 3+ words
};
```

---

## 6. The Resonance scoring algorithm

This is the heart of the app. Keep it pure: same inputs always give the same score.

### 6.1 Inputs

- `audienceKey` (one of `AUDIENCES`)
- `anchorId` (one of `ANCHORS`)
- `selected` (a Set of fragment ids that are toggled on)
- `caption` (the free-text string)

### 6.2 Steps

1. **Pocket fit (0 to 1).** For each class, sum the `value` of the anchor and any selected fragments in that class, cap each class sum at 1, then weight by the audience vector and add up.
2. **Text score (roughly -1 to +1).** Run the caption through the Spotter. Drivers add, show-stoppers subtract.
3. **Resonance (0 to 100).** Blend the two and clamp.

### 6.3 Reference implementation

```js
function splitSentences(text){
  return text.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
}
function wordCount(s){ return (s.match(/\S+/g) || []).length; }

function analyseText(caption){
  const drivers = [];
  const stoppers = [];           // each: {label, snippet}
  const text = caption.trim();
  if(!text){ return { drivers, stoppers, points:0 }; }

  const sentences = splitSentences(text);
  const words = wordCount(text);
  const avgLen = words / Math.max(sentences.length,1);

  let points = 0;

  // drivers
  if(avgLen <= DRIVER_RULES.shortSentenceMax){
    drivers.push("Short, declarative sentences"); points += 0.30;
  }
  if(DRIVER_RULES.rewardNumbers && /\d/.test(text)){
    drivers.push("Includes a concrete number"); points += 0.20;
  }
  if(DRIVER_RULES.rewardCTA && /\?|^\s*(try|join|watch|bring|see|download|read)\b/i.test(text)){
    drivers.push("Has a clear call to action"); points += 0.15;
  }

  // show-stoppers
  const lower = text.toLowerCase();
  HYPE_WORDS.forEach(w=>{
    if(lower.includes(w)){ stoppers.push({label:"Hyperbole", snippet:w}); points -= 0.20; }
  });
  if(STOPPER_RULES.emDash && /[—–]/.test(text)){
    stoppers.push({label:"Em or en dash", snippet:"— or –"}); points -= 0.15;
  }
  sentences.forEach(s=>{
    if(wordCount(s) >= STOPPER_RULES.longSentenceMin){
      stoppers.push({label:"Run-on sentence", snippet:s.slice(0,40)+"…"}); points -= 0.15;
    }
  });
  if(STOPPER_RULES.shouting){
    const caps = text.match(/\b[A-Z]{2,}(\s+[A-Z]{2,}){2,}\b/g);
    if(caps){ stoppers.push({label:"Shouting in caps", snippet:caps[0]}); points -= 0.10; }
  }

  // clamp text points to a sane band
  points = Math.max(-1, Math.min(1, points));
  return { drivers, stoppers, points };
}

function pocketFit(audienceKey, anchorId, selected){
  const aud = AUDIENCES[audienceKey];
  const sums = { clarity:0, voice:0, visual:0, community:0 };

  const anchor = ANCHORS.find(a=>a.id===anchorId);
  if(anchor){ sums[anchor.class] += anchor.value; }

  FRAGMENTS.forEach(f=>{
    if(selected.has(f.id)){ sums[f.class] += f.value; }
  });

  // cap each class at 1, then weight
  let fit = 0;
  const breakdown = {};
  CLASSES.forEach(c=>{
    const capped = Math.min(sums[c], 1);
    const contrib = capped * aud.weights[c];
    breakdown[c] = contrib;             // for the HYDE-style bars
    fit += contrib;
  });
  return { fit, breakdown };            // fit is 0 to 1
}

function resonance(audienceKey, anchorId, selected, caption){
  const { fit, breakdown } = pocketFit(audienceKey, anchorId, selected);
  const text = analyseText(caption);

  // blend: pocket fit is the backbone, text nudges it
  let score = 40 + fit*45 + text.points*15;   // 40 base, 0..45 from fit, ±15 from text
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, fit, breakdown, text };
}
```

### 6.4 Score banding (color and label)

```js
function band(score){
  if(score >= 75) return { color:"#178A38", label:"High affinity" };
  if(score >= 50) return { color:"#C9A227", label:"Binds, can improve" };
  return            { color:"#C0392B", label:"Weak fit" };
}
```

### 6.5 Optimized pose (suggestions)

Turn the Spotter findings into plain instructions. This is the payoff that makes the tool feel useful.

```js
function suggestions(result){
  const tips = [];
  result.text.stoppers.forEach(s=>{
    if(s.label==="Hyperbole") tips.push(`Replace "${s.snippet}" with a specific result.`);
    if(s.label==="Em or en dash") tips.push("Swap the dash for a period or a comma.");
    if(s.label==="Run-on sentence") tips.push("Split the long sentence into two.");
    if(s.label==="Shouting in caps") tips.push("Drop the all-caps. Let the point carry itself.");
  });
  // weakest class for this audience
  const aud = AUDIENCES[/*current*/ state.audience];
  const weakest = CLASSES
    .map(c=>({c, gap: aud.weights[c] - result.breakdown[c]}))
    .sort((a,b)=>b.gap-a.gap)[0];
  if(weakest && weakest.gap > 0.05){
    tips.push(`Add a ${CLASS_LABEL[weakest.c]} fragment. This audience weights it heavily.`);
  }
  if(!tips.length) tips.push("Strong pose. Ship it.");
  return tips;
}
```

---

## 7. UI flow and mobile wireframe

One scroll, top to bottom. The score bar stays pinned.

```
┌───────────────────────────┐
│  SeeSTORY                  │   header: title + one-line sub
│  The Resonance Engine      │
├───────────────────────────┤
│  1. Pick your audience     │   segmented buttons (2 per row on phone)
│  [Gen Z][Gen Alpha]        │
│  [PI][Pharma]              │
│  hint line for the choice  │
├───────────────────────────┤
│  2. Choose an anchor       │   4 radio-style chips, pick one
│  ( ) result ( ) story ...  │
├───────────────────────────┤
│  3. Grow the draft         │   chips grouped by class, multi-select
│  Clarity  [+number][+plain]│
│  Voice    [+human][-hype]  │
│  Visual   [+video][+face]  │
│  Community[+reply][+share] │
├───────────────────────────┤
│  4. Paste your caption     │   textarea, live spotter under it
│  [ textarea ]              │
│  Spotter: + drivers        │
│           × show-stoppers  │
├───────────────────────────┤
│  Breakdown (HYDE-style)    │   4 horizontal bars per class
│  Clarity  ▓▓▓▓░░  Voice ▓▓ │
├───────────────────────────┤
│  Suggestions               │   the optimized-pose tips
└───────────────────────────┘
┌───────────────────────────┐
│  72   ▓▓▓▓▓▓▓░░  High      │   sticky score bar (always visible)
└───────────────────────────┘
```

Render order in the DOM matches this. On desktop the same column just centers with more margin.

---

## 8. Markup skeleton (`index.html`)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SeeSTORY · The Resonance Engine</title>
<link rel="icon" href="favicon.svg">
<style>/* paste section 4 CSS here */</style>
</head>
<body>
<main class="wrap">
  <h1>SeeSTORY</h1>
  <p class="sub">The Resonance Engine</p>

  <section class="card blue" aria-labelledby="h-aud">
    <h2 id="h-aud">1. Pick your audience</h2>
    <div class="seg" id="audience" role="group" aria-label="Audience"></div>
    <p class="muted" id="audHint"></p>
  </section>

  <section class="card" aria-labelledby="h-anchor">
    <h2 id="h-anchor">2. Choose an anchor</h2>
    <div class="chips" id="anchors" role="radiogroup" aria-label="Anchor"></div>
  </section>

  <section class="card" aria-labelledby="h-grow">
    <h2 id="h-grow">3. Grow the draft</h2>
    <div id="fragments"></div>
  </section>

  <section class="card" aria-labelledby="h-cap">
    <h2 id="h-cap">4. Paste your caption</h2>
    <textarea id="caption" placeholder="Write or paste your post caption..."></textarea>
    <ul class="spot" id="spotter"></ul>
  </section>

  <section class="card green" aria-labelledby="h-break">
    <h2 id="h-break">Resonance breakdown</h2>
    <div id="breakdown"></div>
  </section>

  <section class="card" aria-labelledby="h-tips">
    <h2 id="h-tips">Optimised pose</h2>
    <ul id="tips" class="spot"></ul>
  </section>

  <p class="muted" style="font-size:.8rem">
    A concept piece exploring Story-Activity Relationships. Not an official BioSolveIT product.
  </p>
</main>

<div class="scorebar" role="status" aria-live="polite">
  <span class="num" id="scoreNum">40</span>
  <div class="bar"><div class="fill" id="scoreFill"></div></div>
  <span id="scoreLabel" class="muted">Binds, can improve</span>
</div>

<script src="data.js"></script>   <!-- or inline -->
<script src="app.js"></script>    <!-- or inline -->
</body>
</html>
```

---

## 9. Wiring it up (`app.js`)

State plus render. Keep one `state` object and one `render()` that redraws the dynamic parts. Re-rendering on every change is cheap at this size.

```js
const state = {
  audience: "genz",
  anchor: ANCHORS[0].id,
  selected: new Set(),
  caption: ""
};

/* ---------- builders (run once) ---------- */
function buildAudience(){
  const el = document.getElementById("audience");
  el.innerHTML = "";
  Object.entries(AUDIENCES).forEach(([key,a])=>{
    const b = document.createElement("button");
    b.textContent = a.label;
    b.setAttribute("aria-pressed", key===state.audience);
    b.onclick = ()=>{ state.audience = key; syncAll(); };
    el.appendChild(b);
  });
}
function buildAnchors(){
  const el = document.getElementById("anchors");
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
function buildFragments(){
  const host = document.getElementById("fragments");
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

/* ---------- paint dynamic output ---------- */
function paintSpotter(text){
  const el = document.getElementById("spotter");
  el.innerHTML = "";
  text.drivers.forEach(d=>{
    const li = document.createElement("li"); li.className="driver"; li.textContent=d; el.appendChild(li);
  });
  text.stoppers.forEach(s=>{
    const li = document.createElement("li"); li.className="stopper";
    li.innerHTML = `${s.label}: <mark>${s.snippet}</mark>`; el.appendChild(li);
  });
}
function paintBreakdown(breakdown){
  const el = document.getElementById("breakdown");
  el.innerHTML = "";
  CLASSES.forEach(c=>{
    const pct = Math.round((breakdown[c] / 0.35) * 100); // 0.35 ~ a strong single-class contribution
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:10px;margin:8px 0";
    row.innerHTML = `
      <span style="width:90px;font-size:.9rem">${CLASS_LABEL[c]}</span>
      <span style="flex:1;height:12px;border-radius:999px;background:#eef1f4;overflow:hidden">
        <span style="display:block;height:100%;width:${Math.min(pct,100)}%;background:${CLASS_COLOR[c]}"></span>
      </span>`;
    el.appendChild(row);
  });
}
function paintTips(tips){
  const el = document.getElementById("tips");
  el.innerHTML = "";
  tips.forEach(t=>{
    const li = document.createElement("li"); li.className="driver"; li.textContent=t; el.appendChild(li);
  });
}
function paintScore(score){
  const b = band(score);
  document.getElementById("scoreNum").textContent = score;
  document.getElementById("scoreNum").style.color = b.color;
  const fill = document.getElementById("scoreFill");
  fill.style.width = score + "%";
  fill.style.background = b.color;
  document.getElementById("scoreLabel").textContent = b.label;
}

/* ---------- the loop ---------- */
function scoreAndPaint(){
  const r = resonance(state.audience, state.anchor, state.selected, state.caption);
  paintScore(r.score);
  paintSpotter(r.text);
  paintBreakdown(r.breakdown);
  paintTips(suggestions(r));
  writeHash();                  // keep the URL shareable
}
function syncAll(){
  document.getElementById("audHint").textContent = AUDIENCES[state.audience].hint;
  // refresh pressed states on the two single-select groups
  [...document.querySelectorAll("#audience button")].forEach((b,i)=>{
    b.setAttribute("aria-pressed", Object.keys(AUDIENCES)[i]===state.audience);
  });
  [...document.querySelectorAll("#anchors button")].forEach((b,i)=>{
    b.setAttribute("aria-pressed", ANCHORS[i].id===state.anchor);
  });
  scoreAndPaint();
}

/* ---------- init ---------- */
function init(){
  readHash();                   // restore state if the URL carries it
  buildAudience(); buildAnchors(); buildFragments();
  document.getElementById("caption").addEventListener("input", e=>{
    state.caption = e.target.value; scoreAndPaint();
  });
  document.getElementById("caption").value = state.caption;
  syncAll();
}
document.addEventListener("DOMContentLoaded", init);
```

---

## 10. Shareable state via URL hash

No backend needed. Encode the state into the hash so a link reproduces the exact card.

```js
function writeHash(){
  const s = {
    a: state.audience,
    n: state.anchor,
    f: [...state.selected],
    c: state.caption
  };
  location.replace("#" + btoa(unescape(encodeURIComponent(JSON.stringify(s)))));
}
function readHash(){
  if(!location.hash) return;
  try{
    const s = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
    if(s.a) state.audience = s.a;
    if(s.n) state.anchor = s.n;
    if(Array.isArray(s.f)) state.selected = new Set(s.f);
    if(typeof s.c === "string") state.caption = s.c;
  }catch(e){ /* ignore a bad hash */ }
}
```

Optional draft save: mirror the same object into `localStorage` on every change and read it on load if the hash is empty. Safe here because you host the site yourself. Do not rely on `localStorage` if you ever paste this into a sandboxed preview that blocks it.

---

## 11. Accessibility and mobile specifics

- `viewport-fit=cover` plus the bottom padding keeps the score bar clear of the iPhone home indicator. Add `padding-bottom: env(safe-area-inset-bottom)` to `.scorebar` if you want it exact.
- Use real `<button>` elements for chips so keyboard and screen readers work for free. `aria-pressed` communicates toggle state.
- The score bar is `role="status"` with `aria-live="polite"` so assistive tech announces the new number without stealing focus.
- Color is never the only signal: drivers use a `+`, show-stoppers use a `×`, and the score shows a text label next to the bar.
- Minimum contrast: the green and blue on white both pass AA for large text. Keep body text in `--ink`, not green.
- Test at 360 px width (small Android) and 430 px (large iPhone). Nothing should need horizontal scroll.

---

## 12. Deployment and linking back to the poster

1. **Host the static files.** GitHub Pages, Netlify, Cloudflare Pages, or any static host. All free for this.
2. **Pick the URL.** The poster placeholder reads `biosolveit.de/seestory`. Use a real path you control, or a subdomain, or a short Netlify URL. Update the footer line in the markup to match.
3. **Generate the QR offline.** Any QR generator that outputs SVG or high-res PNG. Encode the final URL. Keep it monochrome in BioSolveIT blue `#104173` on white for print clarity, with error correction level M or higher.
4. **Drop the QR into the poster.** Replace the dashed placeholder box on the poster slide with the QR image, same size and position. Keep the green "Scan for the live tool" tab beneath it.
5. **Smoke test on a phone.** Scan the printed QR, confirm the page loads under 3 seconds on cellular, and that every control is thumb-reachable.

---

## 13. Optional enhancements (only if you have time)

- **Compare mode.** Score the same caption against all four audiences at once and show which pocket it fits best. This directly visualises the poster idea of a new target class.
- **Preset gallery.** Three or four ready-made example posts with their scores, so a first-time visitor sees the payoff before typing anything.
- **Copy result.** A button that copies the caption plus its score and top suggestion to the clipboard.
- **Tiny animation.** Ease the score number when it changes. Respect `prefers-reduced-motion`.
- **Industry switcher.** Add a second set of audiences from another field (materials, agro, education) to show the engine docking into new target families.

---

## 14. Build checklist

- [ ] Single `index.html` renders on a phone with no horizontal scroll at 360 px.
- [ ] All four data objects in place: audiences, anchors, fragments, lexicon.
- [ ] Score updates live on audience change, anchor change, fragment toggle, and every keystroke.
- [ ] Spotter highlights at least one hyperbole word, an em dash, and a run-on sentence.
- [ ] Breakdown bars move when fragments are toggled.
- [ ] Suggestions change with the findings and never sit empty.
- [ ] Score bar stays pinned and announces updates.
- [ ] Footer disclaimer present. Brand colors only. No em dashes in any copy.
- [ ] URL hash reproduces the exact state when reloaded or shared.
- [ ] QR encodes the final URL and is dropped into the poster.

---

## 15. How this maps back to the poster

| Poster element | Site feature |
|---|---|
| Story-Activity Relationships | The whole scoring premise |
| SeeSTORY pipeline (Screen, Assemble, Score, Optimise) | The four numbered steps of the UI |
| The Four Resonance Classes | The fragment groups and the breakdown bars |
| Story-Activity Spotter (drivers vs show-stoppers) | The live caption analysis |
| Navigating New Target Space | The audience picker and the optional industry switcher |
| The Resonance Engine + QR | The site itself and its link |

Build the single-file version first, get the loop working end to end, then split files and add enhancements only if they earn their place.
