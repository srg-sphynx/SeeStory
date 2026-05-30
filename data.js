/* ── data.js ── all constants, audiences, lexicons, copy strings (v2) ── */

export const AUDIENCES = {
  genz: {
    label: "Gen Z chemist",
    blurb: "Early-career. Scrolls short video, learns in communities.",
    weights: { clarity:0.25, trust:0.20, substance:0.15, fit:0.40 },
    wants: { video:0.30, visual:0.20, humanVoice:0.20, communityHook:0.15, plainSummary:0.15 }
  },
  genalpha: {
    label: "Gen Alpha student",
    blurb: "School or first-year. Playful and visual. Formality loses.",
    weights: { clarity:0.25, trust:0.15, substance:0.10, fit:0.50 },
    wants: { video:0.35, visual:0.30, communityHook:0.20, humanVoice:0.15 }
  },
  pi: {
    label: "Research group leader",
    blurb: "Wants precision and proof. Hype is a turn-off.",
    weights: { clarity:0.20, trust:0.25, substance:0.35, fit:0.20 },
    wants: { number:0.35, source:0.30, plainSummary:0.20, cta:0.15 }
  },
  pharma: {
    label: "Pharma decision-maker",
    blurb: "Wants concrete value and reliability. No vagueness.",
    weights: { clarity:0.20, trust:0.25, substance:0.30, fit:0.25 },
    wants: { number:0.35, source:0.25, cta:0.20, plainSummary:0.20 }
  },
  peer: {
    label: "Peer scientist",
    blurb: "A general technical reader. Clear, useful, no fluff.",
    weights: { clarity:0.25, trust:0.20, substance:0.30, fit:0.25 },
    wants: { number:0.30, source:0.25, visual:0.20, cta:0.15, plainSummary:0.10 }
  }
};

export const CHECKLIST = [
  { id:"visual",        label:"Has an image or graphic",   help:"A figure, chart, or photo." },
  { id:"video",         label:"Has short-form video",      help:"A reel or short clip." },
  { id:"humanVoice",    label:"Shows a real person",       help:"A face or named voice, not a logo." },
  { id:"communityHook", label:"Invites people in",         help:"Tags someone, asks for replies, or invites collaboration." },
  { id:"plainSummary",  label:"Has a plain-language line", help:"One sentence a non-expert would understand." },
  { id:"source",        label:"Links or names a source",   help:"A paper, a dataset, or a page to verify." },
  { id:"resultData",    label:"Includes a result or data", help:"A specific outcome or measurement, even without a number in the text." }
];

export const HYPE_WORDS = [
  "revolutionary","game-changing","game changer","world-class","cutting-edge",
  "cutting edge","unprecedented","best-in-class","best in class","synergy",
  "leverage","disruptive","next-generation","next generation","groundbreaking",
  "state-of-the-art","seamless","robust","paradigm","supercharge","unlock",
  "skyrocket","mind-blowing","ultimate","revolutionize","transformative"
];

export const HEDGE_WORDS = [
  "maybe","perhaps","might","possibly","sort of","kind of","we think",
  "arguably","somewhat","we believe","it seems","fairly"
];

export const RESULT_CUES = [
  "faster","slower","reduced","increased","improved","cut","saved",
  "fold","outperformed","up to","down to","higher","lower"
];

export const CTA_REGEX = /\?|\b(try|join|watch|bring|see|download|read|register|sign up|book|explore|comment|share|reply|tag)\b/i;
export const NUMBER_REGEX = /\d|%/;
export const EMDASH_REGEX = /[\u2014\u2013]/;
export const SHOUT_REGEX = /\b[A-Z]{2,}(\s+[A-Z]{2,}){2,}\b/;

export const SIGNALS = ["clarity","trust","substance","fit"];
export const SIGNAL_LABEL = { clarity:"Clarity", trust:"Trust", substance:"Substance", fit:"Fit" };

export const COPY = {
  title: "SeeSTORY",
  tagline: "Paste a draft, pick your audience, get a score and the one fix that helps most.",
  howToToggle: "How it works",
  step1: "1. Pick who it is for",
  step2: "2. Paste your draft",
  step3: "3. Tick what your draft includes",
  step1desc: "Pick the one group you are writing for. The tool changes what it rewards based on this choice. You can switch it any time to see how the same draft scores for a different reader.",
  step2desc: "Paste the real words you plan to send or post, not a description of them. The tool reads as you type. It reads words only, so visuals go in Step 3.",
  step3desc: "Tick what is true. The tool already finds numbers and calls to action on its own. Be honest, since a box you did not include gives a score you cannot trust.",
  resultDesc: "The score and the one highest-impact fix update on every change. Apply the fix, look again, and stop at green. The score is guidance, never a gate.",
  captionPlaceholder: "Write or paste your post, email, or caption here...",
  scoreLabel: "Resonance score",
  topFixLabel: "Top fix",
  breakdownLabel: "Why this score",
  emptyState: "Add a draft. The score needs words to read.",
  defaultAudienceNote: "No audience picked, so this is scored for a Peer scientist.",
  confidenceLowNote: "Short draft. Treat this as a rough read.",
  disclaimer: "A concept piece exploring how content lands with different readers. Not an official BioSolveIT product."
};

export const SIGNAL_MSG = {
  clarity: {
    high: "Easy to read. Sentences are short and clear.",
    mid:  "Readable, but some sentences are long.",
    low:  "Hard to read. Shorten the long sentences."
  },
  trust: {
    high: "Reads as honest and plain.",
    mid:  "Mostly clean, with a little noise.",
    low:  "Reads like marketing. Cut the hype."
  },
  substance: {
    high: "Backed by something concrete.",
    mid:  "Some proof, but it could be firmer.",
    low:  "Light on proof. Add a number or a result."
  },
  fit: {
    high: "Carries what this audience wants.",
    mid:  "Has some of what this audience wants.",
    low:  "Missing what this audience cares about most."
  }
};

export const BAND = [
  { min:80, label:"Excellent", head:"Strong fit. This is ready to post.", color:"#178A38" },
  { min:60, label:"Strong",    head:"Good draft. A tweak or two will lift it.", color:"#C9A227" },
  { min:40, label:"Developing",head:"This can land. It needs some work first.", color:"#C9A227" },
  { min:0,  label:"Weak",      head:"Rework this before posting.", color:"#C0392B" }
];

export const FIT_FIX = {
  video:         "No video. This audience watches more than it reads.",
  visual:        "Add a visual. A figure or photo earns the first glance.",
  humanVoice:    "Put a face on it. People follow people, not logos.",
  communityHook: "Invite people in. Ask a question or tag a collaborator.",
  plainSummary:  "Add one plain-language line for the non-experts.",
  number:        "Add a concrete number. It is the fastest credibility win.",
  source:        "Name a source so the reader can check it.",
  cta:           "Add a clear next step. Tell the reader what to do."
};

export const GLOSSARY = [
  { plain:"Audience",       science:"Target, or binding pocket",   idea:"Who the content has to fit." },
  { plain:"Resonance score", science:"Binding affinity",           idea:"How well it fits and holds." },
  { plain:"The four signals",science:"Pharmacophore features",     idea:"The properties that make it stick." },
  { plain:"Top fix",         science:"Lead optimisation step",     idea:"The change that improves the fit most." },
  { plain:"Trust signal",    science:"Activity Spotter",           idea:"Features that help versus features that block." },
  { plain:"Substance",       science:"Scoring with HYDE",          idea:"Concrete contributions you can point to." }
];

export const PRESETS = [
  {
    title: "The Hype Trap",
    desc: "Score: ~44, Focus: Substance",
    audience: "pi",
    caption: "Our revolutionary, game-changing platform delivers world-class results that will supercharge your pipeline!",
    checklist: {}
  },
  {
    title: "The Clean Post",
    desc: "Score: ~65, Focus: Fit",
    audience: "genz",
    caption: "Watch one screen go from idea to a ranked hit list in 20 minutes. We filmed the whole thing. What would you screen first?",
    checklist: { video: true }
  },
  {
    title: "The Data Post",
    desc: "Score: ~78, Focus: Fit",
    audience: "peer",
    caption: "We screened 2.4 million compounds in 48 hours. 37 hits confirmed in dose-response.",
    checklist: { source: true, resultData: true }
  }
];
