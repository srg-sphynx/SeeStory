# SeeSTORY

> **Paste a draft, pick your audience, get a score and the one fix that helps most.**

[![Deploy to GitHub Pages](https://github.com/srg-sphynx/SeeStory/actions/workflows/deploy.yml/badge.svg)](https://github.com/srg-sphynx/SeeStory/actions/workflows/deploy.yml)

## 🔬 What is this?

SeeSTORY is a lightweight, browser-based tool that helps scientists craft social-media posts, emails, and captions that actually land with their target audience. It borrows the language of computational chemistry — *binding*, *resonance*, *pharmacophore features* — as a metaphor for how content connects with readers.

The "model" is a **transparent, rule-based heuristics engine** — not a black box. Every point in your score is traceable to a visible rule. A chemist who has never written a LinkedIn post should understand the screen in ten seconds.

## 🚀 Live Demo

**➜ [https://srg-sphynx.github.io/SeeStory/](https://srg-sphynx.github.io/SeeStory/)**

## ✨ Features

| Feature | Description |
|---------|-------------|
| **5 Audiences** | Gen Z chemist, Gen Alpha student, Research PI, Pharma decision-maker, Peer scientist — each with unique scoring weights and "wants" |
| **4-Signal Scoring** | Clarity, Trust, Substance, Fit — weighted per audience into a single 0–100 Resonance Score |
| **Single Top Fix** | A priority ladder selects the one highest-impact suggestion, not a list of ten |
| **Responsive Layout** | Mobile-first with a full two-column desktop layout (input left, results right) that scales automatically |
| **Score Ring** | SVG circular progress ring on desktop showing your score at a glance (replaces the mobile-only sticky bar) |
| **Detection Panel** | "What we detected" — shows exactly what the engine found: numbers, CTAs, hype words, hedges, em dashes, ALL CAPS |
| **Word/Char Counter** | Live word count, character count (with LinkedIn 3,000-char limit indicator), and sentence count |
| **Persona Deep-Dive** | Collapsible research profiles with ✅ what each audience responds to and ❌ what turns them off |
| **Preset Gallery** | Three click-to-load examples (The Hype Trap, The Clean Post, The Data Post) |
| **Compare Mode** | Score the same draft across all 5 audiences side-by-side (5-column grid on desktop) |
| **Live Scoring** | Score updates in real-time as you type (debounced 150ms) |
| **Toggle Checklist** | 7-item checklist with interactive toggle switches for visual/video/source/etc. |
| **Score Animation** | Smooth number count-up with ease-out quad easing, band-coloured progress fills |
| **Copy to Clipboard** | One-click copy of your score summary |
| **Sticky Score Bar** | Frosted-glass bottom bar on mobile; hidden on desktop where the score ring takes over |
| **State Persistence** | Draft auto-saved to localStorage; shareable via URL hash |
| **Cross-browser** | No regex lookbehinds — works on Safari/iOS. `prefers-reduced-motion` respected |
| **Glossary** | Optional chemistry-metaphor glossary (for the chemists) |

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

### The Top Fix Priority Ladder

The engine doesn't overwhelm you with tips. It:
1. Calculates the **Focus Signal** — the signal with the largest weighted deficit (`weight × (100 - score)`)
2. Runs through a priority ladder for that signal to find the single most impactful fix
3. If your score is ≥ 80: "Strong pose. Nothing urgent to fix. Ship it."

### Acceptance Tests

The engine is validated against two canonical examples from the spec:

| Example | Audience | Score | Focus | C | T | S | F |
|---------|----------|-------|-------|---|---|---|---|
| The Hype Trap | PI | **44** | Substance | 100 | 52 | 30 | 0 |
| The Clean Post | Gen Z | **65** | Fit | 100 | 100 | 55 | 30 |

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
| **< 600px** | Single column, 1-col audience grid | Sticky bottom bar |
| **601–899px** | Single column, 2-col audience grid | Floating bottom bar |
| **900px+** | Two-column (input left, results right) | SVG score ring (sticky right column) |
| **1100px+** | Wider input column (1.15:0.85 ratio) | SVG score ring |

## 📁 Project Structure

```
SeeStory/
├── index.html       # Single-page app shell
├── styles.css       # Design system (cards, toggles, glassmorphism, persona cards)
├── main.js          # Entry point — wires DOM to engine
├── scoring.js       # Pure 4-signal scoring engine + priority ladder
├── ui.js            # DOM rendering, state management, animations
├── data.js          # Audiences, lexicons, copy deck, personas
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
