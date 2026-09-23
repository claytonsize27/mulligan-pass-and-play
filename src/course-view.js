// A shared scale keeps every ball comparable, including behind the tee or past the pin.
export function courseScale(yards, positions) {
  const low = Math.min(0, ...positions);
  const high = Math.max(yards, ...positions);
  const margin = Math.max(25, (high - low) * 0.08);
  const min = low < 0 ? low - margin : 0;
  const max = high > yards ? high + margin : yards;
  const at = value => (value - min) / (max - min) * 100;
  return { at, tee: at(0), pin: at(yards), min, max };
}
