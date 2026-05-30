import { AUDIENCES, ANCHORS, FRAGMENTS, CLASSES, CLASS_LABEL, CLASS_COLOR } from './data.js';
import { state, resonance, band, suggestions } from './scoring.js';

export function buildAudience(){
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

export function buildAnchors(){
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

export function buildFragments(){
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
    li.style.listStyle = "none";
    li.style.margin = "8px 0";
    li.style.paddingLeft = "1.8em";
    li.style.position = "relative";
    li.innerHTML = `<span style="position:absolute;left:0;color:var(--blue);font-weight:bold;">→</span>${t}`;
    el.appendChild(li);
  });
}

function paintScore(score){
  const b = band(score);
  const numEl = document.getElementById("scoreNum");
  
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

export function scoreAndPaint(){
  const r = resonance();
  paintScore(r.score);
  paintSpotter(r.text);
  paintBreakdown(r.breakdown);
  paintTips(suggestions(r));
  writeHash();
}

export function syncAll(){
  document.getElementById("audHint").textContent = AUDIENCES[state.audience].hint;
  
  [...document.querySelectorAll("#audience button")].forEach((b,i)=>{
    b.setAttribute("aria-pressed", Object.keys(AUDIENCES)[i]===state.audience);
  });
  [...document.querySelectorAll("#anchors button")].forEach((b,i)=>{
    b.setAttribute("aria-pressed", ANCHORS[i].id===state.anchor);
  });
  scoreAndPaint();
}

export function writeHash(){
  const s = {
    a: state.audience,
    n: state.anchor,
    f: [...state.selected],
    c: state.caption
  };
  location.replace("#" + btoa(unescape(encodeURIComponent(JSON.stringify(s)))));
}

export function readHash(){
  if(!location.hash) return;
  try{
    const s = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
    if(s.a) state.audience = s.a;
    if(s.n) state.anchor = s.n;
    if(Array.isArray(s.f)) state.selected = new Set(s.f);
    if(typeof s.c === "string") state.caption = s.c;
  }catch(e){}
}
