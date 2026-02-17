# KOLUMN — Game Design Specification

**Version:** 0.1 DRAFT  
**Author:** Constantin / Uncloned Math  
**Date:** February 2026  
**Status:** Concept — mechanics validated via prototype and simulation  
**Working title history:** Rising Towers → Rising Towers Horizontal → KOLUMN

---

## 1. CONCEPT

**Genre:** Skill-based arcade with virtual economy  
**Core loop:** Tetris-style symbol matching — player rotates a falling strip to match symbols vertically  
**Platform:** Mobile (primary), Web  
**Monetization:** Virtual currency (Coins) purchased for real money, no cash-out

### One-line pitch

Tetris meets symbol matching: rotate falling strips to clear columns before they hit the ceiling.  
**Name:** KOLUMN (K intentional — distinctive, column-based gameplay)

---

## 2. GAMEPLAY MECHANICS

### 2.1 Playing Field

- **Grid:** 5 columns × 10 rows (ceiling)
- **Symbols:** 5 distinct symbols (emoji/icons TBD for production)
- **State:** Each column is a stack of symbols, growing upward from bottom

### 2.2 Core Loop

1. A **strip** of 5 random symbols appears above the grid
2. Player **rotates** the strip (cyclic shift left/right) to align symbols with column tops
3. Player **drops** the strip (or timer expires → auto-drop)
4. For each column:
   - **Match** (dropped symbol = column top) → both symbols removed, column shrinks by 1
   - **No match** → symbol stacks on top, column grows by 1
5. **Horizontal chain:** after drop resolves, if 3+ adjacent column tops show the same symbol → all matching tops removed (single pass, no cascade)
6. **Bomb** (once per game): after each drop, if max column height ≥ 6 → bomb may trigger (p=0.3 at h6, p=0.5 at h8, p=1.0 at h9). Bomb lands on random column top, fires two 45° rays (down-left, down-right). All symbols in path destroyed, remaining symbols settle. Scoring: `destroyed² × 3`. Average 2.4 symbols destroyed.
7. If any column reaches height 10 → **Game Over**
8. Score awarded based on matches per drop + chain bonus + bomb bonus
9. Next strip generated → repeat from step 2

### 2.3 Timer & Drop Multiplier

- **20 seconds** per drop
- Multiplier starts at **×10.0**, decreases linearly by 0.1 every ~0.2 sec
- At **×1.0** (18 sec elapsed) — strip **auto-drops** at ×1.0
- Visual: progress bar + live multiplier display (green → yellow → red)
- Score for drop = base points × current multiplier at moment of drop
- Fast decisions rewarded: drop at ×10.0 (instant) vs ×1.0 (forced) = 10× difference
- Timer resets after each drop

### 2.4 Controls

- **Rotate Left / Right:** Cyclic shift of strip (keyboard arrows or buttons)
- **Drop:** Place strip immediately (spacebar or button)
- **Visual preview:** Strip cells glow green (match) or red (no match) in real-time as player rotates

### 2.5 Scoring

Per drop: `matches² × 10 × multiplier`

Base points (before multiplier):

| Matches in drop | Base points |
|----------------|-------------|
| 0 | 0 |
| 1 | 10 |
| 2 | 40 |
| 3 | 90 |
| 4 | 160 |
| 5 (perfect) | 250 |

Multiplier: ×10.0 (instant drop) → ×1.0 (auto-drop at 18 sec).

Example: 3 matches dropped at ×7.3 = 90 × 7.3 = 657 points.

**Horizontal chain bonus:** `chainCleared² × 5 × multiplier`

Example: 3 tops cleared by chain at ×7.3 = 9 × 5 × 7.3 = 329 points.

Total score = sum of all drop scores + chain bonuses in session.

### 2.6 Game Over

- Any column reaches ceiling (height = 10)
- Final score displayed with session stats (drops, total cleared, match rate)

---

## 3. SIMULATION DATA

### 3.1 With Multiplier (production scoring: base × mult)

Based on 200,000 simulated games (seed: 1771307718). Scoring: `matches² × 10 × multiplier`.

**Bot — Best Strategy, instant drop (×10.0 always):**

| Metric | Value |
|--------|-------|
| Avg score | 9,796 |
| Median score | 9,200 |
| Avg drops | 24.4 |
| Match rate | 35.0% |
| Score range | 900 — 45,500 |

| P5 | P10 | P25 | Median | P75 | P90 | P95 | P99 |
|----|-----|-----|--------|-----|-----|-----|-----|
| 4,300 | 5,100 | 6,800 | 9,200 | 12,100 | 15,300 | 17,400 | 21,900 |

**Human-Sim — Best strategy + thinking time (2–12 sec) + 5% errors:**

| Metric | Value |
|--------|-------|
| Avg score | 7,092 |
| Median score | 6,626 |
| Avg drops | 22.7 |
| Match rate | 33.9% |
| Effective avg multiplier | ×7.2 |
| Score range | 551 — 32,505 |

| P5 | P10 | P25 | Median | P75 | P90 | P95 | P99 |
|----|-----|-----|--------|-----|-----|-----|-----|
| 3,006 | 3,631 | 4,889 | 6,626 | 8,795 | 11,131 | 12,750 | 16,224 |

### 3.2 Without Multiplier (base scoring, historical)

Based on 200,000 games. Scoring: `matches² × 10` (no multiplier).

| Mode | Avg score | Avg drops | Match rate |
|------|-----------|-----------|------------|
| Smart (best rotation) | 1,004 | 24.8 | 35.9% |
| Random (no rotation) | 177 | 11.3 | 17.7% |

### 3.3 With Horizontal Chains (production)

Based on 10,000 games. Scoring: `matches² × 10 × mult` + `chainCleared² × 5 × mult`. Single-pass horizontal chain (3+ adjacent same tops).

| Metric | No chains | With chains | Change |
|--------|-----------|-------------|--------|
| Avg score | 6,873 | 12,354 | +80% |
| Avg drops | 24.4 | 36.4 | +49% |
| Chains/game | 0 | 4.9 | — |
| Extra cleared/game | 0 | 15.9 | — |
| Chain fire rate | 0% | 97.4% | — |

**Other chain variants tested and rejected:**
- Vertical pairs (top 2 same in column): 0% impact — never triggers
- Adjacent tops (2 neighbor tops same): +292% drops — breaks balance, game becomes immortal

### 3.4 Bomb Impact (20K games)

| Metric | No bomb | With bomb | Change |
|--------|---------|-----------|--------|
| Avg score | 12,124 | 13,189 | +8.8% |
| Median score | 11,021 | 12,010 | +9.0% |
| Avg drops | 35.6 | 38.6 | +8.4% |
| P5 score | 4,505 | 5,052 | +12.1% |

Bomb fires in 100% of games (every game reaches h≥6). Avg 2.4 symbols destroyed per bomb. Modest survival boost, doesn't break balance.

### 3.5 Skill Gaps

| Comparison | Ratio |
|------------|-------|
| Smart vs Random (game length) | 2.19× |
| Smart vs Random (score, no mult) | 5.67× |
| Bot ×10.0 vs Human-Sim (score, with mult) | 1.38× |
| Bot ×10.0 vs Random (score, no mult) | ~55× |

### 3.6 Human Playtesting (single tester, author)

**Production build (multiplier + horizontal chains + bomb):**

| Game | Score | Drops | Chains | Bomb |
|------|-------|-------|--------|------|
| 1 | 9,851 | 31 | 5 | — |
| 2 | 10,000 | — | — | — |
| 3 | 4,500 | — | — | — |
| 4 | 3,737 | 19 | 2 | — |
| 5 | 3,054 | 18 | 0 | — |
| 6 | 3,737 | 19 | 2 | — |
| 7 | 7,634 | 28 | 2 | used |
| 8 | 16,436 | 51 | 8 | used |
| **Average** | **7,369** | | | |

Games 1–6: chains only (no bomb). Games 7–8: with bomb.
Bomb game (16,436) = best score, longest session (51 drops). Bomb extends life → more chains → snowball effect.
Simulation avg (with bomb): 13,189. Human at ~56–125% depending on session luck.
Chains per game: 2–8 (sim: 4.9) — high variance in real play.

**Earlier builds (no chains, multiplier bug — ×10.0 always):**

| Game | Score |
|------|-------|
| 1 | 7,700 |
| 2 | 6,400 |
| 3 | 9,800 |
| **Average** | **7,967** |

**Without multiplier (fixed timer, historical):**

| Timer | Score |
|-------|-------|
| 15 sec | 1,130 — 1,150 |
| 4 sec | 360 |
| No rotation (DROP only) | 1,500 — 1,900 (avg 1,700) |

**Observations:**
- Chain frequency matches simulation perfectly (5 vs 4.9)
- Session variance high: 4,500–10,000 (±45%) — keeps games exciting
- Real human effective mult ~×5–6 (thinking 7–10 sec per drop)
- Rotation skill = ×4.7 score boost (7,967 vs 1,700 without rotation)
- Speed of thought IS the skill — not just rotation choice
- Score ceiling likely rises with practice (faster pattern recognition)

---

## 4. ECONOMY MODEL

### 4.1 Virtual Currency: Coins

- Player purchases Coins with real money (in-app purchase)
- Coins used as entry fee (bet) for each game session
- Score earned during session → converted to Coins won

### 4.2 Withdrawal Models (market-dependent)

**Model A — Direct Cash-out:**
Coins → real money withdrawal. Simplest model. Applicable in unregulated markets (SEA). Makes the product a real-money skill game — requires legal clearance per jurisdiction.

**Model B — Marketplace:**
Coins → in-game items (skins, avatars, cosmetics). Items tradeable peer-to-peer on internal marketplace. No formal cash-out, but de-facto value extraction exists. Precedent: CS:GO economy.

**Model C — Prize Tournaments:**
Coins are free or earned through play. Top-N players in periodic tournaments win real money prizes. Entry is free = not gambling. Monetization via ads, VIP subscriptions, or cosmetic purchases.

**Model D — Subscription:**
Flat fee ($5/month) = unlimited play. No coins, no bets, no withdrawal. Pure arcade. Leaderboards, seasons, achievements. Monetization predictable and recurring. Zero gambling concerns in any jurisdiction.

**Deployment strategy:** Model selection per market. Model A for unregulated markets, Model B/C for regulated markets, Model D globally. All four can coexist — same core game, different economy layer.

### 4.3 Coin Exchange Rate (Dynamic Pricing)

The system maintains a **population-level exchange rate** for Coin purchases.

**Mechanism:**
- Sliding window tracks average player winnings across ALL players
- Expected average (E) is a design parameter
- If population average moves beyond E ± 3σ, the Coin purchase price adjusts:
  - Population winning above E + 3σ → Coins become more expensive to buy
  - Population winning below E - 3σ → Coins become cheaper to buy
- Rate applies **equally to all players** (single global rate)
- Rate can be displayed openly (transparency)

**Properties:**
- Gameplay integrity preserved — no individual manipulation, no rigging of RNG or game rules
- Self-balancing economy — skilled players drive price up, which naturally limits their advantage
- No per-player targeting — avoids legal/ethical issues of personalized odds
- Players can strategize on **when** to buy Coins (buy cheap when population is losing)

### 4.4 Session Payout Formula

**Model D (Subscription):** Not applicable. Score = score. Leaderboards, personal records, seasons, achievements. No conversion needed.

**Models A/B/C (Coin economy):** TBD — requires calibration:
- Entry fee: X Coins
- Payout: f(score) Coins
- f() designed so that at average skill level, expected payout ≈ E × entry fee
- E = target RTP, set per market / model

---

## 5. LEGAL CONSIDERATIONS

### 5.1 Classification

The game is positioned as a **skill-based arcade** with virtual currency:

- **Skill predominance:** Player decisions (rotation choice, timing) determine outcome. Simulations show 2.2× – 5.7× performance gap between skilled and random play.
- **Withdrawal model varies by market:** Direct cash-out (Model A) in unregulated markets, marketplace (Model B) or prize tournaments (Model C) in regulated markets.
- **No chance-only outcomes:** Every game requires active player input. Random element (strip generation) is a starting condition, not the determinant of outcome.

### 5.2 Regulatory Notes

- Most US states: skill games with virtual currency (no cash-out) are not classified as gambling
- Precedent risk: Washington State court ruled virtual coins can be "things of value" regardless of cash-out (Larsen v PTT, 2024)
- Unregulated Asian markets (SEA): minimal restrictions on skill-based games with virtual currency
- **Recommendation:** Obtain legal opinion before launch in regulated markets

### 5.3 Responsible Gaming

- No targeting of minors
- Coin purchase limits (daily/monthly caps)
- Session time warnings
- No predatory mechanics (no artificial urgency to purchase)

---

## 6. DESIGN LEVERS

Parameters available for tuning without changing core mechanics:

| Lever | Range | Effect |
|-------|-------|--------|
| Number of symbols | 4–8 | Fewer = more matches, longer games |
| Number of columns | 4–7 | More = more rotation options, more skill |
| Ceiling height | 8–15 | Higher = longer games |
| Timer per drop | 3–15 sec | Shorter = more pressure, lower scores |
| Scoring formula | varies | Controls payout curve |
| Coin exchange rate window | 1 day – 1 month | Smoothing of price adjustments |
| E (expected average) | design param | Target house edge |

---

## 7. PRODUCTION ROADMAP

### Phase 1: Prototype ✅
- [x] Core mechanics (rotate, drop, match, stack)
- [x] Timer with visual feedback
- [x] Score system
- [x] Simulation framework (smart vs random)
- [x] Human playtesting

### Phase 2: Balance & Economy
- [ ] Calibrate payout formula f(score)
- [ ] Simulate Coin economy (population dynamics)
- [ ] Determine E and σ parameters
- [ ] Timer sweet spot testing (larger playtest group)
- [ ] Symbol count / column count variants testing

### Phase 3: Production Client
- [ ] Production art (symbols, grid, animations)
- [ ] Sound design
- [ ] Mobile-optimized touch controls (swipe to rotate, tap to drop)
- [ ] Tutorial / onboarding
- [ ] Session history / personal stats

### Phase 4: Backend & Economy
- [ ] Server-side game validation (anti-cheat)
- [ ] Coin purchase integration
- [ ] Exchange rate engine
- [ ] Population statistics dashboard
- [ ] Rate adjustment algorithm

### Phase 5: Launch
- [ ] Soft launch (target: SEA market)
- [ ] Analytics / telemetry
- [ ] A/B testing on design levers
- [ ] Legal review per market

---

## 8. OPEN QUESTIONS

1. **Optimal symbol count:** 5 tested, try 4 and 6 for comparison?
2. ~~**Chain reactions:**~~ DECIDED — Horizontal chains (3+ same tops) adopted. +49% game length, +80% score. Single pass, no cascade.
3. **Power-ups:** Wild symbols, bombs (clear column), freeze timer — add engagement or dilute skill?
4. **Multiplayer:** Competitive mode (same strips, compare scores)? Adds retention but complicates economy.
5. **Session length target:** 25 drops ≈ 1–2 minutes at 4 sec timer. Too short? Too long?
6. **Visual theme:** Abstract tech? Fantasy towers? Minimal?

---

*Uncloned Math — Original Game Concepts*
