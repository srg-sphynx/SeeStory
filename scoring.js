/* ── scoring.js ── pure scoring functions (v3, 4-signal model) ──
   v3 changes:
   • Detection is unified with the recommender via detect.js — textual
     ingredients (source, plain-language line, community hook) are now read
     from the prose, not only the checklist, so the score and the audience
     recommendation no longer disagree about the same draft.
   • Substance is reachable to a full 100 with complete evidence.
   • scoreDraft now returns `contributions` (the exact math behind the score)
     and `whatIf` (projected gains for each missing ingredient) so the UI can
     explain *why* the number is what it is and *what moves it most*. */

import {
  AUDIENCES, HYPE_WORDS, HEDGE_WORDS, RESULT_CUES, HYPE_ALT,
  CTA_REGEX, NUMBER_REGEX, EMDASH_REGEX, CAPS_WORD_REGEX, ACRONYM_ALLOW,
  BAND, FIT_FIX, COPY, SIGNALS
} from './data.js';

import {
  detectTextualIngredients, detectMediaMentions, matchesWord
} from './detect.js';

/* ── Helpers ── */

/** Cross-browser sentence splitter (no lookbehinds, safe on Safari/iOS). */
export function splitSentences(text){
  return text.replace(/([.!?]+)\s+/g, "$1|SPLIT|").split("|SPLIT|").map(s=>s.trim()).filter(Boolean);
}

function getWords(text){ return (text.match(/\S+/g) || []); }

/** Spot shouting without flagging legitimate acronyms.
 *  Shouts when there are 2+ all-caps words, or one long all-caps word
 *  (>= 5 letters). A single short all-caps token is treated as an acronym. */
export function detectShout(text){
  const caps = (text.match(CAPS_WORD_REGEX) || []).filter(w => !ACRONYM_ALLOW.has(w));
  if(caps.length >= 2) return true;
  return caps.some(w => w.length >= 5);
}

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

/* ── Substance model (reachable to a full 100 with complete evidence) ──────── */
const SUBSTANCE = { base:25, number:25, result:20, source:18, data:12 };

function computeSubstance(present, hasNumber, hasResultCue, hasResultData){
  let s = SUBSTANCE.base;
  if(hasNumber)            s += SUBSTANCE.number;
  if(hasResultCue)         s += SUBSTANCE.result;
  if(present.has("source"))s += SUBSTANCE.source;
  if(hasResultData)        s += SUBSTANCE.data;
  return clamp(s);
}

function computeFit(wants, present){
  let got = 0, total = 0;
  for(const ing in wants){ total += wants[ing]; if(present.has(ing)) got += wants[ing]; }
  return total > 0 ? Math.round(100 * got / total) : 50;
}

/* ── Fix chooser (priority ladder) ── */

export function chooseFix(focus, f, aud){
  if(focus === "trust"){
    if(f.hasEmDash) return "Found an em dash. Swap it for a period or a comma.";
    if(f.hypeFound.length){
      const w = f.hypeFound[0];
      const alt = HYPE_ALT[w.toLowerCase()];
      return alt
        ? `The word "${w}" reads as hype. ${alt}`
        : `The word "${w}" reads as hype. Replace it with a specific result.`;
    }
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

/* ── What-if: projected score gain for each missing wanted ingredient ─────── */
function computeWhatIf(ctx){
  const { aud, W, clarity, trust, present, hasNumber, hasResultCue, hasResultData, score } = ctx;
  const out = [];
  // candidate ingredients = everything this audience wants that's missing,
  // plus substance levers (number / source / result) even if fit-neutral.
  const candidates = new Set(Object.keys(aud.wants));
  candidates.add("number"); candidates.add("source");
  for(const ing of candidates){
    if(present.has(ing)) continue;
    const present2 = new Set(present); present2.add(ing);
    const num2 = hasNumber || ing === "number";
    const sub2 = computeSubstance(present2, num2, hasResultCue, hasResultData);
    const fit2 = computeFit(aud.wants, present2);
    const raw2 = W.clarity*clarity + W.trust*trust + W.substance*sub2 + W.fit*fit2;
    const gain = clamp(Math.round(raw2)) - score;
    if(gain > 0) out.push({ ingredient: ing, label: FIT_FIX[ing] || ing, gain });
  }
  return out.sort((a,b) => b.gain - a.gain);
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
  const hypeFound = HYPE_WORDS.filter(x => matchesWord(text, x));
  const hedgeHits = HEDGE_WORDS.filter(x => matchesWord(text, x)).length;
  const exclamations = (text.match(/!/g) || []).length;
  const hasEmDash = EMDASH_REGEX.test(text);
  const shouting = detectShout(text);
  const hasNumber = NUMBER_REGEX.test(text);
  const hasCTA = CTA_REGEX.test(text);
  const hasResultCue = RESULT_CUES.some(x => matchesWord(text, x));
  const longWordShare = w.filter(x => x.replace(/[^A-Za-z]/g,"").length >= 13).length / w.length;

  // ---- present ingredients: checklist ∪ what the prose actually contains ----
  // Textual ingredients (number, cta, source, plain summary, community hook)
  // are read straight from the words, so the score reflects what's written —
  // not only what the user remembered to tick.
  const present = new Set();
  Object.keys(checklist || {}).forEach(k => { if(checklist[k]) present.add(k); });
  detectTextualIngredients(text).forEach(k => present.add(k));

  // Media mentioned in prose but not ticked → a soft nudge, not a score change.
  const mediaMentions = detectMediaMentions(text);
  const mediaNudges = Object.keys(mediaMentions).filter(
    k => mediaMentions[k] && !(checklist && checklist[k])
  );

  const hasResultData = !!(checklist && checklist.resultData);

  // ---- CLARITY ----
  let clarity = 100;
  const clarityDeductions = [];
  if(avgSent > 16){ const d = (avgSent - 16) * 3; clarity -= d; clarityDeductions.push({ label:`Long sentences (avg ${Math.round(avgSent)} words)`, points:-Math.round(d) }); }
  if(longSentences > 0){ clarity -= longSentences * 8; clarityDeductions.push({ label:`${longSentences} over-long sentence${longSentences>1?"s":""}`, points:-longSentences*8 }); }
  if((audienceKey === "genz" || audienceKey === "genalpha") && longWordShare > 0.15){ clarity -= 15; clarityDeductions.push({ label:"Long words for a young audience", points:-15 }); }
  clarity = clamp(clarity);

  // ---- TRUST ----
  let trust = 100;
  const trustDeductions = [];
  if(hypeFound.length){ const d = Math.min(hypeFound.length * 12, 48); trust -= d; trustDeductions.push({ label:`${hypeFound.length} hype word${hypeFound.length>1?"s":""}: ${hypeFound.slice(0,3).join(", ")}${hypeFound.length>3?"…":""}`, points:-d }); }
  if(hasEmDash){ trust -= 12; trustDeductions.push({ label:"Em / en dash", points:-12 }); }
  if(exclamations >= 2){ trust -= 8; trustDeductions.push({ label:`${exclamations} exclamation marks`, points:-8 }); }
  if(exclamations >= 4){ trust -= 8; trustDeductions.push({ label:"Heavy exclamation pile-up", points:-8 }); }
  if(shouting){ trust -= 8; trustDeductions.push({ label:"ALL-CAPS shouting", points:-8 }); }
  if((audienceKey === "pi" || audienceKey === "pharma") && hedgeHits >= 3){ trust -= 10; trustDeductions.push({ label:`${hedgeHits} hedge phrases (this audience wants certainty)`, points:-10 }); }
  trust = clamp(trust);

  // ---- SUBSTANCE ----
  const substance = computeSubstance(present, hasNumber, hasResultCue, hasResultData);

  // ---- FIT ----
  const wants = aud.wants;
  const fit = computeFit(wants, present);

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
                  hasResultCue, hasResultData, present, mediaNudges,
                  audienceKey, audienceLabel: aud.label };
  const topFix = score >= 80
    ? "Strong pose. Nothing urgent to fix. Ship it."
    : chooseFix(focus, facts, aud);

  // ---- contributions: the exact math behind the number ----
  const contributions = {
    weights: W,
    weighted: {
      clarity:   Math.round(W.clarity   * clarity),
      trust:     Math.round(W.trust     * trust),
      substance: Math.round(W.substance * substance),
      fit:       Math.round(W.fit       * fit)
    },
    deductions: { clarity: clarityDeductions, trust: trustDeductions }
  };

  // ---- what-if: projected gains for the levers that move this score most ----
  const whatIf = computeWhatIf({ aud, W, clarity, trust, present, hasNumber, hasResultCue, hasResultData, score });

  return {
    empty:false, usedDefault, confidence,
    score, band: getBand(score),
    signals: { clarity, trust, substance, fit },
    focus, topFix,
    contributions, whatIf,
    facts
  };
}
