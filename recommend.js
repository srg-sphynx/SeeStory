/* ── recommend.js ── dictionary-driven "best audience" recommender ──
   Additive layer: reads the draft through the bundled lexicon (lexicon.js)
   and infers which of the five audiences the *writing itself* most naturally
   suits — independent of the 4-signal resonance score. Never mutates state or
   the scoring pipeline.

   Output is a ranked list of audience affinities (0–100) plus a plain-English
   reason for the winner, built from whichever factors contributed most. */

import { AUDIENCES, HYPE_WORDS, HEDGE_WORDS, RESULT_CUES, CTA_REGEX } from './data.js';
import { readability, EXCITEMENT_WORDS } from './lexicon.js';

function getWords(text){ return (text.match(/\S+/g) || []); }

function splitSentences(text){
  return text.replace(/([.!?]+)\s+/g, "$1|SPLIT|").split("|SPLIT|").map(s=>s.trim()).filter(Boolean);
}

function matchesWord(text, phrase){
  const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + esc + "\\b", "i").test(text);
}

/* ── Text-based cue detectors ──────────────────────────────────────────────
   The recommender must judge the *prose itself*, so media / community / proof
   intent is read from the text — not only from the declared checklist. */
const RX_VIDEO     = /\b(video|reel|reels|filmed|film|footage|clip|on[- ]camera|tiktok|youtube|short[- ]?form|watch (the|her|him|us|it|our))\b/i;
const RX_VISUAL    = /\b(visual|figure|graphic|graphics|image|photo|diagram|infographic|screenshot|render|3d view|illustration)\b/i;
const RX_HUMAN     = /\b(real (person|scientist|scientists|people|chemist)|face[- ]to[- ]camera|behind the scenes|meet (the|our)|our scientist|i tried|i built|i'm a|i am a|my team|her time|his time)\b/i;
const RX_COMMUNITY = /\?|\b(comment|reply|tag|join us|drop (a|your)|let us know|what would you|your thoughts|tell us|vote|poll|share this)\b/i;
const RX_PLAIN     = /\b(the simple version|in plain|plain[- ]language|plain english|in short|in plain terms|one[- ]minute|tl;?dr|here is the simple|simply put|the gist)\b/i;
const RX_SOURCE    = /\b(doi|preprint|paper|papers|dataset|datasets|published|publication|reference|see the (paper|study|case study)|case study|linked below|methods (are|and))\b/i;
const RX_FOLD      = /\b\d+(\.\d+)?\s?[- ]?fold\b/i;

/** Extract the linguistic feature vector the recommender reasons over. */
export function extractFeatures({ caption, checklist }){
  const text = (caption || "").trim();
  const words = getWords(text);
  const sents = splitSentences(text);
  const r = readability(words, Math.max(sents.length, 1));

  const wl = words.map(w => w.toLowerCase().replace(/[^a-z'-]/g, "")).filter(Boolean);

  const excitement = wl.filter(w => EXCITEMENT_WORDS.has(w)).length;
  const exclamations = (text.match(/!/g) || []).length;
  const hype = HYPE_WORDS.filter(x => matchesWord(text, x)).length;
  const hedge = HEDGE_WORDS.filter(x => matchesWord(text, x)).length;
  const hasNumber = /\d|%/.test(text);
  const hasResultCue = RESULT_CUES.some(x => matchesWord(text, x));

  // A "metric" is a quantified claim (percentage, X-fold, or a number paired
  // with a result cue) — distinct from an incidental number like "25 years".
  const hasMetric = /%/.test(text) || RX_FOLD.test(text) || (hasNumber && hasResultCue);

  const ck = checklist || {};
  return {
    wordCount: words.length,
    grade: r.grade,                       // Flesch–Kincaid grade level
    ease: r.ease,                         // Flesch reading ease (higher = simpler)
    complexShare: r.complexShare,         // 3+ syllable, non-common words
    unfamiliarShare: r.unfamiliarShare,   // general-reader-unfriendly vocabulary
    jargonShare: r.jargonShare,           // domain technical terms
    excitement,                           // playful/excited tone words
    exclamations,
    hype,                                 // marketing superlatives
    hedge,                                // tentative language
    hasNumber,                            // any digit / %
    hasMetric,                            // quantified claim
    hasResult: hasResultCue || !!ck.resultData,
    // media / ingredients — declared (checklist) OR detected in the prose
    hasVideo:         !!ck.video         || RX_VIDEO.test(text),
    hasVisual:        !!ck.visual        || RX_VISUAL.test(text),
    hasHumanVoice:    !!ck.humanVoice    || RX_HUMAN.test(text),
    hasCommunityHook: !!ck.communityHook || RX_COMMUNITY.test(text),
    hasPlainSummary:  !!ck.plainSummary  || RX_PLAIN.test(text),
    hasSource:        !!ck.source        || RX_SOURCE.test(text),
    hasCTA:           CTA_REGEX.test(text)
  };
}

/* ── Per-audience affinity scorers ────────────────────────────────────────
   Each returns { score (0–100), reasons:[{weight, text}] }. The reason with
   the largest positive weight becomes the headline explanation. */

function clamp(n){ return Math.max(0, Math.min(100, n)); }

function scoreGenAlpha(f){
  let s = 45; const reasons = [];
  if(f.grade <= 9){ s += 18; reasons.push({ weight:18, text:"a simple, school-level reading grade" }); }
  else if(f.grade >= 13){ s -= 22; }
  if(f.hasVideo || f.hasVisual){ s += 20; reasons.push({ weight:20, text:"it leads with video or visuals" }); }
  if(f.hasCommunityHook){ s += 10; reasons.push({ weight:10, text:"it invites people to join in" }); }
  if(f.hasHumanVoice){ s += 6; reasons.push({ weight:6, text:"a real, human presence" }); }
  if(f.unfamiliarShare > 0.12){ s -= 25; }
  if(f.jargonShare > 0.05){ s -= 18; }
  if(f.excitement + f.exclamations >= 2){ s += 6; reasons.push({ weight:6, text:"its playful, high-energy tone" }); }
  if(f.hasMetric && !f.hasVideo && !f.hasVisual){ s -= 10; }   // dry numbers, no visuals
  return { score: clamp(s), reasons };
}

function scoreGenZ(f){
  let s = 48; const reasons = [];
  if(f.grade >= 8 && f.grade <= 14){ s += 12; reasons.push({ weight:12, text:"an accessible, conversational reading level" }); }
  else if(f.grade >= 16){ s -= 16; }
  if(f.hasHumanVoice){ s += 16; reasons.push({ weight:16, text:"it shows a real person, not a logo" }); }
  if(f.hasVideo){ s += 14; reasons.push({ weight:14, text:"it carries short-form video" }); }
  if(f.hasCommunityHook){ s += 12; reasons.push({ weight:12, text:"it invites a conversation" }); }
  if(f.hasPlainSummary){ s += 6; reasons.push({ weight:6, text:"a plain-language line for non-experts" }); }
  if(f.hype >= 2){ s -= 18; }                          // corporate hype repels them
  if(f.jargonShare > 0.10){ s -= 14; }
  return { score: clamp(s), reasons };
}

function scorePI(f){
  let s = 46; const reasons = [];
  if(f.hasMetric){ s += 18; reasons.push({ weight:18, text:"it puts a hard metric on the table" }); }
  else if(f.hasNumber){ s += 6; reasons.push({ weight:6, text:"it cites a concrete number" }); }
  if(f.hasSource){ s += 14; reasons.push({ weight:14, text:"it names a source they can verify" }); }
  if(f.hasResult){ s += 6; reasons.push({ weight:6, text:"it points to a measurable result" }); }
  if(f.jargonShare >= 0.04){ s += 12; reasons.push({ weight:12, text:"it speaks the field's technical language" }); }
  if(f.grade >= 12){ s += 6; reasons.push({ weight:6, text:"a precise, expert-level register" }); }
  if(f.hype >= 1){ s -= 16; }                          // hype is a hard turn-off
  if(f.hedge >= 3){ s -= 12; }
  if(f.excitement + f.exclamations >= 3){ s -= 12; }
  // Nothing concrete to grip — unless the text is genuinely deep technical prose
  // (high jargon + grade, an expert reading level, or dense unfamiliar vocabulary).
  const deepTechnical = (f.jargonShare >= 0.04 && f.grade >= 14)
    || f.grade >= 18 || f.unfamiliarShare >= 0.30;
  if(!f.hasMetric && !f.hasResult && !f.hasNumber && !f.hasSource && !deepTechnical){ s -= 10; }
  return { score: clamp(s), reasons };
}

function scorePharma(f){
  let s = 46; const reasons = [];
  if(f.hasMetric){ s += 16; reasons.push({ weight:16, text:"it quantifies the value" }); }
  else if(f.hasNumber){ s += 6; reasons.push({ weight:6, text:"it cites a number" }); }
  if(f.hasResult){ s += 8; reasons.push({ weight:8, text:"it shows a measurable outcome" }); }
  if(f.hasCTA){ s += 10; reasons.push({ weight:10, text:"it gives a clear next step to act on" }); }
  if(f.hasSource){ s += 6; reasons.push({ weight:6, text:"it offers something to verify" }); }
  if(f.grade >= 10 && f.grade <= 16){ s += 8; reasons.push({ weight:8, text:"a clear, business-ready register" }); }
  if(f.hasPlainSummary){ s += 6; reasons.push({ weight:6, text:"a plain takeaway a decision-maker can act on" }); }
  if(f.hype >= 2){ s -= 16; }
  if(f.hedge >= 2){ s -= 14; }                         // they want certainty / ROI
  if(f.jargonShare > 0.14){ s -= 8; }                  // too deep in the weeds
  return { score: clamp(s), reasons };
}

function scorePeer(f){
  let s = 50; const reasons = [];           // the balanced, technical-but-general baseline
  if(f.hasMetric || f.hasResult || f.hasNumber){ s += 10; reasons.push({ weight:10, text:"it backs the claim with something concrete" }); }
  if(f.hasSource){ s += 8; reasons.push({ weight:8, text:"it gives a source to check" }); }
  if(f.jargonShare > 0 && f.jargonShare <= 0.12){ s += 10; reasons.push({ weight:10, text:"a comfortable technical-but-readable balance" }); }
  if(f.grade >= 10 && f.grade <= 15){ s += 6; reasons.push({ weight:6, text:"a reproducible, no-fluff tone" }); }
  if(f.hype >= 2){ s -= 10; }
  if(f.jargonShare > 0.16){ s -= 8; }
  return { score: clamp(s), reasons };
}

const SCORERS = {
  genalpha: scoreGenAlpha,
  genz:     scoreGenZ,
  pi:       scorePI,
  pharma:   scorePharma,
  peer:     scorePeer
};

/**
 * Recommend the audience the draft most naturally fits.
 * @returns {null | { bestKey, bestScore, ranked:[{key,label,score}], reason, confidence, features }}
 *   Returns null when there isn't enough text to judge.
 */
export function recommendAudience({ caption, checklist }){
  const f = extractFeatures({ caption, checklist });
  if(f.wordCount < 5) return null;                     // too little to read

  const ranked = Object.keys(SCORERS)
    .filter(k => AUDIENCES[k])
    .map(key => {
      const { score, reasons } = SCORERS[key](f);
      return { key, label: AUDIENCES[key].label, score, reasons };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const runnerUp = ranked[1];
  const margin = best.score - (runnerUp ? runnerUp.score : 0);

  // Confidence reflects both how much text we read and how clear the winner is.
  let confidence = "medium";
  if(f.wordCount < 12 || margin < 6) confidence = "low";
  else if(f.wordCount >= 30 && margin >= 14) confidence = "high";

  // Build the headline reason from the winner's strongest positive factors.
  const topReasons = best.reasons
    .filter(r => r.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map(r => r.text);

  let reason;
  if(topReasons.length === 0){
    reason = "its overall balance of tone, reading level, and content.";
  } else if(topReasons.length === 1){
    reason = topReasons[0] + ".";
  } else {
    reason = topReasons[0] + ", and " + topReasons[1] + ".";
  }

  return {
    bestKey: best.key,
    bestScore: best.score,
    ranked: ranked.map(({ key, label, score }) => ({ key, label, score })),
    reason,
    confidence,
    features: f
  };
}
