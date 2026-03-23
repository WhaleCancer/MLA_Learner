import { randomInt, shuffle } from "./shuffle.js";

/**
 * Coarse gender buckets for quiz distractors (portrait questions).
 * OpenNorth often leaves gender blank; we infer from given name where possible.
 * "U" = unknown / ambiguous — excluded from gender-filtered portrait pools.
 */

/** Full-name overrides when first-name parsing is wrong or ambiguous */
const NAME_OVERRIDES = new Map([
  ["hon chan", "M"],
  ["dallas brodie", "F"],
  ["jordan kealy", "M"],
  ["jody toor", "F"],
  ["brennan day", "M"],
  ["korky neufeld", "M"],
  ["á'a:líya warbus", "F"],
]);

const MALE = new Set(
  [
    "adrian",
    "brent",
    "bruce",
    "bryan",
    "david",
    "donegal",
    "garry",
    "gavin",
    "george",
    "harman",
    "ian",
    "jagrup",
    "jeremy",
    "john",
    "kiel",
    "larry",
    "lawrence",
    "lorne",
    "macklin",
    "mandeep",
    "mike",
    "paul",
    "pete",
    "peter",
    "raj",
    "ravi",
    "rick",
    "rob",
    "scott",
    "sheldon",
    "spencer",
    "steve",
    "terry",
    "tony",
    "trevor",
    "ward",
  ].map((s) => s.toLowerCase()),
);

const FEMALE = new Set(
  [
    "amelia",
    "amna",
    "anna",
    "anne",
    "bowinn",
    "brenda",
    "brittny",
    "christine",
    "claire",
    "dana",
    "darlene",
    "diana",
    "elenore",
    "grace",
    "harwinder",
    "heather",
    "janet",
    "jennifer",
    "jessie",
    "jodie",
    "josie",
    "kelly",
    "kristina",
    "lana",
    "linda",
    "lisa",
    "lynne",
    "mable",
    "misty",
    "niki",
    "nina",
    "randene",
    "reann",
    "rohini",
    "rosalyn",
    "sharon",
    "sheila",
    "stephanie",
    "sunita",
    "susie",
    "tara",
    "teresa",
    "joan",
    "tamara",
    "debra",
  ].map((s) => s.toLowerCase()),
);

/**
 * Prefer the right-hand segment of "Traditional - English" style first names.
 * @param {string} firstName
 */
export function primaryGivenToken(firstName) {
  const raw = String(firstName || "")
    .trim()
    .toLowerCase()
    .normalize("NFKC");
  if (!raw || raw === "hon") return "";
  const segments = raw.split(/\s*-\s*/);
  const lastSeg = segments[segments.length - 1].trim();
  const firstWord = lastSeg.split(/\s+/).filter(Boolean)[0] ?? "";
  return firstWord.replace(/^['’]+/, "").replace(/['’]+$/g, "");
}

/**
 * @param {object} mla
 * @returns {"M"|"F"|"U"}
 */
export function genderBucket(mla) {
  const nk = String(mla.name || "")
    .trim()
    .toLowerCase();
  const o = NAME_OVERRIDES.get(nk);
  if (o) return o;

  const api = String(mla.gender || "")
    .trim()
    .toUpperCase();
  if (api === "M" || api === "F") return api;

  const token = primaryGivenToken(mla.firstName);
  if (!token) return "U";
  if (MALE.has(token)) return "M";
  if (FEMALE.has(token)) return "F";
  return "U";
}

/**
 * Correct MLA = any with a photo; distractors prefer the same inferred gender (then fill from
 * everyone else) so every photo MLA can be asked while keeping options hard to guess by gender alone.
 *
 * @param {object[]} withPhoto
 * @param {() => number} rng
 * @param {number} k — total options (correct + distractors)
 * @returns {{ correct: object; others: object[] } | null}
 */
export function pickPortraitMcOptions(withPhoto, rng, k) {
  if (withPhoto.length < k) return null;
  const correct = withPhoto[randomInt(0, withPhoto.length - 1, rng)];
  const need = k - 1;
  const g = genderBucket(correct);

  const sameGender = withPhoto.filter(
    (m) => m.id !== correct.id && (g === "U" || genderBucket(m) === g),
  );
  const everyoneElse = withPhoto.filter((m) => m.id !== correct.id);

  const others = [];
  const seen = new Set([correct.id]);
  const pullFrom = (list) => {
    for (const m of shuffle(list, rng)) {
      if (others.length >= need) break;
      if (seen.has(m.id)) continue;
      others.push(m);
      seen.add(m.id);
    }
  };
  pullFrom(sameGender);
  if (others.length < need) pullFrom(everyoneElse);

  if (others.length < need) return null;
  return { correct, others };
}
