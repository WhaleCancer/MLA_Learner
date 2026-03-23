import { shuffle } from "./shuffle.js";

/** Shown when an MLA has no Executive Council / parliamentary secretary appointment in the dataset */
export const BACKBENCH_ROLE_LABEL =
  "MLA (not currently a minister or parliamentary secretary)";

const INSTITUTIONAL_DECOYS = [
  "Speaker of the Legislative Assembly",
  "Clerk of the Legislative Assembly",
  "Sergeant-at-Arms of the Legislative Assembly",
];

/**
 * Primary label for quiz type 5: cabinet / parliamentary secretary title when known.
 * @param {object} mla
 */
export function executiveRoleLabel(mla) {
  if (mla.executiveTitle) return mla.executiveTitle;
  return BACKBENCH_ROLE_LABEL;
}

/**
 * All strings that can appear as multiple-choice options (titles + decoys + backbench).
 * @param {object[]} mlas
 */
export function allExecutiveRoleOptionPool(mlas) {
  const set = new Set();
  for (const m of mlas) {
    if (m.executiveTitle) set.add(m.executiveTitle);
  }
  set.add(BACKBENCH_ROLE_LABEL);
  for (const d of INSTITUTIONAL_DECOYS) set.add(d);
  return [...set];
}

/**
 * @param {string} correct
 * @param {string[]} pool
 * @param {number} totalOptions
 * @param {() => number} rng
 */
export function pickRoleOptions(correct, pool, totalOptions, rng) {
  const wrong = shuffle(
    pool.filter((p) => p !== correct),
    rng,
  );
  const need = totalOptions - 1;
  const picks = wrong.slice(0, need);
  let decoyIdx = 0;
  while (picks.length < need) {
    const extra = INSTITUTIONAL_DECOYS.find((d) => d !== correct && !picks.includes(d));
    if (extra) {
      picks.push(extra);
      continue;
    }
    decoyIdx += 1;
    picks.push(`Other portfolio or role (${decoyIdx})`);
  }
  return shuffle([correct, ...picks.slice(0, need)], rng);
}
