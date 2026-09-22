// House deck: verified total, reconstructed frequencies and pairings. See docs/RULES.md.
export const CLUBS = {
  driver: { name: 'Driver', yards: 300, note: 'First shot of a hole only.' },
  wood: { name: 'Fairway wood', yards: 250, note: 'A long shot down the fairway.' },
  hybrid: { name: 'Hybrid', yards: 200, note: 'Keep your approach in reach.' },
  iron: { name: 'Iron', yards: 150, note: 'A measured approach.' },
  wedge: { name: 'Pitching wedge', yards: 100, note: 'Close in on the green.' },
  lob: { name: 'Lob wedge', yards: 50, note: 'A short approach.' },
  putt: { name: '1-Putt', yards: 25, note: 'Within 25 yd: hole out. Immune to actions.' }
};
export const ACTIONS = {
  rough: { name: 'Rough', text: 'Take 50 yd off the target’s shot.', delta: -50 },
  slice: { name: 'Slice', text: 'Take 25 yd off the target’s shot.', delta: -25 },
  hook: { name: 'Hook', text: 'Add 25 yd to the target’s shot.', delta: 25 },
  sand: { name: 'Sand trap', text: 'Halve the target’s shot distance.', half: true },
  bounds: { name: 'Out of bounds', text: 'Add two penalty strokes to the target.', penalty: 2 },
  fairway: { name: 'Clear fairway', text: 'No change. A safe action for yourself.', delta: 0 },
  dig: { name: 'Dig through the bag', text: 'Before planning: exchange any other cards in your hand.', anytime: true },
  borrow: { name: 'Borrow a club', text: 'Before planning: look at another hand and take one card.', anytime: true },
  read: { name: 'Read the lie', text: 'Before planning: inspect an already locked shot.', anytime: true },
  mulligan: { name: 'Mulligan', text: 'After reveal: cancel one action or an earlier cancellation.', anytime: true }
};
const clubs = [['driver',12],['wood',12],['hybrid',16],['iron',16],['wedge',16],['lob',16],['putt',16]];
const actions = [['rough',16],['slice',16],['hook',12],['sand',12],['bounds',8],['fairway',16],['dig',8],['borrow',4],['read',4],['mulligan',8]];
const expand = list => list.flatMap(([key,count]) => Array(count).fill(key));
const faces = expand(actions);
export const CARDS = expand(clubs).map((club,i) => ({ id: `c${i}`, club, action: faces[(i * 37) % 104] }));
export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id,c]));
export const HAND_SIZE = 8;
