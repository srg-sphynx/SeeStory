import { AUDIENCES, ANCHORS, FRAGMENTS, CLASSES, HYPE_WORDS, DRIVER_RULES, STOPPER_RULES, JARGON_WORDS } from './data.js';

export const state = {
  audience: "genz",
  anchor: ANCHORS[0].id,
  selected: new Set(),
  caption: ""
};

export function splitSentences(text){
  return text.replace(/([.!?]+)(\s*)/g, "$1|SPLIT|").split("|SPLIT|").map(s=>s.trim()).filter(Boolean);
}

function wordCount(s){ return (s.match(/\S+/g) || []).length; }

function countSyllables(word) {
  word = word.toLowerCase();
  if(word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const match = word.match(/[aeiouy]{1,2}/g);
  return match ? match.length : 1;
}

function detectPassiveVoice(text) {
  const passiveRegex = /\b(am|are|is|was|were|be|been|being)\s+(?:\w+ly\s+)?([a-z]+ed|known|seen|done|written|made|found|built|given|taken|shown|proven|drawn|led)\b/i;
  const match = text.match(passiveRegex);
  // Exclude false positives for common adjectives/nouns if possible
  if (match && /\b(need|weed|seed|bleed|excited|tired|bored)\b/i.test(match[2])) return null;
  return match ? match[0] : null;
}

export function analyseText(caption, audienceKey){
  const drivers = [];
  const stoppers = [];
  const text = caption.trim();
  if(!text){ return { drivers, stoppers, points:0 }; }

  const sentences = splitSentences(text);
  const words = wordCount(text);
  const avgLen = words / Math.max(sentences.length, 1);

  let syllables = 0;
  text.split(/\s+/).forEach(w => { syllables += countSyllables(w); });

  const fleschReadingEase = 206.835 - 1.015 * (words / Math.max(sentences.length, 1)) - 84.6 * (syllables / Math.max(words, 1));

  let points = 0;

  if(avgLen <= DRIVER_RULES.shortSentenceMax){
    drivers.push("Short, punchy sentences"); points += 0.30;
  }
  
  if (fleschReadingEase >= 60 && fleschReadingEase <= 80) {
    drivers.push("Excellent reading ease"); points += 0.25;
  } else if (fleschReadingEase < 30) {
    stoppers.push({label:"Very hard to read", snippet:"High complexity"}); points -= 0.20;
  }

  if(DRIVER_RULES.rewardNumbers && /\d/.test(text)){
    drivers.push("Includes concrete data"); points += 0.20;
  }
  if(DRIVER_RULES.rewardCTA && /\?|^\s*(try|join|watch|bring|see|download|read)\b/i.test(text)){
    drivers.push("Clear call to action"); points += 0.15;
  }

  const passive = detectPassiveVoice(text);
  if (passive) {
    stoppers.push({label:"Passive voice", snippet:passive}); points -= 0.20;
  }

  const lower = text.toLowerCase();
  HYPE_WORDS.forEach(w=>{
    if(lower.includes(w)){ stoppers.push({label:"Hyperbole", snippet:w}); points -= 0.25; }
  });

  if (audienceKey === "genz" || audienceKey === "genalpha") {
    JARGON_WORDS.forEach(w => {
      if(lower.includes(w)){ stoppers.push({label:"Jargon", snippet:w}); points -= 0.15; }
    });
  }

  if(STOPPER_RULES.emDash && /[—–]/.test(text)){
    stoppers.push({label:"Em or en dash", snippet:"— or –"}); points -= 0.10;
  }
  sentences.forEach(s=>{
    if(wordCount(s) >= STOPPER_RULES.longSentenceMin){
      stoppers.push({label:"Run-on sentence", snippet:s.slice(0,30)+"…"}); points -= 0.15;
    }
  });
  if(STOPPER_RULES.shouting){
    const caps = text.match(/\b[A-Z]{2,}(\s+[A-Z]{2,}){2,}\b/g);
    if(caps){ stoppers.push({label:"Shouting in caps", snippet:caps[0]}); points -= 0.10; }
  }

  points = Math.max(-1, Math.min(1, points));
  return { drivers, stoppers, points, fleschReadingEase };
}

function softCap(x) {
  // Rational sigmoid passing through origin (0,0) and asymptoting to 1
  return x / (x + 0.35);
}

export function pocketFit(audienceKey, anchorId, selected){
  const aud = AUDIENCES[audienceKey];
  const sums = { clarity:0, voice:0, visual:0, community:0 };

  const anchor = ANCHORS.find(a=>a.id===anchorId);
  if(anchor){ sums[anchor.class] += anchor.value; }

  FRAGMENTS.forEach(f=>{
    if(selected.has(f.id)){ sums[f.class] += f.value; }
  });

  let fit = 0;
  const breakdown = {};
  CLASSES.forEach(c=>{
    // Apply soft cap directly to raw sum
    const capped = softCap(sums[c]); 
    const contrib = capped * aud.weights[c];
    breakdown[c] = contrib;
    fit += contrib;
  });
  return { fit, breakdown };
}

export function resonance(){
  const { fit, breakdown } = pocketFit(state.audience, state.anchor, state.selected);
  const text = analyseText(state.caption, state.audience);

  let score = 30 + fit*50 + text.points*20; 
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, fit, breakdown, text };
}

export function band(score){
  if(score >= 75) return { color:"#178A38", label:"High affinity" };
  if(score >= 50) return { color:"#C9A227", label:"Binds, can improve" };
  return            { color:"#C0392B", label:"Weak fit" };
}

export function suggestions(result){
  const tips = [];
  result.text.stoppers.forEach(s=>{
    if(s.label==="Hyperbole") tips.push(`Replace "${s.snippet}" with a specific, grounded result.`);
    if(s.label==="Passive voice") tips.push(`Change "${s.snippet}" to active voice (e.g., "We made" instead of "was made").`);
    if(s.label==="Jargon") tips.push(`Simplify the word "${s.snippet}" for this younger audience.`);
    if(s.label==="Em or en dash") tips.push("Swap the dash for a period or a comma for better flow.");
    if(s.label==="Run-on sentence") tips.push("Split the long sentence into two punchy ones.");
    if(s.label==="Shouting in caps") tips.push("Drop the all-caps. Let the point carry itself.");
    if(s.label==="Very hard to read") tips.push("Simplify your words and use shorter sentences to improve readability.");
  });
  
  const aud = AUDIENCES[state.audience];
  const weakest = CLASSES
    .map(c=>({c, gap: aud.weights[c] - result.breakdown[c]}))
    .sort((a,b)=>b.gap-a.gap)[0];
  if(weakest && weakest.gap > 0.05){
    tips.push(`Add a ${CLASSES.find(x => x===weakest.c).toUpperCase()} fragment to strengthen the core message.`);
  }
  if(!tips.length) tips.push("Strong pose. Ship it.");
  return tips;
}
