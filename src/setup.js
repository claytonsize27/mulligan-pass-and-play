import { LEVELS } from "./cpu.js";

// House course ranges, within USGA par guidelines; five-yard steps suit the cards.
export const YARD_RANGES = { 3: [125, 225], 4: [275, 450], 5: [475, 600] };
const NINE = [3, 3, 4, 4, 4, 4, 4, 5, 5];
function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function generateCourse(length, random = Math.random) {
  if (![1, 3, 9, 18].includes(length)) throw new Error("Choose 1, 3, 9 or 18 holes.");
  const pars = length === 1 ? [3 + Math.floor(random() * 3)] :
    length === 3 ? shuffled([3, 4, 5], random) :
    length === 9 ? shuffled(NINE, random) :
    [...shuffled(NINE, random), ...shuffled(NINE, random)];
  return pars.map((par, i) => {
    const [min, max] = YARD_RANGES[par];
    return { name: `Hole ${i + 1}`, par,
      yards: min + 5 * Math.floor(random() * ((max - min) / 5 + 1)) };
  });
}
export function playerNames(names, controllers) {
  const result = names.map((name, i) => name.trim() || `Player ${i + 1}`);
  const used = new Set(result.filter((_, i) => controllers[i] === "human").map(n => n.toLowerCase()));
  controllers.forEach((controller, i) => {
    if (controller === "human") return;
    const base = `CPU - ${LEVELS[controller]}`;
    let name = base, suffix = 2;
    while (used.has(name.toLowerCase())) name = `${base} ${suffix++}`;
    result[i] = name;
    used.add(name.toLowerCase());
  });
  return result;
}
