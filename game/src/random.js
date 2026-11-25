// random.js — a tiny seeded random number generator (mulberry32).
// The game uses it for order spawning and customer lines, and the
// screenshot mode seeds it so every staged shot renders identically.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one element of an array with the given rng.
export function pickFrom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// A whole number between min and max, both inclusive, from the given rng.
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Shuffle a copy of an array in place, using the given rng.
export function shuffleWith(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
