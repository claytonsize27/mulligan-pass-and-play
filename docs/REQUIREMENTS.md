# Consolidated requirements

| User requirement | Implementation / acceptance |
|---|---|
| Mobile phone application | Responsive browser app, standalone manifest, touch controls and safe-area padding |
| Shared phone for 2–4 players | Named player setup, privacy handoffs, hands absent from shared views |
| Learn official game from site and videos | Source research ledger, full tutorial transcript, photographed card examples; intro transcript limitation disclosed |
| Preserve core gameplay | Dual-use physical cards, club/action/target planning, simultaneous reveal and movement |
| Finite deck with reshuffling | 104 unique instances; inventory assertion on every move; discard recycling only on exhaustion |
| Infer missing deck information | Explicit deterministic house-deck counts/pairings, never represented as official |
| Free cloud hosting | Static output and GitHub Pages workflow, public repository / default domain; account connection needed to publish |
| Efficient, future-friendly | No runtime dependencies; pure engine separate from DOM; deterministic seed; versioned saves; no background compute |
| Standalone use | Offline shell cache, home-screen metadata; browser retains save locally |
| Minimal user input | Stack, UI, house rules and fictional sample course chosen autonomously; only external-account access can block publishing |
| Documentation / flowcharts | README, rules provenance, requirements, architecture Mermaid, deployment and validation |

## Chosen defaults

Eight-card hands, three-hole quick round, golf preparation order, conventional stroke-play scoring with shared ties. All players finish each hole. Exact landing or a 1-Putt within 25 yards finishes; overshoots play back toward the target. Twelve-shot cap prevents stalemates. These are disclosed house rules where evidence is incomplete.

## Deliberately outside this request

Online multiplayer, paid hosting, accounts, cloud saves, cloud AI services, a native app-store binary, course APIs and official asset duplication. The pass-and-play requirement does not need any of these.

## Acceptance checks

Full simulated rounds finish for every player count; cards remain conserved across every transition. Mobile UI supports setup, plan, reveal, reactions and scorecard. Refresh covers hands and preserves the committed state. Build includes only public files, and relative URLs support repository subpaths.

## User refinements (22 September 2026)

- Player N labels are placeholders; typed values start empty. Blank names fall back to unique seat labels, with duplicate-name validation unchanged.
- All course lanes use one yard scale. Overshoots extend beyond the flag and label yards past the hole; backward overshoots can extend behind the tee.
- Every planned action includes its brief effect description on reveal and reactions; cancelled actions remain labelled cancelled.
- Hands, deck order and discards persist across holes. Refill to eight after resolution. Recycle only currently discarded cards on draw exhaustion, never held or committed cards.
- Each of 2–4 seats selects Human, Easy CPU, Normal CPU, Hard CPU or Expert CPU. Any mix, including all CPUs, is supported.
- CPUs receive no opponent hand, hidden plan, seed or deck order. Discard identities are hidden from both humans and CPUs. Expert may reason from its own hand, remembered publicly revealed cards and the inferred deck catalogue. No paid AI or cloud computation.

## Latest refinements

Discard contents are no longer public to any player or CPU. Counts may be shown, but identities are absent from the rendered UI and CPU observation. CPU seats always get automatic difficulty names; duplicate names receive numbered suffixes, avoiding collisions with human names. Human names remain editable and are restored when switching a seat back from CPU.

Fixed round lengths generate fresh yardages and shuffled par order. Par distributions: 1 hole randomly par 3/4/5; 3 holes one each; 9 holes 2/5/2; 18 holes 4/10/4 with each nine independently 2/5/2. Custom scorecards are unchanged. Existing saves retain their original course and names.

## Reaction and mobile-selector refinements (23 September 2026)

Changing a seat type updates its name/read-only state and description without replacing or refocusing the native select. This avoids reopening the mobile picker. During reactions, Undo last Mulligan reverses the current player's unconfirmed choices in reverse order, including a Mulligan aimed at another Mulligan. Passing or finishing reactions locks those choices. Covers, saves and reloads do not confirm them. Shot results label restored actions beside the original action and distinguish actions still cancelled or ignored by a putt/practice swing.

## CPU tuning and automatic flow (23 September 2026)

New game names: Easy = Bobby Fairways; Normal (the requested Medium tier) = Grant Horvat; Hard = Bryson Dechambeau; Expert = Tiger Woods. Dropdown labels stay unchanged. Repeated names get numeric suffixes; human-name collisions are avoided. Existing saves retain names.

Relative design targets are 6/7/9/10, not externally calibrated ratings. Easy no longer plays random shots or randomly declines protection: all levels evaluate legal combinations and prioritize exact finishes. Normal adds limited planning and tactical targets; Hard weighs sabotage and reactions more strongly; Expert also evaluates next-shot club/action combinations and remembers public card sightings. CPU preparation specials remain club-only, as before.

`publicPlayed` contains only club/action cards from resolved, publicly revealed plans. No private discards, opponent hands or draw order enter this memory. It is cleared on discard recycling, conservatively forgetting prior sightings when cards may re-enter play. Old saves start with empty memory. The discard pile remains uninspectable. No API, paid AI or background training is used.

`flow.js` returns automatic transitions only for shared reveal and results, only when autoplay is enabled and every human has finished the current hole. Hole scorecards never auto-advance. CPU turns run consecutively; human private planning/reactions, including undo, never auto-confirm. Human privacy handoffs remain explicit. Results/scorecards stay visible briefly (1.8 seconds); Pause autoplay stops shared-screen advancement but never stops CPU planning or reactions. Hidden tabs and Save & leave cancel timers. All-human games retain manual flow; all-CPU games advance shots automatically but still wait at each Hole Complete screen.

## Autoplay correction

All Cards on the Table and Swing Together require manual clicks while any human has not finished the hole. Once all humans are done (including pickup at the shot limit), autoplay may skip those two screens. Hole Complete always requires Next Hole, or See final results on the final hole, even with no human seats. Turning autoplay off never suspends CPU decisions: private CPU planning and reaction phases remain scheduled automatically. Timers still stop when the page is hidden or the user leaves the game.

## Golf order and live reaction projection

First hole tee order is seat order (Player 1 first). Later tee shots sort by the immediately preceding hole's strokes, lowest first. Tied scores preserve previous tee order. After the first shot, unfinished players sort by absolute remaining distance, farthest first, including overshoots; equal distances preserve the preceding shot order. Reactions use the shot's same fixed order, even when previewed outcomes change. Existing in-progress turns retain their order until the next planning boundary; old saves without tee-order metadata fall back to seat order for ties.

Reaction screens show both the current numbered ball and a separate P marker for the projected landing, on a shared scale that includes all current and projected positions. Per-player text shows projected remaining distance, total strokes, penalties and holed/picked-up status. Preview refreshes on every Mulligan and undo. It describes the current choices; later reactions may change them.

`previewShots` runs the same `resolveShots` calculation used by real resolution on a cloned state, only after public reveal. It does not refill hands, consume cards, change the live PRNG, write scores or save state. Only the real resolver performs those operations. The tee order is optional backward-compatible save metadata.

- Reaction course preview defaults collapsed each turn, summarizing the active player's projected yardage and total strokes. View course expands it; Mulligan, counter-Mulligan, and undo update both summary and full preview while preserving the current expansion choice.
