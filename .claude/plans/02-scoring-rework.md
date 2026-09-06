# Scoring rework — plateau-then-cliff curve, scaled by difficulty

**Status: implemented** (commit `dd70e02`). Follows
[01-map-fixes-and-game-modes.md](01-map-fixes-and-game-modes.md), which introduced the
difficulty modes this builds on.

## Context

Scoring today is `5000 * exp(-distance / 1500)` in [scoring.js](src/scoring.js). That is
almost exactly real GeoGuessr's world-map formula, but it is at its **steepest** in the
1000–2000 km band — which is precisely the "I found the right country, wrong end of it"
band. A round guessing José Mariano Jiménez when the answer was Los Santitos, Baja
California — 980 km off, correct country, correct general region — scored 2602/5000. That
reads as a failure when it was a decent guess.

Two changes, both confirmed with the user:

1. **Reshape the curve** so near-misses cost almost nothing, the right-country band stays
   strong, and wrong-continent guesses still collapse to zero.
2. **Scale it by difficulty**, which is already threaded through to the results page but
   currently unused for scoring.

## The curve

```
score = 5000 * exp( -(distance / SCALE) ^ 1.3 )
```

The exponent `1.3` is what does the work. The current formula uses an implicit exponent of
1.0, which decays fastest immediately and gives a long tail. Pushing it above 1 flattens
the curve near zero and steepens it later — a plateau, then a cliff:

|  distance | easy + hard (2500) | medium (3500) |    today |
|----------:|-------------------:|--------------:|---------:|
|      0 km |               5000 |          5000 |     5000 |
|     25 km |               4987 |          4992 |     4918 |
|    100 km |               4924 |          4951 |     4677 |
|    250 km |               4756 |          4841 |     4238 |
|    500 km |               4420 |          4617 |     3583 |
| **980 km** |          **3719** |      **4130** | **2602** |
|   2000 km |               2366 |          3084 |     1318 |
|   5000 km |                426 |          1020 |      178 |
|  10000 km |                 12 |           100 |        6 |
|  20000 km |                  0 |             0 |        0 |

`SCALE` is the single tuning knob per mode: **easy 2500**, **medium 3500**, **hard 2500**.

Medium is the forgiving one. Easy is harsher because you had a recognizable city to work
from. **Hard matches easy** rather than being the most forgiving: hard is not a harder
*location* — it draws from the same random pool as medium — it is the same game with a
10-minute timer, so it gets the demanding curve rather than a bonus for difficulty it
doesn't actually have in its drop points.

Note the reachable maximum distance on Earth is ~20,015 km, and this curve reaches
effectively zero there on its own — no clamping needed.

**Accepted trade-off:** pinpoint accuracy is rewarded less sharply than before. A 200 km
miss now costs about 120 points instead of about 500. That is the direct consequence of
what was asked for. If it later feels too soft, lower the `1.3` toward `1.0` or shrink the
per-mode `SCALE` values — both are one-number edits.

## Changes

### `src/scoring.js`

Replace `calculateScore`. `calculateDistance` is untouched.

```js
// Per-mode decay distance. Bigger = more forgiving.
// hard matches easy on purpose: it draws the same random locations as medium and only
// adds a timer, so it gets the demanding curve rather than a forgiveness bonus.
const DECAY_KM = { easy: 2500, medium: 3500, hard: 2500 };
// >1 flattens the curve near zero and steepens it further out: near-misses stay
// cheap, wrong-continent guesses still collapse.
const SHAPE = 1.3;

export const calculateScore = (distance, difficulty = 'medium') =>
    Math.round(5000 * Math.exp(-Math.pow(distance / (DECAY_KM[difficulty] ?? DECAY_KM.medium), SHAPE)));
```

The `?? DECAY_KM.medium` fallback matters: `difficulty` arrives from a query string, so a
hand-edited or stale URL must not produce `NaN`.

### `src/pages/Submit.js`

`difficulty` is already parsed out of the query string in the existing `useMemo`
([Submit.js:23-30](src/pages/Submit.js#L23-L30)) and already used for the "Play Again"
link — just feed it to the scorer:

```js
const score = markerPosition ? calculateScore(distance, difficulty) : 0;
```

Since scores are no longer comparable across modes, show which mode was played next to the
score, so a 4130 and a 3719 aren't silently different things.

### `src/scoring.test.js`

All four existing assertions still hold under the new curve (checked: 0→5000, 25→4992,
400→4711, 20000→0), so they stay as regression cover. Add assertions for the new behavior:

```js
test('medium is the forgiving mode', () => {
    expect(calculateScore(980, 'easy')).toBeLessThan(calculateScore(980, 'medium'));
    expect(calculateScore(980, 'hard')).toBeLessThan(calculateScore(980, 'medium'));
});

test('hard scores the same as easy', () => {
    expect(calculateScore(980, 'hard')).toBe(calculateScore(980, 'easy'));
});

test('right country, wrong end of it still scores well', () => {
    expect(calculateScore(980, 'medium')).toBeGreaterThan(4000);  // was 2602
    expect(calculateScore(980, 'hard')).toBeGreaterThan(3500);
});

test('unknown difficulty falls back to medium', () => {
    expect(calculateScore(980, 'nonsense')).toBe(calculateScore(980, 'medium'));
    expect(calculateScore(980)).toBe(calculateScore(980, 'medium'));
});

test('monotonically decreasing', () => {
    const ds = [0, 100, 500, 1000, 2000, 5000, 10000, 20000];
    const scores = ds.map((d) => calculateScore(d, 'medium'));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
});
```

## Verification

1. `npm test` — the four existing assertions plus the five new ones pass.
2. `npm start`, play a **medium** round and deliberately click ~1000 km off (a guess in the
   wrong part of the right country). Expect roughly 4100, not 2600.
3. Play a **hard** round and miss by a comparable distance; expect roughly 3700 — lower
   than medium, matching easy — and confirm the mode is labelled on the results page.
4. Click the far side of the planet — expect a score in the single digits or zero, not a
   consolation prize.
5. Hand-edit the results URL to `&difficulty=garbage` and confirm the score is a number
   matching medium, not `NaN`.

## Out of scope

Country-aware bonuses (a "same country" floor) — that needs reverse geocoding the *guess*
as well as the answer, which is an extra API call and a new failure path. The reshaped
curve already delivers the outcome that prompted this. Also unchanged: the 5000-point
maximum, and `calculateDistance`.
