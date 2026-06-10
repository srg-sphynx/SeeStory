/* audit_scoring.mjs — exhaustive permutation audit of the scoring engine.
   Surfaces logical inconsistencies the eye misses: monotonicity violations,
   unreachable ceilings, recommender/scorer disagreement, band boundary jumps. */

import { scoreDraft } from './scoring.js';
import { recommendAudience, extractFeatures } from './recommend.js';
import { AUDIENCES, CHECKLIST } from './data.js';

const AUD_KEYS = Object.keys(AUDIENCES);
const CHK_IDS = CHECKLIST.map(c => c.id); // visual, video, humanVoice, communityHook, plainSummary, source, resultData

let problems = [];
function flag(category, detail){ problems.push({ category, detail }); }

/* ── 1. Substance ceiling reachability ───────────────────────────────────── */
{
  // Best possible substance: number + result cue + source + resultData
  const r = scoreDraft({
    audienceKey: "peer",
    caption: "We improved screening and reduced cost by 40 percent across 12 projects.",
    checklist: { source: true, resultData: true }
  });
  console.log(`Substance ceiling probe: substance=${r.signals.substance}`);
  if(r.signals.substance < 100) flag("ceiling", `Substance maxes at ${r.signals.substance}, never 100 — a perfect-substance draft can't show a full bar.`);
}

/* ── 2. FIT monotonicity: ticking a WANTED ingredient must never lower fit ── */
function allChecklistSubsets(){
  const out = [];
  const n = CHK_IDS.length;
  for(let mask = 0; mask < (1 << n); mask++){
    const ck = {};
    for(let i = 0; i < n; i++) if(mask & (1 << i)) ck[CHK_IDS[i]] = true;
    out.push(ck);
  }
  return out;
}

const baseCaption = "We built a tool for chemists. It helps teams work through their daily tasks.";
for(const audKey of AUD_KEYS){
  const wants = AUDIENCES[audKey].wants;
  for(const ck of allChecklistSubsets()){
    const before = scoreDraft({ audienceKey: audKey, caption: baseCaption, checklist: ck });
    for(const ing of CHK_IDS){
      if(ck[ing]) continue;
      const ck2 = { ...ck, [ing]: true };
      const after = scoreDraft({ audienceKey: audKey, caption: baseCaption, checklist: ck2 });
      // A wanted ingredient should raise (or hold) fit; a non-wanted should hold.
      const isWanted = ing in wants || (ing === "resultData"); // resultData feeds substance
      if(after.signals.fit < before.signals.fit){
        flag("fit-monotonicity", `${audKey}: ticking "${ing}" LOWERED fit ${before.signals.fit}→${after.signals.fit}`);
      }
      if(isWanted && ing in wants && after.signals.fit === before.signals.fit){
        flag("fit-deadcheck", `${audKey}: "${ing}" is wanted (w=${wants[ing]}) but ticking it did nothing to fit.`);
      }
    }
  }
}

/* ── 3. Overall-score monotonicity: adding genuine evidence shouldn't drop score ─ */
{
  const audKey = "peer";
  const c0 = "We made a tool for chemists.";
  const c1 = "We made a tool for chemists. It screened 2 million compounds.";          // +number
  const c2 = c1 + " It reduced screening time by 40 percent.";                          // +result+number
  const s0 = scoreDraft({ audienceKey: audKey, caption: c0, checklist: {} });
  const s1 = scoreDraft({ audienceKey: audKey, caption: c1, checklist: {} });
  const s2 = scoreDraft({ audienceKey: audKey, caption: c2, checklist: {} });
  console.log(`Evidence ramp (peer): ${s0.score} → ${s1.score} → ${s2.score}`);
  if(!(s1.score >= s0.score)) flag("score-monotonicity", `Adding a number dropped score ${s0.score}→${s1.score}`);
  if(!(s2.score >= s1.score)) flag("score-monotonicity", `Adding a result dropped score ${s1.score}→${s2.score}`);
}

/* ── 4. Recommender ↔ scorer agreement on text-detectable ingredients ─────── */
// The recommender reads media/source/community FROM THE PROSE. The scorer's FIT
// only credits them from the checklist. Quantify the gap.
{
  const probes = [
    { name: "video-in-prose", caption: "We filmed a real scientist docking a molecule in a 60-second video. Watch the reel.", ing: "video" },
    { name: "source-in-prose", caption: "The full methods and dataset are linked below in our published paper with a DOI.", ing: "source" },
    { name: "visual-in-prose", caption: "Here is a screenshot of the binding pose, a clear figure of the docked ligand.", ing: "visual" },
    { name: "community-in-prose", caption: "What would you screen first? Drop a comment and tag a collaborator to join us.", ing: "communityHook" },
    { name: "plain-in-prose", caption: "In plain language: we searched billions of molecules and found real drug candidates.", ing: "plainSummary" },
  ];
  // Textual ingredients MUST agree between reco and scorer. Media assets may
  // differ by design (a prose mention isn't proof of an attached asset).
  const TEXTUAL = new Set(["source", "communityHook", "plainSummary", "number", "cta"]);
  for(const p of probes){
    const f = extractFeatures({ caption: p.caption, checklist: {} });
    const detectedByReco = {
      video: f.hasVideo, source: f.hasSource, visual: f.hasVisual,
      communityHook: f.hasCommunityHook, plainSummary: f.hasPlainSummary
    }[p.ing];
    const scored = scoreDraft({ audienceKey: "peer", caption: p.caption, checklist: {} });
    const scorerSees = scored.facts.present.has(p.ing);
    if(TEXTUAL.has(p.ing) && detectedByReco && !scorerSees){
      flag("reco-scorer-gap",
        `TEXTUAL ingredient "${p.ing}" is detected in prose by the recommender but NOT by the scorer — the two halves disagree about the same words.`);
    }
  }
}

/* ── 5. Band-boundary sanity: each band reachable, thresholds consistent ──── */
{
  // sweep a synthetic score by varying evidence; just confirm bands map right
  const cases = [
    { cap: "Our revolutionary game-changing world-class platform will supercharge everything effortlessly!", ck: {}, aud: "pi" },
    { cap: "We screened 2.4 million compounds in 48 hours. 37 hits confirmed in dose-response.", ck: { source:true, resultData:true }, aud: "peer" },
  ];
  for(const c of cases){
    const r = scoreDraft({ audienceKey: c.aud, caption: c.cap, checklist: c.ck });
    console.log(`Band check [${c.aud}]: score=${r.score} band=${r.band.label}`);
  }
}

/* ── 6. Focus ↔ topFix coherence: the named focus should drive the fix ────── */
{
  let mismatches = 0, total = 0;
  const caps = [
    "Our revolutionary game-changing platform supercharges your pipeline effortlessly!",
    "We screened compounds and found hits across many projects in the lab this year somehow.",
    "We made a tool.",
    "This very long sentence keeps going and going well past any reasonable length so that the clarity signal is forced down by the average sentence length penalty which should then surface as the dominant focus area for improvement here today.",
  ];
  for(const audKey of AUD_KEYS){
    for(const cap of caps){
      const r = scoreDraft({ audienceKey: audKey, caption: cap, checklist: {} });
      if(r.empty) continue;
      total++;
      // when focus is fit, topFix should be a FIT_FIX-style ingredient line; loose check
      if(r.score < 80 && !r.topFix) { mismatches++; flag("focus-fix", `${audKey}: no topFix for focus=${r.focus}`); }
    }
  }
  console.log(`Focus/topFix coherence: ${total - mismatches}/${total} ok`);
}

/* ── Report ───────────────────────────────────────────────────────────────── */
console.log("\n===== AUDIT FINDINGS =====");
if(!problems.length){ console.log("No inconsistencies found."); }
else {
  const byCat = {};
  for(const p of problems) (byCat[p.category] ||= []).push(p.detail);
  for(const cat of Object.keys(byCat)){
    // de-dupe identical details
    const uniq = [...new Set(byCat[cat])];
    console.log(`\n[${cat}] (${byCat[cat].length} hits, ${uniq.length} unique)`);
    uniq.slice(0, 8).forEach(d => console.log("  • " + d));
    if(uniq.length > 8) console.log(`  …and ${uniq.length - 8} more`);
  }
}
console.log(`\nTotal problem instances: ${problems.length}`);
