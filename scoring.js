/* ── scoring.js ── pure scoring functions (v2, 4-signal model) ── */

import {
  AUDIENCES, HYPE_WORDS, HEDGE_WORDS, RESULT_CUES,
  CTA_REGEX, NUMBER_REGEX, EMDASH_REGEX, SHOUT_REGEX,
  BAND, FIT_FIX, COPY, SIGNALS
} from './data.js';

/* ── Helpers ── */

/** Cross-browser sentence splitter (no lookbehinds, safe on Safari/iOS). */
export function splitSentences(text){
  return text.replace(/([.!?]+)\s+/g, "$1|SPLIT|").split("|SPLIT|").map(s=>s.trim()).filter(Boolean);
}

function getWords(text){ return (text.match(/\S+/g) || []); }

function avg(arr){ return arr.length ? arr.reduce((a,b)=>a+b, 0) / arr.length : 0; }

function clamp(n){ return Math.max(0, Math.min(100, n)); }

export function normaliseWeights(w){
  const sum = w.clarity + w.trust + w.substance + w.fit;
  if(sum <= 0) return { clarity:0.25, trust:0.25, substance:0.25, fit:0.25 };
  return {
    clarity:   w.clarity   / sum,
    trust:     w.trust     / sum,
    substance: w.substance / sum,
    fit:       w.fit       / sum
  };
}

export function getBand(score){
  return BAND.find(b => score >= b.min);
}

export function getSignalBand(score){
  if(score >= 70) return "high";
  if(score >= 45) return "mid";
  return "low";
}

/* ── Fix chooser (section G.4 priority ladder) ── */

export function chooseFix(focus, f, aud){
  if(focus === "trust"){
    if(f.hasEmDash) return "Found an em dash. Swap it for a period or a comma.";
    if(f.hypeFound.length) return `The word "${f.hypeFound[0]}" reads as hype. Replace it with a specific result.`;
    if(f.shouting) return "All-caps reads as shouting. Make the point quietly.";
    if(f.exclamations >= 2) return "Ease off the exclamation marks. Let the point carry itself.";
    if((f.audienceKey==="pi"||f.audienceKey==="pharma") && f.hedgeHits >= 3)
      return "Lots of hedging. If the data supports it, state it plainly.";
    return "Tighten the tone. Say it plainly and drop the buzzwords.";
  }
  if(focus === "clarity"){
    if(f.longSentences > 0) return "One sentence runs long. Split it in two.";
    if(f.avgSent > 20) return "Sentences are long on average. Aim for short, single-idea lines.";
    if((f.audienceKey==="genz"||f.audienceKey==="genalpha") && f.longWordShare > 0.15)
      return "Long words for this audience. Trade a few for everyday ones.";
    return "Trim for readability. Short sentences land harder.";
  }
  if(focus === "substance"){
    if(!f.hasNumber && "number" in aud.wants)
      return `No figure yet. ${aud.label} responds to a concrete number.`;
    if(!f.present.has("source") && "source" in aud.wants)
      return `No source. ${aud.label} wants something to verify.`;
    if(!f.hasResultCue) return "Add a concrete result. What changed, and by how much?";
    return "Make it more concrete. Numbers and results build trust.";
  }
  // focus === "fit": highest-weighted missing wanted ingredient
  const missing = Object.keys(aud.wants)
    .filter(i => !f.present.has(i))
    .sort((a,b)=>aud.wants[b]-aud.wants[a])[0];
  return missing ? FIT_FIX[missing] : "Add what this audience cares about most.";
}

/* ── Main scoring function ── */

export function scoreDraft({ audienceKey, caption, checklist }){
  const aud = AUDIENCES[audienceKey] || AUDIENCES.peer;
  const text = (caption || "").trim();
  const w = getWords(text);
  const usedDefault = !AUDIENCES[audienceKey];

  // ---- empty / very short handling ----
  if(w.length < 3){
    return { empty:true, message: COPY.emptyState, usedDefault };
  }
  const confidence = w.length < 12 ? "low" : (w.length <= 40 ? "medium" : "high");

  // ---- derived facts ----
  const sents = splitSentences(text);
  const avgSent = avg(sents.map(s => getWords(s).length));
  const longSentences = sents.filter(s => getWords(s).length > 28).length;
  const lower = text.toLowerCase();
  const hypeFound = HYPE_WORDS.filter(x => lower.includes(x));
  const hedgeHits = HEDGE_WORDS.filter(x => lower.includes(x)).length;
  const exclamations = (text.match(/!/g) || []).length;
  const hasEmDash = EMDASH_REGEX.test(text);
  const shouting = SHOUT_REGEX.test(text);
  const hasNumber = NUMBER_REGEX.test(text);
  const hasCTA = CTA_REGEX.test(text);
  const hasResultCue = RESULT_CUES.some(x => lower.includes(x));
  const longWordShare = w.filter(x => x.replace(/[^A-Za-z]/g,"").length >= 13).length / w.length;

  // ---- present ingredients ----
  const present = new Set();
  Object.keys(checklist || {}).forEach(k => { if(checklist[k]) present.add(k); });
  if(hasNumber) present.add("number");
  if(hasCTA) present.add("cta");

  // ---- CLARITY ----
  let clarity = 100;
  if(avgSent > 16) clarity -= (avgSent - 16) * 3;
  clarity -= longSentences * 8;
  if((audienceKey === "genz" || audienceKey === "genalpha") && longWordShare > 0.15) clarity -= 15;
  clarity = clamp(clarity);

  // ---- TRUST ----
  let trust = 100;
  trust -= Math.min(hypeFound.length * 12, 48);
  if(hasEmDash) trust -= 12;
  if(exclamations >= 2) trust -= 8;
  if(exclamations >= 4) trust -= 8;
  if(shouting) trust -= 8;
  if((audienceKey === "pi" || audienceKey === "pharma") && hedgeHits >= 3) trust -= 10;
  trust = clamp(trust);

  // ---- SUBSTANCE ----
  let substance = 30;
  if(hasNumber) substance += 25;
  if(hasResultCue) substance += 15;
  if(present.has("source")) substance += 15;
  if(checklist && checklist.resultData) substance += 10;
  substance = clamp(substance);

  // ---- FIT ----
  const wants = aud.wants;
  let got = 0, total = 0;
  for(const ing in wants){ total += wants[ing]; if(present.has(ing)) got += wants[ing]; }
  const fit = total > 0 ? Math.round(100 * got / total) : 50;

  // ---- blend ----
  const W = normaliseWeights(aud.weights);
  const raw = W.clarity*clarity + W.trust*trust + W.substance*substance + W.fit*fit;
  const score = clamp(Math.round(raw));

  // ---- focus signal (largest weighted deficit) ----
  const deficits = {
    clarity:   W.clarity   * (100 - clarity),
    trust:     W.trust     * (100 - trust),
    substance: W.substance * (100 - substance),
    fit:       W.fit       * (100 - fit)
  };
  const focus = Object.keys(deficits).sort((a,b) => deficits[b] - deficits[a])[0];

  // ---- top fix ----
  const facts = { hasEmDash, hypeFound, shouting, exclamations, hedgeHits,
                  longSentences, avgSent, longWordShare, hasNumber, hasCTA,
                  hasResultCue, present, audienceKey, audienceLabel: aud.label };
  const topFix = score >= 80
    ? "Strong pose. Nothing urgent to fix. Ship it."
    : chooseFix(focus, facts, aud);

  return {
    empty:false, usedDefault, confidence,
    score, band: getBand(score),
    signals: { clarity, trust, substance, fit },
    focus, topFix,
    facts
  };
}
