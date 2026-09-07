# Geography Guessr — map fixes, difficulty modes, faster location sampling

**Status: implemented** (commit `c277d90`, plus the Street View follow-ups described at the
end). Superseded on the scoring front by [02-scoring-rework.md](02-scoring-rework.md).

## Context

The game drops you in a random Street View panorama, you pan/walk around, place a
guess on a mini-map, and get scored on distance. Three things needed work:

1. **Street view and the guess map fought each other.** Panning the panorama and then
   opening the mini-map teleported you back to the drop point; panning the mini-map and
   moving the mouse away snapped it back to `0,0` or your last click.
2. **The result map sometimes rendered blank / without markers.**
3. **Easy/Medium/Hard all linked to the same game**, and the drop point was found by
   guessing random lat/lng in a `while` loop until Street View said yes — which with the
   API's default 50 m search radius meant hundreds to thousands of calls per game.

Difficulty definitions chosen: **easy** = curated major cities and mid-size towns
worldwide; **medium** = anywhere; **hard** = anywhere plus a 5-minute timer.

All three bugs had the same shape — **a value that should be set once was being re-applied
on every React render** — so each got one fix at the source, not per-symptom patches.

## Root causes

| Symptom | Cause |
|---|---|
| Street view jumps back to drop point when you open the map | `StreetViewWrapper`'s effect depended on `options`, a **fresh object literal every render**. Hovering the map flipped `isHovered`, re-rendered, and the effect called `setOptions({position, pov})` — resetting position *and* heading. |
| Guess map snaps back to `0,0` / last click | `center={markerPosition \|\| {lat:0,lng:0}}` was a **controlled** prop. Any re-render re-applied it, discarding the user's pan. |
| Result map blank / missing markers | Module-level `let counter = 0` **persisted across mounts**. On the second game of a session `counter` was already `2`, so the `setInterval` hack never set the marker state. A `useEffect` **returning JSX** made the guard dead code. |
| Painfully slow load | `getPanorama` with no `radius` defaults to **50 metres**. Combined with uniform random lat/lng (71 % ocean, plus poles), the per-attempt hit rate was near zero. |

Same class of bug as `counter`: the module-level `let tempCenter` in Game.js.

## Changes made

### `src/pages/Game.js`
- `StreetViewWrapper` builds the panorama **once** and never calls `setOptions` again;
  a `panoRef` lets the parent drive it imperatively.
- "Reset Street View" became imperative (`setPano` + `setPov`); deleted the `newCenter`
  state and its `setTimeout(…, 2000)` hack.
- Deleted the `isHovered` state, `mapDim`, and inline `mapContainerStyle`. The CSS already
  did the hover-expand; the JS copy's re-render was what triggered both map bugs.
- Guess map went **uncontrolled**, with its initial view in a module-level
  `GUESS_MAP_OPTIONS` constant so its identity never changes.
- `tempCenter` → `startRef`; difficulty read via `useSearchParams`; hard mode got a
  600-second countdown that auto-submits (with `markerPosition=null` if no guess).

### `src/locations.js` (new)
~78 `[lat, lng]` seeds — major cities and mid-size towns across every inhabited continent.
Only easy mode needs data; medium and hard sample the globe at random.

### Location sampling
- **A real search radius**: `radius: 50000` with `source: OUTDOOR`, which alone moved the
  per-attempt hit rate from ~0 to roughly one in five.
- **Latitude clamp** to `[-60, 75]` — drops Antarctica and the high Arctic.
- Five candidates in flight per round via `Promise.any`, capped at 12 batches, replacing
  the unbounded `while` loop.

*Skipped:* an offline land mask to reject ocean points before calling. Add it only if the
call count shows up on the Maps bill — the radius change already cut it ~100×.

### `src/pages/Submit.js`
- Deleted `counter`, the `setInterval`, `timeoutSet`, and both marker state variables.
- Deleted the `useEffect` that returned JSX; replaced with a guard *before* any use of
  `mapPosition`.
- `fitBounds` over both points with a `Polyline` between them, instead of a fixed
  center/zoom.
- No-guess branch for the hard-mode timeout.
- **Dropped the hardcoded API key**, using the `Geocoder` from the already-loaded SDK.

### `src/styles/Game.css`
Hover sizing moved fully to CSS: `.submit-location` became the positioned sizing box.

### `src/pages/Home.js`
Difficulty links now carry `?difficulty=easy|medium|hard` with a one-line hint each.

### `src/scoring.js` + `src/scoring.test.js` (new)
Distance and score extracted so the math is testable under the CRA jest already installed.

## Follow-up fixes (same effort, found by testing)

Three further defects surfaced after the initial implementation:

1. **Result markers invisible.** `options={{...}}` as an inline literal was re-applied on
   every render, discarding the `fitBounds`. Fixed with a module-level constant and a
   framing effect keyed on the map + round.
2. **React 18 StrictMode.** `@react-google-maps/api` builds its `google.maps` objects in
   `componentDidMount` and never re-attaches them. StrictMode's remount left every
   `Marker` bound to a discarded map. Removed `<React.StrictMode>` in `src/index.js`.
3. **Black Street View on the first game of a page load.** The Maps API lazy-loads its
   Street View renderer the first time a panorama is constructed, so building one on a
   fresh page load painted black — while "Play Again" worked 100 % of the time because the
   module was already cached. The original code hid this by calling `setOptions` on every
   render, which doubled as an accidental retry loop. Fixed by constructing an empty
   panorama as soon as the script loads (warming the renderer behind the loading screen)
   and assigning the location with `setPano` once found.

## Known, not fixed

The dino mini-game leaks: `Runner` is a singleton whose `requestAnimationFrame` loop never
stops and whose `document` keydown/mouse listeners are never removed
(`src/pages/dino/DinoScript.js`, `startListening`/`raq`). It keeps running at 60fps against
a detached canvas for the rest of the session.

⚠️ The Google Maps API key that was hardcoded in `Submit.js` is still present in this
repo's git history. Removing the line did not un-publish it — **revoke it in the Google
Cloud console.** The `REACT_APP_` key should be restricted by HTTP referrer, since a CRA
build inlines it into the JS bundle.

## Out of scope

Difficulty affecting movement (beyond hard's timer), a leaderboard, and the Home page's
`document.getElementById` overlay toggle.
