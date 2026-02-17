// KOLUMN Chain Reaction Efficiency Test
// Compare: No chains vs 3 chain variants

const SYMBOLS = 5;
const COLS = 5;
const MAX_HEIGHT = 10;

// Usage: node kolumn_chain_sim.js [modes] [count]
// modes: none,horizontal,vertical,adjacent  or  all  (default: all)
// count: number of games (default: 20000)
// Examples:
//   node kolumn_chain_sim.js none 50000
//   node kolumn_chain_sim.js horizontal,vertical 10000
//   node kolumn_chain_sim.js all 20000

const ALL_MODES = ['none','horizontal','vertical','adjacent'];
const arg1 = process.argv[2] || 'all';
const arg2 = process.argv[3];
const RUN_MODES = arg1 === 'all' ? ALL_MODES : arg1.split(',');
const GAMES = parseInt(arg2) || 20000;
const seed = Math.floor(Date.now() / 1000);

console.log(`Modes: ${RUN_MODES.join(', ')}  Games: ${GAMES.toLocaleString()}`);
console.log();

let rngState = seed;
function rng() {
  rngState = (rngState * 1664525 + 1013904223) & 0xFFFFFFFF;
  return (rngState >>> 0) / 0x100000000;
}

function generate() {
  const piece = [];
  for (let i = 0; i < COLS; i++) piece.push(Math.floor(rng() * SYMBOLS));
  return piece;
}

function rotateArr(arr, shift) {
  const n = arr.length;
  const s = ((shift % n) + n) % n;
  return [...arr.slice(n - s), ...arr.slice(0, n - s)];
}

function evalRotation(columns, piece) {
  let matches = 0;
  let score = 0;
  for (let c = 0; c < COLS; c++) {
    const col = columns[c];
    const top = col.length > 0 ? col[col.length - 1] : -1;
    if (top === piece[c]) {
      matches++;
      if (col.length >= 8) score += 12;
      else if (col.length >= 7) score += 8;
      else if (col.length >= 5) score += 4;
    } else {
      if (col.length >= 8) score -= 15;
      else if (col.length >= 7) score -= 8;
      else if (col.length >= 5) score -= 3;
    }
  }
  score += matches * 10;
  const maxH = Math.max(...columns.map(c => c.length));
  for (let c = 0; c < COLS; c++) {
    if (columns[c].length === maxH && columns[c].length > 0) {
      const top = columns[c][columns[c].length - 1];
      if (top === piece[c]) score += 5;
    }
  }
  return { matches, score };
}

function bestRotation(columns, piece) {
  let bestShift = 0, bestScore = -999, bestMatches = 0;
  for (let s = 0; s < COLS; s++) {
    const rotated = rotateArr(piece, s);
    const ev = evalRotation(columns, rotated);
    if (ev.score > bestScore) {
      bestScore = ev.score;
      bestShift = s;
      bestMatches = ev.matches;
    }
  }
  return { shift: bestShift, matches: bestMatches };
}

// ==========================================
// CHAIN VARIANTS
// ==========================================

// Variant A: Horizontal chains
// After drop, check column tops: 3+ adjacent same symbol -> remove all matching tops
function chainHorizontal(columns) {
  let totalChainCleared = 0;
  
  const tops = columns.map(c => c.length > 0 ? c[c.length - 1] : -1);
  let cleared = new Set();
  
  let i = 0;
  while (i < COLS) {
    if (tops[i] === -1) { i++; continue; }
    let j = i;
    while (j < COLS && tops[j] === tops[i] && tops[i] !== -1) j++;
    if (j - i >= 3) {
      for (let k = i; k < j; k++) cleared.add(k);
    }
    i = j;
  }
  
  for (const c of cleared) {
    columns[c].pop();
    totalChainCleared++;
  }
  
  return { chainCleared: totalChainCleared, chainDepth: totalChainCleared > 0 ? 1 : 0 };
}

// Variant B: Vertical chains
// After drop, for each column, if top 2 symbols are same -> remove top
function chainVerticalPairs(columns) {
  let totalChainCleared = 0;
  
  for (let c = 0; c < COLS; c++) {
    const col = columns[c];
    if (col.length >= 2 && col[col.length - 1] === col[col.length - 2]) {
      col.pop();
      totalChainCleared++;
    }
  }
  
  return { chainCleared: totalChainCleared, chainDepth: totalChainCleared > 0 ? 1 : 0 };
}

// Variant C: Adjacent top match
// After drop, if any two adjacent column tops are same symbol -> remove both
function chainAdjacentTops(columns) {
  let totalChainCleared = 0;
  
  const tops = columns.map(c => c.length > 0 ? c[c.length - 1] : -1);
  let cleared = new Set();
  
  for (let c = 0; c < COLS - 1; c++) {
    if (tops[c] !== -1 && tops[c] === tops[c + 1]) {
      cleared.add(c);
      cleared.add(c + 1);
    }
  }
  
  for (const c of cleared) {
    columns[c].pop();
    totalChainCleared++;
  }
  
  return { chainCleared: totalChainCleared, chainDepth: totalChainCleared > 0 ? 1 : 0 };
}

// ==========================================

function playGame(chainMode) {
  const columns = [];
  for (let c = 0; c < COLS; c++) columns.push([]);
  
  let score = 0, drops = 0, totalCleared = 0;
  let totalChainCleared = 0, maxChainDepth = 0, chainEvents = 0;

  while (true) {
    const piece = generate();
    const best = bestRotation(columns, piece);
    const rotated = rotateArr(piece, best.shift);
    
    const thinkSec = 3 + rng() * 6;
    const mult = Math.max(1.0, 10.0 - (thinkSec / 18.0) * 9.0);
    
    let matched = 0;
    for (let c = 0; c < COLS; c++) {
      const col = columns[c];
      const top = col.length > 0 ? col[col.length - 1] : -1;
      if (top === rotated[c]) {
        col.pop();
        matched++;
      } else {
        col.push(rotated[c]);
      }
    }
    
    drops++;
    totalCleared += matched;
    
    if (matched > 0) {
      score += Math.round(matched * matched * 10 * mult);
    }
    
    let chainResult = { chainCleared: 0, chainDepth: 0 };
    if (chainMode === 'horizontal') {
      chainResult = chainHorizontal(columns);
    } else if (chainMode === 'vertical') {
      chainResult = chainVerticalPairs(columns);
    } else if (chainMode === 'adjacent') {
      chainResult = chainAdjacentTops(columns);
    }
    
    if (chainResult.chainCleared > 0) {
      score += Math.round(chainResult.chainCleared * chainResult.chainCleared * 5 * mult);
      totalChainCleared += chainResult.chainCleared;
      chainEvents++;
      if (chainResult.chainDepth > maxChainDepth) maxChainDepth = chainResult.chainDepth;
    }
    
    const maxH = Math.max(...columns.map(c => c.length));
    if (maxH >= MAX_HEIGHT || drops >= 100) break;
  }
  
  return { score, drops, totalCleared, totalChainCleared, maxChainDepth, chainEvents };
}

function runSim(mode, n) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(playGame(mode));
    if (i > 0 && i % 5000 === 0) process.stdout.write(`  ${mode}: ${i.toLocaleString()}/${n.toLocaleString()} (${Math.round(i/n*100)}%)\n`);
  }
  
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const scores = results.map(r => r.score).sort((a, b) => a - b);
  const pct = (arr, p) => arr[Math.floor(arr.length * p / 100)];
  
  return {
    avgScore: Math.round(avg(results.map(r => r.score))),
    medianScore: pct(scores, 50),
    avgDrops: Math.round(avg(results.map(r => r.drops)) * 10) / 10,
    avgCleared: Math.round(avg(results.map(r => r.totalCleared)) * 10) / 10,
    avgChainCleared: Math.round(avg(results.map(r => r.totalChainCleared)) * 10) / 10,
    avgChainEvents: Math.round(avg(results.map(r => r.chainEvents)) * 10) / 10,
    maxChainDepth: Math.max(...results.map(r => r.maxChainDepth)),
    chainRate: Math.round(results.filter(r => r.chainEvents > 0).length / n * 1000) / 10,
    p5: pct(scores, 5),
    p95: pct(scores, 95),
  };
}

console.log(`KOLUMN Chain Reaction Test — ${GAMES.toLocaleString()} games, seed: ${seed}`);
console.log('='.repeat(70));

const modeLabels = {
  'none': 'No chains (baseline)',
  'horizontal': 'A: Horizontal (3+ same tops in row)',
  'vertical': 'B: Vertical pairs (top 2 same in col)',
  'adjacent': 'C: Adjacent tops (2 neighbor tops same)',
};

const modes = RUN_MODES.map(m => [m, modeLabels[m] || m]);

const results = {};
for (const [mode, label] of modes) {
  rngState = seed;
  console.log(`\n>>> ${label}...`);
  results[mode] = runSim(mode, GAMES);
  console.log(`  DONE: avg=${results[mode].avgScore} drops=${results[mode].avgDrops} chains=${results[mode].avgChainCleared}/game`);
}

console.log('\n' + '='.repeat(70));
console.log('COMPARISON TABLE');
console.log('='.repeat(70));

const hdr = 'Mode'.padEnd(14) + 
  'Avg Score'.padStart(10) + 
  'Median'.padStart(9) +
  'Drops'.padStart(7) + 
  'Cleared'.padStart(9) + 
  'Chains'.padStart(8) +
  'Ch.Clear'.padStart(10) +
  'Ch.Rate'.padStart(9) +
  'MaxDep'.padStart(8);
console.log(hdr);
console.log('-'.repeat(hdr.length));

for (const [mode] of modes) {
  const r = results[mode];
  const row = mode.padEnd(14) +
    r.avgScore.toLocaleString().padStart(10) +
    r.medianScore.toLocaleString().padStart(9) +
    r.avgDrops.toString().padStart(7) +
    r.avgCleared.toString().padStart(9) +
    r.avgChainEvents.toString().padStart(8) +
    r.avgChainCleared.toString().padStart(10) +
    (r.chainRate + '%').padStart(9) +
    r.maxChainDepth.toString().padStart(8);
  console.log(row);
}

if (results['none']) {
  console.log('\n--- Impact vs Baseline ---');
  const base = results['none'];
  for (const [mode] of modes) {
    if (mode === 'none') continue;
    const r = results[mode];
    const scoreDiff = ((r.avgScore / base.avgScore - 1) * 100).toFixed(1);
    const dropsDiff = ((r.avgDrops / base.avgDrops - 1) * 100).toFixed(1);
    console.log(`  ${mode.padEnd(12)} Score: ${scoreDiff > 0 ? '+' : ''}${scoreDiff}%  Drops: ${dropsDiff > 0 ? '+' : ''}${dropsDiff}%  Extra cleared/game: ${r.avgChainCleared}`);
  }
}
