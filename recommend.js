/* ── recommend.js ── dictionary-driven "best audience" recommender ──
   Additive layer: reads the draft through the bundled lexicon (lexicon.js)
   and infers which of the five audiences the *writing itself* most naturally
   suits — independent of the 4-signal resonance score. Never mutates state or
   the scoring pipeline.

   v3 — robustness pass:
   • Richer feature vector (questions, 2nd/1st-person address, emoji, sentence
     rhythm, reading-ease bands, caps-shout) so the five audiences separate
     cleanly instead of collapsing onto a Peer default.
   • Each audience is scored as evidence + / repellent − from a *low* shared
     baseline, so a neutral draft yields a genuinely low-confidence read
     rather than a confident-but-arbitrary winner.
   • Softmax over the raw scores gives a calibrated confidence and a real
     runner-up, so the UI can always offer "the next best fit" — the draft
     never feels stuck on one answer.

   Output: a ranked list of audience affinities (0–100), the winner's reason,
   a runner-up (key + reason), and a confidence label. */

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

function countMatches(text, rx){ return (text.match(rx) || []).length; }

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

const RX_QUESTION    = /\?/g;
const RX_EXCLAIM     = /!/g;
// 2nd-person address ("you", "your", "you'll") — marketing / conversational.
const RX_SECONDPER   = /\b(you|your|you're|you'll|you've|yours|yourself)\b/gi;
// 1st-person ("I", "we", "our") — a human presence behind the words.
const RX_FIRSTPER    = /\b(i|we|we're|we've|i'm|i've|our|ours|my|us)\b/gi;
// Emoji / pictographs — a strong young-audience signal.
const RX_EMOJI       = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu;
const RX_HASHTAG     = /(^|\s)#[a-z0-9_]+/gi;

/** Extract the linguistic feature vector the recommender reasons over. */
export function extractFeatures({ caption, checklist }){
  const text = (caption || "").trim();
  const words = getWords(text);
  const sents = splitSentences(text);
  const sentCount = Math.max(sents.length, 1);
  const r = readability(words, sentCount);

  const wl = words.map(w => w.toLowerCase().replace(/[^a-z'-]/g, "")).filter(Boolean);

  const excitement = wl.filter(w => EXCITEMENT_WORDS.has(w)).length;
  const exclamations = countMatches(text, RX_EXCLAIM);
  const questions = countMatches(text, RX_QUESTION);
  const hype = HYPE_WORDS.filter(x => matchesWord(text, x)).length;
  const hedge = HEDGE_WORDS.filter(x => matchesWord(text, x)).length;
  const hasNumber = /\d|%/.test(text);
  const hasResultCue = RESULT_CUES.some(x => matchesWord(text, x));

  // A "metric" is a quantified claim (percentage, X-fold, or a number paired
  // with a result cue) — distinct from an incidental number like "25 years".
  const hasMetric = /%/.test(text) || RX_FOLD.test(text) || (hasNumber && hasResultCue);

  // Sentence rhythm + reader-friendliness signals.
  const avgSentLen   = words.length / sentCount;
  const secondPerson = countMatches(text, RX_SECONDPER);
  const firstPerson  = countMatches(text, RX_FIRSTPER);
  const emoji        = countMatches(text, RX_EMOJI);
  const hashtags     = countMatches(text, RX_HASHTAG);

  const ck = checklist || {};
  return {
    wordCount: words.length,
    sentCount,
    grade: r.grade,                       // Flesch–Kincaid grade level
    ease: r.ease,                         // Flesch reading ease (higher = simpler)
    complexShare: r.complexShare,         // 3+ syllable, non-common words
    unfamiliarShare: r.unfamiliarShare,   // general-reader-unfriendly vocabulary
    jargonShare: r.jargonShare,           // domain technical terms
    avgSentLen,
    excitement,                           // playful/excited tone words
    exclamations,
    questions,
    secondPerson,                         // "you / your" — conversational / salesy
    firstPerson,                          // "I / we / our" — a human behind it
    emoji,
    hashtags,
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
   the largest positive weight becomes the headline explanation.

   Design: a low shared baseline (38) + evidence. Strong repellents push an
   audience well below baseline so a clearly-wrong fit reads as a clearly-low
   bar — that separation is what lets the softmax express real confidence. */

function clamp(n){ return Math.max(0, Math.min(100, n)); }

// The youngest, most visual / interactive reader. Formal register repels.
function scoreGenAlpha(f){
  let s = 38; const reasons = [];
  const youthMedia = f.hasVideo || f.hasVisual || f.hasCommunityHook;
  const playful = f.excitement + f.exclamations + f.emoji;
  if(f.hasVideo){ s += 22; reasons.push({ weight:22, text:"it leads with video, the format this audience lives in" }); }
  if(f.hasVisual){ s += 16; reasons.push({ weight:16, text:"it shows something visual to look at" }); }
  if(f.hasCommunityHook){ s += 12; reasons.push({ weight:12, text:"it invites people to join in" }); }
  // Simplicity supports the fit, but Gen Alpha is defined by visual / interactive
  // media — not plain text alone — so it weighs less than the media signals.
  if(f.grade <= 8){ s += 12; reasons.push({ weight:12, text:"a simple, easy-to-skim reading level" }); }
  else if(f.grade >= 12){ s -= 22; }
  if(f.ease >= 70){ s += 5; }
  if(f.hasHumanVoice){ s += 6; reasons.push({ weight:6, text:"a real, human presence" }); }
  if(playful >= 2){ s += 8; reasons.push({ weight:8, text:"its playful, high-energy tone" }); }
  if(f.questions >= 1){ s += 4; }
  // Repellents: density, jargon, dry expert prose.
  if(f.unfamiliarShare > 0.12){ s -= 26; }
  if(f.jargonShare > 0.05){ s -= 22; }
  if(f.hype >= 1){ s -= 8; }
  if(f.avgSentLen > 22){ s -= 10; }
  if(f.hasMetric && !f.hasVideo && !f.hasVisual){ s -= 14; }   // dry numbers, no visuals
  // Plain text carrying no media, interactivity, or playful energy isn't a
  // Gen Alpha fit — it's just general writing. Pull it back to the baseline.
  if(!youthMedia && playful === 0 && f.questions === 0){ s -= 16; }
  return { score: clamp(s), reasons };
}

// Entering the workforce. Human voice + community + video, conversational.
function scoreGenZ(f){
  let s = 40; const reasons = [];
  if(f.hasHumanVoice){ s += 18; reasons.push({ weight:18, text:"it shows a real person, not a logo" }); }
  if(f.hasVideo){ s += 15; reasons.push({ weight:15, text:"it carries short-form video" }); }
  if(f.hasCommunityHook){ s += 13; reasons.push({ weight:13, text:"it invites a conversation" }); }
  if(f.hasPlainSummary){ s += 7; reasons.push({ weight:7, text:"a plain-language line for non-experts" }); }
  if(f.grade >= 7 && f.grade <= 14){ s += 11; reasons.push({ weight:11, text:"an accessible, conversational reading level" }); }
  else if(f.grade >= 17){ s -= 18; }
  if(f.firstPerson >= 2){ s += 6; reasons.push({ weight:6, text:"a first-person voice that feels personal" }); }
  if(f.secondPerson >= 1){ s += 5; reasons.push({ weight:5, text:"it talks directly to the reader" }); }
  if(f.emoji >= 1 || f.excitement >= 1){ s += 5; }
  // Repellents: corporate hype + deep jargon read as inauthentic to them.
  if(f.hype >= 1){ s -= 12; }
  if(f.hype >= 3){ s -= 8; }
  if(f.jargonShare > 0.10){ s -= 16; }
  if(f.unfamiliarShare > 0.18){ s -= 8; }
  return { score: clamp(s), reasons };
}

// Time-poor analyst. Numbers, sources, technical register. Hype repels hard.
function scorePI(f){
  let s = 40; const reasons = [];
  if(f.hasMetric){ s += 20; reasons.push({ weight:20, text:"it puts a hard metric on the table" }); }
  // A bare number with no result context (e.g. an incidental year) is not the
  // "concrete data" a PI grips onto — only a real metric earns that credit.
  if(f.hasSource){ s += 15; reasons.push({ weight:15, text:"it names a source they can verify" }); }
  if(f.hasResult){ s += 7; reasons.push({ weight:7, text:"it points to a measurable result" }); }
  // Genuine technical register — but only when the text isn't drowning in hype.
  // Buzzwords like "pipeline" or "platform" are marketing jargon, not depth.
  if(f.jargonShare >= 0.04 && f.hype < 2){ s += 14; reasons.push({ weight:14, text:"it speaks the field's technical language" }); }
  if(f.grade >= 13){ s += 7; reasons.push({ weight:7, text:"a precise, expert-level register" }); }
  if(f.complexShare >= 0.18){ s += 4; }
  // Repellents: hype, hedging, breathless tone, salesy 2nd-person, emoji.
  if(f.hype >= 1){ s -= 20; }
  if(f.hype >= 3){ s -= 12; }                          // wall-to-wall hype: hard no
  if(f.hedge >= 3){ s -= 12; }
  if(f.excitement + f.exclamations >= 3){ s -= 14; }
  if(f.emoji >= 1){ s -= 10; }
  if(f.secondPerson >= 3 && !f.hasMetric){ s -= 6; }
  // Nothing concrete to grip — unless the text is genuinely deep technical prose.
  const deepTechnical = (f.jargonShare >= 0.04 && f.grade >= 14)
    || f.grade >= 18 || f.unfamiliarShare >= 0.30;
  if(!f.hasMetric && !f.hasResult && !f.hasNumber && !f.hasSource && !deepTechnical){ s -= 12; }
  return { score: clamp(s), reasons };
}

// ROI-focused decision-maker. Quantified value + a clear next step.
function scorePharma(f){
  let s = 40; const reasons = [];
  if(f.hasMetric){ s += 18; reasons.push({ weight:18, text:"it quantifies the value" }); }
  else if(f.hasNumber && f.hasResult){ s += 7; reasons.push({ weight:7, text:"it cites a number behind the outcome" }); }
  if(f.hasResult){ s += 9; reasons.push({ weight:9, text:"it shows a measurable outcome" }); }
  if(f.hasCTA){ s += 13; reasons.push({ weight:13, text:"it gives a clear next step to act on" }); }
  if(f.hasSource){ s += 7; reasons.push({ weight:7, text:"it offers something to verify" }); }
  if(f.grade >= 10 && f.grade <= 16){ s += 8; reasons.push({ weight:8, text:"a clear, business-ready register" }); }
  if(f.hasPlainSummary){ s += 6; reasons.push({ weight:6, text:"a plain takeaway a decision-maker can act on" }); }
  if(f.secondPerson >= 1 && f.hasCTA){ s += 4; }
  // Repellents: hype, hedging (they want certainty), jargon rabbit-holes.
  if(f.hype >= 2){ s -= 16; }
  if(f.hedge >= 2){ s -= 14; }
  if(f.jargonShare > 0.14){ s -= 10; }
  if(f.emoji >= 1){ s -= 8; }
  if(!f.hasMetric && !f.hasNumber && !f.hasResult && !f.hasCTA){ s -= 10; }
  return { score: clamp(s), reasons };
}

// The balanced, technical-but-general baseline reader.
function scorePeer(f){
  let s = 46; const reasons = [];     // slightly higher: the sensible default
  if(f.hasMetric || f.hasResult || f.hasNumber){ s += 11; reasons.push({ weight:11, text:"it backs the claim with something concrete" }); }
  if(f.hasSource){ s += 9; reasons.push({ weight:9, text:"it gives a source to check" }); }
  if(f.jargonShare > 0 && f.jargonShare <= 0.12 && f.hype < 2){ s += 11; reasons.push({ weight:11, text:"a comfortable technical-but-readable balance" }); }
  if(f.grade >= 10 && f.grade <= 15){ s += 7; reasons.push({ weight:7, text:"a reproducible, no-fluff tone" }); }
  if(f.hasPlainSummary){ s += 4; }
  // Repellents: hype and runaway jargon both pull it off-centre.
  if(f.hype >= 2){ s -= 12; }
  if(f.jargonShare > 0.16){ s -= 10; }
  if(f.emoji >= 1){ s -= 4; }
  return { score: clamp(s), reasons };
}

const SCORERS = {
  genalpha: scoreGenAlpha,
  genz:     scoreGenZ,
  pi:       scorePI,
  pharma:   scorePharma,
  peer:     scorePeer
};

/** Build a plain-English reason from a scorer's strongest positive factors. */
function buildReason(reasons){
  const top = reasons
    .filter(r => r.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map(r => r.text);
  if(top.length === 0) return "its overall balance of tone, reading level, and content.";
  if(top.length === 1) return top[0] + ".";
  return top[0] + ", and " + top[1] + ".";
}

/**
 * Recommend the audience the draft most naturally fits.
 * @returns {null | {
 *   bestKey, bestScore, ranked:[{key,label,score}], reason,
 *   runnerUp:{key,label,score,reason}|null, confidence, margin, features
 * }}
 *   Returns null when there isn't enough text to judge.
 */
export function recommendAudience({ caption, checklist }){
  const f = extractFeatures({ caption, checklist });
  if(f.wordCount < 5) return null;                     // too little to read

  const scored = Object.keys(SCORERS)
    .filter(k => AUDIENCES[k])
    .map(key => {
      const { score, reasons } = SCORERS[key](f);
      return { key, label: AUDIENCES[key].label, score, reasons };
    })
    // Deterministic order: score desc, then a fixed priority so ties never flicker.
    .sort((a, b) => b.score - a.score || PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key));

  const best = scored[0];
  const runnerUp = scored[1] || null;
  const margin = best.score - (runnerUp ? runnerUp.score : 0);

  // Softmax over raw scores → a calibrated sense of how decisive the winner is.
  // Combined with how much text we actually read, this drives the label.
  const peak = Math.max(...scored.map(s => s.score));
  const expSum = scored.reduce((acc, s) => acc + Math.exp((s.score - peak) / 12), 0);
  const winnerProb = Math.exp((best.score - peak) / 12) / expSum;   // 0.2 (tie) … ~1 (decisive)

  let confidence = "medium";
  if(f.wordCount < 12 || margin < 6 || winnerProb < 0.30) confidence = "low";
  else if(f.wordCount >= 28 && margin >= 12 && winnerProb >= 0.42) confidence = "high";
  // If even the winner sits below the neutral baseline, nothing fits well —
  // never project more than a tentative read, however clear the margin.
  if(best.score < 45 && confidence !== "low") confidence = "low";

  return {
    bestKey: best.key,
    bestScore: best.score,
    ranked: scored.map(({ key, label, score }) => ({ key, label, score })),
    reason: buildReason(best.reasons),
    runnerUp: runnerUp ? {
      key: runnerUp.key,
      label: runnerUp.label,
      score: runnerUp.score,
      reason: buildReason(runnerUp.reasons)
    } : null,
    confidence,
    margin,
    features: f
  };
}

// Fixed tie-break order. On a genuine tie the draft carries no decisive signal,
// so the balanced general reader (peer) is the safest default — never a niche
// audience like a hype-averse PI or a media-hungry teen.
const PRIORITY = ["peer", "pi", "pharma", "genz", "genalpha"];
