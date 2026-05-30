# SeeSTORY — The Resonance Engine

> An interactive companion to the *Story-Activity Relationships* poster.  
> Score, tune, and share social-media "poses" for scientific communication.

[![Deploy to GitHub Pages](https://github.com/srg-sphynx/SeeStory/actions/workflows/deploy.yml/badge.svg)](https://github.com/srg-sphynx/SeeStory/actions/workflows/deploy.yml)

## 🔬 What is this?

SeeSTORY borrows the language of computational chemistry — *binding*, *pocket fit*, *resonance* — to help scientists craft social-media posts that actually land with their target audience.

**Pick an audience → choose an anchor → grow the draft → paste your caption → get a live Resonance Score.**

The "model" is a transparent, rule-based scorer:
- **Flesch Reading Ease** measures true readability (syllable + sentence complexity).
- **Passive voice detection** spots engagement-killing constructions.
- **Hype & jargon spotting** flags words that repel specific audiences.
- **Sigmoid pocket-fit weighting** maps fragment contributions to a smooth, realistic curve.

## 🚀 Live Demo

**➜ [https://srg-sphynx.github.io/SeeStory/](https://srg-sphynx.github.io/SeeStory/)**

Scan the QR code on the poster, or open the link above on your phone.

## 🏗️ Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Markup | Semantic HTML5 | Accessible, lightweight |
| Style | Vanilla CSS + CSS custom properties | Zero dependencies |
| Logic | Vanilla ES Modules | No build step, <30 KB total JS |
| Typography | BioSans (custom) + Inter (fallback) | Matches BioSolveIT brand |
| Hosting | GitHub Pages via Actions | Free, automatic deploys |

## 📁 Project Structure

```
SeeStory/
├── index.html          # Single-page app shell
├── styles.css          # Design system (tokens, layout, components)
├── main.js             # Entry point — wires DOM to engine
├── scoring.js          # NLP analysis + resonance scoring engine
├── ui.js               # DOM rendering + state synchronisation
├── data.js             # Static config (audiences, fragments, rules)
├── Font/               # BioSans .ttf font files
└── .github/workflows/
    └── deploy.yml      # Auto-deploy to GitHub Pages on push
```

## 🧪 How Scoring Works

1. **Pocket Fit** — Each fragment and anchor belongs to a communication class (Clarity, Voice, Visual, Community). The audience's weight profile determines how much each class contributes. A rational soft-cap curve (`x / (x + 0.35)`) prevents diminishing-returns stacking.

2. **Text Analysis** — Your pasted caption is evaluated for:
   - Sentence length & Flesch Reading Ease
   - Passive voice constructions
   - Hyperbolic buzzwords
   - Audience-conditional jargon
   - Run-on sentences & formatting issues

3. **Resonance Score** = `30 + (pocket_fit × 50) + (text_points × 20)`, clamped to 0–100.

## 🛠️ Local Development

No build step required. Just serve the files:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## 📜 License

This is a concept piece exploring Story-Activity Relationships.  
Not an official BioSolveIT product.

---

*Built with ♥ for the intersection of science and storytelling.*
