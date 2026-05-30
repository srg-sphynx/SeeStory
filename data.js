/* ── data.js ── audiences, fragments, lexicon (ES module) ── */

export const AUDIENCES = {
  genz: {
    label: "Gen Z chemist",
    weights: { clarity:0.20, voice:0.25, visual:0.30, community:0.25 },
    hint: "Short, visual, community-led. Jargon walls repel."
  },
  genalpha: {
    label: "Gen Alpha student",
    weights: { clarity:0.20, voice:0.15, visual:0.35, community:0.30 },
    hint: "Playful and interactive wins. Formality loses."
  },
  pi: {
    label: "Academic PI",
    weights: { clarity:0.35, voice:0.30, visual:0.15, community:0.20 },
    hint: "Precision and proof. Hype is a turn-off."
  },
  pharma: {
    label: "Pharma decision-maker",
    weights: { clarity:0.30, voice:0.30, visual:0.20, community:0.20 },
    hint: "Concrete results and clear value. No vagueness."
  }
};

export const ANCHORS = [
  { id:"a_result",  text:"We found active molecules faster.",         class:"clarity", value:0.9 },
  { id:"a_story",   text:"Here is how one screen actually went.",      class:"voice",   value:0.8 },
  { id:"a_visual",  text:"Watch the pose appear in real time.",        class:"visual",  value:0.85 },
  { id:"a_invite",  text:"Bring your target, we will screen it live.", class:"community",value:0.8 }
];

export const FRAGMENTS = [
  // Clarity
  { id:"f_number",  text:"Add a concrete number",        class:"clarity", value:0.8 },
  { id:"f_oneidea", text:"Keep one idea only",           class:"clarity", value:0.7 },
  { id:"f_plain",   text:"Plain-language summary",       class:"clarity", value:0.75 },
  // Voice
  { id:"f_human",   text:"First-person, human tone",     class:"voice",   value:0.75 },
  { id:"f_nohype",  text:"Strip the hyperbole",          class:"voice",   value:0.85 },
  { id:"f_cta",     text:"One clear call to action",     class:"voice",   value:0.7 },
  // Visual
  { id:"f_short",   text:"Short-form video clip",        class:"visual",  value:0.85 },
  { id:"f_palette", text:"Green and blue layout",        class:"visual",  value:0.6 },
  { id:"f_face",    text:"A real face on screen",        class:"visual",  value:0.7 },
  // Community
  { id:"f_reply",   text:"Invite replies",               class:"community",value:0.7 },
  { id:"f_takeover",text:"Scientist takeover",           class:"community",value:0.75 },
  { id:"f_share",   text:"Shareable workflow",           class:"community",value:0.65 }
];

export const CLASSES = ["clarity","voice","visual","community"];
export const CLASS_LABEL = { clarity:"Clarity", voice:"Voice", visual:"Visual", community:"Community" };
export const CLASS_COLOR = { clarity:"#178A38", voice:"#104173", visual:"#178A38", community:"#104173" };

export const HYPE_WORDS = [
  "revolutionary","game-changing","game changer","world-class","cutting-edge",
  "cutting edge","unprecedented","best-in-class","best in class","synergy",
  "leverage","disruptive","next-generation","next generation","groundbreaking",
  "state-of-the-art","seamless","robust","paradigm","supercharge","unlock",
  "skyrocket","mind-blowing","ultimate"
];

export const DRIVER_RULES = {
  shortSentenceMax: 15,
  rewardNumbers: true,
  rewardCTA: true
};

export const STOPPER_RULES = {
  longSentenceMin: 30,
  emDash: true,
  shouting: true
};

/* ── Preset gallery examples ── */
export const PRESETS = [
  {
    title: "The Data Post",
    audience: "pi",
    anchor: "a_result",
    fragments: ["f_number", "f_oneidea", "f_nohype"],
    caption: "We screened 2.4 million compounds in 48 hours. 37 hits confirmed in dose-response. No GPU required."
  },
  {
    title: "The Visual Hook",
    audience: "genz",
    anchor: "a_visual",
    fragments: ["f_short", "f_face", "f_reply"],
    caption: "Watch the molecule dock in real time. What target would you try next?"
  },
  {
    title: "The Community Play",
    audience: "genalpha",
    anchor: "a_invite",
    fragments: ["f_human", "f_cta", "f_takeover", "f_share"],
    caption: "Bring your target to our next live screen. Join the stream and see if your molecule binds."
  },
  {
    title: "The Hype Trap",
    audience: "pharma",
    anchor: "a_story",
    fragments: ["f_plain"],
    caption: "Our revolutionary, game-changing platform leverages cutting-edge AI to deliver unprecedented results in drug discovery -- a true paradigm shift."
  }
];
