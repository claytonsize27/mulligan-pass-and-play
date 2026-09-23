import { CARDS, CARD_BY_ID, CLUBS, ACTIONS } from "./cards.js";

export const LEVELS = {
  easy: "Easy", normal: "Normal", hard: "Hard", expert: "Expert",
};
export const LEVEL_HELP = {
  easy: "Chooses sensible shots and protects them with Mulligans.",
  normal: "Chooses a close landing and protects its shot.",
  hard: "Plans the next shot and weighs every revealed action.",
  expert: "Refines opponent estimates using its own hand and spends Mulligans more precisely.",
};

// Explicit information boundary. Never pass engine state to chooseCpuMove.
// Discard identities are private; locked plans appear only after reveal.
export function cpuObservation(s) {
  const id = s.order[s.cursor];
  const publicPlans = s.phase === "reaction" || s.phase === "reveal" ||
    (s.phase === "handoff" && s.stage === "reaction");
  return structuredClone({
    phase: s.phase, stage: s.stage, id, yards: s.course[s.hole].yards,
    order: s.order, hand: s.players[id].hand,
    players: s.players.map(p => ({ id: p.id, position: p.position,
      shots: p.shots, strokes: p.strokes, scores: p.scores, done: p.done })),
    remembered: [...(s.publicPlayed || [])],
    plans: publicPlans ? s.plans : {},
    cancels: publicPlans ? s.cancels.map(({player, target}) => ({player, target})) : [],
  });
}
const gap = (o, p) => Math.abs(o.yards - p.position);
const legal = (o, p, id) => CARD_BY_ID[id].club === "driver" ? p.shots === 0 :
  CARD_BY_ID[id].club !== "putt" || gap(o, p) <= 25;
function landing(o, p, club, actions = []) {
  if (CARD_BY_ID[club].club === "putt") return 0;
  let distance = CLUBS[CARD_BY_ID[club].club].yards;
  distance = Math.max(0, distance + actions.reduce((n, a) => n + (a.delta || 0), 0));
  distance /= 2 ** actions.filter(a => a.half).length;
  return Math.abs(gap(o, p) - distance);
}
// Yard-equivalent cost: reaching putting range is valuable, penalties expensive.
const cost = d => d < .001 ? -140 : d <= 25 ? -70 + d : d;
function cancelled(cancels) {
  const result = new Set();
  for (let i = cancels.length - 1; i >= 0; i--)
    if (!result.has(`x${i}`)) result.add(cancels[i].target);
  return result;
}
function tableCost(o, cancels, level) {
  const off = cancelled(cancels);
  return o.order.reduce((sum, id) => {
    const plan = o.plans[id];
    if (plan.rest) return sum;
    const actions = o.order.filter(i => o.plans[i].action &&
      o.plans[i].target === id && !off.has(`a${i}`))
      .map(i => ACTIONS[CARD_BY_ID[o.plans[i].action].action]);
    const penalty = CARD_BY_ID[plan.club].club === "putt" ? 0 :
      actions.reduce((n, a) => n + (a.penalty || 0), 0);
    const weight = id === o.id ? 1 : level === "easy" ? 0 : level === "normal" ? -0.2 : -0.35;
    return sum + weight * (cost(landing(o, o.players[id], plan.club, actions)) + penalty * 100);
  }, 0);
}
function opponentImpact(o, target, action, level) {
  if (target === o.id || action.name === ACTIONS.fairway.name) return 0;
  const p = o.players[target];
  // Expert excludes its own cards and remembered publicly played cards. The
  // remaining catalogue is a probability model, never a peek at the real deck.
  const unavailable = new Set(level === "expert" ? [...o.hand, ...(o.remembered || [])] : o.hand);
  const possible = CARDS.filter(c => !unavailable.has(c.id) && legal(o, p, c.id));
  const ranked = possible.sort((a, b) => cost(landing(o, p, a.id)) - cost(landing(o, p, b.id)));
  const candidates = ranked.slice(0, Math.max(1, Math.ceil(ranked.length / 4)));
  if (!candidates.length) return 0;
  return candidates.reduce((n, c) => n + cost(landing(o, p, c.id, [action])) -
    cost(landing(o, p, c.id)) + (c.club === "putt" ? 0 : (action.penalty || 0) * 100), 0) / candidates.length;
}
export function chooseCpuMove(o, level, random = Math.random) {
  if (!LEVELS[level]) throw new Error("Unknown CPU difficulty.");
  if (o.phase === "handoff") return { type: "OPEN" };
  if (o.phase === "reaction") {
    const card = o.hand.find(id => CARD_BY_ID[id].action === "mulligan");
    if (!card) return { type: "PASS" };
    const off = cancelled(o.cancels);
    const targets = [...o.order.filter(i => o.plans[i].action).map(i => `a${i}`),
      ...o.cancels.map((_, i) => `x${i}`)].filter(t => !off.has(t));
    const baseline = tableCost(o, o.cancels, level);
    const ranked = targets.map(target => ({ target, benefit: baseline - tableCost(o,
      [...o.cancels, { player: o.id, target }], level) })).sort((a, b) => b.benefit - a.benefit);
    if (ranked[0]?.benefit > (level === "expert" ? 12 : level === "hard" ? 18 : 25))
      return { type: "CANCEL", card, target: ranked[0].target };
    return { type: "PASS" };
  }
  if (o.phase !== "plan") throw new Error("CPU cannot act on this screen.");
  const p = o.players[o.id], choices = [];
  const impactCache = new Map(), futureCache = new Map();
  for (const club of o.hand.filter(id => legal(o, p, id))) {
    for (const action of o.hand.filter(id => id !== club && !ACTIONS[CARD_BY_ID[id].action].anytime)) {
      const effect = ACTIONS[CARD_BY_ID[action].action];
      for (const target of o.order) {
        const d = landing(o, p, club, target === o.id ? [effect] : []);
        let score = cost(d) + (target === o.id && CARD_BY_ID[club].club !== "putt" ? (effect.penalty || 0) * 100 : 0);
        if (level !== "easy") {
          const next = o.hand.filter(id => id !== club && id !== action && CARD_BY_ID[id].club !== "driver");
          if (d > 25 && next.length) score += (level === "normal" ? .15 : level === "hard" ? .15 : .1) * Math.min(...next.filter(id => CARD_BY_ID[id].club !== "putt")
            .map(id => cost(Math.abs(d - CLUBS[CARD_BY_ID[id].club].yards))), d);
          if (level === "expert" && d > 25) {
            const key = `${club}:${action}:${d}`;
            if (!futureCache.has(key)) {
              let best = cost(d);
              const nextPlayer = {...p, shots: p.shots + 1, position: o.yards - d};
              for (const c of next.filter(id => legal(o, nextPlayer, id)))
                for (const a of next.filter(id => id !== c && !ACTIONS[CARD_BY_ID[id].action].anytime)) {
                  const effect = ACTIONS[CARD_BY_ID[a].action];
                  best = Math.min(best, cost(landing(o, nextPlayer, c)),
                    cost(landing(o, nextPlayer, c, [effect])) + (effect.penalty || 0) * 100);
                }
              futureCache.set(key, best);
            }
            score += .15 * futureCache.get(key);
          }
          const key = `${target}:${CARD_BY_ID[action].action}`;
          if (!impactCache.has(key)) impactCache.set(key, opponentImpact(o, target, effect, level));
          score -= (level === "normal" ? .12 : level === "hard" ? .2 : .45) * impactCache.get(key);
          // Preserve a putter and Mulligans when other choices land equally well.
          score += (CARD_BY_ID[action].club === "putt" ? 4 : 0) + (CARD_BY_ID[club].action === "mulligan" ? 3 : 0);
        } else if (target !== o.id) score -= (effect.penalty || 0) * 10 + (effect.delta < 0 || effect.half ? 2 : 0);
        if (d < .001 && !(target === o.id && effect.penalty)) score -= 1000;
        choices.push({ move: { type: "COMMIT", club, action, target }, score });
      }
    }
  }
  if (!choices.length) return { type: "REST" };
  choices.sort((a, b) => a.score - b.score);
  return choices[0].move;
}
