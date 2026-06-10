/* realworld_samples.mjs — run real-world-style science/marketing posts through
   the engine and print the full read, so we can eyeball whether scores match
   intuition. Captions are paraphrased from public drug-discovery / SaaS posts. */

import { scoreDraft } from './scoring.js';
import { recommendAudience } from './recommend.js';

const SAMPLES = [
  {
    name: "Nature-style methods abstract",
    aud: "peer",
    caption: "We report a deep-learning docking protocol that recovered 89% of known actives in the top 1% of a 1.2 billion compound library, a 4-fold enrichment over Glide. Code and benchmarks are available at the linked repository.",
    checklist: {}
  },
  {
    name: "LinkedIn product launch (hype-heavy)",
    aud: "pharma",
    caption: "Thrilled to announce our revolutionary, AI-powered platform that will completely transform drug discovery! This game-changing, end-to-end solution is the ultimate way to supercharge your pipeline. Request a demo today!",
    checklist: {}
  },
  {
    name: "TikTok-style science explainer",
    aud: "genz",
    caption: "We filmed a real chemist docking a molecule in 60 seconds. No textbook, just the screen. What would you screen first? Drop a comment.",
    checklist: { video: true, humanVoice: true }
  },
  {
    name: "Press release boilerplate",
    aud: "pharma",
    caption: "Company X, a world-leading, industry-first provider of best-in-class solutions, today announced the launch of its next-level, cutting-edge platform designed to deliver unprecedented value.",
    checklist: {}
  },
  {
    name: "Conference poster takeaway",
    aud: "pi",
    caption: "Across three prospective campaigns, our workflow reduced median hit-finding time from 11 months to 6 and improved the confirmed hit rate by 2.3-fold. Full methodology in the preprint.",
    checklist: {}
  },
  {
    name: "Casual community post",
    aud: "genalpha",
    caption: "Ever wondered how scientists find new medicines? We turned it into a game. Beat our scientist's docking time and tag a friend to try it.",
    checklist: { video: true, visual: true, communityHook: true }
  },
  {
    name: "Hedgy uncertain abstract",
    aud: "peer",
    caption: "We believe this method might somewhat improve enrichment, and it could potentially reduce screening time, though results may vary and performance is arguably project-dependent.",
    checklist: {}
  },
  {
    name: "Plain-language outreach",
    aud: "genz",
    caption: "In plain terms: we searched 2.4 billion molecules in under an hour and found 37 promising drug candidates. Here is the short version of how it works.",
    checklist: {}
  },
];

for(const s of SAMPLES){
  const r = scoreDraft({ audienceKey: s.aud, caption: s.caption, checklist: s.checklist });
  const reco = recommendAudience({ caption: s.caption, checklist: s.checklist });
  console.log(`\n■ ${s.name}  [scored as: ${s.aud}]`);
  console.log(`  Score ${r.score} (${r.band.label})  C=${r.signals.clarity} T=${r.signals.trust} S=${r.signals.substance} F=${r.signals.fit}`);
  console.log(`  Focus: ${r.focus} | Top fix: ${r.topFix}`);
  console.log(`  Recommender → ${reco ? reco.bestKey + " (" + reco.confidence + ", margin " + reco.margin + ")" : "n/a"}`);
}
