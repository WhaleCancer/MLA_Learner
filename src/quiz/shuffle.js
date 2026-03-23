/**
 * @template T
 * @param {T[]} arr
 * @param {() => number} [rng]
 * @returns {T[]}
 */
export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @template T
 * @param {T[]} pool
 * @param {(item: T) => boolean} exclude
 * @param {number} n
 * @param {() => number} [rng]
 */
export function takeUniqueWhere(pool, exclude, n, rng = Math.random) {
  const copy = shuffle(pool, rng);
  const out = [];
  for (const item of copy) {
    if (exclude(item)) continue;
    out.push(item);
    if (out.length >= n) break;
  }
  return out;
}

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} [rng]
 */
export function randomInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
