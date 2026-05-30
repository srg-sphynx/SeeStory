/* ── scoring.js ── pure scoring functions (ES module) ── */

import {
  AUDIENCES, ANCHORS, FRAGMENTS, CLASSES, CLASS_LABEL,
  HYPE_WORDS, DRIVER_RULES, STOPPER_RULES
} from './data.js';

/* ── State ── */
export const state = {
  audience: "genz",
  anchor: ANCHORS[0].id,
  selected: new Set(),
  caption: ""
};

/* ── Helpers ── */
export function splitSentences(text){
  return text.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
}

function wordCount(s){ return (s.match(/\S+/g) || []).length; }

/* ── Text analysis (audience-agnostic per BUILD.md) ── */
export function analyseText(caption){
  const drivers = [];
  const stoppers = [];           // each: {label, snippet}
  const text = caption.trim();
  if(!text){ return { drivers, stoppers, points:0 }; }

  const sentences = splitSentences(text);
  const words = wordCount(text);
  const avgLen = words / Math.max(sentences.length, 1);

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

/* ── Pocket fit (0 to 1) ── */
export function pocketFit(audienceKey, anchorId, selected){
  const aud = AUDIENCES[audienceKey];
  if(!aud) return { fit:0, breakdown:{ clarity:0, voice:0, visual:0, community:0 } };

  const sums = { clarity:0, voice:0, visual:0, community:0 };

  const anchor = ANCHORS.find(a=>a.id===anchorId);
  if(anchor){ sums[anchor.class] += anchor.value; }

  FRAGMENTS.forEach(f=>{
    if(selected.has(f.id)){ sums[f.class] += f.value; }
  });

  // cap each class at 1, then weight — simple hard cap per BUILD.md
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

/* ── Resonance score (0 to 100) ── */
export function resonance(audienceKey, anchorId, selected, caption){
  const { fit, breakdown } = pocketFit(audienceKey, anchorId, selected);
  const text = analyseText(caption);

  // blend: pocket fit is the backbone, text nudges it
  // BUILD.md: score = 40 + fit*45 + text.points*15
  let score = 40 + fit*45 + text.points*15;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, fit, breakdown, text };
}

/* ── Score banding (color and label) ── */
export function band(score){
  if(score >= 75) return { color:"#178A38", label:"High affinity" };
  if(score >= 50) return { color:"#C9A227", label:"Binds, can improve" };
  return            { color:"#C0392B", label:"Weak fit" };
}

/* ── Suggestions (optimised pose tips) ── */
export function suggestions(result, audienceKey){
  const tips = [];
  result.text.stoppers.forEach(s=>{
    if(s.label==="Hyperbole") tips.push(`Replace "${s.snippet}" with a specific result.`);
    if(s.label==="Em or en dash") tips.push("Swap the dash for a period or a comma.");
    if(s.label==="Run-on sentence") tips.push("Split the long sentence into two.");
    if(s.label==="Shouting in caps") tips.push("Drop the all-caps. Let the point carry itself.");
  });

  // weakest class for this audience
  const aud = AUDIENCES[audienceKey];
  if(aud){
    const weakest = CLASSES
      .map(c=>({c, gap: aud.weights[c] - result.breakdown[c]}))
      .sort((a,b)=>b.gap-a.gap)[0];
    if(weakest && weakest.gap > 0.05){
      tips.push(`Add a ${CLASS_LABEL[weakest.c]} fragment. This audience weights it heavily.`);
    }
  }
  if(!tips.length) tips.push("Strong pose. Ship it.");
  return tips;
}
