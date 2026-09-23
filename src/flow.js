// Autoplay skips shared shot screens only once every human has finished.
// CPU decisions are scheduled independently of this shared-screen preference.
export function automaticEvent(s, enabled = true) {
  if (!enabled || !s.players.some(p => p.controller && p.controller !== "human")) return null;
  if (s.players.some(p => (!p.controller || p.controller === "human") && !p.done)) return null;
  const type = { reveal: "REACTIONS", results: "CONTINUE" }[s.phase];
  return type ? {type} : null; // Hole Complete always requires a manual click.
}
