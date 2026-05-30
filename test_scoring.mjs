import { scoreDraft } from './scoring.js';

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
check("Substance", r1.signals.substance, 30);
check("Fit", r1.signals.fit, 0);
check("Score", r1.score, 44);
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
check("Substance", r2.signals.substance, 55);
check("Fit", r2.signals.fit, 30);
check("Score", r2.score, 65);
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

console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
