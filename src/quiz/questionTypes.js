/** @type {const} */
export const QUESTION_TYPE_IDS = [1, 2, 3, 4, 5, 6];

/** Shown above each question and as the checkbox heading on the start screen */
export const QUESTION_TYPE_TITLE = {
  1: "Name the MLA",
  2: "Match the portrait",
  3: "Riding from the map",
  4: "MLA’s riding",
  5: "Cabinet & legislative role",
  6: "Headline office",
};

/** One-line explanation beside each checkbox */
export const QUESTION_TYPE_DESCRIPTION = {
  1: "Pick the correct name for the official portrait.",
  2: "Given a name, tap the matching portrait.",
  3: "Pick the riding name from the outlined district.",
  4: "Pick the electoral district this MLA represents.",
  5: "Pick their ministry, parliamentary secretary title, or backbench role.",
  6: "Who holds a major portfolio? Each choice shows a portrait and name.",
};

export const CHOICE_COUNT_MIN = 3;
export const CHOICE_COUNT_MAX = 8;
export const DEFAULT_CHOICE_COUNT = 5;

/** @param {number} n */
export function clampChoiceCount(n) {
  const k = Math.floor(Number(n));
  if (!Number.isFinite(k)) return DEFAULT_CHOICE_COUNT;
  return Math.min(CHOICE_COUNT_MAX, Math.max(CHOICE_COUNT_MIN, k));
}

/** @returns {Record<number, boolean>} */
export function defaultTypeSelection() {
  return Object.fromEntries(QUESTION_TYPE_IDS.map((id) => [id, true]));
}

/**
 * @param {Record<number, boolean>} selection
 * @returns {number[]}
 */
export function enabledTypeList(selection) {
  const headlineOn = Boolean(selection[6] || selection[7]);
  return QUESTION_TYPE_IDS.filter((id) =>
    id === 6 ? headlineOn : selection[id],
  );
}
