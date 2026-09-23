import test from "node:test";
import assert from "node:assert/strict";
import { createGame, transition, assertGame, COURSE, activePlayer } from "../src/engine.js";
import { cpuObservation, chooseCpuMove, LEVELS } from "../src/cpu.js";
import { courseScale } from "../src/course-view.js";
import { loadGame, SAVE_KEY } from "../src/storage.js";

test("course scale preserves proportional overshoots and positions behind tee", () => {
  const scale = courseScale(280, [-25, 280, 350, 400]);
  assert.ok(scale.at(-25) < scale.tee);
  assert.ok(scale.at(350) > scale.pin && scale.at(400) < 100);
  assert.ok(Math.abs((scale.at(350) - scale.pin) / (scale.at(400) - scale.pin) - 70/120) < 1e-9);
});
test("private deck, seed, opponent hand and locked plan cannot affect CPU decisions", () => {
  let s = createGame(["A", "B", "C"], COURSE, 42, ["expert", "normal", "hard"]);
  s = transition(s, { type: "OPEN" });
  s = transition(s, chooseCpuMove(cpuObservation(s), "expert"));
  s = transition(s, { type: "OPEN" });
  const modified = structuredClone(s);
  modified.deck.reverse(); modified.seed = 321;
  const opponent = modified.players[0];
  [opponent.hand[0], modified.deck[0]] = [modified.deck[0], opponent.hand[0]];
  const plan = modified.plans[0];
  [plan.club, modified.deck[1]] = [modified.deck[1], plan.club];
  assert.deepEqual(cpuObservation(s), cpuObservation(modified));
  for (const level of Object.keys(LEVELS)) assert.deepEqual(
    chooseCpuMove(cpuObservation(s), level, () => .3),
    chooseCpuMove(cpuObservation(modified), level, () => .3));
  assert.equal("seed" in cpuObservation(s), false);
  assert.equal("hand" in cpuObservation(s).players[0], false);
  assert.equal("deck" in cpuObservation(s), false);
});
test("legacy saves remain human games and new CPU settings survive reload", () => {
  const s = createGame(["A", "B"], COURSE, 2, ["human", "expert"]);
  const storage = { getItem: key => key === SAVE_KEY ? JSON.stringify(s) : null };
  assert.equal(loadGame(storage).state.players[1].controller, "expert");
  s.players.forEach(p => delete p.controller);
  assert.ok(loadGame(storage).state);
  assert.throws(() => createGame(["A", "B"], COURSE, 2, ["human", "cheat"]));
});
test("all four CPU levels complete finite 2–4 player 18-hole games; holes retain every card zone", () => {
  for (const level of Object.keys(LEVELS)) for (const n of [2,3,4]) {
    let s = createGame(Array.from({length:n}, (_,i) => `CPU ${i}`),
      [...COURSE, ...COURSE], 729 + n, Array(n).fill(level));
    let moves = 0, holes = 0;
    while (s.phase !== "finished") {
      assert.ok(++moves < 8000, `${level}/${n} stuck`);
      const before = structuredClone(s);
      const type = { reveal: "REACTIONS", results: "CONTINUE", score: "NEXT_HOLE" }[s.phase];
      const event = type ? {type} : chooseCpuMove(cpuObservation(s), activePlayer(s).controller, () => .47);
      s = transition(s, event);
      assertGame(s);
      if (s.hole !== before.hole) {
        holes++;
        assert.deepEqual(s.players.map(p => p.hand), before.players.map(p => p.hand));
        assert.deepEqual(s.deck, before.deck);
        assert.deepEqual(s.discard, before.discard);
        assert.equal(s.seed, before.seed);
        assert.equal(s.reshuffles, before.reshuffles);
      }
      if (s.phase === "results") assert.ok(s.players.every(p => p.hand.length === 8));
    }
    assert.equal(holes, 17);
    assert.ok(s.reshuffles > 0);
  }
});
