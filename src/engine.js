import { CARDS, CARD_BY_ID, CLUBS, ACTIONS, HAND_SIZE } from "./cards.js";
export const VERSION = 1;
export const COURSE = [
  { name: "Opening drive", yards: 280, par: 4 },
  { name: "The short side", yards: 150, par: 3 },
  { name: "Long way home", yards: 475, par: 5 },
  { name: "Across the meadow", yards: 350, par: 4 },
  { name: "A little finesse", yards: 175, par: 3 },
  { name: "The dogleg", yards: 425, par: 4 },
  { name: "Open country", yards: 525, par: 5 },
  { name: "The approach", yards: 325, par: 4 },
  { name: "Clubhouse finish", yards: 400, par: 4 },
];
function insist(ok, message) {
  if (!ok) throw new Error(message);
}
function random(s) {
  let t = (s.seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  s.seed >>>= 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(s, items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function draw(s, p, n) {
  for (let i = 0; i < n; i++) {
    if (!s.deck.length && s.discard.length) {
      s.deck = shuffle(s, s.discard);
      s.discard = [];
      s.reshuffles++;
    }
    if (s.deck.length) p.hand.push(s.deck.pop());
  }
}
function discard(s, p, id) {
  const i = p.hand.indexOf(id);
  insist(i >= 0, "That card is not in your hand.");
  p.hand.splice(i, 1);
  s.discard.push(id);
}
export function remaining(s, p) {
  return Math.abs(s.course[s.hole].yards - p.position);
}
export function legalClub(s, p, id) {
  const c = CARD_BY_ID[id];
  if (!c) return false;
  return c.club === "driver"
    ? p.shots === 0
    : c.club === "putt"
      ? remaining(s, p) <= 25
      : true;
}
export function activePlayer(s) {
  return s.players[s.order[s.cursor]];
}
function startHole(s) {
  s.plans = {};
  s.cancels = [];
  s.events = [];
  s.round = 1;
  for (const p of s.players) {
    p.position = 0;
    p.strokes = 0;
    p.shots = 0;
    p.done = false;
    p.pickedUp = false;
  }
  startPlanning(s);
}
function startPlanning(s) {
  s.plans = {};
  s.cancels = [];
  s.results = [];
  s.events = [];
  s.order = s.players.map((_, i) => i).filter((i) => !s.players[i].done);
  const rotate = (s.hole + s.round - 1) % s.order.length;
  s.order.push(...s.order.splice(0, rotate));
  s.cursor = 0;
  s.stage = "plan";
  s.phase = "handoff";
}
export function createGame(
  names,
  course = COURSE.slice(0, 3),
  seed = Date.now() >>> 0,
  controllers = names.map(() => "human"),
) {
  insist(
    Array.isArray(names) && names.length >= 2 && names.length <= 4,
    "Choose two to four players.",
  );
  insist(
    names.every(
      (n) =>
        typeof n === "string" && n.trim().length > 0 && n.trim().length <= 20,
    ),
    "Names must be 1–20 characters.",
  );
  insist(
    new Set(names.map((n) => n.trim().toLowerCase())).size === names.length,
    "Give each player a different name.",
  );
  insist(
    Array.isArray(course) &&
      course.length >= 1 &&
      course.length <= 18 &&
      course.every(
        (h) =>
          Number.isInteger(h.yards) &&
          h.yards >= 50 &&
          h.yards <= 650 &&
          Number.isInteger(h.par) &&
          h.par >= 3 &&
          h.par <= 6,
      ),
    "Use 1–18 holes, 50–650 yards and par 3–6.",
  );
  insist(controllers.length === names.length && controllers.every(c => ["human", "easy", "normal", "hard", "expert"].includes(c)), "Choose a valid player type.");
  const s = {
    version: VERSION,
    seed: seed >>> 0,
    players: names.map((name, id) => ({ id, name: name.trim(), scores: [], hand: [], controller: controllers[id] })),
    course: structuredClone(course),
    hole: 0,
    reshuffles: 0,
    revision: 0,
  };
  s.deck = shuffle(s, CARDS.map(c => c.id));
  s.discard = [];
  for (const p of s.players) draw(s, p, HAND_SIZE);
  startHole(s);
  return s;
}
function advancePlanner(s) {
  s.cursor++;
  if (s.cursor < s.order.length) {
    s.phase = "handoff";
    return;
  }
  s.cursor = 0;
  s.phase = "reveal";
}
function advanceReaction(s) {
  s.cursor++;
  if (s.cursor < s.order.length) {
    s.phase = "handoff";
    return;
  }
  resolve(s);
}
export function liveEffects(s) {
  const cancelled = new Set(); // Resolve cancellation chains backwards: a cancelled cancellation does nothing.
  for (let i = s.cancels.length - 1; i >= 0; i--)
    if (!cancelled.has(`x${i}`)) cancelled.add(s.cancels[i].target);
  return cancelled;
}
function resolve(s) {
  const cancelled = liveEffects(s);
  s.results = [];
  for (const id of s.order) {
    const p = s.players[id],
      plan = s.plans[id];
    const before = p.position;
    const effects = [];
    p.strokes++;
    p.shots++;
    let distance = 0,
      penalty = 0,
      putt = false;
    if (plan.rest) {
      effects.push("Practice swing: refreshed hand, one stroke.");
    } else {
      const club = CLUBS[CARD_BY_ID[plan.club].club];
      putt = CARD_BY_ID[plan.club].club === "putt";
      distance = club.yards;
      const incoming = s.order.filter(
        (i) =>
          s.plans[i].action &&
          s.plans[i].target === id &&
          !cancelled.has(`a${i}`),
      );
      // House stacking: sum adjustments, clamp, then halve per trap. Putt ignores all actions.
      if (putt) {
        distance = remaining(s, p);
        effects.push("1-Putt: holed out; actions have no effect.");
      } else {
        for (const i of incoming) {
          const a = ACTIONS[CARD_BY_ID[s.plans[i].action].action];
          distance += a.delta || 0;
          penalty += a.penalty || 0;
          effects.push(`${s.players[i].name}: ${a.name}`);
        }
        distance = Math.max(0, distance);
        for (const i of incoming)
          if (ACTIONS[CARD_BY_ID[s.plans[i].action].action].half) distance /= 2;
      }
      p.position +=
        Math.sign(s.course[s.hole].yards - p.position || 1) * distance;
      p.strokes += penalty;
      if (putt || remaining(s, p) < 0.001) p.done = true;
    }
    if (s.round >= 12 && !p.done) {
      p.strokes = Math.max(p.strokes, s.course[s.hole].par + 8);
      p.done = true;
      p.pickedUp = true;
      effects.push("12-shot limit: picked up at at least par +8.");
    }
    s.results.push({
      id,
      before,
      after: p.position,
      distance,
      penalty,
      done: p.done,
      club: plan.rest
        ? "Practice swing"
        : CLUBS[CARD_BY_ID[plan.club].club].name,
      effects,
    });
  }
  for (const plan of Object.values(s.plans)) {
    if (plan.club) s.discard.push(plan.club);
    if (plan.action) s.discard.push(plan.action);
  }
  s.plans = {};
  for (const p of s.players) draw(s, p, Math.max(0, HAND_SIZE - p.hand.length));
  s.phase = "results";
  s.cursor = 0;
  if (s.players.every((p) => p.done))
    for (const p of s.players) p.scores.push(p.strokes);
}
export function transition(state, event) {
  const s = structuredClone(state);
  const p = ["plan", "reaction", "borrow", "handoff"].includes(s.phase)
    ? activePlayer(s)
    : null;
  switch (event.type) {
    case "OPEN":
      insist(s.phase === "handoff", "No handoff to open.");
      s.phase = s.stage;
      break;
    case "COVER":
      insist(
        ["plan", "reaction", "borrow"].includes(s.phase),
        "This is already a shared screen.",
      );
      s.phase = "handoff";
      break;
    case "BORROW": {
      insist(
        s.phase === "plan" &&
          p.hand.includes(event.card) &&
          CARD_BY_ID[event.card].action === "borrow",
        "Choose Borrow a club before planning.",
      );
      insist(
        Number.isInteger(event.target) &&
          s.players[event.target] &&
          event.target !== p.id,
        "Choose another player.",
      );
      discard(s, p, event.card);
      s.borrowTarget = event.target;
      s.phase = "borrow";
      s.stage = "borrow";
      break;
    }
    case "TAKE": {
      insist(s.phase === "borrow", "Play Borrow a club first.");
      const target = s.players[s.borrowTarget];
      insist(target.hand.includes(event.card), "Choose a card from that hand.");
      target.hand.splice(target.hand.indexOf(event.card), 1);
      p.hand.push(event.card);
      draw(s, target, 1);
      delete s.borrowTarget;
      s.phase = "plan";
      s.stage = "plan";
      s.events.push(`${p.name} borrowed a club.`);
      break;
    }
    case "COMMIT": {
      insist(s.phase === "plan", "You can only plan on your turn.");
      const { club, action, target } = event;
      insist(
        p.hand.includes(club) && legalClub(s, p, club),
        "Choose a playable club.",
      );
      insist(
        p.hand.includes(action) &&
          action !== club &&
          !ACTIONS[CARD_BY_ID[action].action].anytime,
        "Choose a different card with a regular action.",
      );
      insist(
        Number.isInteger(target) && s.order.includes(target),
        "Choose a player still on this hole.",
      );
      p.hand = p.hand.filter((id) => id !== club && id !== action);
      s.plans[p.id] = { club, action, target };
      advancePlanner(s);
      break;
    }
    case "REST":
      insist(s.phase === "plan", "You can only exchange on your turn.");
      s.discard.push(...p.hand);
      p.hand = [];
      draw(s, p, HAND_SIZE);
      s.plans[p.id] = { rest: true };
      advancePlanner(s);
      break;
    case "ANYTIME": {
      insist(s.phase === "plan", "Play this before locking your shot.");
      const c = CARD_BY_ID[event.card];
      insist(
        p.hand.includes(event.card) &&
          ACTIONS[c.action].anytime &&
          c.action !== "mulligan",
        "Choose a preparation card.",
      );
      if (c.action === "dig") {
        const ids = event.cards || [];
        insist(
          new Set(ids).size === ids.length &&
            ids.every((id) => id !== event.card && p.hand.includes(id)),
          "Choose cards from your hand.",
        );
        discard(s, p, event.card);
        for (const id of ids) discard(s, p, id);
        draw(s, p, ids.length + 1);
      } else if (c.action === "borrow") {
        throw new Error("Use the Borrow action to inspect a hand.");
      } else {
        insist(
          s.plans[event.target] && !s.plans[event.target].rest,
          "Choose a locked shot.",
        );
        discard(s, p, event.card);
        draw(s, p, 1);
      }
      s.events.push(`${p.name} played ${ACTIONS[c.action].name}.`);
      break;
    }
    case "REACTIONS":
      insist(s.phase === "reveal", "Reveal the shots first.");
      s.stage = "reaction";
      s.phase = "handoff";
      s.cursor = 0;
      break;
    case "CANCEL": {
      insist(s.phase === "reaction", "Wait for the reaction window.");
      insist(
        p.hand.includes(event.card) &&
          CARD_BY_ID[event.card].action === "mulligan",
        "Choose a Mulligan card.",
      );
      insist(
        /^a[0-3]$/.test(event.target)
          ? !!s.plans[Number(event.target.slice(1))]?.action
          : /^x\d+$/.test(event.target) &&
              Number(event.target.slice(1)) < s.cancels.length,
        "Choose an action or cancellation.",
      );
      insist(
        !liveEffects(s).has(event.target),
        "That effect is already cancelled.",
      );
      discard(s, p, event.card);
      s.cancels.push({ player: p.id, target: event.target });
      break;
    }
    case "PASS":
      insist(s.phase === "reaction", "Not a reaction turn.");
      advanceReaction(s);
      break;
    case "CONTINUE":
      insist(s.phase === "results", "Finish the shot first.");
      if (s.players.every((p) => p.done)) s.phase = "score";
      else {
        s.round++;
        startPlanning(s);
      }
      break;
    case "NEXT_HOLE":
      insist(s.phase === "score", "Finish the hole first.");
      if (s.hole === s.course.length - 1) s.phase = "finished";
      else {
        s.hole++;
        startHole(s);
      }
      break;
    default:
      throw new Error("Unknown game action.");
  }
  s.revision++;
  assertGame(s);
  return s;
}
export function assertGame(s) {
  insist(s?.version === VERSION, "This save uses an unsupported version.");
  insist(
    Array.isArray(s.players) && s.players.length >= 2 && s.players.length <= 4,
    "Invalid players.",
  );
  insist(
    [
      "handoff",
      "plan",
      "borrow",
      "reveal",
      "reaction",
      "results",
      "score",
      "finished",
    ].includes(s.phase),
    "Invalid game phase.",
  );
  insist(["plan", "borrow", "reaction"].includes(s.stage), "Invalid stage.");
  if (s.stage === "borrow")
    insist(
      Number.isInteger(s.borrowTarget) &&
        s.players[s.borrowTarget] &&
        s.borrowTarget !== s.order[s.cursor],
      "Invalid borrow target.",
    );
  insist(
    Array.isArray(s.course) && s.hole >= 0 && s.hole < s.course.length,
    "Invalid course.",
  );
  insist(
    s.course.every(
      (h) =>
        Number.isInteger(h.yards) &&
        h.yards >= 50 &&
        h.yards <= 650 &&
        Number.isInteger(h.par) &&
        h.par >= 3 &&
        h.par <= 6,
    ),
    "Invalid hole.",
  );
  insist(
    Number.isInteger(s.seed) &&
      Number.isInteger(s.revision) &&
      s.round >= 1 &&
      s.round <= 12,
    "Invalid game metadata.",
  );
  insist(
    Array.isArray(s.order) &&
      new Set(s.order).size === s.order.length &&
      s.order.every(
        (i) => Number.isInteger(i) && i >= 0 && i < s.players.length,
      ) &&
      s.cursor >= 0 &&
      s.cursor < s.order.length,
    "Invalid turn order.",
  );
  insist(
    s.players.every(
      (p, i) =>
        (p.controller === undefined || ["human", "easy", "normal", "hard", "expert"].includes(p.controller)) &&
        p.id === i &&
        typeof p.name === "string" &&
        p.name.length <= 20 &&
        Array.isArray(p.hand) &&
        Array.isArray(p.scores) &&
        p.scores.every((x) => Number.isFinite(x) && x >= 1) &&
        Number.isFinite(p.position) &&
        Number.isInteger(p.strokes) &&
        p.strokes >= 0 &&
        Number.isInteger(p.shots) &&
        p.shots >= 0 &&
        typeof p.done === "boolean",
    ),
    "Invalid player state.",
  );
  const ids = [
    ...s.deck,
    ...s.discard,
    ...s.players.flatMap((p) => p.hand),
    ...Object.values(s.plans).flatMap((p) =>
      [p.club, p.action].filter(Boolean),
    ),
  ];
  insist(
    ids.length === 104 &&
      new Set(ids).size === 104 &&
      ids.every((id) => CARD_BY_ID[id]),
    "Card inventory is damaged.",
  );
  for (const [id, p] of Object.entries(s.plans)) {
    insist(s.order.includes(Number(id)), "Invalid shot owner.");
    if (!p.rest)
      insist(
        CARD_BY_ID[p.club] &&
          CARD_BY_ID[p.action] &&
          !ACTIONS[CARD_BY_ID[p.action].action].anytime &&
          s.order.includes(p.target),
        "Invalid shot.",
      );
  }
  insist(
    Array.isArray(s.cancels) &&
      s.cancels.every(
        (x, i) =>
          s.order.includes(x.player) &&
          (/^a[0-3]$/.test(x.target) ||
            (/^x\d+$/.test(x.target) && Number(x.target.slice(1)) < i)),
      ),
    "Invalid reactions.",
  );
  insist(
    Array.isArray(s.results) &&
      s.results.every(
        (r) =>
          s.players[r.id] &&
          typeof r.club === "string" &&
          Number.isFinite(r.distance) &&
          Number.isFinite(r.penalty) &&
          Array.isArray(r.effects) &&
          r.effects.every((x) => typeof x === "string"),
      ) &&
      Array.isArray(s.events) &&
      s.events.every((x) => typeof x === "string"),
    "Invalid history.",
  );
  return true;
}
