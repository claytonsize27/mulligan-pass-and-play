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
  Scorecard --> Handoff: next hole / gather, shuffle, deal
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
