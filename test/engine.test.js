import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  transition as move,
  assertGame,
  activePlayer,
  legalClub,
  remaining,
  liveEffects,
  previewShots,
} from "../src/engine.js";
import { CARDS, CARD_BY_ID, ACTIONS } from "../src/cards.js";
import { loadGame, saveGame, SAVE_KEY } from "../src/storage.js";
const newGame = (n = 2) =>
  createGame(
    Array.from({ length: n }, (_, i) => `Player ${i + 1}`),
    [{ name: "Test", yards: 280, par: 4 }],
    12345,
  );
// Move actual cards between zones; never conjure test cards.
function give(s, player, predicate) {
  const id = s.deck.find((id) => predicate(CARD_BY_ID[id]));
  assert.ok(id);
  const p = s.players[player];
  s.deck.splice(s.deck.indexOf(id), 1);
  p.hand.push(id);
  return id;
}
function emptyHands(s) {
  for (const p of s.players) {
    s.deck.push(...p.hand);
    p.hand = [];
  }
}
function setupShot(clubs, actions, targets, positions = [0, 0]) {
  let s = newGame(clubs.length);
  emptyHands(s);
  for (let i = 0; i < clubs.length; i++) {
    s.players[i].position = positions[i];
    give(s, i, (c) => c.club === clubs[i]);
    give(
      s,
      i,
      (c) => c.action === actions[i] && !s.players[i].hand.includes(c.id),
    );
  }
  for (let i = 0; i < clubs.length; i++) {
    s = move(s, { type: "OPEN" });
    const p = activePlayer(s);
    s = move(s, {
      type: "COMMIT",
      club: p.hand[0],
      action: p.hand[1],
      target: targets[i],
    });
  }
  return s;
}
function resolve(s) {
  s = move(s, { type: "REACTIONS" });
  while (s.phase !== "results") {
    s = move(s, { type: "OPEN" });
    s = move(s, { type: "PASS" });
  }
  return s;
}
test("104 unique dual cards, reproducible shuffle and correct dealing for 2–4 players", () => {
  assert.equal(CARDS.length, 104);
  assert.equal(new Set(CARDS.map((c) => c.id)).size, 104);
  for (let n = 2; n <= 4; n++) {
    const s = newGame(n);
    assertGame(s);
    assert.equal(s.deck.length, 104 - 8 * n);
    assert.deepEqual(s, newGame(n));
  }
});
test("validates names, course and player count", () => {
  assert.throws(() => createGame(["A"]));
  assert.throws(() => createGame(["A", " a "]));
  assert.throws(() => createGame(["A", "B"], [{ yards: NaN, par: 4 }]));
  assert.throws(() => createGame(["A", "B"], [{ yards: 700, par: 4 }]));
});
test("card cannot be committed as both faces; anytime cannot be a planned action", () => {
  let s = move(newGame(), { type: "OPEN" });
  const p = activePlayer(s),
    club = p.hand.find((id) => legalClub(s, p, id));
  assert.throws(() =>
    move(s, { type: "COMMIT", club, action: club, target: 0 }),
  );
  const special = give(s, p.id, (c) => ACTIONS[c.action].anytime);
  assert.throws(() =>
    move(s, { type: "COMMIT", club, action: special, target: 0 }),
  );
});
test("secret commits remove cards; final player causes shared reveal without movement", () => {
  let s = setupShot(["driver", "hybrid"], ["rough", "sand"], [1, 0]);
  assert.equal(s.phase, "reveal");
  assert.equal(s.players[0].position, 0);
  assert.equal(Object.keys(s.plans).length, 2);
  assertGame(s);
  s = resolve(s);
  assert.equal(s.players[0].position, 150);
  assert.equal(s.players[1].position, 150);
  assert.equal(s.players[0].hand.length, 8);
});
test("modifiers add first then sand halves, independent of seat order", () => {
  const s = resolve(
    setupShot(
      ["hybrid", "hybrid", "hybrid"],
      ["rough", "hook", "sand"],
      [0, 0, 0],
      [0, 0, 0],
    ),
  );
  assert.equal(s.results[0].distance, 87.5);
});
test("putt finishes within 25 yards and ignores distance and penalty actions", () => {
  const s = resolve(
    setupShot(["putt", "hybrid"], ["sand", "bounds"], [0, 0], [260, 0]),
  );
  assert.equal(s.players[0].position, 280);
  assert.equal(s.players[0].done, true);
  assert.equal(s.players[0].strokes, 1);
});
test("exact landing finishes; overshoot plays back toward hole", () => {
  let s = setupShot(
    ["lob", "driver"],
    ["fairway", "fairway"],
    [0, 1],
    [230, 0],
  );
  s = resolve(s);
  assert.equal(s.players[0].done, true);
  assert.equal(remaining(s, s.players[1]), 20);
  assert.equal(s.players[1].done, false);
  assert.equal(
    legalClub(s, s.players[1], CARDS.find((c) => c.club === "driver").id),
    false,
  );
});
test("out of bounds adds two strokes without erasing shot distance", () => {
  let s = resolve(
    setupShot(["hybrid", "hybrid"], ["bounds", "fairway"], [1, 1]),
  );
  assert.equal(s.players[1].strokes, 3);
  assert.equal(s.players[1].position, 200);
});
test("cancellation chains restore original effect and conserve cards", () => {
  let s = setupShot(["hybrid", "hybrid"], ["rough", "fairway"], [0, 1]);
  const m0 = give(s, 0, (c) => c.action === "mulligan"),
    m1 = give(s, 1, (c) => c.action === "mulligan");
  s = move(s, { type: "REACTIONS" });
  s = move(s, { type: "OPEN" });
  s = move(s, { type: "CANCEL", card: m0, target: "a0" });
  assert.ok(liveEffects(s).has("a0"));
  s = move(s, { type: "PASS" });
  s = move(s, { type: "OPEN" });
  s = move(s, { type: "CANCEL", card: m1, target: "x0" });
  assert.ok(!liveEffects(s).has("a0"));
  s = move(s, { type: "PASS" });
  assert.ok(s.publicPlayed.length >= 4);
  assert.equal(s.players[0].position, 150);
  assert.ok(s.results[0].effects.some(e => e.includes("Rough (restored:")));
  assertGame(s);
});

test("reaction Mulligans undo in reverse order, restore exact cards, and lock on pass", () => {
  let s = setupShot(["hybrid", "hybrid"], ["rough", "fairway"], [0, 1]);
  const first = give(s, 0, c => c.action === "mulligan");
  const second = give(s, 0, c => c.action === "mulligan");
  const other = give(s, 1, c => c.action === "mulligan");
  s = move(move(s, {type:"REACTIONS"}), {type:"OPEN"});
  const original = structuredClone(s);
  s = move(s, {type:"CANCEL", card:first, target:"a0"});
  s = move(s, {type:"CANCEL", card:second, target:"x0"});
  assert.equal(liveEffects(s).has("a0"), false);
  // Cover and reload retain pending choices without prematurely confirming them.
  s = move(s, {type:"COVER"});
  s = loadGame({getItem: () => JSON.stringify(s)}).state;
  assert.throws(() => move(s, {type:"UNDO_CANCEL"}));
  s = move(s, {type:"OPEN"});
  s = move(s, {type:"UNDO_CANCEL"});
  assert.ok(liveEffects(s).has("a0"));
  assert.ok(s.players[0].hand.includes(second));
  s = move(s, {type:"UNDO_CANCEL"});
  assert.deepEqual(s.players[0].hand, original.players[0].hand);
  assert.deepEqual(s.discard, original.discard);
  assert.deepEqual(s.deck, original.deck);
  assert.equal(s.seed, original.seed);
  assert.throws(() => move(s, {type:"UNDO_CANCEL"}));
  s = move(s, {type:"CANCEL", card:first, target:"a0"});
  s = move(move(s, {type:"PASS"}), {type:"OPEN"});
  assert.throws(() => move(s, {type:"UNDO_CANCEL"}));
  s = move(s, {type:"CANCEL", card:other, target:"x0"});
  s = move(s, {type:"UNDO_CANCEL"});
  assert.ok(liveEffects(s).has("a0"));
  s = move(s, {type:"PASS"});
  assert.throws(() => move(s, {type:"UNDO_CANCEL"}));
  assert.equal(s.players[0].position, 200);
  assert.ok(s.results[0].effects.some(e => e.includes("Rough (cancelled by Mulligan)")));
  assert.ok(!s.results[0].effects.some(e => e.includes("restored:")));
  assertGame(s);
});

test("three-deep Mulligan chain reports cancelled, not restored", () => {
  let s = setupShot(["hybrid", "hybrid"], ["rough", "fairway"], [0, 1]);
  const cards = Array.from({length:3}, () => give(s, 0, c => c.action === "mulligan"));
  s = move(move(s, {type:"REACTIONS"}), {type:"OPEN"});
  for (let i = 0; i < 3; i++) s = move(s, {type:"CANCEL", card:cards[i], target:i ? `x${i-1}` : "a0"});
  s = move(s, {type:"PASS"});
  s = move(move(s, {type:"OPEN"}), {type:"PASS"});
  assert.equal(s.players[0].position, 200);
  assert.ok(!s.results[0].effects.some(e => e.includes("restored:")));
});
test("borrowing spends before revealing and preserves finite inventory", () => {
  let s = move(newGame(), { type: "OPEN" });
  const id = give(s, 0, (c) => c.action === "borrow");
  s = move(s, { type: "BORROW", card: id, target: 1 });
  assert.equal(s.phase, "borrow");
  assert.ok(s.discard.includes(id));
  const take = s.players[1].hand[0];
  s = move(s, { type: "TAKE", card: take });
  assert.ok(s.players[0].hand.includes(take));
  assert.ok(!s.players[1].hand.includes(take));
  assertGame(s);
});
test("dig recycles actual discard when deck is empty", () => {
  let s = move(newGame(), { type: "OPEN" });
  const id = give(s, 0, (c) => c.action === "dig");
  s.discard.push(...s.deck);
  s.deck = [];
  s.publicPlayed = [s.discard[0]];
  s = move(s, { type: "ANYTIME", card: id, cards: [s.players[0].hand[0]] });
  assert.equal(s.reshuffles, 1);
  assert.deepEqual(s.publicPlayed, []);
  assertGame(s);
});
test("save restore covers private hands; corrupt save and quota failures are handled", () => {
  let raw;
  const store = {
    getItem: () => raw,
    setItem: (k, v) => {
      assert.equal(k, SAVE_KEY);
      raw = v;
    },
  };
  let s = move(newGame(), { type: "OPEN" });
  assert.equal(saveGame(s, store), true);
  assert.equal(loadGame(store).state.phase, "handoff");
  raw = "bad";
  assert.ok(loadGame(store).error);
  assert.equal(
    saveGame(s, {
      setItem() {
        throw new Error("Quota");
      },
    }),
    false,
  );
});
test("damaged inventory rejected", () => {
  const s = newGame();
  s.deck[0] = s.deck[1];
  assert.throws(() => assertGame(s));
});
test("12-shot cap records pickup separately from a holed ball", () => {
  let s = setupShot(["lob", "lob"], ["fairway", "fairway"], [0, 1]);
  s.round = 12;
  s = resolve(s);
  assert.equal(s.players[0].pickedUp, true);
  assert.equal(s.players[0].strokes, 12);
  assert.equal(s.players[0].done, true);
});
test("denied localStorage getter does not crash startup", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("Access denied");
    },
  });
  try {
    assert.equal(saveGame(newGame()), false);
    assert.ok(loadGame().error);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});
test("simulation: complete 2–4 player, 18-hole games without deadlock or card loss", () => {
  for (let n = 2; n <= 4; n++)
    for (let seed = 1; seed <= 8; seed++) {
      let s = createGame(
        Array.from({ length: n }, (_, i) => `P${i}`),
        Array.from({ length: 18 }, (_, i) => ({ yards: 100 + i * 25, par: 4 })),
        seed,
      );
      let steps = 0;
      while (s.phase !== "finished" && steps++ < 5000) {
        switch (s.phase) {
          case "handoff":
            s = move(s, { type: "OPEN" });
            break;
          case "plan": {
            const p = activePlayer(s);
            const options = p.hand
              .filter((id) => legalClub(s, p, id))
              .sort(
                (a, b) =>
                  Math.abs(
                    remaining(s, p) -
                      (CARD_BY_ID[a].club === "putt"
                        ? remaining(s, p)
                        : {
                            driver: 300,
                            wood: 250,
                            hybrid: 200,
                            iron: 150,
                            wedge: 100,
                            lob: 50,
                          }[CARD_BY_ID[a].club]),
                  ) -
                  Math.abs(
                    remaining(s, p) -
                      (CARD_BY_ID[b].club === "putt"
                        ? remaining(s, p)
                        : {
                            driver: 300,
                            wood: 250,
                            hybrid: 200,
                            iron: 150,
                            wedge: 100,
                            lob: 50,
                          }[CARD_BY_ID[b].club]),
                  ),
              );
            const club = options.find((id) =>
              p.hand.some(
                (a) => a !== id && !ACTIONS[CARD_BY_ID[a].action].anytime,
              ),
            );
            const action = p.hand.find(
              (id) => id !== club && !ACTIONS[CARD_BY_ID[id].action].anytime,
            );
            s =
              club && action
                ? move(s, { type: "COMMIT", club, action, target: p.id })
                : move(s, { type: "REST" });
            break;
          }
          case "reveal":
            s = move(s, { type: "REACTIONS" });
            break;
          case "reaction":
            s = move(s, { type: "PASS" });
            break;
          case "results":
            s = move(s, { type: "CONTINUE" });
            break;
          case "score":
            s = move(s, { type: "NEXT_HOLE" });
            break;
        }
        assertGame(s);
      }
      assert.equal(s.phase, "finished");
      for (const p of s.players) assert.equal(p.scores.length, 18);
    }
});


test("tee honours use previous-hole scores with stable ties; later shots are farthest first", () => {
  let s = createGame(["A", "B", "C", "D"], [{yards:280,par:4},{yards:350,par:4},{yards:150,par:3}], 43);
  assert.deepEqual(s.order, [0,1,2,3]);
  s.phase = "score";
  [5,3,4,3].forEach((score,i) => {s.players[i].scores=[score];s.players[i].done=true;});
  s = move(s, {type:"NEXT_HOLE"});
  assert.deepEqual(s.order, [1,3,2,0]);
  s.phase = "results";
  [300,450,250,350].forEach((position,i) => s.players[i].position=position);
  s.players[3].done=true;
  s = move(s, {type:"CONTINUE"});
  // 1 overshot by 100; 2 is short by 100; 0 is short by 50. Ties retain order.
  assert.deepEqual(s.order, [1,2,0]);
  s.phase = "reveal";
  s = move(s, {type:"REACTIONS"});
  assert.deepEqual(s.order, [1,2,0]);
  s.phase = "score";
  s.players.forEach(p => {p.done=true;p.scores.push(4);});
  s = move(s, {type:"NEXT_HOLE"});
  assert.deepEqual(s.order, [1,3,2,0]);
});

test("shot preview is pure, matches resolution, and updates on Mulligan and undo", () => {
  let s = setupShot(["hybrid", "hybrid"], ["rough", "sand"], [0, 0]);
  const card = give(s, 0, c => c.action === "mulligan");
  const before = structuredClone(s);
  const initial = previewShots(s);
  assert.deepEqual(s, before);
  assert.equal(initial.players[0].position, 75);
  s = move(move(s, {type:"REACTIONS"}), {type:"OPEN"});
  s = move(s, {type:"CANCEL", card, target:"a0"});
  assert.equal(previewShots(s).players[0].position, 100);
  s = move(s, {type:"UNDO_CANCEL"});
  assert.deepEqual(previewShots(s), initial);
  const predicted = previewShots(s);
  while (s.phase !== "results") s = move(s, {type:s.phase === "handoff" ? "OPEN" : "PASS"});
  assert.deepEqual(s.results, predicted.results);
  for (const p of s.players) for (const key of ["position","strokes","shots","done","pickedUp"])
    assert.equal(p[key], predicted.players[p.id][key]);
  assert.throws(() => previewShots(newGame()));
});

test("preview includes overshoots, putt immunity and penalty strokes", () => {
  for (const s of [
    setupShot(["driver","hybrid"],["fairway","bounds"],[0,0]),
    setupShot(["putt","hybrid"],["fairway","bounds"],[0,0],[260,0]),
  ]) {
    const preview = previewShots(s);
    const actual = resolve(s);
    assert.deepEqual(preview.results, actual.results);
    assert.equal(preview.players[0].position, actual.players[0].position);
    assert.equal(preview.players[0].strokes, actual.players[0].strokes);
  }
});
