# SeeSTORY

> An interactive tool for crafting scientific communication that actually lands.  
> Score, tune, and share your social-media posts and scientific updates.

[![Deploy to GitHub Pages](https://github.com/srg-sphynx/SeeStory/actions/workflows/deploy.yml/badge.svg)](https://github.com/srg-sphynx/SeeStory/actions/workflows/deploy.yml)

## 🔬 What is this?

SeeSTORY helps scientists craft social-media posts that resonate with their target audience. It uses a custom **4-Signal Scoring Architecture** to guide you toward the most impactful change you can make right now.

**Pick an audience → Paste your draft → Tick your checklist → Get your Top Fix.**

The "model" is a transparent, rule-based heuristics engine—not a black box. You always know exactly why you got the score you did, based on four core signals:
- **Clarity:** How easy is it to read? (Sentence length, reading ease, word complexity).
- **Trust:** Does it sound honest? (Penalizes hype words, hedges, excessive exclamation).
- **Substance:** Is there proof? (Rewards concrete numbers, result cues, named sources).
- **Fit:** Does it include what your specific audience cares about? (Videos, visuals, community hooks).

## 🚀 Live Demo

**➜ [https://srg-sphynx.github.io/SeeStory/](https://srg-sphynx.github.io/SeeStory/)**

Open it on your phone or desktop to test it out.

## 🧪 How v2 Scoring Works

SeeSTORY v2 moves away from the old anchor/fragment system and introduces a seamless "paste and score" workflow:

1. **Audience Wants:** Every audience (e.g., Gen Z, Research PI, Pharma) has a different profile of "Weights" (how much they value Clarity vs. Trust) and "Wants" (do they need a video, or just a concrete number?).
2. **Signal Computation:** Your draft is analyzed live as you type. 
   - Clarity and Trust start at 100 and lose points for bad habits (run-ons, hype, shouting).
   - Substance starts low and gains points for concrete additions (numbers, results).
   - Fit is a direct measure of how many of the audience's "Wants" you have fulfilled via the checklist and text cues.
3. **The Top Fix Priority Ladder:** The engine doesn't overwhelm you with a dozen tips. It calculates your *Focus Signal* (the signal with the largest weighted deficit) and runs down a priority ladder to give you the **single most impactful fix** to apply next.

## 🏗️ Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Markup | Semantic HTML5 | Accessible, lightweight |
| Style | Vanilla CSS | Zero dependencies, CSS variables, glassmorphism UI |
| Logic | Vanilla ES Modules | Pure functions, <30 KB total JS, XSS-safe DOM |
| Typography | BioSans (custom) + Inter | Clean, professional hierarchy |
| Hosting | GitHub Pages via Actions | Free, automatic deploys |

## 📁 Project Structure

```
SeeStory/
├── index.html          # Single-page app shell
├── styles.css          # Design system (dropdowns, toggles, glassmorphism)
├── main.js             # Entry point — wires DOM to engine
├── scoring.js          # Pure NLP analysis & 4-signal engine
├── ui.js               # DOM rendering, state, custom UI interactions
├── data.js             # Static config (audiences, rules, copy deck)
├── Font/               # BioSans .ttf font files
└── .github/workflows/
    └── deploy.yml      # Auto-deploy to GitHub Pages on push
```

## 🛠️ Local Development

No build step or Node.js required. Just serve the files:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## 📜 License

This is a concept piece exploring how content lands with different readers.  
Not an official BioSolveIT product.

---
*Built with ♥ for the intersection of science and storytelling.*
