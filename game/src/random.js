// BRANKAS — Deck Heist. Seeded randomness: one small generator drives every
// shuffle, draft and enemy wobble, so a seed always replays the same run.
export function createRandom(seed) {
  let a = seed >>> 0;
  if (a === 0) a = 0x9e3779b9;
  function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function nextInt(n) {
    return Math.floor(next() * n);
  }
  function pick(list) {
    return list[nextInt(list.length)];
  }
  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = nextInt(i + 1);
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }
  return { next, nextInt, pick, shuffle };
}
