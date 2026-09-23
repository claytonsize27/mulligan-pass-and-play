# Validation record

## Automated

Node.js 22 built-in test runner: 16 tests passed. The simulation test completes 24 games (eight deterministic seeds each for two, three and four players), each 18 holes, with inventory assertions after every transition.

Coverage includes unique 104-card composition, reproducible shuffling, input validation, dual-face exclusivity, play-anytime restrictions, simultaneous movement, modifier ordering, putting immunity, exact landing, overshoot, penalty strokes, cancellation chains, spend-before-inspect borrowing, discard reshuffle, saved-hand privacy, corrupt saves, and storage quota failures.

Static build completed without dependencies. Syntax checks passed. Production output consists only of app assets and documentation; research downloads are excluded.

## Browser

Inspected setup on desktop and a 390×844 mobile viewport. Exercised named setup, private hand reveal, club/action/target selection, commit, next-player cover, reload and resume. Verified hidden hands are absent from the shared handoff DOM. Also exercised Read the lie, simultaneous reveal, two-player reaction passing and shot results at a repository-style /dist/ subpath. An independent source reviewer identified four issues (storage getter exceptions, focus loss, long-name wrapping and pickup labels); all four fixes were reviewed as resolved. The documenter agent was unavailable because of its usage limit, so design documentation was completed inline.

## Limits

Not yet verified on physical iPhone/Android hardware. The public GitHub Pages URL was verified in the browser. The actual intro audio could not be reliably transcribed; the complete tutorial transcript and card photographs are the rules evidence. A full official card distribution was unavailable. The rule ledger explicitly discloses inferred mechanics.

Desktop responsive testing is not a substitute for physical-device PWA installation, offline eviction policies, or screen-reader testing. Core game behavior is tested independently of the DOM.


The browser completed a two-player one-hole game through two 1-Putts, the scorecard and shared-tie final results. The first automated scorecard click needed a retry; subsequent transition and final results succeeded without a console error.

Hosted smoke test: four players, mobile 390x844, long names, private planning and simultaneous reveal; no horizontal overflow. Club selection retained keyboard focus. Initial GitHub Actions test/build/deploy completed successfully. Offline service-worker implementation is present; a disconnected physical-device test remains unperformed.


## CPU and continuity update

`npm test`: 20 tests pass. Added 12 complete 18-hole CPU tournaments (each difficulty with 2, 3 and 4 players), alongside the existing 24 simulated full rounds. Each transition checks 104 unique cards. Every new-hole boundary additionally checks unchanged hands, draw order, discard pile, PRNG state and reshuffle count. CPU tests prove that changing hidden opponent cards, locked plans, seed and deck order produces identical observations and decisions. Old saves with no controller field still load.

Browser checks: 390px mobile setup with four seats and difficulty controls; 1280px desktop setup; blank placeholder inputs; mixed one-human/three-CPU planning and reactions; action descriptions on shared reveal; CPU hands absent; automatic CPU turns; results showing two balls 20 yards beyond the pin. DOM measurement confirmed markers at 92.31% against pins at 86.15%, with no horizontal overflow. No console errors observed. Corrected label encoding was confirmed on a fresh local origin after an older service-worker cache preserved the first test build.

Build remains dependency-free, approximately 105 KB uncompressed including documentation. CodeRabbit did not run: its installer failed with `curl: (60) SSL certificate problem: self signed certificate in certificate chain`. Resolve the local trusted certificate chain and rerun the official installer to enable that optional review; certificate validation was not disabled.
