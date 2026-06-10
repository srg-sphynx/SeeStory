/* ── detect.js ── single source of truth for reading ingredients from prose ──
   Both the scorer (scoring.js) and the audience recommender (recommend.js)
   reason about the *same* draft. Before this module they each had their own
   detectors, so the recommender could "see" a source link or a plain-language
   line that the scorer ignored — the two halves of the tool disagreed about
   the same words. detect.js makes them agree.

   Design line: "If it's in your words, we score it. If it's an attached asset,
   tick it."
   • TEXTUAL ingredients (number, cta, source, plainSummary, communityHook) are
     provable from the words themselves, so they are auto-detected here and the
     scorer credits them with no checkbox required.
   • MEDIA assets (video, visual, humanVoice) can't be proven from text — a post
     can *mention* a video without one being attached — so a prose mention is a
     soft nudge only; the checkbox stays authoritative for scoring those.
*/

import { CTA_REGEX, NUMBER_REGEX, RESULT_CUES } from './data.js';

export function matchesWord(text, phrase){
  const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + esc + "\\b", "i").test(text);
}

/* ── Prose cue patterns ──────────────────────────────────────────────────── */
export const RX_VIDEO     = /\b(video|reel|reels|filmed|film|footage|clip|on[- ]camera|tiktok|youtube|short[- ]?form|watch (the|her|him|us|it|our))\b/i;
export const RX_VISUAL    = /\b(visual|figure|graphic|graphics|image|photo|diagram|infographic|screenshot|render|3d view|illustration|heatmap|chart)\b/i;
export const RX_HUMAN     = /\b(real (person|scientist|scientists|people|chemist)|face[- ]to[- ]camera|behind the scenes|meet (the|our)|our scientist|i tried|i built|i'm a|i am a|my team|her time|his time)\b/i;
export const RX_COMMUNITY = /\?|\b(comment|reply|tag|join us|drop (a|your)|let us know|what would you|your thoughts|tell us|vote|poll|share this)\b/i;
export const RX_PLAIN     = /\b(the simple version|in plain|plain[- ]language|plain english|in short|in plain terms|one[- ]minute|tl;?dr|here is the simple|here is the short|the short version|simply put|the gist|in everyday terms|put simply)\b/i;
export const RX_SOURCE    = /\b(doi|preprint|paper|papers|dataset|datasets|published|publication|reference|see the (paper|study|case study)|case study|linked below|methodology in|methods (are|and)|repository|repo|github|citation|cited)\b/i;
export const RX_URL       = /(https?:\/\/|www\.)\S+|\b\S+\.(?:org|com|io|net|gov|edu|ai)\/\S*/i;
export const RX_FOLD      = /\b\d+(\.\d+)?\s?[- ]?fold\b/i;

/* ── Individual ingredient detectors ─────────────────────────────────────── */
export function hasNumber(text){ return NUMBER_REGEX.test(text); }
export function hasCTA(text){ return CTA_REGEX.test(text); }
export function hasResultCue(text){ return RESULT_CUES.some(x => matchesWord(text, x)); }
export function hasSource(text){ return RX_SOURCE.test(text) || RX_URL.test(text); }
export function hasPlainSummary(text){ return RX_PLAIN.test(text); }
export function hasCommunityHook(text){ return RX_COMMUNITY.test(text); }
export function hasVideoMention(text){ return RX_VIDEO.test(text); }
export function hasVisualMention(text){ return RX_VISUAL.test(text); }
export function hasHumanMention(text){ return RX_HUMAN.test(text); }

/** A "metric" is a quantified claim (%, X-fold, or a number paired with a
 *  result cue) — distinct from an incidental number like "25 years". */
export function hasMetric(text){
  return /%/.test(text) || RX_FOLD.test(text) || (hasNumber(text) && hasResultCue(text));
}

/* Which checklist ingredients are auto-detected from the words themselves.
   The scorer unions these with the user's checkbox ticks. Media assets
   (video, visual, humanVoice) are intentionally absent — see header. */
export const TEXTUAL_INGREDIENTS = ["number", "cta", "source", "plainSummary", "communityHook"];

/** Detect the textual ingredients present in a draft. Returns a Set of ids. */
export function detectTextualIngredients(text){
  const present = new Set();
  if(hasNumber(text))        present.add("number");
  if(hasCTA(text))           present.add("cta");
  if(hasSource(text))        present.add("source");
  if(hasPlainSummary(text))  present.add("plainSummary");
  if(hasCommunityHook(text)) present.add("communityHook");
  return present;
}

/** Media mentioned in prose but not (yet) ticked — drives the "confirm it"
 *  nudge so the recommender and scorer never silently disagree. */
export function detectMediaMentions(text){
  return {
    video:      hasVideoMention(text),
    visual:     hasVisualMention(text),
    humanVoice: hasHumanMention(text)
  };
}
