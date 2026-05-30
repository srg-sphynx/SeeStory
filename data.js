/* ── data.js ── all constants, audiences, lexicons, copy strings (v2) ── */

export const AUDIENCES = {
  genz: {
    label: "Gen Z chemist",
    blurb: "Entering the workforce. Scrolls short video, learns in communities like Reddit. Values a human voice.",
    weights: { clarity:0.25, trust:0.20, substance:0.15, fit:0.40 },
    wants: { video:0.30, visual:0.20, humanVoice:0.20, communityHook:0.15, plainSummary:0.15 }
  },
  genalpha: {
    label: "Gen Alpha student",
    blurb: "High school or early undergrad. Highly visual and interactive. Formal tone actively repels them.",
    weights: { clarity:0.25, trust:0.15, substance:0.10, fit:0.50 },
    wants: { video:0.35, visual:0.30, communityHook:0.20, humanVoice:0.15 }
  },
  pi: {
    label: "Research group leader",
    blurb: "Time-poor and analytical. Wants precision, numbers, and sources. Hype is a massive turn-off.",
    weights: { clarity:0.20, trust:0.25, substance:0.35, fit:0.20 },
    wants: { number:0.35, source:0.30, plainSummary:0.20, cta:0.15 }
  },
  pharma: {
    label: "Pharma decision-maker",
    blurb: "Focused on ROI and reliability. Wants concrete value, clear numbers, and a direct next step.",
    weights: { clarity:0.20, trust:0.25, substance:0.30, fit:0.25 },
    wants: { number:0.35, source:0.25, cta:0.20, plainSummary:0.20 }
  },
  peer: {
    label: "Peer scientist",
    blurb: "Your everyday colleague. A general technical reader looking for clear, reproducible facts without fluff.",
    weights: { clarity:0.25, trust:0.20, substance:0.30, fit:0.25 },
    wants: { number:0.30, source:0.25, visual:0.20, cta:0.15, plainSummary:0.10 }
  }
};

export const CHECKLIST = [
  { 
    id: "visual", 
    label: "Has an image or graphic", 
    help: "A figure, chart, or photo.",
    what: "A high-resolution figure, experimental diagram, molecular structure, dataset chart, or high-impact photograph.",
    why: "Future audiences consume content visually. A static wall of text is immediately ignored. A clean graphic acts as the visual 'hook' that earns the initial 3-second glance in digital feeds."
  },
  { 
    id: "video", 
    label: "Has short-form video", 
    help: "A reel or short clip.",
    what: "A short 15-60 second video clip (e.g., screen recording of a software UI, lab experiment time-lapse, or a quick explanation of a paper).",
    why: "Video is the dominant medium of the future. Gen Z chemists and Gen Alpha students learn primarily through video. It conveys high-density technical concepts faster than text."
  },
  { 
    id: "humanVoice", 
    label: "Shows a real person", 
    help: "A face or named voice, not a logo.",
    what: "A visible human face on screen, a named author speaking in the first person, or a raw voiceover from a real researcher—not a faceless brand or institutional logo.",
    why: "Authenticity is the ultimate credibility metric for future science. People follow other people, not corporate logos. Showing a real person builds immediate trust and emotional connection."
  },
  { 
    id: "communityHook", 
    label: "Invites people in", 
    help: "Tags someone, asks for replies, or invites collaboration.",
    what: "Directly tagging active collaborators, asking an open-ended question to spark debate, or inviting contributions to an open-source repository.",
    why: "Future scientific learning is collaborative. Content that treats readers as co-discoverers rather than passive audiences generates organic discussion and builds lasting professional networks."
  },
  { 
    id: "plainSummary", 
    label: "Has a plain-language line", 
    help: "One sentence a non-expert would understand.",
    what: "A single, jargon-free sentence summarizing the core scientific breakthrough so that an intelligent non-expert can immediately grasp its meaning.",
    why: "Cross-disciplinary collaboration is expanding rapidly. Even expert PIs often appreciate a plain summary before committing to read deep technical jargon. It makes science accessible and highly shareable."
  },
  { 
    id: "source", 
    label: "Links or names a source", 
    help: "A paper, a dataset, or a page to verify.",
    what: "Including a DOI, a hyperlink to a peer-reviewed publication, a GitHub repository link, or an open-source dataset reference.",
    why: "With the rise of AI-generated content, verification is critical. Analytical decision-makers (PIs, Pharma Executives, Peers) demand a clear pathway to verify your assertions before citing or sharing."
  },
  { 
    id: "resultData", 
    label: "Includes a result or data", 
    help: "A specific outcome or measurement, even without a number in the text.",
    what: "Explicitly detailing a specific, concrete outcome, measurement, or discovery in the checklist—even if the raw text draft is written as a summary.",
    why: "Opinion pieces and vague announcements hold zero scientific value. Future readers expect data-first messaging that answers 'What actually changed?' and 'By how much?' immediately."
  }
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
  tagline: "Evaluate scientific communication for future medium resonance and pocket fit.",
  howToToggle: "How it works",
  step1: "1. Pick who it is for",
  step2: "2. Paste your draft",
  step3: "3. Specify your rich-media plans",
  step1desc: "Select the future audience you want to connect with. Future readers have highly specialized medium preferences.",
  step2desc: "Enter the core text of your communication. The engine measures its structural clarity and analytical trust indicators.",
  step3desc: "Specify the rich-media formats you plan to include. Future communication relies heavily on visuals, video, and personal authenticity.",
  resultDesc: "See how well your message aligns with future scientific medium standards. Improve your resonance score to maximize impact.",
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

export const PERSONAS = [
  {
    icon: "🧬",
    name: "Gen Z Chemist",
    age: "22–30",
    bio: "Entering the workforce or completing grad school. They consume science through short-form video and community threads (Reddit, Discord, X/Twitter). They value authenticity and a human voice over corporate polish.",
    wants: ["Short-form video (Reels, TikTok)", "Real people, not logos", "Community language — questions, tags, collabs", "Plain-English takeaways they can reshare"],
    repels: ["Corporate tone or press-release style", "Walls of text with no visual hook", "Jargon-heavy posts with no summary"]
  },
  {
    icon: "🎮",
    name: "Gen Alpha Student",
    age: "14–20",
    bio: "Currently in high school or early undergrad. Highly visual and interactive. Traditional academic formality actively repels them. They want to see the science in action — playfully and accessibly.",
    wants: ["Video-first content, ideally under 60 seconds", "Bright visuals, memes, interactive demos", "A sense of community — 'come join us'", "Casual, friendly tone"],
    repels: ["Formal academic writing", "Text-only posts", "Authority-driven messaging ('We are pleased to announce…')"]
  },
  {
    icon: "🔬",
    name: "Research Group Leader (PI)",
    age: "35–60",
    bio: "Time-poor and highly analytical. They are immediately skeptical of marketing buzzwords. They scan for concrete numbers, data points, and links to peer-reviewed sources before they even consider sharing.",
    wants: ["Hard numbers and quantified results", "Named, verifiable sources (DOI, dataset link)", "Plain one-line summaries they can forward", "A clear call to action (read the paper, try the tool)"],
    repels: ["Hype words (revolutionary, game-changing, unprecedented)", "Vague claims without supporting evidence", "Excessive exclamation marks or ALL CAPS"]
  },
  {
    icon: "💼",
    name: "Pharma Decision-Maker",
    age: "35–55",
    bio: "Focused on ROI, efficiency, and reliability. They have no patience for vagueness. They want to know exactly what the result is, what it costs, and what the next step should be.",
    wants: ["Concrete metrics — time saved, hit rate, cost reduction", "Credible sources and validation data", "A direct CTA — book a demo, read the case study", "Clean, professional presentation"],
    repels: ["Hedging language (maybe, perhaps, we think)", "Flashy visuals with no substance", "Posts that don't get to the point"]
  },
  {
    icon: "👩‍🔬",
    name: "Peer Scientist",
    age: "25–50",
    bio: "Your everyday colleague — a general technical reader. They want clear, reproducible facts without the fluff. They appreciate standard visuals (charts, molecular structures) and straightforward summaries.",
    wants: ["Numbers backed by methodology", "Source links they can verify", "Standard scientific figures and charts", "A clear next step or discussion prompt"],
    repels: ["Marketing speak in a science context", "Unsupported superlatives", "Posts that are all opinion, no data"]
  }
];
