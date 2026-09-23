import test from "node:test";
import assert from "node:assert/strict";
import { generateCourse, YARD_RANGES, playerNames } from "../src/setup.js";
import { createGame, transition } from "../src/engine.js";
import { cpuObservation, chooseCpuMove, LEVELS } from "../src/cpu.js";
import { loadGame } from "../src/storage.js";

const counts = course => [3, 4, 5].map(par => course.filter(h => h.par === par).length);
test("generated courses obey exact par mixes on each nine and yardage bounds", () => {
  let seed = 8723;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const singlePars = new Set(), layouts = new Set();
  for (let run = 0; run < 200; run++) for (const length of [1, 3, 9, 18]) {
    const course = generateCourse(length, random);
    assert.equal(course.length, length);
    if (length === 1) singlePars.add(course[0].par);
    if (length === 3) assert.deepEqual(counts(course), [1, 1, 1]);
    if (length === 9) assert.deepEqual(counts(course), [2, 5, 2]);
    if (length === 18) {
      assert.deepEqual(counts(course), [4, 10, 4]);
      assert.deepEqual(counts(course.slice(0, 9)), [2, 5, 2]);
      assert.deepEqual(counts(course.slice(9)), [2, 5, 2]);
      layouts.add(JSON.stringify(course));
    }
    for (const h of course) {
      assert.ok(h.yards >= YARD_RANGES[h.par][0] && h.yards <= YARD_RANGES[h.par][1]);
      assert.equal(h.yards % 5, 0);
    }
    createGame(["A", "B"], course, 42);
  }
  assert.equal(singlePars.size, 3);
  assert.equal(layouts.size, 200);
  assert.throws(() => generateCourse(4));
});
test("CPU names are automatic, unique and do not replace human names", () => {
  assert.deepEqual(playerNames(["Alex", "old name", "", ""], ["human", "normal", "normal", "expert"]),
    ["Alex", "CPU - Normal", "CPU - Normal 2", "CPU - Expert"]);
  assert.deepEqual(playerNames(["CPU - Easy", "", ""], ["human", "easy", "easy"]),
    ["CPU - Easy", "CPU - Easy 2", "CPU - Easy 3"]);
  assert.deepEqual(playerNames(["", "Sam"], ["human", "human"]), ["Player 1", "Sam"]);
});
test("discard contents cannot affect CPU observations or choices at any difficulty", () => {
  let s = transition(createGame(["A", "B"], undefined, 57), {type:"OPEN"});
  s.discard.push(s.deck.pop(), s.deck.pop());
  const altered = structuredClone(s);
  [altered.discard[0], altered.deck[0]] = [altered.deck[0], altered.discard[0]];
  assert.deepEqual(cpuObservation(s), cpuObservation(altered));
  assert.equal("discard" in cpuObservation(s), false);
  for (const level of Object.keys(LEVELS)) assert.deepEqual(
    chooseCpuMove(cpuObservation(s), level, () => .4),
    chooseCpuMove(cpuObservation(altered), level, () => .4));
});
test("generated courses stay fixed on restore; custom yardage and pars remain untouched", () => {
  for (const course of [generateCourse(18), [{name:"My hole",yards:327,par:4}, {yards:600,par:6}]]) {
    const state = createGame(["A", "B"], course, 8);
    assert.deepEqual(state.course, course);
    assert.deepEqual(loadGame({getItem: () => JSON.stringify(state)}).state.course, course);
  }
});
