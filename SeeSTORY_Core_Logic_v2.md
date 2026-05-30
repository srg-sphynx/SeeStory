# SeeSTORY: Core Logic and Usage Guide (v2)

**This file replaces the old "Data model" and "Scoring" sections.**
It is written so two people can both follow it: the website builder, and any colleague at BioSolveIT who is not in marketing and just wants to use the tool.

The guiding rule for v2: **a chemist who has never written a LinkedIn post should understand the screen in ten seconds.** The drug-discovery wording is now optional flavor, parked in a glossary at the end. Nothing in the main interface requires it.

---

## A. Read this first (the mental model)

The tool answers one question: **"How well will this draft land with the people I am writing for, and what is the single best thing to fix?"**

It does that by reading the draft, checking what the draft contains, and comparing both against what the chosen audience actually responds to. It returns:

1. A **Resonance Score** from 0 to 100.
2. A short, plain headline that says what the score means.
3. **One top fix**, chosen because it will move the score the most.
4. A breakdown of four signals, so the score is never a black box.

It is a heuristic, not a machine-learning model. Every point is traceable to a visible rule. That is deliberate: it stays fast, honest, and explainable.

---

## B. How to use the tool (this doubles as the on-screen guide)

Show these three steps as a short "How it works" panel at the top, collapsed by default with a "How it works" toggle.

**Step 1. Pick who it is for.**
Choose one audience. Each option has a one-line description so the choice is obvious. If nothing is picked, the tool defaults to "Peer scientist" and says so.

**Step 2. Paste your draft.**
Drop in the actual text you plan to post, email, or publish. The tool reads it live as you type.

**Step 3. Tick what your draft includes.**
A short checklist of things the text alone cannot detect, like "has a visual" or "links a source." Tick the ones that apply. The tool auto-detects the rest, such as numbers and a call to action.

**Then read the result.**
The score and the top fix appear at the bottom and update on every change. Apply the fix, watch the score move, and stop when it reaches the green band.

> On-screen one-liner under the title: **"Paste a draft, pick your audience, get a score and the one fix that helps most."**

### B.1 Each step, explained simply (use these as the on-screen descriptions)

These are written for someone who has never done marketing. Each one can drop straight under its step as helper text. Plain on top, with a short "why" so the user trusts the result.

**Step 1. Who is this for?**
Pick the one group you are writing for. The tool changes what it rewards based on this choice, because a school student and a research group leader do not read the same way. A group leader wants proof and precision. A Gen Z chemist wants something short and visual. You only pick one, and you can switch it any time to see how the same draft scores for a different reader. If you skip this, the tool assumes a general peer scientist and tells you so.
*Plain example: writing a post about a new feature for early-career chemists on LinkedIn? Pick Gen Z chemist.*

**Step 2. Paste your actual draft.**
Put in the real words you plan to send, post, or publish. Not a description of it, the thing itself. The tool reads it as you type and reacts live, so you can edit a sentence and watch the score respond. It reads the words only. It cannot see your image or video, which is what Step 3 is for.
*Plain example: paste the full caption you wrote for the post, headline and all.*

**Step 3. Tick what your draft includes.**
This is a short checklist of things the text alone cannot prove. Does the post carry an image? A short video? A real person on screen? A link to a source? Tick the boxes that are true. The tool already finds numbers and calls to action by itself, so you do not need to flag those. Be honest here, because ticking a box you did not actually include will give you a score you cannot trust.
*Plain example: your post has a 30-second clip and tags a colleague, so you tick "Has short-form video" and "Invites people in."*

**Reading the result.**
Three things appear and update on every change.
- **The score, 0 to 100.** A quick read of how well this draft fits the chosen reader. Green means ready, amber means close, red means rework.
- **The top fix.** The single change that will lift the score the most right now. Do this one thing first, then look again. The tool always picks the highest-impact fix, so you are never staring at a long list.
- **Why this score.** Four short lines, one per signal (Clarity, Trust, Substance, Fit), each saying how that part is doing. This is there so the score is never a mystery.

**How to actually use it in practice.**
Paste, pick, tick, read the top fix, apply it, and watch the score move. Repeat until you reach green or until the top fix stops being worth the effort. The score is guidance, not a gate. It never stops you from posting. It just tells you where the easy wins are.

---

## C. What the score means (the bands)

| Score | Band | Headline shown to the user |
|---|---|---|
| 80 to 100 | Excellent | Strong fit. This is ready to post. |
| 60 to 79 | Strong | Good draft. A tweak or two will lift it. |
| 40 to 59 | Developing | This can land. It needs some work first. |
| 0 to 39 | Weak | Rework this before posting. |

Color: green for 80+, amber for 40 to 79, red below 40. Always pair the color with the text label so color is never the only signal.

---

## D. The four signals (named in plain words)

The score is a weighted blend of four sub-scores, each from 0 to 100. The user sees the plain name. The science name is optional flavor only.

| Plain name | What it measures | Old science name |
|---|---|---|
| **Clarity** | Is it easy to read? Short sentences, plain words. | readability |
| **Trust** | Does it sound honest? No hype, no shouting, no hedging. | tone |
| **Substance** | Does it prove anything? Numbers, results, a source. | proof |
| **Fit** | Does it carry the things this audience cares about? | pocket fit |

Each audience cares about these four signals differently. A research group leader weights Substance and Trust highly. A Gen Z chemist weights Fit and Clarity highly. The weights are in section E.

---

## E. The scoring model (advanced, but explainable)

### E.1 Overview

```
ResonanceScore = round(
    wClarity   * Clarity
  + wTrust     * Trust
  + wSubstance * Substance
  + wFit       * Fit
)
clamped to the range 0 to 100
```

The four weights depend on the audience and always sum to 1. Each sub-score is computed from explicit rules in section F.

### E.2 Audience weights

```js
const AUDIENCES = {
  genz: {
    label: "Gen Z chemist",
    blurb: "Early-career. Scrolls short video, learns in communities.",
    weights: { clarity:0.25, trust:0.20, substance:0.15, fit:0.40 },
    wants:   { video:0.30, visual:0.20, humanVoice:0.20, communityHook:0.15, plainSummary:0.15 }
  },
  genalpha: {
    label: "Gen Alpha student",
    blurb: "School or first-year. Playful and visual. Formality loses.",
    weights: { clarity:0.25, trust:0.15, substance:0.10, fit:0.50 },
    wants:   { video:0.35, visual:0.30, communityHook:0.20, humanVoice:0.15 }
  },
  pi: {
    label: "Research group leader",
    blurb: "Wants precision and proof. Hype is a turn-off.",
    weights: { clarity:0.20, trust:0.25, substance:0.35, fit:0.20 },
    wants:   { number:0.35, source:0.30, plainSummary:0.20, cta:0.15 }
  },
  pharma: {
    label: "Pharma decision-maker",
    blurb: "Wants concrete value and reliability. No vagueness.",
    weights: { clarity:0.20, trust:0.25, substance:0.30, fit:0.25 },
    wants:   { number:0.35, source:0.25, cta:0.20, plainSummary:0.20 }
  },
  peer: {
    label: "Peer scientist",
    blurb: "A general technical reader. Clear, useful, no fluff.",
    weights: { clarity:0.25, trust:0.20, substance:0.30, fit:0.25 },
    wants:   { number:0.30, source:0.25, visual:0.20, cta:0.15, plainSummary:0.10 }
  }
};
```

`weights` drives the final blend. `wants` drives the Fit sub-score. Both are per-audience, which is what makes the feedback adaptive rather than one-size-fits-all.

### E.3 Confidence

Confidence does not change the number. It changes the wording so the tool is honest about thin input.

```
words < 12   -> confidence "low",    note: "Short draft. Treat this as a rough read."
12 to 40     -> confidence "medium", no note
words > 40   -> confidence "high",   no note
```

---

## F. Detection rules (the if/else logic)

Every rule below is deterministic. Thresholds are stated so the builder and you can both audit them.

### F.0 Helpers

```js
function sentences(t){ return t.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean); }
function words(t){ return (t.match(/\S+/g) || []); }
function avg(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
```

### F.1 Clarity (0 to 100)

Measures reading ease. It is **audience-aware**: long technical words are normal for scientists, so they are only penalized for the youngest, least technical audiences.

```
start at 100
let avgSent = average words per sentence
let longSentences = number of sentences with more than 28 words

if avgSent > 16:        subtract (avgSent - 16) * 3
subtract longSentences * 8

// long-word penalty only for non-technical audiences
if audience is genz or genalpha:
    let longWordShare = share of words with 13+ letters
    if longWordShare > 0.15:  subtract 15

clamp to 0..100
```

Why 16 and 28: 16 words per sentence is a comfortable average for social and web copy. A single sentence over 28 words is the run-on threshold the Trust signal also uses, so the two stay consistent.

### F.2 Trust (0 to 100)

Penalizes the things that make writing feel like marketing noise. This is where your brand rules live.

```
start at 100

let hypeHits = count of HYPE_WORDS found
subtract min(hypeHits * 12, 48)

if text contains an em dash or en dash:   subtract 12   // your house rule
if exclamation count >= 2:                subtract 8
if exclamation count >= 4:                subtract 8 more
if an ALL-CAPS run of 3+ words exists:    subtract 8

let hedgeHits = count of HEDGE_WORDS found
// hedging only hurts with audiences that expect confidence
if audience is pi or pharma and hedgeHits >= 3:  subtract 10

clamp to 0..100
```

### F.3 Substance (0 to 100)

Rewards proof. Starts low and climbs as the draft gets more concrete. The baseline is **30**, not a neutral 50, on purpose: a draft with no proof at all should read as weak on this signal, not average.

```
start at 30

if text contains a digit or a percent sign:        add 25
if text contains a RESULT_CUE word:                add 15
if checklist "links or names a source" is ticked:  add 15
if checklist "includes a result or data" is ticked: add 10

clamp to 0..100
```

Resulting bands: no proof lands at 30 (low), a single number lands at 55 (mid), a number plus a result cue lands at 70 (high). This makes all three Substance messages in G.3 reachable, which the old baseline of 45 did not.

> **Note on intended double counting.** A number and a source each help two signals: Substance, because they are proof, and Fit, because several audiences specifically want them. This is deliberate, not a bug. Substance asks "is there proof at all," Fit asks "does it have what this particular audience wants," and a number answers both.

### F.4 Fit (0 to 100)

Measures how much of what this audience cares about is actually present. This reads from the checklist plus two auto-detected items (number, call to action).

```
let present = the set of ingredients that are true
   // ticked by the user: visual, video, humanVoice, communityHook, plainSummary, source
   // auto-detected:       number (digit or %), cta (CTA regex matches)

let wants = AUDIENCES[audience].wants     // ingredient -> weight, weights are this audience's priorities
let got    = sum of wants[i] for each i in present that also appears in wants
let total  = sum of all values in wants

Fit = total > 0 ? round(100 * got / total) : 50
```

Plain reading: "You included this share of what this audience wants." If an audience does not list an ingredient in `wants`, including it neither helps nor hurts Fit, which keeps the model from rewarding clutter.

### F.5 Lexicons and detectors

```js
const HYPE_WORDS = [
  "revolutionary","game-changing","game changer","world-class","cutting-edge",
  "cutting edge","unprecedented","best-in-class","best in class","synergy",
  "leverage","disruptive","next-generation","next generation","groundbreaking",
  "state-of-the-art","seamless","robust","paradigm","supercharge","unlock",
  "skyrocket","mind-blowing","ultimate","revolutionize","transformative"
];

const HEDGE_WORDS = [
  "maybe","perhaps","might","possibly","sort of","kind of","we think",
  "arguably","somewhat","we believe","it seems","fairly"
];

const RESULT_CUES = [
  "faster","slower","reduced","increased","improved","cut","saved",
  "fold","outperformed","up to","down to","higher","lower"
];

const CTA_REGEX = /\?|\b(try|join|watch|bring|see|download|read|register|sign up|book|explore|comment|share|reply|tag)\b/i;
const NUMBER_REGEX = /\d|%/;
const EMDASH_REGEX = /[\u2014\u2013]/;          // em dash and en dash
const SHOUT_REGEX  = /\b[A-Z]{2,}(\s+[A-Z]{2,}){2,}\b/;
```

---

## G. Adaptive copy deck (every string the tool can say)

This is the wording layer. The builder lifts these strings directly. The logic for which one to show is in G.4.

### G.1 Static labels

```js
const COPY = {
  title: "SeeSTORY",
  tagline: "Paste a draft, pick your audience, get a score and the one fix that helps most.",
  howToToggle: "How it works",
  step1: "1. Pick who it is for",
  step2: "2. Paste your draft",
  step3: "3. Tick what your draft includes",
  step1desc: "Pick the one group you are writing for. The tool changes what it rewards based on this choice. You can switch it any time to see how the same draft scores for a different reader.",
  step2desc: "Paste the real words you plan to send or post, not a description of them. The tool reads as you type. It reads words only, so visuals go in Step 3.",
  step3desc: "Tick what is true. The tool already finds numbers and calls to action on its own. Be honest, since a box you did not include gives a score you cannot trust.",
  resultDesc: "The score and the one highest-impact fix update on every change. Apply the fix, look again, and stop at green. The score is guidance, never a gate.",
  captionPlaceholder: "Write or paste your post, email, or caption here...",
  scoreLabel: "Resonance score",
  topFixLabel: "Top fix",
  breakdownLabel: "Why this score",
  emptyState: "Add a draft. The score needs words to read.",
  defaultAudienceNote: "No audience picked, so this is scored for a Peer scientist.",
  confidenceLowNote: "Short draft. Treat this as a rough read.",
  disclaimer: "A concept piece exploring how content lands with different readers. Not an official BioSolveIT product."
};
```

### G.2 Checklist items (with helper text)

```js
const CHECKLIST = [
  { id:"visual",        label:"Has an image or graphic",   help:"A figure, chart, or photo." },
  { id:"video",         label:"Has short-form video",      help:"A reel or short clip." },
  { id:"humanVoice",    label:"Shows a real person",       help:"A face or named voice, not a logo." },
  { id:"communityHook", label:"Invites people in",         help:"Tags someone, asks for replies, or invites collaboration." },
  { id:"plainSummary",  label:"Has a plain-language line", help:"One sentence a non-expert would understand." },
  { id:"source",        label:"Links or names a source",   help:"A paper, a dataset, or a page to verify." },
  { id:"resultData",    label:"Includes a result or data", help:"A specific outcome or measurement, even without a number in the text." }
];
```

The `resultData` item feeds the Substance signal only. It is the manual backup for a real finding that the text does not phrase as a digit, for example "we improved selectivity." It is not part of any audience's Fit wants, so ticking it never inflates Fit.

### G.3 Per-signal messages, by band

Each signal shows one line in the breakdown. Pick by the signal's own score.

```js
const SIGNAL_MSG = {
  clarity: {
    high: "Easy to read. Sentences are short and clear.",
    mid:  "Readable, but some sentences are long.",
    low:  "Hard to read. Shorten the long sentences."
  },
  trust: {
    high: "Reads as honest and plain.",
    mid:  "Mostly clean, with a little noise.",
    low:  "Reads like marketing. Cut the hype."
  },
  substance: {
    high: "Backed by something concrete.",
    mid:  "Some proof, but it could be firmer.",
    low:  "Light on proof. Add a number or a result."
  },
  fit: {
    high: "Carries what this audience wants.",
    mid:  "Has some of what this audience wants.",
    low:  "Missing what this audience cares about most."
  }
};
// band split for signals: high >= 70, mid 45 to 69, low < 45
```

### G.4 The top fix (priority ladder, if/else)

This is the most important adaptive output. The tool shows exactly one fix, chosen to move the score the most.

**Step 1. Find the focus signal.**
For each signal, compute its weighted deficit:
```
deficit(signal) = weight(signal) * (100 - score(signal))
```
The focus signal is the one with the largest deficit. This guarantees the fix targets what is both weak and important to this audience.

**Step 2. Inside the focus signal, choose the most specific triggered issue.**
Walk the list top to bottom and emit the first match. If none match, fall back to the signal's generic fix.

```
if focus is TRUST:
    if em dash found        -> "Found an em dash. Swap it for a period or a comma."
    elif a hype word w found-> 'The word "{w}" reads as hype. Replace it with a specific result.'
    elif shouting found     -> "All-caps reads as shouting. Make the point quietly."
    elif many exclamations  -> "Ease off the exclamation marks. Let the point carry itself."
    elif hedging is dense and audience is pi/pharma
                            -> "Lots of hedging. If the data supports it, state it plainly."
    else                    -> "Tighten the tone. Say it plainly and drop the buzzwords."

elif focus is CLARITY:
    if a run-on sentence exists -> "One sentence runs long. Split it in two."
    elif avgSent > 20           -> "Sentences are long on average. Aim for short, single-idea lines."
    elif audience is genz/genalpha and long words are dense
                                -> "Long words for this audience. Trade a few for everyday ones."
    else                        -> "Trim for readability. Short sentences land harder."

elif focus is SUBSTANCE:
    if no number and audience wants a number
                            -> "No figure yet. {Audience} responds to a concrete number."
    elif no source and audience wants a source
                            -> "No source. {Audience} wants something to verify."
    elif no result cue      -> "Add a concrete result. What changed, and by how much?"
    else                    -> "Make it more concrete. Numbers and results build trust."

elif focus is FIT:
    // name the single highest-weighted wanted ingredient that is missing
    let missing = the ingredient in this audience's wants with the highest weight that is not present
    use the FIT_FIX line for that ingredient (see below)
```

**Fit fix lines, by missing ingredient:**
```js
const FIT_FIX = {
  video:         "No video. This audience watches more than it reads.",
  visual:        "Add a visual. A figure or photo earns the first glance.",
  humanVoice:    "Put a face on it. People follow people, not logos.",
  communityHook: "Invite people in. Ask a question or tag a collaborator.",
  plainSummary:  "Add one plain-language line for the non-experts.",
  number:        "Add a concrete number. It is the fastest credibility win.",
  source:        "Name a source so the reader can check it.",
  cta:           "Add a clear next step. Tell the reader what to do."
};
```

**Step 3. If the score is already 80 or higher**, skip the ladder and show:
```
"Strong pose. Nothing urgent to fix. Ship it."
```

### G.5 Band headlines (final score)

```js
const BAND = [
  { min:80, label:"Excellent", head:"Strong fit. This is ready to post." },
  { min:60, label:"Strong",    head:"Good draft. A tweak or two will lift it." },
  { min:40, label:"Developing",head:"This can land. It needs some work first." },
  { min:0,  label:"Weak",      head:"Rework this before posting." }
];
```

### G.6 Subhead under the headline

Always name the lever, using the focus signal from G.4 step 1:
```
"Biggest lever right now: {focus signal plain name}."
```

---

## H. The complete scoring function

This ties every rule and string together. Same inputs always give the same output.

```js
function scoreDraft({ audienceKey, caption, checklist }){
  const aud = AUDIENCES[audienceKey] || AUDIENCES.peer;
  const text = (caption || "").trim();
  const w = words(text);
  const usedDefault = !AUDIENCES[audienceKey];

  // ---- empty / very short handling ----
  if (w.length < 3){
    return { empty:true, message: COPY.emptyState, usedDefault };
  }
  const confidence = w.length < 12 ? "low" : (w.length <= 40 ? "medium" : "high");

  // ---- derived facts ----
  const sents = sentences(text);
  const avgSent = avg(sents.map(s => words(s).length));
  const longSentences = sents.filter(s => words(s).length > 28).length;
  const lower = text.toLowerCase();
  const hypeFound = HYPE_WORDS.filter(x => lower.includes(x));
  const hedgeHits = HEDGE_WORDS.filter(x => lower.includes(x)).length;
  const exclamations = (text.match(/!/g) || []).length;
  const hasEmDash = EMDASH_REGEX.test(text);
  const shouting = SHOUT_REGEX.test(text);
  const hasNumber = NUMBER_REGEX.test(text);
  const hasCTA = CTA_REGEX.test(text);
  const hasResultCue = RESULT_CUES.some(x => lower.includes(x));
  const longWordShare = w.filter(x => x.replace(/[^A-Za-z]/g,"").length >= 13).length / w.length;

  // ---- present ingredients ----
  const present = new Set();
  Object.keys(checklist || {}).forEach(k => { if (checklist[k]) present.add(k); });
  if (hasNumber) present.add("number");
  if (hasCTA) present.add("cta");

  // ---- CLARITY ----
  let clarity = 100;
  if (avgSent > 16) clarity -= (avgSent - 16) * 3;
  clarity -= longSentences * 8;
  if ((audienceKey === "genz" || audienceKey === "genalpha") && longWordShare > 0.15) clarity -= 15;
  clarity = clamp(clarity);

  // ---- TRUST ----
  let trust = 100;
  trust -= Math.min(hypeFound.length * 12, 48);
  if (hasEmDash) trust -= 12;
  if (exclamations >= 2) trust -= 8;
  if (exclamations >= 4) trust -= 8;
  if (shouting) trust -= 8;
  if ((audienceKey === "pi" || audienceKey === "pharma") && hedgeHits >= 3) trust -= 10;
  trust = clamp(trust);

  // ---- SUBSTANCE ----
  let substance = 30;
  if (hasNumber) substance += 25;
  if (hasResultCue) substance += 15;
  if (present.has("source")) substance += 15;
  if (checklist && checklist.resultData) substance += 10;
  substance = clamp(substance);

  // ---- FIT ----
  const wants = aud.wants;
  let got = 0, total = 0;
  for (const ing in wants){ total += wants[ing]; if (present.has(ing)) got += wants[ing]; }
  const fit = total > 0 ? Math.round(100 * got / total) : 50;

  // ---- blend ----
  // Normalise the weights defensively so they always sum to 1, even if someone
  // edits AUDIENCES and the four no longer add up. This keeps score in 0..100.
  const W = normaliseWeights(aud.weights);
  const raw = W.clarity*clarity + W.trust*trust + W.substance*substance + W.fit*fit;
  const score = clamp(Math.round(raw));

  // ---- focus signal (largest weighted deficit) ----
  const deficits = {
    clarity:   W.clarity   * (100 - clarity),
    trust:     W.trust     * (100 - trust),
    substance: W.substance * (100 - substance),
    fit:       W.fit       * (100 - fit)
  };
  const focus = Object.keys(deficits).sort((a,b)=>deficits[b]-deficits[a])[0];

  // ---- top fix ----
  const facts = { hasEmDash, hypeFound, shouting, exclamations, hedgeHits,
                  longSentences, avgSent, longWordShare, hasNumber, hasCTA,
                  hasResultCue, present, audienceKey, audienceLabel: aud.label };
  const topFix = score >= 80
    ? "Strong pose. Nothing urgent to fix. Ship it."
    : chooseFix(focus, facts, aud);

  return {
    empty:false, usedDefault, confidence,
    score, band: BAND.find(b => score >= b.min),
    signals: { clarity, trust, substance, fit },
    focus, topFix,
    facts
  };
}

function clamp(n){ return Math.max(0, Math.min(100, n)); }

function normaliseWeights(w){
  const sum = w.clarity + w.trust + w.substance + w.fit;
  if (sum <= 0) return { clarity:0.25, trust:0.25, substance:0.25, fit:0.25 };
  return {
    clarity:   w.clarity   / sum,
    trust:     w.trust     / sum,
    substance: w.substance / sum,
    fit:       w.fit       / sum
  };
}
```

And the fix chooser, which is just section G.4 in code:

```js
function chooseFix(focus, f, aud){
  if (focus === "trust"){
    if (f.hasEmDash) return "Found an em dash. Swap it for a period or a comma.";
    if (f.hypeFound.length) return `The word "${f.hypeFound[0]}" reads as hype. Replace it with a specific result.`;
    if (f.shouting) return "All-caps reads as shouting. Make the point quietly.";
    if (f.exclamations >= 2) return "Ease off the exclamation marks. Let the point carry itself.";
    if ((f.audienceKey==="pi"||f.audienceKey==="pharma") && f.hedgeHits >= 3)
      return "Lots of hedging. If the data supports it, state it plainly.";
    return "Tighten the tone. Say it plainly and drop the buzzwords.";
  }
  if (focus === "clarity"){
    if (f.longSentences > 0) return "One sentence runs long. Split it in two.";
    if (f.avgSent > 20) return "Sentences are long on average. Aim for short, single-idea lines.";
    if ((f.audienceKey==="genz"||f.audienceKey==="genalpha") && f.longWordShare > 0.15)
      return "Long words for this audience. Trade a few for everyday ones.";
    return "Trim for readability. Short sentences land harder.";
  }
  if (focus === "substance"){
    if (!f.hasNumber && "number" in aud.wants)
      return `No figure yet. ${aud.label} responds to a concrete number.`;
    if (!f.present.has("source") && "source" in aud.wants)
      return `No source. ${aud.label} wants something to verify.`;
    if (!f.hasResultCue) return "Add a concrete result. What changed, and by how much?";
    return "Make it more concrete. Numbers and results build trust.";
  }
  // focus === "fit": name the highest-weighted missing wanted ingredient
  const missing = Object.keys(aud.wants)
    .filter(i => !f.present.has(i))
    .sort((a,b)=>aud.wants[b]-aud.wants[a])[0];
  return missing ? FIT_FIX[missing] : "Add what this audience cares about most.";
}
```

---

## I. Worked examples (so the numbers feel real)

### Example 1: a hype-heavy post aimed at a research group leader

> "Our revolutionary, game-changing platform delivers world-class results that will supercharge your pipeline!"

- Audience: `pi`. Words: 12, which sits on the boundary, so confidence is **medium** and no confidence note is shown. A draft of 11 words or fewer would read as low and add "Short draft. Treat this as a rough read."
- Clarity: one sentence, 12 words, well under the 16 threshold, no run-on. Clarity **100**.
- Trust: four hype hits (revolutionary, game-changing, world-class, supercharge). Penalty min(4·12, 48) = 48. One exclamation only, so no exclamation penalty. Trust **52**.
- Substance: no number, no result cue, no source. Stays at the baseline **30**.
- Fit: `pi` wants number, source, plainSummary, cta. None are present. Fit **0**.
- Blend with pi weights (.20/.25/.35/.20): 0.20·100 + 0.25·52 + 0.35·30 + 0.20·0 = 20 + 13 + 10.5 + 0 = **43.5 -> 44**.
- Band: Developing.
- Focus by weighted deficit: clarity 0, trust 0.25·48 = 12, substance 0.35·70 = **24.5**, fit 0.20·100 = 20. Largest is **substance**.
- Top fix (focus substance, no number, pi wants a number): **"No figure yet. Research group leader responds to a concrete number."**
- Subhead: "Biggest lever right now: Substance."

Note how the advice stays coherent: substance and fit are both dragged down by the same missing number, so the fix points at the number either way.

### Example 2: a clean post aimed at a Gen Z chemist, with video ticked

> "Watch one screen go from idea to a ranked hit list in 20 minutes. We filmed the whole thing. What would you screen first?"

- Audience: `genz`. Words: 24, confidence **medium**.
- Clarity: three short sentences, average 8 words each, no run-on. Clarity **100**.
- Trust: no hype, no dashes, no shouting. Trust **100**.
- Substance: has a number (20), so 30 + 25 = **55**. No result cue, no source.
- Fit: present = video (ticked), number (auto), cta (auto, from "Watch" and the question mark). genz wants video .30, visual .20, humanVoice .20, communityHook .15, plainSummary .15, total 1.00. Only video is wanted and present, so got = .30. Fit = **30**. Number and cta are present but genz does not list them in its wants, so they do not raise Fit.
- Blend with genz weights (.25/.20/.15/.40): 0.25·100 + 0.20·100 + 0.15·55 + 0.40·30 = 25 + 20 + 8.25 + 12 = **65.25 -> 65**.
- Band: Strong.
- Focus by weighted deficit: clarity 0, trust 0, substance 0.15·45 = 6.75, fit 0.40·70 = **28**. Largest is **fit**.
- Top fix (focus fit, highest-weighted missing want is `visual` at .20, ahead of the .15 items): **"Add a visual. A figure or photo earns the first glance."**
- Subhead: "Biggest lever right now: Fit."

These two examples are the acceptance tests for the builder. If the code returns **44** for Example 1 and **65** for Example 2, with the focus signals and top fixes shown above, the engine is wired correctly.

---

## J. Edge cases and guardrails

```
empty or under 3 words   -> show COPY.emptyState, no score yet
no audience selected     -> use peer, set usedDefault true, show COPY.defaultAudienceNote
under 12 words           -> confidence "low", show "Short draft. Treat this as a rough read."
score lands exactly on a band edge -> the >= comparisons put 80 in Excellent, 60 in Strong, 40 in Developing
a signal computes below 0 or above 100 -> clamp() forces it back into range
a hype word is also a normal word in context (for example "leverage" as a verb)
    -> accepted limitation; the fix is phrased as a suggestion, not a verdict
non-Latin or emoji-heavy text -> word and sentence splitters still run; scores skew on Clarity only, which is acceptable
```

Two product guardrails worth stating in the UI:
1. The score is guidance, not a gate. It never blocks anyone from posting.
2. The tool reads text only. It does not see the actual image or video, which is why those are checkboxes the user confirms.

---

## K. Data the builder needs, in one place

Everything the engine imports:

```js
// AUDIENCES        -> section E.2
// CHECKLIST        -> section G.2
// COPY             -> section G.1
// SIGNAL_MSG       -> section G.3
// FIT_FIX          -> section G.4
// BAND             -> section G.5
// HYPE_WORDS, HEDGE_WORDS, RESULT_CUES, regexes -> section F.5
// scoreDraft(), chooseFix(), helpers            -> sections F.0 and H
```

The UI calls `scoreDraft` on every change to the audience, the caption, or any checkbox, then renders: the score and band headline (C, G.5), the subhead (G.6), the top fix (G.4), the four signal lines (G.3), and any confidence or default-audience note (E.3, J).

---

## L. Optional science flavor (the glossary, for the curious only)

Nobody needs this to use the tool. It is the wink for the chemists and the link back to the poster. Keep it behind a small "Why the chemistry names" link.

| Plain term in the tool | Poster and science term | The idea |
|---|---|---|
| Audience | Target, or binding pocket | Who the content has to fit. |
| Resonance score | Binding affinity | How well it fits and holds. |
| The four signals | Pharmacophore features | The properties that make it stick. |
| Top fix | Lead optimisation step | The change that improves the fit most. |
| Trust signal driver and show-stopper list | Activity Spotter | Features that help versus features that block. |
| Substance, with numbers and sources | Scoring with HYDE | Concrete contributions you can point to. |

If you add this panel, label it clearly as flavor so a first-time user is never required to read it.

---

## M. Builder handoff checklist

- [ ] The top of the page reads plainly. A non-marketer understands it without the glossary.
- [ ] "How it works" shows the three steps from section B, collapsed by default.
- [ ] Audience options show their one-line blurbs from E.2.
- [ ] The checklist from G.2 shows helper text on each item.
- [ ] `scoreDraft` runs on every change and returns the section I acceptance numbers: Example 1 scores **44** with focus **substance**, Example 2 scores **65** with focus **fit**.
- [ ] Exactly one top fix shows at a time, chosen by the G.4 ladder.
- [ ] The four signal lines show the right band message from G.3.
- [ ] Empty, short, and no-audience states behave as in section J.
- [ ] The glossary in L is optional and clearly labelled as flavor.
- [ ] No em dashes anywhere in the visible copy. Brand colors only.
