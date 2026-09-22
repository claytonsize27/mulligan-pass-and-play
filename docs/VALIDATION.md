# Validation record

## Automated

Node.js 22 built-in test runner: 16 tests passed. The simulation test completes 24 games (eight deterministic seeds each for two, three and four players), each 18 holes, with inventory assertions after every transition.

Coverage includes unique 104-card composition, reproducible shuffling, input validation, dual-face exclusivity, play-anytime restrictions, simultaneous movement, modifier ordering, putting immunity, exact landing, overshoot, penalty strokes, cancellation chains, spend-before-inspect borrowing, discard reshuffle, saved-hand privacy, corrupt saves, and storage quota failures.

Static build completed without dependencies. Syntax checks passed. Production output consists only of app assets and documentation; research downloads are excluded.

## Browser

Inspected setup on desktop and a 390×844 mobile viewport. Exercised named setup, private hand reveal, club/action/target selection, commit, next-player cover, reload and resume. Verified hidden hands are absent from the shared handoff DOM. Also exercised Read the lie, simultaneous reveal, two-player reaction passing and shot results at a repository-style /dist/ subpath. An independent source reviewer identified four issues (storage getter exceptions, focus loss, long-name wrapping and pickup labels); all four fixes were reviewed as resolved. The documenter agent was unavailable because of its usage limit, so design documentation was completed inline.

## Limits

Not yet verified on physical iPhone/Android hardware or a public GitHub Pages URL. The actual intro audio could not be reliably transcribed; the complete tutorial transcript and card photographs are the rules evidence. A full official card distribution was unavailable. The rule ledger explicitly discloses inferred mechanics.

Desktop responsive testing is not a substitute for physical-device PWA installation, offline eviction policies, or screen-reader testing. Core game behavior is tested independently of the DOM.


The browser completed a two-player one-hole game through two 1-Putts, the scorecard and shared-tie final results. The first automated scorecard click needed a retry; subsequent transition and final results succeeded without a console error.
