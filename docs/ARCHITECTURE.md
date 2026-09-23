# Architecture

The browser is the complete runtime. Static hosting sends files; it does not store games or execute game logic. This avoids database bills, cloud function cold starts, polling and vendor lock-in.

```mermaid
flowchart LR
  Pages[GitHub Pages static files] --> Browser[Phone browser / installed web app]
  Browser --> UI[app.js rendering and input]
  UI --> Engine[engine.js immutable transitions]
  Deck[cards.js 104-card catalogue] --> Engine
  Engine --> Check[Inventory and state validation]
  Check --> Save[Versioned localStorage]
  Check --> UI
  SW[Service worker app-shell cache] --> Browser
```

## Game state machine

```mermaid
stateDiagram-v2
  [*] --> Setup
  Setup --> Handoff: shuffle and deal
  Handoff --> Plan: owner opens hand
  Plan --> Borrow: spend Borrow
  Borrow --> Plan: take one card
  Plan --> Handoff: lock / next player
  Plan --> Reveal: last player locks
  Reveal --> ReactionHandoff: show all plans
  ReactionHandoff --> Reaction: owner opens
  Reaction --> Reaction: cancel action / cancellation
  Reaction --> ReactionHandoff: pass / next player
  Reaction --> Results: last reaction resolves all shots
  Results --> Handoff: unfinished players / next shot
  Results --> Scorecard: all players finished
  Scorecard --> Handoff: next hole / retain hands and piles
  Scorecard --> Finished: final hole
  Finished --> Setup: new round
```

The implementation reuses `handoff` with `stage` set to `plan`, `borrow`, or `reaction`. Covering, browser backgrounding, and loading a private save all go through this gate. Local draft selections are not committed game state and are cleared when covered.

## Card lifecycle

```mermaid
flowchart LR
  Draw[Draw pile] --> Hand[Private hand]
  Hand --> Plan[Locked club and action]
  Plan --> Discard[Discard pile]
  Hand --> Discard
  Discard -->|only when draw pile empty: shuffle| Draw
  Hand -->|Borrow transfers one existing card| Other[Other hand]
```

Every transition clones state, validates input, mutates only the clone, then asserts unique inventory. Invalid actions throw without changing the original save. One seed initializes a deterministic PRNG; its state travels with the save. Shuffling uses Fisher–Yates. Rendering never draws or randomizes anything.

## Resolution ordering

1. Resolve cancellation chains from newest to oldest.
2. For each active player independently, collect all live actions aimed at that player.
3. Putt within range ignores actions and finishes. Otherwise add yard adjustments, clamp distance to zero, halve per trap and sum penalty strokes.
4. Move toward the hole from the pre-shot position; exact arrival finishes. Overshoot is retained as a position beyond the hole.
5. Apply the twelve-shot pickup rule when needed.
6. Move both used cards per plan to discard. Refill each hand up to eight using the finite deck.
7. Save a shared result snapshot. Record scores only when all players finish.

## Persistence and privacy

`mulligan.house.v1` holds one round. Save writes are wrapped for quota/blocked-storage failures and surface a persistent warning. Invalid JSON, invalid state and unsupported versions show a recovery notice instead of crashing. A cross-tab storage event returns to the home screen with the newest covered save.

Do not treat localStorage as encrypted or adversarially secure. DOM handoff privacy prevents casual peeking only. Names never go to a server during play. Browser data clearing, private browsing policies and device loss can remove the round.

## Performance and updates

Small event-driven DOM rendering for at most four players and roughly 32 cards in hands. O(104) cloning and invariant checks are trivial at human turn speed. No animation loop or network requests per move. Build has zero compilation/package-install requirement. Browser-native system fonts avoid remote font requests.

Cache-first service worker versions the complete shell. Increment `CACHE` in `sw.js` on releases. New workers wait until existing clients close, avoiding a forced mid-round update. Save schema changes require a separate version/migration decision. Future official deck data can replace the catalogue without redesigning the rendering boundary.

## CPU information boundary

`cpuObservation` in `src/cpu.js` copies an explicit allowlist: own hand, public positions/scores, turn order, and revealed plans/cancellations during reactions. It never includes discard identities, shuffle seed, draw order, opponents’ hands or hidden locked plans. `chooseCpuMove` accepts only this projection and returns ordinary engine events. No CPU-only rule exceptions exist.

```mermaid
flowchart LR
  State[Full local game state] --> Projection[Public information + own hand]
  Projection --> CPU[Difficulty heuristic]
  CPU --> Event[Ordinary game event]
  Event --> Engine[Same validated engine as humans]
  Engine --> State
```

Easy evaluates legal shots and useful defensive Mulligans. Normal minimizes immediate landing cost and protects its own shot. Hard adds one-shot lookahead using retained cards, estimates opponents’ likely shots and evaluates cancellation chains. Expert excludes its own hand and remembered publicly revealed cards from the catalogue when estimating opponents’ options, and spends Mulligans on smaller worthwhile improvements. These are bounded heuristics, not guaranteed win rates or an online AI service. Preparation specials (Dig, Borrow, Read) are currently used only as club faces by CPUs; CPUs exchange an unplayable hand for the same one-stroke practice swing as humans.

CPU timers run only on their private turns, never display their hands, stop when hidden or leaving play, and resume when visible. Games with CPUs automatically advance shared reveal, results and scorecards, stopping at human private turns or the final result. Pause autoplay allows review. Work is bounded by eight cards and four targets, with cached opponent estimates per action/target; no background simulation, API or worker is needed.

The optional `controller` field is backward compatible: absent means human, preserving existing v1 saves. Current saves store one of human/easy/normal/hard/expert. The deck lifecycle changes at the next hole without discarding the current save. `course-view.js` computes a common proportional scale including positions beyond the pin and behind the tee.

## Randomized fixed-length courses

A new 1-hole round chooses par 3, 4 or 5. Three holes have one of each, shuffled. Nine holes have two par 3s, five par 4s and two par 5s, shuffled. Eighteen holes generate front and back nines independently with that same 2/5/2 distribution (par 36 each, par 72 total).

Each hole gets a random distance in five-yard steps: par 3 uses 125–225 yards, par 4 uses 275–450, and par 5 uses 475–600. These house ranges are within the [USGA par guidelines](https://www.usga.org/content/usga/home-page/handicapping/roh/Content/rules/Appendix%20F%20Establishing%20Par.htm); they are not an official course rating. Custom scorecards retain the existing 1–18 holes, 50–650 yard and par 3–6 validation.

Generation runs once when a new game is submitted. The resulting scorecard is saved with the game, so resume and reload never reroll holes. Existing saved rounds keep their course. `src/setup.js` owns generation and collision-safe CPU naming; its injectable random function supports repeatable tests without exposing the deck seed.

## Reversible reaction choices

CANCEL records the card ID, original hand index and `locked: false` on its cancellation entry. The real card stays in discard during the preview; reactions never draw, so it cannot be recycled before confirmation. UNDO_CANCEL pops only the current player's last unconfirmed entry and returns that exact card to its original hand position. Reverse-order undo keeps cancellation references valid. PASS locks the current player's entries before advancing or resolving. COVER and reload preserve the pending choices. Legacy saves without this optional metadata still load; pre-update Mulligans cannot be undone because their original card identity was not recorded. New choices in those saves are reversible. CPU observations strip undo metadata, exposing only public player/target cancellation information.

```mermaid
flowchart LR
  Reaction -->|CANCEL| Pending[Preview Mulligan]
  Pending -->|UNDO_CANCEL: return exact card| Reaction
  Pending -->|another CANCEL| Pending
  Pending -->|cover or reload| Covered[Covered pending choices]
  Covered -->|open| Pending
  Pending -->|PASS: lock choices| Next[Next player or resolve]
```

Result strings are generated from the final cancellation graph before locked plans clear. A live original action whose cancelling Mulligan was cancelled gets a restored annotation. A cancelled original gets a cancelled annotation, never a misleading restored label. Putt/practice immunity remains explicit.

CPU selector changes patch only dependent name fields and helper text. The native select DOM node remains mounted and receives no programmatic refocus.

## CPU tuning and automatic flow (23 September 2026)

New game names: Easy = Bobby Fairways; Normal (the requested Medium tier) = Grant Horvat; Hard = Bryson Dechambeau; Expert = Tiger Woods. Dropdown labels stay unchanged. Repeated names get numeric suffixes; human-name collisions are avoided. Existing saves retain names.

Relative design targets are 6/7/9/10, not externally calibrated ratings. Easy no longer plays random shots or randomly declines protection: all levels evaluate legal combinations and prioritize exact finishes. Normal adds limited planning and tactical targets; Hard weighs sabotage and reactions more strongly; Expert also evaluates next-shot club/action combinations and remembers public card sightings. CPU preparation specials remain club-only, as before.

`publicPlayed` contains only club/action cards from resolved, publicly revealed plans. No private discards, opponent hands or draw order enter this memory. It is cleared on discard recycling, conservatively forgetting prior sightings when cards may re-enter play. Old saves start with empty memory. The discard pile remains uninspectable. No API, paid AI or background training is used.

`flow.js` returns automatic transitions for shared reveal, results and hole scorecards whenever CPUs are involved. CPU turns run consecutively; human private planning/reactions, including undo, never auto-confirm. Human privacy handoffs remain explicit. Results/scorecards stay visible briefly (1.8 seconds); Pause autoplay stops advancement and CPU activity until resumed. Hidden tabs and Save & leave cancel timers. All-human games retain manual flow; all-CPU games can finish without clicks, stopping at final results.
