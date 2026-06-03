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
    what: "A SeeSAR binding-pose screenshot, an infiniSee chemical-space map, a HYDE scoring heatmap, or a molecule-of-the-week card. Anything that turns a concept into a single frame someone can screenshot and reshare.",
    why: "BioSolveIT already makes beautiful 3D science. The next 25 years are about putting those visuals where the audience actually is - in social feeds, email headers, and conference slide decks - instead of behind a download button."
  },
  { 
    id: "video", 
    label: "Has short-form video", 
    help: "A reel or short clip.",
    what: "A 60-second SeeSAR screen recording showing a molecule docked in real time. A 30-second infiniSee search across billions of compounds. A quick 'lab tip' reel from a BioSolveIT scientist. Think TikTok for drug design.",
    why: "Gen Z chemists and Gen Alpha students learn from video, not PDFs. A single 60-second tutorial of SeeSAR's drag-and-dock workflow can do more for adoption than a 20-page whitepaper. This is where BioSolveIT's next generation of users already lives."
  },
  { 
    id: "humanVoice", 
    label: "Shows a real person", 
    help: "A face or named voice, not a logo.",
    what: "A BioSolveIT scientist explaining a docking result on camera. A YoungSolvers student sharing their thesis project. A named researcher giving a quick opinion - not a faceless corporate logo or stock photo.",
    why: "People follow people. The BioSolveIT team has 25 years of deep expertise - putting real faces and voices on that knowledge builds trust faster than any logo-branded infographic. Future audiences demand authenticity."
  },
  { 
    id: "communityHook", 
    label: "Invites people in", 
    help: "Tags someone, asks for replies, or invites collaboration.",
    what: "Tagging a YoungSolvers alumnus. Asking 'What would you screen first?' Inviting users to submit their own SeeSAR use case. Running a community poll on the next Scientific Challenge topic.",
    why: "BioSolveIT's YoungSolvers program and Scientific Challenges already build community. The next step is extending that energy into everyday content - turning passive readers into active collaborators who feel ownership over the science."
  },
  { 
    id: "plainSummary", 
    label: "Has a plain-language line", 
    help: "One sentence a non-expert would understand.",
    what: "One sentence that makes the science click for anyone: 'We searched 2.4 billion molecules in under an hour and found 37 drug candidates.' No jargon, no acronyms, just the result.",
    why: "BioSolveIT's tools solve complex problems, but the value proposition is simple. As the audience broadens - from computational chemists to medicinal chemists, biologists, and decision-makers - a plain-language hook is what earns the first click."
  },
  { 
    id: "source", 
    label: "Links or names a source", 
    help: "A paper, a dataset, or a page to verify.",
    what: "A DOI link to the validation study. A direct link to the SeeSAR download page. A GitHub repo for a workflow script. A citation to the HYDE scoring publication.",
    why: "BioSolveIT has 25 years of peer-reviewed science behind it. Linking to that evidence is the fastest way to convert interest into trust - especially for PIs and pharma decision-makers who need to verify before they share or buy."
  },
  { 
    id: "resultData", 
    label: "Includes a result or data", 
    help: "A specific outcome or measurement, even without a number in the text.",
    what: "A concrete outcome: '48-hour screen, 2.4 million compounds, 37 confirmed hits.' A benchmark: 'infiniSee found the known active in the top 0.01% of 12 billion compounds.' A customer result with permission to share.",
    why: "Data is BioSolveIT's superpower. Every post that leads with a real result - not a feature list - positions the company as scientists talking to scientists. Future audiences will filter out everything that doesn't answer 'What actually changed?'"
  }
];

// Hype / marketing buzzwords. Drawn from real B2B SaaS landing-page copy and
// drug-discovery software marketing. Whole-word matched (see scoring.js), so
// hyphenated and multi-word entries are both supported.
export const HYPE_WORDS = [
  // classic marketing superlatives
  "revolutionary","game-changing","game changer","game-changer","world-class",
  "cutting-edge","cutting edge","unprecedented","best-in-class","best in class",
  "best-of-breed","best of breed","best-in-breed","synergy","leverage","disruptive",
  "groundbreaking","state-of-the-art",
  "seamless","paradigm","supercharge","supercharged","supercharging",
  "turbocharge","turbocharged","unlock","skyrocket","mind-blowing","ultimate",
  "revolutionize","revolutionizing","transformative","transformational","reimagine",
  "reimagined","unparalleled","unrivaled","unrivalled","groundbreaker",
  // B2B SaaS / SEO landing-page staples
  "industry-leading","industry leading","market-leading","market leading",
  "world-leading","industry-first","industry first","world's first","turnkey",
  "end-to-end","end to end","frictionless","effortless","effortlessly",
  "ai-powered","ai powered","ai-driven","ai driven","powerful","innovative",
  "blazing-fast","blazing fast","lightning-fast","lightning fast","one-stop",
  "one stop shop","must-have","must have","plug-and-play","plug and play",
  "hassle-free","scalable solution","bleeding-edge","bleeding edge","elite",
  "premier","breakthrough","dominate","crush it","killer","insanely",
  "jaw-dropping","next-level","next level",
  // drug-discovery flavoured hype
  "silver bullet","magic bullet","holy grail","wonder drug","miracle","magical"
];

export const HEDGE_WORDS = [
  "maybe","perhaps","might","possibly","sort of","kind of","we think",
  "arguably","somewhat","we believe","it seems","fairly","potentially",
  "presumably","apparently","seemingly","supposedly","hopefully","we feel",
  "we suspect","we assume","in our view","in our opinion","tends to","tend to",
  "more or less","relatively","to some extent","in theory","could be",
  "ought to","conceivably","ostensibly","we'd argue","a bit"
];

export const RESULT_CUES = [
  // directional change
  "faster","slower","reduced","reduction","increased","increase","improved",
  "improvement","cut","saved","fold","outperformed","outperform","outperforms",
  "up to","down to","higher","lower","boosted","boost","accelerated","accelerate",
  "decreased","doubled","tripled","quadrupled","halved","gained","dropped",
  "grew","growth","shortened","speedup","speed-up","uplift",
  // comparison framing
  "compared to","compared with","versus","more than","less than","fewer",
  "benchmark","benchmarked","outperformed",
  // domain result metrics (B2B SaaS + drug discovery)
  "conversion","enrichment","hit rate","return on investment"
];

export const CTA_REGEX = /\?|\b(try|join|watch|bring|see|download|read|register|sign up|book|book a call|explore|comment|share|reply|tag|subscribe|demo|learn more|learn|discover|request|contact|schedule|claim|follow|click|visit|check out|find out|apply|enroll|reach out|talk to|grab|get started|get a quote)\b/i;
export const NUMBER_REGEX = /\d|%/;
export const EMDASH_REGEX = /[\u2014\u2013]/;

// All-caps words of 2+ letters. Used by detectShout() to spot shouting while
// tolerating legitimate acronyms (see ACRONYM_ALLOW).
export const CAPS_WORD_REGEX = /\b[A-Z]{2,}\b/g;

// Real abbreviations that read as normal scientific writing, not shouting.
// A single one of these (or any single short token) never counts as shouting.
export const ACRONYM_ALLOW = new Set([
  // general
  "OK","ID","EU","US","USA","UK","CEO","CTO","CFO","COO","HR","FAQ","IT","QA",
  "GPU","CPU","API","URL","PDF","AI","ML","2D","3D","EMEA","APAC","NA",
  // B2B SaaS / SEO / GTM
  "SEO","SERP","CTR","CRM","ERP","SDK","UI","UX","KPI","SLA","MRR","ARR",
  "CAC","LTV","NPS","GDPR","HIPAA","SOC","ISO","MVP","POC","RFP","SMB","ICP",
  "TAM","SAM","SOM","CTA","CRO","GTM","PLG","ROAS","ROI","SaaS",
  // life science / drug discovery
  "DNA","RNA","PCR","NMR","HYDE","SAR","QSAR","DOI","PDB","SMILES","ADMET",
  "ADME","DMPK","PK","PD","FEP","MD","QM","MM","CADD","SBDD","LBDD","HTS",
  "FBDD","MOA","IND","NDA","GLP","GMP","GCP","NCE","HERG","CYP","EGFR","GPCR",
  "ATP","ELISA","HPLC","LCMS","MS","NGS","CRISPR","FDA","EMA","KD","IC","EC"
]);

export const SIGNALS = ["clarity","trust","substance","fit"];
export const SIGNAL_LABEL = { clarity:"Clarity", trust:"Trust", substance:"Substance", fit:"Fit" };

export const COPY = {
  title: "SeeSTORY",
  tagline: "A companion to the BioWeek poster - exploring how BioSolveIT content could land with the next generation.",
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
  disclaimer: "Built for the BioWeek 2026 poster on 25 years of BioSolveIT. This interactive demo was created entirely with AI-assisted vibe coding - itself a demonstration of how the next 25 years will be built."
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
    desc: "Score: ~83, Focus: Fit",
    audience: "peer",
    caption: "We screened 2.4 million compounds in 48 hours. 37 hits confirmed in dose-response.",
    checklist: { source: true, resultData: true }
  },
  {
    title: "The SaaS Buzzword Bomb",
    desc: "Score: ~47, Focus: Substance",
    audience: "pharma",
    caption: "Our AI-powered, industry-leading platform is the ultimate end-to-end solution to supercharge your discovery workflow. Request a demo today!",
    checklist: {}
  },
  {
    title: "The Benchmark Drop",
    desc: "Score: ~91, Focus: Fit",
    audience: "pi",
    caption: "In a prospective benchmark, our docking workflow recovered 92% of known actives in the top 1 percent, a 3-fold enrichment over the baseline. Methods and dataset are linked below.",
    checklist: { source: true, resultData: true }
  },
  {
    title: "The Gen Alpha Reel",
    desc: "Score: ~90, Focus: Fit",
    audience: "genalpha",
    caption: "We turned molecular docking into a 30-second game. Can you dock the molecule faster than our scientist? Drop your best time below.",
    checklist: { video: true, visual: true, communityHook: true }
  },
  {
    title: "The Shouty Launch",
    desc: "Score: ~52, Focus: Substance",
    audience: "pi",
    caption: "HUGE NEWS! Our NEW platform is FINALLY HERE and it is absolutely INCREDIBLE for your research!",
    checklist: {}
  },
  {
    title: "The Hedgy Maybe",
    desc: "Score: ~49, Focus: Fit",
    audience: "pharma",
    caption: "We think this might possibly improve screening times, and it could potentially reduce costs somewhat, though results may vary across projects.",
    checklist: {}
  }
];

// Friendly labels for the media-preference weights stored in AUDIENCES[*].wants.
// Used by the Explore page persona deck to render each reader's "media diet".
export const MEDIA_LABEL = {
  video:         "Short-form video",
  visual:        "Images & graphics",
  humanVoice:    "A real human voice",
  communityHook: "Community & interaction",
  plainSummary:  "Plain-language summary",
  number:        "Hard numbers",
  source:        "Cited sources",
  cta:           "A clear next step"
};

export const PERSONAS = [
  {
    key: "genz",
    icon: "atom",
    name: "Gen Z Chemist",
    age: "22–30",
    tagline: "Learns from creators, not journals",
    bio: "Entering the workforce or completing grad school. They discovered drug design through YouTube tutorials and Reddit threads, not textbooks. They already know SeeSAR exists - they want to see it in action, in 60 seconds, from a real person.",
    wants: ["60-second SeeSAR screen recordings on LinkedIn/TikTok", "Real scientists showing real workflows on camera", "Community threads - 'What would you screen first?'", "Plain-English takeaways they can reshare in group chats"],
    repels: ["Corporate press-release tone", "20-page PDFs when a 30-second video would do", "Logo-branded content with no human voice"]
  },
  {
    key: "genalpha",
    icon: "gamepad",
    name: "Gen Alpha Student",
    age: "14–20",
    tagline: "Your user in 10 years",
    bio: "Currently in high school or early undergrad. They will be BioSolveIT's users in 10 years. They learn through interactive demos, YouTube explainers, and gamified challenges - not journal papers. The YoungSolvers program is their on-ramp.",
    wants: ["Video-first content, ideally under 60 seconds", "Interactive demos - 'try docking this molecule yourself'", "YoungSolvers stories and success spotlights", "Casual, friendly tone - 'come join us, not we are pleased to announce'"],
    repels: ["Formal academic announcements", "Text-only posts with no visuals", "Content that assumes 10 years of domain expertise"]
  },
  {
    key: "pi",
    icon: "microscope",
    name: "Research Group Leader (PI)",
    age: "35–60",
    tagline: "Reads the benchmark, not the banner",
    bio: "Time-poor and highly analytical. They evaluate tools by reading the benchmarks, not the marketing page. They want to know: does infiniSee actually find actives? Show me the hit rate. Link me the paper.",
    wants: ["Hard numbers: '2.4M compounds screened in 48 hours, 37 confirmed hits'", "DOI links and verifiable benchmark data", "One-line summaries they can forward to their group", "A direct path to try the software: download link, demo, or trial"],
    repels: ["Hype words (revolutionary, game-changing, unprecedented)", "Vague claims without supporting data", "Excessive exclamation marks or ALL CAPS"]
  },
  {
    key: "pharma",
    icon: "briefcase",
    name: "Pharma Decision-Maker",
    age: "35–55",
    tagline: "Wants the business case, not the buzz",
    bio: "Focused on ROI, pipeline velocity, and risk reduction. They compare BioSolveIT's Chemical Space Docking to competitors on throughput, cost, and validation. They want a business case, not a feature list.",
    wants: ["Concrete metrics - time saved, hit rate, cost per screen", "Customer case studies with permission to reference", "A direct CTA - book a demo, read the case study, get a quote", "Clean, professional presentation that respects their time"],
    repels: ["Hedging language (maybe, perhaps, we think)", "Flashy visuals that don't connect to outcomes", "Posts that bury the result under three paragraphs of context"]
  },
  {
    key: "peer",
    icon: "flask",
    name: "Peer Scientist",
    age: "25–50",
    tagline: "Will switch workflows - if it's reproducible",
    bio: "Your everyday colleague in computational chemistry. They already understand docking, scoring, and chemical spaces. They want to know what's new, what's reproducible, and whether it's worth switching their workflow.",
    wants: ["Reproducible benchmarks with methodology details", "Source links to papers and datasets they can verify", "SeeSAR/infiniSee comparison screenshots and workflow tips", "A clear next step or discussion prompt"],
    repels: ["Marketing speak in a science context", "Unsupported superlatives", "Posts that are all announcement, no substance"]
  }
];
