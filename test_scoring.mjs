import { scoreDraft } from './scoring.js';
import { recommendAudience } from './recommend.js';

let pass = 0, fail = 0;
function check(label, got, expected) {
  if (got === expected) { console.log(`  PASS  ${label}: ${got}`); pass++; }
  else { console.log(`  FAIL  ${label}: expected ${expected}, got ${got}`); fail++; }
}

console.log("=== Example 1: The Hype Trap (pi) ===");
const r1 = scoreDraft({
  audienceKey: "pi",
  caption: "Our revolutionary, game-changing platform delivers world-class results that will supercharge your pipeline!",
  checklist: {}
});
check("Clarity", r1.signals.clarity, 100);
check("Trust", r1.signals.trust, 52);
check("Substance", r1.signals.substance, 25);
check("Fit", r1.signals.fit, 0);
check("Score", r1.score, 42);
check("Focus", r1.focus, "substance");
check("Top fix", r1.topFix, "No figure yet. Research group leader responds to a concrete number.");

console.log("\n=== Example 2: The Clean Post (genz, video) ===");
const r2 = scoreDraft({
  audienceKey: "genz",
  caption: "Watch one screen go from idea to a ranked hit list in 20 minutes. We filmed the whole thing. What would you screen first?",
  checklist: { video: true }
});
check("Clarity", r2.signals.clarity, 100);
check("Trust", r2.signals.trust, 100);
check("Substance", r2.signals.substance, 50);
check("Fit", r2.signals.fit, 45);
check("Score", r2.score, 71);
check("Focus", r2.focus, "fit");
check("Top fix", r2.topFix, "Add a visual. A figure or photo earns the first glance.");

console.log("\n=== Example 3: The Data Post (peer, source+resultData) ===");
const r3 = scoreDraft({
  audienceKey: "peer",
  caption: "We screened 2.4 million compounds in 48 hours. 37 hits confirmed in dose-response.",
  checklist: { source: true, resultData: true }
});
console.log(`  Score: ${r3.score}, Focus: ${r3.focus}`);
console.log(`  Signals: C=${r3.signals.clarity} T=${r3.signals.trust} S=${r3.signals.substance} F=${r3.signals.fit}`);

console.log("\n=== Edge: Empty input ===");
const r4 = scoreDraft({ audienceKey: null, caption: "", checklist: {} });
check("Empty flag", r4.empty, true);
check("UsedDefault", r4.usedDefault, true);

console.log("\n=== Edge: Very short input (2 words) ===");
const r5 = scoreDraft({ audienceKey: "peer", caption: "Hello world", checklist: {} });
check("Empty flag", r5.empty, true);

console.log("\n=== Edge: Short input (low confidence) ===");
const r6 = scoreDraft({ audienceKey: "peer", caption: "We tested three compounds.", checklist: {} });
check("Confidence", r6.confidence, "low");

console.log("\n=== Edge: No audience key (defaults to peer) ===");
const r7 = scoreDraft({ audienceKey: null, caption: "We screened 500 molecules and found 12 hits.", checklist: {} });
check("UsedDefault", r7.usedDefault, true);
check("Empty", r7.empty, false);

console.log("\n=== Recommender: dictionary-driven best-audience fit ===");
// Numbers + verifiable source + technical register → research group leader (PI).
const rec1 = recommendAudience({
  caption: "In a prospective benchmark, our docking workflow recovered 92% of known actives in the top 1 percent, a 3-fold enrichment over the baseline. Methods and dataset are linked below.",
  checklist: { source: true, resultData: true }
});
check("Benchmark → PI", rec1.bestKey, "pi");

// Video + visual + community + simple, playful language → Gen Alpha.
const rec2 = recommendAudience({
  caption: "We turned molecular docking into a 30-second game. Can you dock the molecule faster than our scientist? Drop your best time below.",
  checklist: { video: true, visual: true, communityHook: true }
});
check("Reel → Gen Alpha", rec2.bestKey, "genalpha");

// Too little text to judge → null.
check("Too short → null", recommendAudience({ caption: "Hi all", checklist: {} }), null);

// Ranking is complete and sorted.
check("Ranks all 5 audiences", rec1.ranked.length, 5);
check("Ranked descending", rec1.ranked[0].score >= rec1.ranked[4].score, true);

function checkIn(label, got, allowed){
  if(allowed.includes(got)){ console.log(`  PASS  ${label}: ${got}`); pass++; }
  else { console.log(`  FAIL  ${label}: expected one of [${allowed.join(", ")}], got ${got}`); fail++; }
}

console.log("\n=== Real-world BioSolveIT-style samples: detection + recommender ===");

// Marketing copy with an em-dash + a real superlative ("effortlessly").
const sMkt = "SeeSAR is your intuitive, visual drug design platform—covering every step of your discovery process, from virtual screening to fragment-based design, so every chemist can effortlessly advance their research.";
const dMkt = scoreDraft({ audienceKey: "peer", caption: sMkt, checklist: {} });
check("Marketing: em-dash detected", dMkt.facts.hasEmDash, true);
check("Marketing: 'effortlessly' flagged as hype", dMkt.facts.hypeFound.includes("effortlessly"), true);

// Thought-leadership: "the next generation of scientists" must NOT read as hype,
// and an incidental year ("25") must not push the recommender to pharma/pi.
const sThought = "The next 25 years of computational chemistry will not be won in the lab alone—it will be won in the feed, the deck, and the reel—wherever the next generation of scientists actually spends its attention.";
const dThought = scoreDraft({ audienceKey: "peer", caption: sThought, checklist: {} });
check("Thought piece: 'next generation' not hype", dThought.facts.hypeFound.length, 0);
check("Thought piece: em-dash detected", dThought.facts.hasEmDash, true);
checkIn("Thought piece → young/general audience", recommendAudience({ caption: sThought, checklist: {} }).bestKey, ["genz", "peer"]);

// Pharma ROI pitch: quantified value + a clear call to action → pharma.
const sRoi = "Teams cut hit-finding costs by 38% and shortened lead time from 14 months to 9. See the case study, then book a 30-minute call to map it to your portfolio.";
check("ROI pitch → pharma", recommendAudience({ caption: sRoi, checklist: {} }).bestKey, "pharma");

// Deep technical science (no numbers) → research group leader / peer, never a young audience.
const sHyde = "HYDE binding assessment approximates and visualizes affinities based on two major physical driving forces: desolvation and protein-ligand interactions, giving medicinal chemists a transparent, per-atom readout.";
checkIn("Deep science → expert audience", recommendAudience({ caption: sHyde, checklist: {} }).bestKey, ["pi", "peer"]);

// All-caps launch: shouting + exclamation pile-up detected.
const sCaps = "HUGE NEWS!!! Our BRAND NEW docking engine is FINALLY HERE and the results are absolutely INCREDIBLE for EVERY medicinal chemistry team out there!!!";
const dCaps = scoreDraft({ audienceKey: "pi", caption: sCaps, checklist: {} });
check("All-caps: shouting detected", dCaps.facts.shouting, true);
check("All-caps: 6 exclamations", dCaps.facts.exclamations, 6);

// Hedge-heavy abstract: tentative language detected, repels decision-makers.
const sHedge = "We believe this approach might possibly improve enrichment somewhat, and it could potentially reduce screening time, though results may vary and we suspect performance is arguably project-dependent.";
check("Hedgy: 5+ hedge phrases", scoreDraft({ audienceKey: "peer", caption: sHedge, checklist: {} }).facts.hedgeHits >= 5, true);

// Social post (video + community in the prose, no checklist ticks) → young audience.
const sSocial = "We filmed a real scientist docking a molecule in under a minute. No textbook, just the screen. Could you beat her time? Drop a comment and we'll react to the best one.";
checkIn("Social post → young audience", recommendAudience({ caption: sSocial, checklist: {} }).bestKey, ["genz", "genalpha"]);

console.log("\n=== Recommender v3: robustness + adaptivity ===");

// Wall-to-wall hype with no proof must NEVER read as a (hype-averse) PI, and
// "pipeline" / "platform" are marketing jargon, not genuine technical depth.
const sHype = "Our revolutionary, world-class, game-changing platform will supercharge and transform your entire pipeline effortlessly!";
const recHype = recommendAudience({ caption: sHype, checklist: {} });
check("Pure hype is not PI", recHype.bestKey !== "pi", true);
check("Pure hype reads low-confidence", recHype.confidence, "low");

// Plain, neutral text with zero media / interactivity is general writing — it
// should fall to the balanced peer default, never confidently to Gen Alpha.
const sNeutral = "We have a tool that helps with some of the work people do every day in the lab and office.";
check("Neutral text → peer default", recommendAudience({ caption: sNeutral, checklist: {} }).bestKey, "peer");

// The winner always carries a runner-up so the card can offer a next move.
const recRunner = recommendAudience({ caption: sRoi, checklist: {} });
check("Recommendation exposes a runner-up", !!recRunner.runnerUp && recRunner.runnerUp.key !== recRunner.bestKey, true);

// A decisive, well-evidenced expert draft earns real confidence + clear margin.
check("Strong benchmark → high confidence", rec1.confidence, "high");
check("Strong benchmark → clear margin", rec1.margin >= 12, true);

console.log("\n=== Scoring v3: unified detection + reachable ceilings ===");

// Source named in the prose ("linked repository") must count WITHOUT a checkbox.
const v1 = scoreDraft({
  audienceKey: "peer",
  caption: "We recovered 89% of known actives in the top 1% of a billion-compound library, a 4-fold enrichment. Code and benchmarks are in the linked repository.",
  checklist: {}
});
check("Prose source counts (present)", v1.facts.present.has("source"), true);
check("Prose source: no 'add a source' fix", /source/i.test(v1.topFix), false);

// A plain-language line in the prose must count without a checkbox.
const v2 = scoreDraft({
  audienceKey: "genz",
  caption: "In plain terms: we searched 2.4 billion molecules in under an hour and found 37 candidates.",
  checklist: {}
});
check("Prose plain-summary counts", v2.facts.present.has("plainSummary"), true);

// A question counts as a community hook in the prose.
const v3c = scoreDraft({ audienceKey: "genz", caption: "We filmed the whole screen. What would you screen first?", checklist: {} });
check("Question = community hook", v3c.facts.present.has("communityHook"), true);

// Substance is reachable to a full 100 with complete evidence.
const v4 = scoreDraft({
  audienceKey: "peer",
  caption: "We reduced screening time by 40% across 12 projects, verified against the linked benchmark dataset.",
  checklist: { resultData: true }
});
check("Substance reaches 100", v4.signals.substance, 100);

// contributions + whatIf are exposed for the UI.
check("Exposes weighted contributions", typeof v1.contributions.weighted.fit, "number");
check("What-if is a sorted list of gains", Array.isArray(v1.whatIf), true);
const hypeDraft = scoreDraft({ audienceKey: "pi", caption: "Our revolutionary platform will supercharge your pipeline effortlessly.", checklist: {} });
check("What-if surfaces a real lever", hypeDraft.whatIf.length > 0, true);
check("Contributions list trust deductions", hypeDraft.contributions.deductions.trust.length > 0, true);

// Hype rewrite suggestion is concrete, not generic.
check("Hype fix offers a concrete swap", /Say what gets faster|specific|benchmark|capability|result|number/i.test(hypeDraft.topFix) || hypeDraft.topFix.includes("hype"), true);

// Media mentioned in prose but not ticked surfaces as a nudge (not a score change).
const v5 = scoreDraft({ audienceKey: "genalpha", caption: "We filmed a 30-second reel of the docking run.", checklist: {} });
check("Unticked media mention → nudge", v5.facts.mediaNudges.includes("video"), true);

console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
