# Rules and research ledger

Research date: 22 September 2026. This is an independent **house edition**, not a claim of complete official fidelity. Original game by Jake Van Slooten and Cory Meyer; published by Eagle-Gryphon Games. Original artwork is not included.

## Sources inspected

- [Official game site](https://mulligancardgame.com/): two to four players, golf distances, action targeting, arbitrary course scorecards.
- [Official gameplay tutorial, 3:26](https://www.youtube.com/watch?v=GpVoduxbgHQ): full English transcript reviewed; browser playback inspected. The video covers dual-function cards, private club/action/target preparation, simultaneous reveal, action effects, refill, and play-anytime cards.
- [Official intro, 1:04](https://www.youtube.com/watch?v=FUNdEoj1zfA): opened in the site's player and on YouTube. The extracted transcript was corrupted/unrelated Korean text and was not used as rules evidence. This is not a claim that its audio was successfully understood.
- [Publisher product page](https://www.eagle-gryphon.com/products/mulligan-the-golf-card-game): confirms **104 Club/Action cards**, 16 targeting cards, four guides and four yardage boards.
- [Publisher component photo](https://www.eagle-gryphon.com/cdn/shop/files/102302-5.jpg?v=1747772587) and the official site's [club photo](https://mulligancardgame.com/assets/pick_U6UDgv_LCrAsZovuHFltv.png) and [action photo](https://mulligancardgame.com/assets/sabotage_u_tieZW9_65aFDEd7l9Ry.png): read visible card faces.
- [BoardGameGeek listing](https://boardgamegeek.com/boardgame/334073/mulligan-the-golf-card-game): no rule files listed when inspected. Additional web searches did not locate a complete card manifest.

Research extracts and reference photos are kept locally in ignored `.firecrawl/`; none are deployed.

## Verified vs reconstructed

| Item | Evidence | Implemented behavior |
|---|---|---|
| 2–4 players | Official site | Two to four named players |
| Dual-function cards | Tutorial | One card can be either its club face or its action face, never both in a shot |
| Club + action + target | Tutorial | Two physical cards plus a target selection; targeting cards become reusable controls |
| Simultaneous shots | Tutorial | Private sequential planning followed by simultaneous resolution |
| Driver 300 yd, first shot only | Photos | Enforced |
| Hybrid 200, Pitching wedge 100, Lob wedge 50 | Photos | Enforced |
| 1-Putt within 25 yd; action-proof | Action photo | Finishes from at most 25 yd and ignores all incoming actions |
| Rough −50 yd; Sand trap halves distance | Tutorial | Enforced |
| Slice −25 yd; Out of bounds +2 strokes | Photos | Enforced |
| Hook increases distance | Tutorial's 280-yard example | Exact +25 value inferred |
| Fairway wood and Iron | Wood named in tutorial | 250 and 150 yd inferred |
| Dig through the bag | Component photo | Discard selected other cards and draw replacements, including the spent Dig card; replacement timing inferred |
| Borrow a club | Component photo | Spend Borrow, inspect another hand and take one card; opponent replacement inferred |
| Reveal/cancel abilities | Tutorial | House cards Read the lie and Mulligan implement these concepts; names/details not fully verified |
| Clear fairway | No source | House neutral action ensuring non-sabotage choices |
| Deck total | Publisher | 104 finite uniquely identified cards |
| Frequencies and pairings | Not published in inspected material | Reconstructed table below |
| Hand size | Not settled by inspected evidence | Eight, refilled after each shot |
| Hole completion / scoring | Not fully covered by tutorial | Exact landing or 1-Putt; all players finish; lowest aggregate strokes wins, ties shared |
| Overshoot | Not established | Next shot aims back toward hole; remaining distance is absolute difference |
| Stacking | Not established | Sum yard changes, clamp at zero, halve once per Sand trap; penalties additive |
| Reaction timing | Physical game says anytime | Each player gets one ordered window after reveal; multiple cancellations allowed; later windows can cancel earlier cancellations |
| Safety limit | House rule | After 12 simultaneous shots, unfinished players score at least par +8 |

The source markets a race to the hole. This app chooses conventional aggregate stroke play because complete official scoring was unavailable. The public reveal shows every active player's shot at once; selecting earlier on the shared phone never moves the ball early. Preparation order rotates each shot to distribute information advantages. Read the lie only reveals already locked shots.

## Exact house deck

Clubs: Driver 12; Fairway wood 12; Hybrid 16; Iron 16; Pitching wedge 16; Lob wedge 16; 1-Putt 16. Total **104**.

Other faces: Rough 16; Slice 16; Hook 12; Sand trap 12; Out of bounds 8; Clear fairway 16; Dig 8; Borrow 4; Read the lie 4; Mulligan 8. Total **104**.

The two lists are expanded in order; club index `i` pairs with action index `(i * 37) % 104`. Since 37 and 104 are coprime, every action occurrence is used exactly once. Pairings are deterministic, inferred, and editable in `src/cards.js`.

Every physical card belongs to exactly one zone: draw pile, player hand, locked plan, or discard pile. Playing a face spends the entire card. Cancellation never returns an action card to its owner. Discards are Fisher–Yates shuffled only when the draw pile runs out. Hands, the draw pile and the discard pile persist across holes. Only starting a new game gathers, shuffles and deals all 104 cards. This deck lifecycle follows the user’s explicit clarification. No unlimited card spawning. The first seed comes from browser cryptographic randomness; a stored PRNG state makes reloads deterministic.

## Pass-and-play adaptations

- Preparation specials must be used before locking. Gold special faces cannot fill the action slot.
- Borrow is spent before a target hand is shown. The choice must finish before planning resumes.
- Read the lie spends a real card before displaying a locked plan.
- Mulligan cancels one action or a prior Mulligan. Before passing or finishing reactions, undo your latest Mulligan to return its exact card to your hand; repeat to undo earlier choices in your turn. Passing locks the choices. Resolve the cancellation chain in reverse order, then apply active actions. Results identify restored or cancelled actions.
- A practice swing exchanges the entire hand for one stroke and uses the player's shot opportunity. It solves otherwise unplayable hands without an endless free refresh.
- Finished players sit out the remaining shots. Actions may target only active players. Borrow may take an unplayed card from any other player's retained hand.
- Fixed-length rounds generate randomized fictional courses as described below. Enter real scorecard yardages and pars manually for any 1–18-hole course within the supported 50–650 yd range.

## Future official fidelity

Replace inferred frequencies, pairings and uncertain effects when a complete authorized rulebook or deck manifest is available. Keep the independent label until all divergences are reconciled. Any change affecting saved state needs a version increment and explicit migration or a fresh-round notice.

## Randomized fixed-length courses

A new 1-hole round chooses par 3, 4 or 5. Three holes have one of each, shuffled. Nine holes have two par 3s, five par 4s and two par 5s, shuffled. Eighteen holes generate front and back nines independently with that same 2/5/2 distribution (par 36 each, par 72 total).

Each hole gets a random distance in five-yard steps: par 3 uses 125–225 yards, par 4 uses 275–450, and par 5 uses 475–600. These house ranges are within the [USGA par guidelines](https://www.usga.org/content/usga/home-page/handicapping/roh/Content/rules/Appendix%20F%20Establishing%20Par.htm); they are not an official course rating. Custom scorecards retain the existing 1–18 holes, 50–650 yard and par 3–6 validation.

Generation runs once when a new game is submitted. The resulting scorecard is saved with the game, so resume and reload never reroll holes. Existing saved rounds keep their course. `src/setup.js` owns generation and collision-safe CPU naming; its injectable random function supports repeatable tests without exposing the deck seed.

## CPU tuning and automatic flow (23 September 2026)

New game names: Easy = Bobby Fairways; Normal (the requested Medium tier) = Grant Horvat; Hard = Bryson Dechambeau; Expert = Tiger Woods. Dropdown labels stay unchanged. Repeated names get numeric suffixes; human-name collisions are avoided. Existing saves retain names.

Relative design targets are 6/7/9/10, not externally calibrated ratings. Easy no longer plays random shots or randomly declines protection: all levels evaluate legal combinations and prioritize exact finishes. Normal adds limited planning and tactical targets; Hard weighs sabotage and reactions more strongly; Expert also evaluates next-shot club/action combinations and remembers public card sightings. CPU preparation specials remain club-only, as before.

`publicPlayed` contains only club/action cards from resolved, publicly revealed plans. No private discards, opponent hands or draw order enter this memory. It is cleared on discard recycling, conservatively forgetting prior sightings when cards may re-enter play. Old saves start with empty memory. The discard pile remains uninspectable. No API, paid AI or background training is used.

`flow.js` returns automatic transitions only for shared reveal and results, only when autoplay is enabled and every human has finished the current hole. Hole scorecards never auto-advance. CPU turns run consecutively; human private planning/reactions, including undo, never auto-confirm. Human privacy handoffs remain explicit. Results/scorecards stay visible briefly (1.8 seconds); Pause autoplay stops shared-screen advancement but never stops CPU planning or reactions. Hidden tabs and Save & leave cancel timers. All-human games retain manual flow; all-CPU games advance shots automatically but still wait at each Hole Complete screen.

## Autoplay correction

All Cards on the Table and Swing Together require manual clicks while any human has not finished the hole. Once all humans are done (including pickup at the shot limit), autoplay may skip those two screens. Hole Complete always requires Next Hole, or See final results on the final hole, even with no human seats. Turning autoplay off never suspends CPU decisions: private CPU planning and reaction phases remain scheduled automatically. Timers still stop when the page is hidden or the user leaves the game.
