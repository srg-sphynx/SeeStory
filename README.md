# SeeSTORY: BioWeek 2026 Interactive Demo

> **A companion to the BioWeek poster - exploring how BioSolveIT content could land with the next generation.**

[![Deploy to GitHub Pages](https://github.com/srg-sphynx/SeeStory/actions/workflows/deploy.yml/badge.svg)](https://github.com/srg-sphynx/SeeStory/actions/workflows/deploy.yml)

## 🔬 What is this?

SeeSTORY is an interactive demonstration built to support the **BioWeek 2026** poster celebrating 25 years of BioSolveIT. It explores how scientific communication must evolve over the next 25 years to reach new audiences (Gen Z, Gen Alpha) alongside established decision-makers.

It is also a showcase of the future of software development itself: this entire application was built using **AI-assisted vibe coding** in a matter of hours.

While it borrows the language of computational chemistry - *binding*, *resonance*, *pharmacophore features* - the engine underneath is a transparent, rule-based heuristic that dynamically suggests future content strategies like SeeSAR tutorials, infiniSee screencasts, and YoungSolvers community integration.

### Three ways to use it

A header **page switch** lets visitors choose how to engage:

- **Easy mode** (`start.html`) - the no-jargon on-ramp for anyone outside Sales, Marketing, or Services. It explains in plain words what the BioWeek poster is about, what the tool does, and why it exists (even though the facts are online and AI can already write your posts). The centrepiece is a **gamified mini-scorer**: pick a reader, flip a handful of glowing switches (drop the hype, add a real number, link the proof, show a real person, make it a video, say it plainly) and watch a big animated dial, four signal meters, and a live "level" badge react instantly. It drives the **real** scoring engine, so every point is honest, and a "then / next" slider frames the 25-years-and-counting story.
- **Try the tool** (`index.html`) - the interactive resonance scorer.
- **Explore the science** (`learn.html`) - a read-only, one-page brief for people who would rather *learn* than *use*. It covers why the next generation reads differently, what the four signals measure, how the five audiences differ (rendered live from the real engine weights), and how the computational-chemistry field communicates - profiling **Schrödinger, Molsoft, OpenEye/Cadence, Chemical Computing Group, Cresset, and BioSolveIT** with sourced facts, animated stat counters, an interactive company explorer, and a market-size breakdown. All figures are cited; market sizes are flagged as third-party estimates and "communication signal" notes as interpretive.

## 🚀 Live Demo

**➜ [https://srg-sphynx.github.io/SeeStory/](https://srg-sphynx.github.io/SeeStory/)**

## ✨ Features

| Feature | Description |
|---------|-------------|
| **5 Audiences** | Gen Z chemist, Gen Alpha student, Research PI, Pharma decision-maker, Peer scientist - each with unique scoring weights and "wants" |
| **4-Signal Scoring** | Clarity, Trust, Substance, Fit - weighted per audience into a single 0–100 Resonance Score |
| **Single Top Fix** | A priority ladder selects the one highest-impact suggestion, not a list of ten |
| **Light / Dark / Auto theme** | A header toggle (sun / monitor / moon) switches the whole UI between light, dark, and system-matched themes. Preference is persisted; an inline bootstrap prevents any flash; contrast is preserved via themeable surface/text tokens layered over the fixed BioSolveIT brand hues |
| **Explore page** | A second `learn.html` view (see above) for non-users - sourced industry facts, animated counters, an interactive competitor explorer, and a revenue-mix chart |
| **Page switch** | A header segmented control to move between the tool and the Explore page |
| **Responsive Layout** | Mobile-first with a full two-column desktop layout (input left, results right) that scales automatically; on mobile the header **condenses on scroll** to reclaim vertical space |
| **Score Ring** | SVG circular progress ring on desktop showing your score at a glance (replaces the mobile-only sticky bar) |
| **How it works modal** | Help trigger pinned in the sticky header (always reachable) opens a centered dialog on desktop / bottom sheet on mobile, with Escape, backdrop-click, and focus-return |
| **Collapsible results** | "What we detected" and "Compare audiences" are an accordion - opening one collapses the other - and each shows a **summary teaser when collapsed** (detected: signals present + issue count; compare: best-fit audience and score) |
| **Detection Panel** | "What we detected" - shows exactly what the engine found across 8 categories (numbers, CTA, results, hype, hedging, exclamations, dashes, ALL-CAPS shouting), with audience-adaptive contextual explanations for each item |
| **Real-world detection dataset** | Hundreds of hype/hedge/result/CTA terms drawn from real B2B SaaS landing-page copy and drug-discovery software marketing, plus an acronym allow-list (DNA, QSAR, HPLC, CRM, ARR, ...) so legitimate jargon is never flagged as shouting |
| **Educational Toggles** | Each checklist item has a "Learn more" panel explaining what the content type means and why it matters for future audiences |
| **Word/Char Counter** | Live word count, character count (with LinkedIn 3,000-char limit indicator), and sentence count |
| **Persona Deep-Dive** | Collapsible research profiles with ✅ what each audience responds to and ❌ what turns them off |
| **Preset Gallery** | Eight click-to-load examples spanning the score range - The Hype Trap, The Clean Post, The Data Post, The SaaS Buzzword Bomb, The Benchmark Drop, The Gen Alpha Reel, The Shouty Launch, and The Hedgy Maybe |
| **Compare Mode** | Score the same draft across all 5 audiences side-by-side in a collapsible panel; the grid auto-fits its columns so cells never clip on the narrower results column |
| **Live Scoring** | Score updates in real-time as you type (debounced 150ms) |
| **Toggle Checklist** | 7-item checklist with interactive toggle switches and inline educational content for each media type |
| **Score Animation** | Smooth number count-up with ease-out quad easing, band-coloured progress fills, scroll-reveal cards, and grid-based collapse transitions |
| **Copy to Clipboard** | One-click copy of your score summary |
| **Sticky Score Bar** | Frosted-glass bottom bar on mobile that slides in once a score exists, with a jump-to-results control; hidden on desktop where the score ring takes over |
| **State Persistence** | Draft auto-saved to localStorage (consent-gated); old hash-based shared links still load but the URL is cleaned immediately |
| **Cross-browser** | No regex lookbehinds - works on Safari/iOS. `prefers-reduced-motion` respected |
| **Glossary** | Optional chemistry-metaphor glossary (for the chemists) |
| **Cookie / Storage Consent** | A polished glassmorphism banner asks for consent before persisting anything to localStorage. Accept enables theme + draft saving; Decline silently blocks future writes (app still works, just doesn't remember). Respects `prefers-reduced-motion`, safe-area insets, and 48px touch targets on mobile |

## 🧪 How Scoring Works

### The 4-Signal Model

| Signal | Starts at | Direction | What it measures |
|--------|-----------|-----------|------------------|
| **Clarity** | 100 | Loses points | Sentence length, long-word share, readability |
| **Trust** | 100 | Loses points | Hype words, hedging, exclamation marks, ALL CAPS |
| **Substance** | 30 | Gains points | Numbers in text, result cues, named sources, data |
| **Fit** | 0 | Gains points | How many of the audience's "wants" you have fulfilled |

### Blending

Each audience has a unique weight profile:

```
Final Score = round(W.clarity × Clarity + W.trust × Trust + W.substance × Substance + W.fit × Fit)
```

For example, a **Gen Z chemist** weights Fit at 40% (they care most about format), while a **Research PI** weights Substance at 35% (they care most about proof).

### The Detection Engine

Before scoring, the engine reads the draft and auto-detects eight signals shown in the **"What we detected"** panel:

| Category | How it's detected |
|----------|-------------------|
| **Numbers** | Any digit or `%` |
| **Call to action** | A question mark or an action verb (try, watch, subscribe, request a demo, book a call, ...) |
| **Result / comparison** | Outcome and benchmark cues (reduced, 3-fold, enrichment, compared to, hit rate, ...) |
| **Hype words** | Marketing buzzwords from real B2B SaaS and drug-discovery copy (revolutionary, AI-powered, turnkey, end-to-end, silver bullet, ...) |
| **Hedge phrases** | Tentative language (maybe, we think, could potentially, tends to, ...) |
| **Exclamation marks** | Counted; flagged at 2+ |
| **Em / en dashes** | `—` or `–` |
| **ALL-CAPS shouting** | Two or more all-caps words, or one long (5+ letter) caps word - with an acronym allow-list (DNA, QSAR, HPLC, CRM, ARR, SEO, ...) so legitimate jargon is **not** flagged |

All lexicon matching is **whole-word** (case-insensitive), so `scaffold` is not mistaken for the result cue `fold`, and `mighty` is not mistaken for the hedge `might`. The hype/hedge/result/CTA datasets are tuned for **B2B SaaS companies generally and drug-discovery software specifically**, making this usable as a real content-resonance checker beyond the demo.

### The Top Fix Priority Ladder

The engine doesn't overwhelm you with tips. It:
1. Calculates the **Focus Signal** - the signal with the largest weighted deficit (`weight × (100 - score)`)
2. Runs through a priority ladder for that signal to find the single most impactful fix
3. If your score is ≥ 80: "Strong pose. Nothing urgent to fix. Ship it."

### Acceptance Tests

The engine is validated against canonical examples (`node test_scoring.mjs`, 20 assertions):

| Example | Audience | Score | Focus | C | T | S | F |
|---------|----------|-------|-------|---|---|---|---|
| The Hype Trap | PI | **44** | Substance | 100 | 52 | 30 | 0 |
| The Clean Post | Gen Z | **65** | Fit | 100 | 100 | 55 | 30 |
| The Data Post | Peer | **83** | Fit | 100 | 100 | 80 | 55 |

### Preset Gallery (verified scores)

Every click-to-load example is verified against the live engine:

| Example | Audience | Score | Demonstrates |
|---------|----------|-------|--------------|
| The Hype Trap | PI | 44 | Buzzwords tank Trust; no numbers |
| The Clean Post | Gen Z | 65 | Video + CTA, but missing a visual |
| The Data Post | Peer | 83 | Numbers + source + result data |
| The SaaS Buzzword Bomb | Pharma | 47 | B2B SaaS hype with no substance |
| The Benchmark Drop | PI | 91 | A concrete benchmark done right |
| The Gen Alpha Reel | Gen Alpha | 90 | Video-first, visual, community hook |
| The Shouty Launch | PI | 52 | ALL-CAPS shouting + exclamations |
| The Hedgy Maybe | Pharma | 49 | Hedging language drains authority |

## 🏗️ Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Markup | Semantic HTML5 | Accessible, lightweight, no framework |
| Layout | CSS Grid + Flexbox | True responsive: mobile → tablet → desktop via breakpoints |
| Style | Vanilla CSS + custom properties | Zero dependencies, glassmorphism, toggle switches, SVG ring |
| Logic | Vanilla ES Modules | Pure functions, <30 KB total JS, XSS-safe DOM |
| Typography | BioSans (custom) + Inter (fallback) | Clean, professional hierarchy |
| Hosting | GitHub Pages via Actions | Free, automatic deploys on push |

### Responsive Breakpoints

| Breakpoint | Layout | Score display |
|------------|--------|---------------|
| **< 600px** | Single column, 1-col audience grid, condensing sticky header | Slide-in sticky bottom bar |
| **601–899px** | Single column, 2-col audience grid | Floating bottom bar |
| **900px+** | Two-column (input left, results right), static header | SVG score ring (sticky right column) |
| **1100px+** | Wider input column (1.15:0.85 ratio) | SVG score ring |

## 📁 Project Structure

```
SeeStory/
├── index.html       # The tool - single-page app shell
├── learn.html       # The Explore page - read-only science + industry brief
├── start.html       # Easy mode - plain-words tour + gamified mini-scorer
├── styles.css       # Shared design system + theme tokens (light/dark/auto)
├── learn.css        # Explore-page-only styles (rides on the shared tokens)
├── start.css        # Easy-mode-only styles (glowing dial, switches, era slider)
├── main.js          # Tool entry point - wires DOM to engine
├── scoring.js       # Pure 4-signal scoring engine + priority ladder
├── ui.js            # Tool DOM rendering, theming, state, animations
├── learn.js         # Explore-page interactivity (counters, accordion, tabs)
├── start.js         # Easy-mode interactivity (drives the real engine via switches)
├── data.js          # Audiences, lexicons, copy deck, personas (shared)
├── Font/            # BioSans .ttf font files
└── .github/workflows/
    └── deploy.yml   # Auto-deploy to GitHub Pages on push
```

## 🛠️ Local Development

No build step or Node.js required:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

To run the scoring acceptance tests:

```bash
node test_scoring.mjs
```

## 📜 License

This is a concept piece exploring how content lands with different readers.  
Not an official BioSolveIT product.

---

*Built with ♥ for the intersection of science and storytelling.*
