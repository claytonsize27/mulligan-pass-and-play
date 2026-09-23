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

Eight-card hands, three-hole quick round, rotating preparation order, conventional stroke-play scoring with shared ties. All players finish each hole. Exact landing or a 1-Putt within 25 yards finishes; overshoots play back toward the target. Twelve-shot cap prevents stalemates. These are disclosed house rules where evidence is incomplete.

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
- CPUs receive no opponent hand, hidden plan, seed or deck order. Discard identities are hidden from both humans and CPUs. Expert may reason from its own hand and the inferred deck catalogue. No paid AI or cloud computation.

## Latest refinements

Discard contents are no longer public to any player or CPU. Counts may be shown, but identities are absent from the rendered UI and CPU observation. CPU seats always get automatic difficulty names; duplicate names receive numbered suffixes, avoiding collisions with human names. Human names remain editable and are restored when switching a seat back from CPU.

Fixed round lengths generate fresh yardages and shuffled par order. Par distributions: 1 hole randomly par 3/4/5; 3 holes one each; 9 holes 2/5/2; 18 holes 4/10/4 with each nine independently 2/5/2. Custom scorecards are unchanged. Existing saves retain their original course and names.
