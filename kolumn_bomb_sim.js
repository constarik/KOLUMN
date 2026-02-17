// KOLUMN Bomb Mechanic Simulation
// Bomb: once per game, 2 diagonal rays at 45°, symbols settle after

const SYMBOLS = 5;
const COLS = 5;
const MAX_HEIGHT = 10;
const GAMES = parseInt(process.argv[2]) || 20000;
const seed = Math.floor(Date.now() / 1000);

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
  let matches = 0, score = 0;
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
  return { matches, score };
}

function bestRotation(columns, piece) {
  let bestShift = 0, bestScore = -999;
  for (let s = 0; s < COLS; s++) {
    const rotated = rotateArr(piece, s);
    const ev = evalRotation(columns, rotated);
    if (ev.score > bestScore) { bestScore = ev.score; bestShift = s; }
  }
  return { shift: bestShift };
}

function chainHorizontal(columns) {
  const tops = columns.map(c => c.length > 0 ? c[c.length - 1] : -1);
  let cleared = new Set();
  let i = 0;
  while (i < COLS) {
    if (tops[i] === -1) { i++; continue; }
    let j = i;
    while (j < COLS && tops[j] === tops[i]) j++;
    if (j - i >= 3) { for (let k = i; k < j; k++) cleared.add(k); }
    i = j;
  }
  for (const c of cleared) columns[c].pop();
  return cleared.size;
}

// Bomb: two 45 rays from bomb column top, going down-left and down-right
// Destroys all symbols in path, then columns compact
function detonateBomb(columns) {
  const bombCol = Math.floor(rng() * COLS);
  const bombRow = columns[bombCol].length - 1;
  
  if (bombRow < 0) return 0;
  
  const destroy = new Set();
  destroy.add(`${bombCol},${bombRow}`);
  
  // Ray 1: down-left
  let c = bombCol - 1, r = bombRow - 1;
  while (c >= 0 && r >= 0) {
    if (r < columns[c].length) destroy.add(`${c},${r}`);
    c--; r--;
  }
  
  // Ray 2: down-right
  c = bombCol + 1; r = bombRow - 1;
  while (c < COLS && r >= 0) {
    if (r < columns[c].length) destroy.add(`${c},${r}`);
    c++; r--;
  }
  
  for (let col = 0; col < COLS; col++) {
    const newCol = [];
    for (let row = 0; row < columns[col].length; row++) {
      if (!destroy.has(`${col},${row}`)) newCol.push(columns[col][row]);
    }
    columns[col] = newCol;
  }
  
  return destroy.size;
}

function playGame(bombEnabled) {
  const columns = [];
  for (let c = 0; c < COLS; c++) columns.push([]);
  
  let score = 0, drops = 0, totalCleared = 0, totalChainCleared = 0;
  let bombUsed = false, bombFired = false, bombDestroyed = 0;

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
      if (top === rotated[c]) { col.pop(); matched++; }
      else col.push(rotated[c]);
    }
    
    drops++;
    totalCleared += matched;
    if (matched > 0) score += Math.round(matched * matched * 10 * mult);
    
    const chained = chainHorizontal(columns);
    if (chained > 0) {
      score += Math.round(chained * chained * 5 * mult);
      totalChainCleared += chained;
    }
    
    // Bomb check
    if (bombEnabled && !bombUsed) {
      const maxH = Math.max(...columns.map(c => c.length));
      let bombProb = 0;
      if (maxH >= 9) bombProb = 1.0;
      else if (maxH >= 8) bombProb = 0.5;
      else if (maxH >= 6) bombProb = 0.3;
      
      if (bombProb > 0 && rng() < bombProb) {
        bombUsed = true;
        bombFired = true;
        bombDestroyed = detonateBomb(columns);
        score += Math.round(bombDestroyed * bombDestroyed * 3);
        totalCleared += bombDestroyed;
      }
    }
    
    const maxH = Math.max(...columns.map(c => c.length));
    if (maxH >= MAX_HEIGHT || drops >= 200) break;
  }
  
  return { score, drops, totalCleared, totalChainCleared, bombFired, bombDestroyed };
}

console.log(`KOLUMN Bomb Test — ${GAMES.toLocaleString()} games, seed: ${seed}`);
console.log('='.repeat(65));

const modes = [
  [false, 'No bomb (chains only)'],
  [true, 'With bomb (once/game)'],
];

const results = {};
for (const [enabled, label] of modes) {
  rngState = seed;
  console.log(`\n>>> ${label}...`);
  const games = [];
  for (let i = 0; i < GAMES; i++) {
    games.push(playGame(enabled));
    if (i > 0 && i % 5000 === 0) process.stdout.write(`  ${i.toLocaleString()}/${GAMES.toLocaleString()} (${Math.round(i/GAMES*100)}%)\n`);
  }
  
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const scores = games.map(r => r.score).sort((a, b) => a - b);
  const pct = (arr, p) => arr[Math.floor(arr.length * p / 100)];
  
  const key = enabled ? 'bomb' : 'none';
  results[key] = {
    avgScore: Math.round(avg(games.map(r => r.score))),
    medianScore: pct(scores, 50),
    avgDrops: Math.round(avg(games.map(r => r.drops)) * 10) / 10,
    avgCleared: Math.round(avg(games.map(r => r.totalCleared)) * 10) / 10,
    bombRate: Math.round(games.filter(r => r.bombFired).length / GAMES * 1000) / 10,
    avgBombDestroyed: Math.round(avg(games.filter(r => r.bombFired).map(r => r.bombDestroyed)) * 10) / 10 || 0,
    p5: pct(scores, 5),
    p25: pct(scores, 25),
    p50: pct(scores, 50),
    p75: pct(scores, 75),
    p95: pct(scores, 95),
  };
  
  const r = results[key];
  console.log(`  DONE: avg=${r.avgScore} median=${r.medianScore} drops=${r.avgDrops} bomb%=${r.bombRate}`);
}

console.log('\n' + '='.repeat(65));
console.log('COMPARISON');
console.log('='.repeat(65));

const n = results['none'], b = results['bomb'];
console.log(`\n${''.padEnd(18)} ${'No bomb'.padStart(10)} ${'With bomb'.padStart(10)} ${'Change'.padStart(10)}`);
console.log('-'.repeat(52));

const rows = [
  ['Avg score', n.avgScore, b.avgScore],
  ['Median score', n.medianScore, b.medianScore],
  ['Avg drops', n.avgDrops, b.avgDrops],
  ['P5 score', n.p5, b.p5],
  ['P25 score', n.p25, b.p25],
  ['P75 score', n.p75, b.p75],
  ['P95 score', n.p95, b.p95],
];

for (const [label, v1, v2] of rows) {
  const change = ((v2 / v1 - 1) * 100).toFixed(1);
  console.log(`${label.padEnd(18)} ${v1.toLocaleString().padStart(10)} ${v2.toLocaleString().padStart(10)} ${(change > 0 ? '+' : '') + change + '%'}`);
}

console.log(`\nBomb fires in ${b.bombRate}% of games`);
console.log(`Avg destroyed per bomb: ${b.avgBombDestroyed} symbols`);
console.log(`\nBomb scoring: destroyed^2 * 3 (survival-focused, not score-focused)`);
