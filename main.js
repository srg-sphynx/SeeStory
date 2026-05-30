import { state } from './scoring.js';
import { readHash, buildAudience, buildAnchors, buildFragments, syncAll, scoreAndPaint } from './ui.js';

function init(){
  readHash();
  buildAudience(); 
  buildAnchors(); 
  buildFragments();
  
  const capEl = document.getElementById("caption");
  capEl.addEventListener("input", e=>{
    state.caption = e.target.value; 
    scoreAndPaint();
  });
  capEl.value = state.caption;
  syncAll();
}

document.addEventListener("DOMContentLoaded", init);
