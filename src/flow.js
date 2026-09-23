// Shared screens need no decision. Keep privacy gates only for shared phones.
export function automaticEvent(s) {
  if (!s.players.some(p => p.controller && p.controller !== "human")) return null;
  const shared = { reveal: "REACTIONS", results: "CONTINUE", score: "NEXT_HOLE" }[s.phase];
  if (shared) return {type: shared};
  return null;
}
