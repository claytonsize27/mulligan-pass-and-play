import { generateCourse, playerNames } from "./setup.js";
import { LEVELS, LEVEL_HELP, cpuObservation, chooseCpuMove } from "./cpu.js";
import { courseScale } from "./course-view.js";
import { CARDS, CARD_BY_ID, CLUBS, ACTIONS } from "./cards.js";
import {
  createGame,
  transition,
  activePlayer,
  remaining,
  legalClub,
  liveEffects,
} from "./engine.js";
import { loadGame, saveGame, SAVE_KEY } from "./storage.js";
const app = document.querySelector("#app"),
  notice = document.querySelector("#notice");
const loaded = loadGame();
let game = loaded.state,
  screen = "home",
  selected = { club: null, action: null, target: null },
  special = null,
  peek = null,
  count = 2;
let names = ["", "", "", ""];
let controllers = ["human", "human", "human", "human"];
let cpuTimer;
let roundSize = "3",
  custom = "280,4\n150,3\n475,5",
  problem = loaded.error || "",
  storageWarning = false;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n) => (Number.isInteger(n) ? n : String(Number(n.toFixed(2))));
const badge = (p) => `<span class="player-dot p${p.id}">${p.id + 1}</span>`;
const button = (text, action, cls = "primary", extra = "") =>
  `<button class="${cls}" data-do="${action}" ${extra}>${text}</button>`;
const flag = `<svg class="flag" viewBox="0 0 48 48" aria-hidden="true"><path d="M18 40V6l24 8-24 8"/><path d="M7 41h23"/></svg>`;
let noticeTimer;
function announce(msg) {
  clearTimeout(noticeTimer);
  notice.textContent = msg;
  if (!storageWarning)
    noticeTimer = setTimeout(() => {
      notice.textContent = "";
    }, 6000);
}
function persist() {
  storageWarning = !saveGame(game);
  if (storageWarning)
    announce(
      "Saving is unavailable in this browser. Keep this page open to continue your round.",
    );
}
function act(e) {
  try {
    game = transition(game, e);
    selected = { club: null, action: null, target: null };
    special = null;
    peek = null;
    problem = "";
    persist();
    render();
  } catch (error) {
    announce(error.message);
  }
}
function home() {
  return `<section class="setup"><div class="setup-intro"><h1>Meet you<br>on the first tee.</h1><p class="lede">A round of cards.<br>A few friendly rivalries.</p><div class="tee-board" aria-hidden="true">${flag}<span class="tee-line"></span><span class="tee-ball"></span><span class="tee-label">ONE PHONE. EVERYONE PLAYS.</span></div><p class="edition">Independent house edition <span>·</span> Based on Mulligan</p></div><div class="setup-form"><h2>Your group</h2><p>Choose people or CPUs for each seat. Pass the phone between human players.</p>${game ? `<div class="resume"><div><strong>Your round is waiting</strong><span>Hole ${game.hole + 1} of ${game.course.length} · ${game.players.map((p) => esc(p.name)).join(", ")}</span></div>${button("Resume round", "resume")}</div>` : ""}<form id="setup-form"><fieldset><legend>Players</legend><div class="segments">${[2, 3, 4].map((n) => button(`${n} players`, "count", "segment", `type="button" data-count="${n}" aria-pressed="${count === n}"`)).join("")}</div></fieldset><div class="names">${names
    .slice(0, count)
    .map(
      (name, i) =>
        `<div class="player-setup"><label>${badge({ id: i })}<span class="sr-only">Player ${i + 1} name</span><input name="name${i}" aria-label="Player ${i + 1} name" placeholder="Player ${i + 1}" value="${esc(controllers[i] === "human" ? name : playerNames(names.slice(0, count), controllers.slice(0, count))[i])}" ${controllers[i] !== "human" ? 'readonly aria-readonly="true"' : ""} maxlength="20" autocomplete="off"></label><label class="seat-type"><span>Player ${i + 1} plays as</span><select name="controller${i}" aria-describedby="seat-help${i}"><option value="human" ${controllers[i] === "human" ? "selected" : ""}>Human</option>${Object.entries(LEVELS).map(([key, label]) => `<option value="${key}" ${controllers[i] === key ? "selected" : ""}>CPU · ${label}</option>`).join("")}</select></label><small id="seat-help${i}">${LEVEL_HELP[controllers[i]] || "You choose the cards."}</small></div>`,
    )
    .join(
      "",
    )}</div><label class="field">Round length<select name="round"><option value="1" ${roundSize === "1" ? "selected" : ""}>1 hole · A quick game</option><option value="3" ${roundSize === "3" ? "selected" : ""}>3 holes · A short round</option><option value="9" ${roundSize === "9" ? "selected" : ""}>9 holes · The front nine</option><option value="18" ${roundSize === "18" ? "selected" : ""}>18 holes · A full round</option><option value="custom" ${roundSize === "custom" ? "selected" : ""}>Use your own scorecard</option></select></label>${roundSize === "custom" ? `<label class="field">Yards, par — one hole per line<textarea name="custom" rows="5" aria-describedby="custom-hint">${esc(custom)}</textarea></label><small id="custom-hint">1–18 holes. 50–650 yards, par 3–6. Example: 350,4</small>` : ""}<p class="form-error" role="alert">${esc(problem)}</p><button type="submit" class="primary start">${game ? "Start a new round" : "Tee off"} <span aria-hidden="true">→</span></button><p class="fine">${game ? "Starting a new round asks before replacing your save." : "No sign-in. No ads. Your round stays on this phone."}</p></form><button class="text-button" data-do="rules">Learn the house rules</button></div></section>`;
}
function top() {
  const h = game.course[game.hole];
  return `<div class="game-top"><div><h1>Hole ${game.hole + 1}<span> / ${game.course.length}</span></h1><p>${esc(h.name || "Custom hole")} <span>·</span> ${h.yards} yd <span>·</span> Par ${h.par}</p></div><button class="quiet" data-do="home">Save & leave</button></div>`;
}
function board() {
  const h = game.course[game.hole];
  const scale = courseScale(h.yards, game.players.map(p => p.position));
  return `<section class="course-board" aria-label="Player positions"><div class="course-heading"><span>On the course</span><span>Shot ${game.round}</span></div>${game.players.map(p => {
    const ball = scale.at(p.position);
    const location = p.done ? (p.pickedUp ? "Picked up" : "Holed") : `${fmt(remaining(game, p))} yd ${p.position > h.yards ? "past hole" : p.position < 0 ? "to hole · behind tee" : "left"}`;
    return `<div class="lane"><div class="lane-label">${badge(p)}<strong>${esc(p.name)}</strong><span>${location} · ${p.strokes} ${p.strokes === 1 ? "stroke" : "strokes"}</span></div><div class="yard-track"><span class="yard-fill p${p.id}" style="position:absolute;left:${Math.min(scale.tee,ball)}%;width:${Math.abs(ball-scale.tee)}%"></span><span class="pin" style="left:${scale.pin}%"></span><span class="ball p${p.id}" style="left:${ball}%">${p.id+1}</span></div></div>`;
  }).join("")}<div class="course-axis"><span style="left:${scale.tee}%">Tee</span><span style="left:${scale.pin}%" class="hole-label">Hole</span></div><p class="course-distance">${h.yards} yards from tee to hole${scale.max > h.yards ? " · Track extends beyond the flag" : ""}</p></section>`;
}
function cpuView() {
  const p = activePlayer(game);
  return `${top()}<section class="handoff"><div class="handoff-emblem">${badge(p)}</div><h2>${esc(p.name)} is ${game.stage === "reaction" ? "reviewing the shots" : "planning a shot"}.</h2><p>CPU · ${LEVELS[p.controller]}. Its hand stays private.</p></section>${board()}`;
}
function isCpuTurn() {
  return screen === "game" && ["handoff", "plan", "reaction"].includes(game.phase) && LEVELS[activePlayer(game).controller];
}
function handoff() {
  const p = activePlayer(game);
  return `${top()}<section class="handoff"><div class="handoff-emblem">${badge(p)}</div><h2>Pass to ${esc(p.name)}.</h2><p>${game.stage === "reaction" ? "Check the revealed shots and decide whether to play a Mulligan." : game.stage === "borrow" ? "Your borrowed-card choice is waiting." : "Your hand is covered. Take the phone before revealing your cards."}</p>${button(`I’m ${esc(p.name)} · ${game.stage === "reaction" ? "review shots" : "show my hand"}`, "open")}<span class="fine">${game.cursor + 1} of ${game.order.length} players · ${game.stage === "reaction" ? "Reaction pass" : "Private planning"}</span></section>${board()}`;
}
function card(id, p, mode = "hand") {
  const c = CARD_BY_ID[id],
    club = CLUBS[c.club],
    a = ACTIONS[c.action];
  const playable = legalClub(game, p, id);
  const chosen =
    selected.club === id ? "club" : selected.action === id ? "action" : "";
  if (mode === "take")
    return `<button class="take-card" data-do="take" data-id="${id}"><strong>${club.name}</strong><b>${club.yards} yd</b><span>${a.name}</span><small>Take this card</small></button>`;
  if (mode === "dig")
    return `<button class="take-card ${special.cards.includes(id) ? "picked" : ""}" data-do="dig-toggle" data-id="${id}" aria-pressed="${special.cards.includes(id)}"><strong>${club.name}</strong><b>${club.yards} yd</b><span>${a.name}</span></button>`;
  return `<article class="playing-card ${chosen ? "chosen-" + chosen : ""}"><button class="club-face" data-do="club" data-id="${id}" aria-pressed="${selected.club === id}" ${!playable || selected.action === id ? "disabled" : ""}><span>${club.name}</span><strong>${club.yards}<small>yd</small></strong><span class="card-note">${!playable ? (c.club === "driver" ? "First shot only" : "Get within 25 yd") : c.club === "putt" ? "Hole out · action-proof" : selected.club === id ? "Club selected" : "Use as club"}</span></button><div class="card-divider"><span>OR</span></div><button class="action-face ${a.anytime ? "special-face" : ""}" data-do="${a.anytime ? "special" : "action"}" data-id="${id}" ${selected.club === id ? "disabled" : ""} ${!a.anytime ? `aria-pressed="${selected.action === id}"` : ""}><span class="card-kind">${a.anytime ? (c.action === "mulligan" ? "After reveal" : "Play now") : "Action"}</span><strong>${a.name}</strong><span>${a.text}</span>${selected.action === id ? '<b class="selected-label">Action selected</b>' : ""}</button></article>`;
}
function plans() {
  const cancelled = liveEffects(game);
  return `<div class="revealed-list">${game.order
    .map((id) => {
      const p = game.players[id],
        plan = game.plans[id];
      return `<div class="revealed-row">${badge(p)}<div><strong>${esc(p.name)}</strong><p>${plan.rest ? "Practice swing · exchange hand" : `${CLUBS[CARD_BY_ID[plan.club].club].name} <b>${CLUBS[CARD_BY_ID[plan.club].club].yards} yd</b>`}</p></div><div>${plan.action ? `<strong class="${cancelled.has("a" + id) ? "cancelled" : ""}">${ACTIONS[CARD_BY_ID[plan.action].action].name}</strong><p>to ${esc(game.players[plan.target].name)}${cancelled.has("a" + id) ? " · cancelled" : ""}</p><small class="action-effect">${esc(ACTIONS[CARD_BY_ID[plan.action].action].text)}</small>` : "<span>+1 stroke</span>"}</div></div>`;
    })
    .join(
      "",
    )}${game.cancels.map((x, i) => `<p class="reaction-log">${esc(game.players[x.player].name)} used Mulligan on ${x.target[0] === "a" ? `${esc(game.players[+x.target.slice(1)].name)}’s action` : "an earlier Mulligan"}${cancelled.has("x" + i) ? " (cancelled)" : ""}.</p>`).join("")}</div>`;
}
function specials(p) {
  if (!special) return "";
  const c = CARD_BY_ID[special.id];
  if (c.action === "dig")
    return `<section class="special-panel"><h3>Dig through the bag</h3><p>Select the cards to exchange. This also spends and replaces your Dig card.</p><div class="small-hand">${p.hand
      .filter((id) => id !== special.id)
      .map((id) => card(id, p, "dig"))
      .join(
        "",
      )}</div><div class="button-row">${button(`Exchange ${special.cards.length} selected`, "dig")}${button("Cancel", "cancel-special", "quiet")}</div></section>`;
  if (c.action === "borrow")
    return `<section class="special-panel"><h3>Borrow a club</h3><p>Choose a player. Your card is spent before their hand is shown.</p><div class="button-row">${game.players
      .filter((x) => x.id !== p.id)
      .map((x) =>
        button(esc(x.name), "borrow", "secondary", `data-target="${x.id}"`),
      )
      .join("")}${button("Cancel", "cancel-special", "quiet")}</div></section>`;
  if (c.action === "read")
    return `<section class="special-panel"><h3>Read the lie</h3><p>Spend this card to inspect a locked shot.</p><div class="button-row">${
      Object.keys(game.plans)
        .filter((i) => !game.plans[i].rest)
        .map((i) =>
          button(
            esc(game.players[i].name),
            "peek",
            "secondary",
            `data-target="${i}"`,
          ),
        )
        .join("") || "<p>No shots are locked yet. Keep this card for later.</p>"
    }${button("Cancel", "cancel-special", "quiet")}</div></section>`;
  return "";
}
function planning() {
  const p = activePlayer(game);
  return `${top()}<details class="planning-board"><summary>${fmt(remaining(game, p))} yd to the hole · ${p.strokes} strokes <span>View course</span></summary>${board()}</details><section class="private-area"><div class="section-heading"><h2>${badge(p)}${esc(p.name)}’s shot</h2>${button("Cover hand", "cover", "quiet")}</div><p class="instruction">Pick a club, an action on a different card, and a target.</p>${peek ? `<div class="special-panel"><strong>${esc(peek.name)}’s locked shot</strong><p>${esc(peek.text)}</p></div>` : ""}${specials(p)}<div class="shot-slots"><div><span>Club</span><strong>${selected.club ? CLUBS[CARD_BY_ID[selected.club].club].name : "Choose below"}</strong></div><div><span>Action</span><strong>${selected.action ? ACTIONS[CARD_BY_ID[selected.action].action].name : "Choose below"}</strong></div></div><fieldset class="targets"><legend>Who gets your action?</legend>${game.order.map((i) => `<button data-do="target" data-target="${i}" aria-pressed="${selected.target === i}" class="target">${badge(game.players[i])}${i === p.id ? "Me" : esc(game.players[i].name)}</button>`).join("")}</fieldset><div class="hand-heading"><h3>Your hand <span>${p.hand.length} cards</span></h3><span>${game.deck.length} in deck · ${game.discard.length} discarded</span></div><div class="hand">${p.hand.map((id) => card(id, p)).join("")}</div><div class="commit-bar"><div><strong>${selected.club && selected.action && selected.target !== null ? "Your shot is ready." : "Build your shot above."}</strong><small>Cards stay hidden until everyone is ready.</small></div>${button("Lock shot & pass", "commit", "primary", !selected.club || !selected.action || selected.target === null ? "disabled" : "")}</div><details class="recovery"><summary>Need a different hand?</summary><p>Take a practice swing: spend one stroke to exchange your whole hand. No shot or action this turn.</p>${button("Exchange hand · +1 stroke", "rest", "secondary")}</details></section>`;
}
function borrowView() {
  const p = activePlayer(game),
    target = game.players[game.borrowTarget];
  return `${top()}<section class="private-area"><div class="section-heading"><h2>Borrow from ${esc(target.name)}</h2>${button("Cover hand", "cover", "quiet")}</div><p>Choose one card. Their hand will receive a replacement from the deck.</p><div class="small-hand">${target.hand.map((id) => card(id, p, "take")).join("")}</div></section>`;
}
function reveal() {
  return `${top()}<section class="shared"><h2>All cards on the table.</h2><p>Here’s what everyone planned. Each player gets a private chance to play a Mulligan before the shots resolve.</p>${plans()}${button("Start reaction pass", "reactions")}</section>${board()}`;
}
function reaction() {
  const p = activePlayer(game),
    cards = p.hand.filter((id) => CARD_BY_ID[id].action === "mulligan"),
    cancelled = liveEffects(game);
  return `${top()}<section class="private-area"><div class="section-heading"><h2>${badge(p)}${esc(p.name)}’s reaction</h2>${button("Cover hand", "cover", "quiet")}</div>${plans()}<h3>${cards.length ? `${cards.length} Mulligan ${cards.length === 1 ? "available" : "cards available"}` : "No Mulligan in your hand"}</h3><p>${cards.length ? "Cancel an action, or cancel an earlier Mulligan to restore its effect." : "You can pass. Your shot will resolve with the group."}</p>${
    cards.length
      ? `<div class="cancel-options">${game.order
          .filter((i) => game.plans[i].action && !cancelled.has("a" + i))
          .map((i) =>
            button(
              `Cancel ${esc(game.players[i].name)}’s ${ACTIONS[CARD_BY_ID[game.plans[i].action].action].name}`,
              "cancel-effect",
              "secondary",
              `data-effect="a${i}" data-id="${cards[0]}"`,
            ),
          )
          .join(
            "",
          )}${game.cancels.map((x, i) => (cancelled.has("x" + i) ? "" : button(`Cancel ${esc(game.players[x.player].name)}’s Mulligan`, "cancel-effect", "secondary", `data-effect="x${i}" data-id="${cards[0]}"`))).join("")}</div>`
      : ""
  }${game.cancels.at(-1)?.player === p.id && game.cancels.at(-1)?.card && !game.cancels.at(-1)?.locked ? `<div class="reaction-draft"><p>Your Mulligan choices are not locked yet. Undo them one at a time, or finish your reaction to confirm.</p>${button("Undo last Mulligan", "undo-mulligan", "secondary")}</div>` : ""}${button(game.cursor === game.order.length - 1 ? "Finish reactions & swing" : "Pass to next player", "pass")}</section>`;
}
function results() {
  return `${top()}<section class="shared results"><h2>Swing, together.</h2><div class="result-list">${game.results
    .map((r) => {
      const p = game.players[r.id];
      return `<article class="result-row"><div>${badge(p)}<h3>${esc(p.name)}</h3><strong>${r.done ? (p.pickedUp ? "Picked up" : "Holed out") : `${fmt(r.distance)} yd`}</strong></div><p>${esc(r.club)}${r.penalty ? ` · +${r.penalty} penalty strokes` : ""} · ${r.done ? `${p.strokes} strokes this hole` : `${fmt(remaining(game, p))} yd remaining`}</p><ul>${r.effects.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></article>`;
    })
    .join(
      "",
    )}</div>${button(game.players.every((p) => p.done) ? "View hole scorecard" : "Plan the next shot", "continue")}</section>${board()}`;
}
function score() {
  const finished = game.phase === "finished",
    totals = game.players.map((p) => p.scores.reduce((a, b) => a + b, 0)),
    low = Math.min(...totals),
    winners = game.players.filter((_, i) => totals[i] === low);
  return `${top()}<section class="shared scorecard">${finished ? flag : ""}<h2>${finished ? `${winners.map((p) => esc(p.name)).join(" & ")} ${winners.length > 1 ? "share the win." : "takes the round."}` : "Hole complete."}</h2><p>${finished ? "The scores are in. There’s always another round." : "Mark the card, then head to the next tee."}</p><div class="table-scroll"><table><caption>Scorecard · strokes per hole</caption><thead><tr><th scope="col">Hole</th><th scope="col">Par</th>${game.players.map((p) => `<th scope="col">${badge(p)}${esc(p.name)}</th>`).join("")}</tr></thead><tbody>${game.course
    .slice(0, game.players[0].scores.length)
    .map(
      (h, i) =>
        `<tr><th scope="row">${i + 1}</th><td>${h.par}</td>${game.players.map((p) => `<td>${p.scores[i]}</td>`).join("")}</tr>`,
    )
    .join(
      "",
    )}</tbody><tfoot><tr><th scope="row">Total</th><td>${game.course.slice(0, game.players[0].scores.length).reduce((n, h) => n + h.par, 0)}</td>${totals.map((t) => `<td>${t}</td>`).join("")}</tr></tfoot></table></div>${finished ? button("Play another round", "home") : button(game.hole === game.course.length - 1 ? "See final results" : "Next hole", "next-hole")}</section>`;
}
let renderedPhase = "";
function render() {
  clearTimeout(cpuTimer);
  const phase = screen === "home" ? "home" : game.phase;
  const focused = document.activeElement;
  const key = focused?.closest("[data-do]")?.dataset;
  const focusName = focused?.getAttribute("name");
  app.innerHTML =
    screen === "home"
      ? home()
      : isCpuTurn()
        ? cpuView()
        : game.phase === "handoff"
        ? handoff()
        : game.phase === "plan"
          ? planning()
          : game.phase === "borrow"
            ? borrowView()
            : game.phase === "reveal"
              ? reveal()
              : game.phase === "reaction"
                ? reaction()
                : game.phase === "results"
                  ? results()
                  : score();
  if (isCpuTurn() && !document.hidden) {
    const revision = game.revision;
    cpuTimer = setTimeout(() => {
      if (isCpuTurn() && game.revision === revision && !document.hidden)
        act(chooseCpuMove(cpuObservation(game), activePlayer(game).controller));
    }, game.phase === "handoff" ? 450 : 200);
  }
  if (phase === renderedPhase) {
    let replacement;
    if (key) {
      replacement = [...app.querySelectorAll("[data-do]")].find((el) =>
        Object.entries(key).every(([k, v]) => el.dataset[k] === v),
      );
    } else if (focusName) {
      replacement = [...app.querySelectorAll("[name]")].find(
        (el) => el.name === focusName,
      );
    }
    replacement?.focus({ preventScroll: true });
  } else {
    window.scrollTo(0, 0);
    const heading = app.querySelector(
      ".section-heading h2,.shared h2,.handoff h2,h1",
    );
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  renderedPhase = phase;
  if (storageWarning) announce("Saving unavailable. Keep this page open.");
}
function rememberForm() {
  const form = document.querySelector("#setup-form");
  if (!form) return;
  for (let i = 0; i < count; i++) {
    if (controllers[i] === "human") names[i] = form.elements[`name${i}`].value;
    controllers[i] = form.elements[`controller${i}`].value;
  }
  roundSize = form.elements.round.value;
  if (form.elements.custom) custom = form.elements.custom.value;
}
app.addEventListener("change", (e) => {
  if (e.target.name?.startsWith("controller")) {
    rememberForm();
    // Keep the native select mounted and focused: replacing/refocusing it can
    // reopen the iOS picker immediately after the user chooses an option.
    const assigned = playerNames(names.slice(0, count), controllers.slice(0, count));
    const form = e.target.form;
    for (let i = 0; i < count; i++) {
      const input = form.elements[`name${i}`];
      const cpu = controllers[i] !== "human";
      input.value = cpu ? assigned[i] : names[i];
      input.readOnly = cpu;
      input.setAttribute("aria-readonly", String(cpu));
      document.querySelector(`#seat-help${i}`).textContent = LEVEL_HELP[controllers[i]] || "You choose the cards.";
    }
  } else if (e.target.name === "round") {
    rememberForm();
    render();
  }
});
app.addEventListener("submit", (e) => {
  e.preventDefault();
  rememberForm();
  try {
    let course =
      roundSize === "custom"
        ? custom
            .trim()
            .split(/\n/)
            .map((line, i) => {
              const vals = line.split(",");
              if (vals.length !== 2)
                throw new Error(
                  `Hole ${i + 1}: use yards,par (for example 350,4).`,
                );
              return {
                name: `Custom hole ${i + 1}`,
                yards: Number(vals[0]),
                par: Number(vals[1]),
              };
            })
        : generateCourse(Number(roundSize));
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const next = createGame(playerNames(names.slice(0, count), controllers.slice(0, count)), course, seed, controllers.slice(0, count));
    if (game && !confirm("Replace your saved round with a new game?")) return;
    game = next;
    screen = "game";
    problem = "";
    persist();
    render();
    window.scrollTo(0, 0);
  } catch (error) {
    problem = error.message;
    render();
  }
});
app.addEventListener("click", (e) => {
  const b = e.target.closest("[data-do]");
  if (!b || b.disabled) return;
  const id = b.dataset.id,
    target = Number(b.dataset.target);
  switch (b.dataset.do) {
    case "count":
      rememberForm();
      count = Number(b.dataset.count);
      render();
      break;
    case "resume":
      screen = "game";
      render();
      break;
    case "home":
      if (["plan", "reaction", "borrow"].includes(game.phase))
        act({ type: "COVER" });
      screen = "home";
      render();
      break;
    case "rules":
      document.querySelector("#help").showModal();
      break;
    case "open":
      act({ type: "OPEN" });
      break;
    case "cover":
      act({ type: "COVER" });
      break;
    case "club":
      selected.club = selected.club === id ? null : id;
      special = null;
      render();
      break;
    case "action":
      selected.action = selected.action === id ? null : id;
      special = null;
      render();
      break;
    case "target":
      selected.target = target;
      render();
      break;
    case "commit":
      act({ type: "COMMIT", ...selected });
      window.scrollTo(0, 0);
      break;
    case "rest":
      if (confirm("Exchange your whole hand and spend one stroke?"))
        act({ type: "REST" });
      break;
    case "special":
      if (CARD_BY_ID[id].action === "mulligan") {
        announce(
          "Keep this card for the reaction pass after all shots are revealed.",
        );
        break;
      }
      special = { id, cards: [] };
      render();
      document
        .querySelector(".special-panel")
        ?.scrollIntoView({ block: "center" });
      break;
    case "cancel-special":
      special = null;
      render();
      break;
    case "dig-toggle":
      special.cards = special.cards.includes(id)
        ? special.cards.filter((x) => x !== id)
        : [...special.cards, id];
      render();
      break;
    case "dig":
      act({ type: "ANYTIME", card: special.id, cards: special.cards });
      break;
    case "borrow":
      act({ type: "BORROW", card: special.id, target });
      break;
    case "take":
      act({ type: "TAKE", card: id });
      break;
    case "peek": {
      const plan = game.plans[target];
      const info = {
        name: game.players[target].name,
        text: `${CLUBS[CARD_BY_ID[plan.club].club].name}; ${ACTIONS[CARD_BY_ID[plan.action].action].name} targeting ${game.players[plan.target].name}.`,
      };
      act({ type: "ANYTIME", card: special.id, target });
      peek = info;
      render();
      break;
    }
    case "reactions":
      act({ type: "REACTIONS" });
      break;
    case "cancel-effect":
      act({ type: "CANCEL", card: id, target: b.dataset.effect });
      break;
    case "undo-mulligan":
      act({ type: "UNDO_CANCEL" });
      break;
    case "pass":
      act({ type: "PASS" });
      window.scrollTo(0, 0);
      break;
    case "continue":
      act({ type: "CONTINUE" });
      window.scrollTo(0, 0);
      break;
    case "next-hole":
      act({ type: "NEXT_HOLE" });
      window.scrollTo(0, 0);
      break;
  }
});
document
  .querySelector("#help-button")
  .addEventListener("click", () => document.querySelector("#help").showModal());
document
  .querySelector("#close-help")
  .addEventListener("click", () => document.querySelector("#help").close());
document.addEventListener("visibilitychange", () => {
  clearTimeout(cpuTimer);
  if (!document.hidden) { render(); return; }
  if (
    document.hidden &&
    game &&
    ["plan", "reaction", "borrow"].includes(game.phase)
  )
    act({ type: "COVER" });
});
window.addEventListener("storage", (e) => {
  if (e.key === SAVE_KEY) {
    const fresh = loadGame();
    game = fresh.state;
    screen = "home";
    problem = fresh.error || "";
    render();
    announce(
      "The saved round changed in another tab. Resume the latest round here.",
    );
  }
});
render();
if (loaded.error) announce(loaded.error);
if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register("./sw.js")
    .catch(() =>
      announce(
        "Offline installation is unavailable. You can still play while this page is open.",
      ),
    );
