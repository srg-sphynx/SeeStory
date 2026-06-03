/* ── lexicon.js ── bundled, offline dictionaries + linguistic helpers ──
   Powers the dictionary-driven "best audience" recommender (recommend.js).
   Everything here is permissively-licensed / public-domain word data, shipped
   as plain JS so it runs entirely in the browser — no network, no build step.

   It is intentionally additive: nothing here touches scoring.js. If this module
   ever fails to load, the recommender degrades and the core engine is untouched.

   Sources / licensing:
   - COMMON_WORDS: a compact core of high-frequency English words (derived from
     public-domain frequency lists; everyday vocabulary a general reader knows).
   - DOMAIN_JARGON: curated computational-chemistry / drug-discovery + B2B SaaS
     technical terms (project-specific, hand-built).
   - Tone words: small hand-built positive/excitement set, complementing the
     HYPE_WORDS / HEDGE_WORDS already in data.js.
*/

/* ── Compact core of familiar English words ───────────────────────────────
   Not exhaustive — a representative high-frequency core. Combined with the
   syllable + length heuristics below, it classifies vocabulary familiarity
   well for the short marketing / science drafts this tool scores. Extend
   freely; the algorithm tolerates gaps gracefully. */
const COMMON_LIST = (
  // function words + ultra-high-frequency
  "the be to of and a in that have i it for not on with he as you do at this but his by from " +
  "they we say her she or an will my one all would there their what so up out if about who get " +
  "which go me when make can like time no just him know take people into year your good some " +
  "could them see other than then now look only come its over think also back after use two how " +
  "our work first well way even new want because any these give day most us " +
  // common everyday content words
  "is are was were been being am has had did does done go goes going went gone made making say said " +
  "tell told ask asked find found show showed shown try tried call called need needed feel felt " +
  "become left put mean keep let begin seem help talk turn start might move live believe hold bring " +
  "happen write provide sit stand lose pay meet include continue set learn change lead understand watch " +
  "follow stop create speak read allow add spend grow open walk win offer remember love consider appear " +
  "buy wait serve die send build stay fall cut reach kill remain " +
  "great little own old big high small large next early young important few public bad same able " +
  "person world life hand part child eye woman place week case point company number group problem fact " +
  "home water room mother area money story month lot right study book job word business issue side kind " +
  "head house service friend father power hour game line end member law car city community name team minute " +
  "idea body information back face others level office door health art war history party result change " +
  "morning reason research girl guy moment air teacher force education foot boy age policy process music market " +
  "sense nation plan college interest death course someone experience behind student program question work " +
  "play run move like live feel become leave " +
  "more less many much most least very really too also just only still even well back even now then once " +
  "here there where why how what who which when while before after during until since because though although " +
  "good better best fast faster fastest easy easier hard harder simple clear clearly quick quickly slow slowly " +
  "yes today every always never often sometimes maybe sure okay thanks please " +
  "you your yours we our ours they their theirs it its he his she her hers " +
  "make made making use used using used test tested testing check checking checked build built building " +
  "data result results number numbers team teams tool tools step steps demo video image graphic photo source " +
  "share watch read post draft science scientist scientists future audience message platform discovery design " +
  "model molecule docking screen screening compound compounds hit hits time times day days minute minutes hour " +
  "fast slow clear simple real human voice community question reduce reduced improve improved cost costs speed " +
  "benchmark percent first top pipeline workflow project projects paper papers dataset method methods"
);
export const COMMON_WORDS = new Set(COMMON_LIST.split(/\s+/).filter(Boolean));

/* ── Domain jargon: technical terms that signal an expert register ────────── */
export const DOMAIN_JARGON = new Set([
  // computational chemistry / drug discovery
  "docking","ligand","ligands","binding","affinity","pharmacophore","scaffold","scaffolds",
  "conformer","conformers","tautomer","enantiomer","stereochemistry","cheminformatics",
  "qsar","admet","adme","dmpk","pharmacokinetics","pharmacodynamics","bioavailability",
  "cytotoxicity","selectivity","potency","nanomolar","micromolar","assay","assays","throughput",
  "enrichment","actives","decoys","scoring","solvation","electrostatics","crystallography",
  "crystallographic","apo","holo","allosteric","orthosteric","kinase","kinases","protease",
  "inhibitor","inhibitors","agonist","antagonist","substructure","fingerprint","fingerprints",
  "enumeration","retrosynthesis","synthesizability","chemotype","chemotypes","fragment","fragments",
  "homology","pose","poses","rmsd","conformational","macrocycle","macrocyclic","covalent",
  "noncovalent","hydrophobic","solvent","desolvation","entropic","enthalpic","free-energy",
  "perturbation","trajectory","simulation","ensemble","virtual","screening","chemical-space",
  // statistics / methodology
  "prospective","retrospective","validation","reproducible","reproducibility","statistical",
  "significance","correlation","regression","baseline","prevalence","sensitivity","specificity",
  "calibration","quantitative","qualitative","heuristic","heuristics","parameterization",
  // B2B / SaaS technical
  "throughput","latency","scalability","integration","api","sdk","deployment","orchestration",
  "infrastructure","provisioning","authentication","tenancy","middleware","pipeline","onboarding"
]);

/* ── Tone: positive / excitement words (complement HYPE/HEDGE in data.js) ── */
export const EXCITEMENT_WORDS = new Set([
  "amazing","awesome","incredible","exciting","excited","love","wow","huge","massive","stunning",
  "thrilled","epic","insane","crazy","unbelievable","fantastic","brilliant","cool","super",
  "mind-blowing","wild","obsessed","vibe","vibes","hype","lit","goosebumps","jaw-dropping"
]);

/* ── Syllable estimator (heuristic, no dictionary needed) ──────────────────
   Good enough for readability formulas on English prose. */
export function countSyllables(word){
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if(!w) return 0;
  if(w.length <= 3) return 1;
  // drop common silent endings
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  w = w.replace(/^y/, "");
  const groups = w.match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

/** A word is "complex" for readability if it has 3+ syllables and isn't a
 *  trivially-inflected common word. (Gunning Fog convention, simplified.) */
export function isComplexWord(word){
  const clean = word.toLowerCase().replace(/[^a-z-]/g, "");
  if(!clean) return false;
  if(COMMON_WORDS.has(clean)) return false;
  return countSyllables(clean) >= 3;
}

/** Is this token unfamiliar to a general reader?
 *  Familiar = in the common core, short, or low-syllable. Jargon terms and
 *  long multi-syllable non-common words count as unfamiliar. */
export function isUnfamiliarWord(word){
  const clean = word.toLowerCase().replace(/[^a-z-]/g, "");
  if(!clean) return false;
  if(DOMAIN_JARGON.has(clean)) return true;
  if(COMMON_WORDS.has(clean)) return false;
  if(clean.length <= 6) return false;
  return countSyllables(clean) >= 3;
}

export function isJargon(word){
  const clean = word.toLowerCase().replace(/[^a-z-]/g, "");
  return DOMAIN_JARGON.has(clean);
}

/* ── Readability ──────────────────────────────────────────────────────────
   Returns Flesch–Kincaid grade level + Flesch reading ease + the complex /
   unfamiliar word shares used by the recommender. */
export function readability(words, sentenceCount){
  const n = words.length;
  if(n === 0 || sentenceCount === 0){
    return { grade: 0, ease: 100, complexShare: 0, unfamiliarShare: 0, jargonShare: 0, avgSyllables: 0 };
  }
  let syllables = 0, complex = 0, unfamiliar = 0, jargon = 0;
  for(const raw of words){
    syllables += countSyllables(raw);
    if(isComplexWord(raw)) complex++;
    if(isUnfamiliarWord(raw)) unfamiliar++;
    if(isJargon(raw)) jargon++;
  }
  const wps = n / sentenceCount;          // words per sentence
  const spw = syllables / n;              // syllables per word
  const grade = 0.39 * wps + 11.8 * spw - 15.59;
  const ease  = 206.835 - 1.015 * wps - 84.6 * spw;
  return {
    grade: Math.max(0, Math.round(grade * 10) / 10),
    ease:  Math.max(0, Math.min(100, Math.round(ease))),
    complexShare:    complex / n,
    unfamiliarShare: unfamiliar / n,
    jargonShare:     jargon / n,
    avgSyllables:    Math.round(spw * 100) / 100
  };
}
