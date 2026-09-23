import { createGame, transition, activePlayer, COURSE } from "../src/engine.js";
import { chooseCpuMove, cpuObservation } from "../src/cpu.js";
import { automaticEvent } from "../src/flow.js";

// Deterministic calibration sample; lower aggregate strokes is better.
const levels = ["easy", "normal", "hard", "expert"];
const totals = Object.fromEntries(levels.map(level => [level, 0]));
for (let seed = 1; seed <= 48; seed++) {
  const order = levels.map((_, i) => levels[(i + seed) % 4]);
  let state = createGame(order, COURSE, seed, order);
  while (state.phase !== "finished") {
    state = transition(state, automaticEvent(state) ||
      chooseCpuMove(cpuObservation(state), activePlayer(state).controller));
  }
  for (const player of state.players)
    totals[player.controller] += player.scores.reduce((sum, score) => sum + score, 0);
}
console.log(JSON.stringify(totals, null, 2));
