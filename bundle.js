const AUDIENCES = {
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

const ANCHORS = [
  { id:"a_result",  text:"We found active molecules faster.",         class:"clarity", value:0.9 },
  { id:"a_story",   text:"Here is how one screen actually went.",      class:"voice",   value:0.8 },
  { id:"a_visual",  text:"Watch the pose appear in real time.",        class:"visual",  value:0.85 },
  { id:"a_invite",  text:"Bring your target, we will screen it live.", class:"community",value:0.8 }
];

const FRAGMENTS = [
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

const CLASSES = ["clarity","voice","visual","community"];
const CLASS_LABEL = { clarity:"Clarity", voice:"Voice", visual:"Visual", community:"Community" };
const CLASS_COLOR = { clarity:"#178A38", voice:"#104173", visual:"#178A38", community:"#104173" };

const HYPE_WORDS = [
  "revolutionary","game-changing","game changer","world-class","cutting-edge",
  "cutting edge","unprecedented","best-in-class","best in class","synergy",
  "leverage","disruptive","next-generation","next generation","groundbreaking",
  "state-of-the-art","seamless","robust","paradigm","supercharge","unlock",
  "skyrocket","mind-blowing","ultimate"
];

const DRIVER_RULES = {
  shortSentenceMax: 15,
  rewardNumbers: true,
  rewardCTA: true
};

const STOPPER_RULES = {
  longSentenceMin: 30,
  emDash: true,
  shouting: true
};
const state = {
  audience: "genz",
  anchor: ANCHORS[0].id,
  selected: new Set(),
  caption: ""
};

/* ---------- builders (run once) ---------- */
function buildAudience(){
  const el = document.getElementById("audience");
  el.innerHTML = "";
  Object.entries(AUDIENCES).forEach(([key,a])=>{
    const b = document.createElement("button");
    b.textContent = a.label;
    b.setAttribute("aria-pressed", key===state.audience);
    b.onclick = ()=>{ state.audience = key; syncAll(); };
    el.appendChild(b);
  });
}

function buildAnchors(){
  const el = document.getElementById("anchors");
  el.innerHTML = "";
  ANCHORS.forEach(a=>{
    const c = document.createElement("button");
    c.className = "chip";
    c.textContent = a.text;
    c.setAttribute("role","radio");
    c.setAttribute("aria-pressed", a.id===state.anchor);
    c.onclick = ()=>{ state.anchor = a.id; syncAll(); };
    el.appendChild(c);
  });
}

function buildFragments(){
  const host = document.getElementById("fragments");
  host.innerHTML = "";
  CLASSES.forEach(cls=>{
    const wrap = document.createElement("div");
    wrap.style.margin = "0 0 16px";
    const label = document.createElement("div");
    label.textContent = CLASS_LABEL[cls];
    label.style.cssText = `font-weight:700;color:${CLASS_COLOR[cls]};margin:0 0 8px;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.05em;`;
    wrap.appendChild(label);
    const chips = document.createElement("div");
    chips.className = "chips";
    FRAGMENTS.filter(f=>f.class===cls).forEach(f=>{
      const c = document.createElement("button");
      c.className = "chip";
      c.textContent = f.text;
      c.setAttribute("aria-pressed", state.selected.has(f.id));
      c.onclick = ()=>{
        state.selected.has(f.id) ? state.selected.delete(f.id) : state.selected.add(f.id);
        c.setAttribute("aria-pressed", state.selected.has(f.id));
        scoreAndPaint();
      };
      chips.appendChild(c);
    });
    wrap.appendChild(chips);
    host.appendChild(wrap);
  });
}

/* ---------- logic ---------- */
function splitSentences(text){
  return text.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
}
function wordCount(s){ return (s.match(/\S+/g) || []).length; }

function analyseText(caption){
  const drivers = [];
  const stoppers = [];
  const text = caption.trim();
  if(!text){ return { drivers, stoppers, points:0 }; }

  const sentences = splitSentences(text);
  const words = wordCount(text);
  const avgLen = words / Math.max(sentences.length,1);

  let points = 0;

  if(avgLen <= DRIVER_RULES.shortSentenceMax){
    drivers.push("Short, declarative sentences"); points += 0.30;
  }
  if(DRIVER_RULES.rewardNumbers && /\d/.test(text)){
    drivers.push("Includes a concrete number"); points += 0.20;
  }
  if(DRIVER_RULES.rewardCTA && /\?|^\s*(try|join|watch|bring|see|download|read)\b/i.test(text)){
    drivers.push("Has a clear call to action"); points += 0.15;
  }

  const lower = text.toLowerCase();
  HYPE_WORDS.forEach(w=>{
    if(lower.includes(w)){ stoppers.push({label:"Hyperbole", snippet:w}); points -= 0.20; }
  });
  if(STOPPER_RULES.emDash && /[—–]/.test(text)){
    stoppers.push({label:"Em or en dash", snippet:"— or –"}); points -= 0.15;
  }
  sentences.forEach(s=>{
    if(wordCount(s) >= STOPPER_RULES.longSentenceMin){
      stoppers.push({label:"Run-on sentence", snippet:s.slice(0,40)+"…"}); points -= 0.15;
    }
  });
  if(STOPPER_RULES.shouting){
    const caps = text.match(/\b[A-Z]{2,}(\s+[A-Z]{2,}){2,}\b/g);
    if(caps){ stoppers.push({label:"Shouting in caps", snippet:caps[0]}); points -= 0.10; }
  }

  points = Math.max(-1, Math.min(1, points));
  return { drivers, stoppers, points };
}

function pocketFit(audienceKey, anchorId, selected){
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
    const capped = Math.min(sums[c], 1);
    const contrib = capped * aud.weights[c];
    breakdown[c] = contrib;
    fit += contrib;
  });
  return { fit, breakdown };
}

function resonance(audienceKey, anchorId, selected, caption){
  const { fit, breakdown } = pocketFit(audienceKey, anchorId, selected);
  const text = analyseText(caption);

  let score = 40 + fit*45 + text.points*15;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, fit, breakdown, text };
}

function band(score){
  if(score >= 75) return { color:"#178A38", label:"High affinity" };
  if(score >= 50) return { color:"#C9A227", label:"Binds, can improve" };
  return            { color:"#C0392B", label:"Weak fit" };
}

function suggestions(result){
  const tips = [];
  result.text.stoppers.forEach(s=>{
    if(s.label==="Hyperbole") tips.push(`Replace "${s.snippet}" with a specific result.`);
    if(s.label==="Em or en dash") tips.push("Swap the dash for a period or a comma.");
    if(s.label==="Run-on sentence") tips.push("Split the long sentence into two.");
    if(s.label==="Shouting in caps") tips.push("Drop the all-caps. Let the point carry itself.");
  });
  
  const aud = AUDIENCES[state.audience];
  const weakest = CLASSES
    .map(c=>({c, gap: aud.weights[c] - result.breakdown[c]}))
    .sort((a,b)=>b.gap-a.gap)[0];
  if(weakest && weakest.gap > 0.05){
    tips.push(`Add a ${CLASS_LABEL[weakest.c]} fragment. This audience weights it heavily.`);
  }
  if(!tips.length) tips.push("Strong pose. Ship it.");
  return tips;
}

/* ---------- paint dynamic output ---------- */
function paintSpotter(text){
  const el = document.getElementById("spotter");
  el.innerHTML = "";
  if(text.drivers.length === 0 && text.stoppers.length === 0 && !state.caption.trim()) {
    const li = document.createElement("li");
    li.style.color = "var(--muted)";
    li.textContent = "Start typing to see live suggestions...";
    el.appendChild(li);
    return;
  }

  text.drivers.forEach(d=>{
    const li = document.createElement("li"); li.className="driver"; li.textContent=d; el.appendChild(li);
  });
  text.stoppers.forEach(s=>{
    const li = document.createElement("li"); li.className="stopper";
    li.innerHTML = `${s.label}: <mark>${s.snippet}</mark>`; el.appendChild(li);
  });
}

function paintBreakdown(breakdown){
  const el = document.getElementById("breakdown");
  el.innerHTML = "";
  CLASSES.forEach(c=>{
    const pct = Math.round((breakdown[c] / 0.35) * 100);
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:16px;margin:12px 0;";
    row.innerHTML = `
      <span style="width:100px;font-size:0.95rem;font-weight:600;color:var(--ink);">${CLASS_LABEL[c]}</span>
      <span style="flex:1;height:12px;border-radius:999px;background:var(--line);overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);">
        <span style="display:block;height:100%;width:${Math.min(pct,100)}%;background:${CLASS_COLOR[c]};transition:width 0.4s cubic-bezier(0.4, 0, 0.2, 1);"></span>
      </span>`;
    el.appendChild(row);
  });
}

function paintTips(tips){
  const el = document.getElementById("tips");
  el.innerHTML = "";
  tips.forEach(t=>{
    const li = document.createElement("li"); 
    // Just a regular item or use a custom icon
    li.style.listStyle = "none";
    li.style.margin = "var(--s2) 0";
    li.style.paddingLeft = "1.8em";
    li.style.position = "relative";
    li.innerHTML = `<span style="position:absolute;left:0;color:var(--blue);font-weight:bold;">→</span>${t}`;
    el.appendChild(li);
  });
}

function paintScore(score){
  const b = band(score);
  const numEl = document.getElementById("scoreNum");
  
  // Animate number
  const currentScore = parseInt(numEl.textContent) || 0;
  if(currentScore !== score) {
    numEl.style.transform = "scale(1.1)";
    setTimeout(() => { numEl.style.transform = "scale(1)"; }, 150);
  }

  numEl.textContent = score;
  numEl.style.color = b.color;
  
  const fill = document.getElementById("scoreFill");
  fill.style.width = score + "%";
  fill.style.background = b.color;
  document.getElementById("scoreLabel").textContent = b.label;
}

/* ---------- the loop ---------- */
function scoreAndPaint(){
  const r = resonance(state.audience, state.anchor, state.selected, state.caption);
  paintScore(r.score);
  paintSpotter(r.text);
  paintBreakdown(r.breakdown);
  paintTips(suggestions(r));
  writeHash();
}

function syncAll(){
  document.getElementById("audHint").textContent = AUDIENCES[state.audience].hint;
  
  [...document.querySelectorAll("#audience button")].forEach((b,i)=>{
    b.setAttribute("aria-pressed", Object.keys(AUDIENCES)[i]===state.audience);
  });
  [...document.querySelectorAll("#anchors button")].forEach((b,i)=>{
    b.setAttribute("aria-pressed", ANCHORS[i].id===state.anchor);
  });
  scoreAndPaint();
}

/* ---------- Hash handling ---------- */
function writeHash(){
  const s = {
    a: state.audience,
    n: state.anchor,
    f: [...state.selected],
    c: state.caption
  };
  location.replace("#" + btoa(unescape(encodeURIComponent(JSON.stringify(s)))));
}
function readHash(){
  if(!location.hash) return;
  try{
    const s = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
    if(s.a) state.audience = s.a;
    if(s.n) state.anchor = s.n;
    if(Array.isArray(s.f)) state.selected = new Set(s.f);
    if(typeof s.c === "string") state.caption = s.c;
  }catch(e){ /* ignore bad hash */ }
}

/* ---------- init ---------- */
function init(){
  readHash();
  buildAudience(); buildAnchors(); buildFragments();
  
  const capEl = document.getElementById("caption");
  capEl.addEventListener("input", e=>{
    state.caption = e.target.value; scoreAndPaint();
  });
  capEl.value = state.caption;
  syncAll();
}

document.addEventListener("DOMContentLoaded", init);
