import {
  BACKBENCH_ROLE_LABEL,
  allExecutiveRoleOptionPool,
  pickRoleOptions,
} from "./executiveRoles.js";
import { pickPortraitMcOptions } from "./genderFromFirstName.js";
import { headlinesWithMatches } from "./headlinePortfolios.js";
import {
  findRidingFeatureByMla,
  pickNearbyRidingDistractorFeatures,
  pickRandomRidingNameDistractors,
} from "./ridingProximity.js";
import { QUESTION_TYPE_IDS, clampChoiceCount } from "./questionTypes.js";
import { randomInt, shuffle, takeUniqueWhere } from "./shuffle.js";

/**
 * @typedef {object} QuizOption
 * @property {string} id
 * @property {string} label
 * @property {string} [imageUrl]
 */

/**
 * @typedef {object} QuizQuestion
 * @property {1|2|3|4|5|6} type
 * @property {string} prompt
 * @property {QuizOption[]} options
 * @property {string} correctOptionId
 * @property {object} [reveal]
 */

/**
 * @param {import("../hooks/useQuizData.js").QuizBundle} bundle
 */
function pools(bundle) {
  const { mlas, ridings } = bundle;
  const withPhoto = mlas.filter((m) => Boolean(m.photoUrl));
  const withRidingMap = mlas.filter((m) => m.hasRidingGeometry);
  const ridingFeatures = ridings.features.filter((f) => f?.geometry && f.properties?.name);
  return { withPhoto, withRidingMap, ridingFeatures };
}

/** Party + Executive Council / PS title for post-answer “learn more” lines */
function mlaPartyAndRoleReveal(mla) {
  const party = mla.partyShort ?? mla.party;
  const role = mla.executiveTitle;
  return {
    party,
    ...(role ? { role } : {}),
  };
}

/** @type {(bundle: import("../hooks/useQuizData.js").QuizBundle, rng: () => number, k: number) => QuizQuestion | null} */
function buildType1(bundle, rng, k) {
  const { withPhoto } = pools(bundle);
  const picked = pickPortraitMcOptions(withPhoto, rng, k);
  if (!picked) return null;
  const { correct, others } = picked;
  const optionMlAs = shuffle([correct, ...others], rng);
  return {
    type: 1,
    prompt: "Who is pictured below?",
    options: optionMlAs.map((m) => ({
      id: m.id,
      label: m.name,
    })),
    correctOptionId: correct.id,
    reveal: {
      name: correct.name,
      riding: correct.ridingName,
      ...mlaPartyAndRoleReveal(correct),
    },
    _mla: correct,
  };
}

function buildType2(bundle, rng, k) {
  const { withPhoto } = pools(bundle);
  const picked = pickPortraitMcOptions(withPhoto, rng, k);
  if (!picked) return null;
  const { correct, others } = picked;
  const optionMlAs = shuffle([correct, ...others], rng);
  return {
    type: 2,
    prompt: `Pick the portrait of ${correct.name}.`,
    options: optionMlAs.map((m) => ({
      id: m.id,
      label: m.name,
      imageUrl: m.photoUrl,
    })),
    correctOptionId: correct.id,
    reveal: {
      name: correct.name,
      riding: correct.ridingName,
      ...mlaPartyAndRoleReveal(correct),
    },
    _mla: correct,
  };
}

function buildType3(bundle, rng, k) {
  const { ridingFeatures } = pools(bundle);
  if (ridingFeatures.length < k) return null;
  const correct = ridingFeatures[randomInt(0, ridingFeatures.length - 1, rng)];
  const correctName = correct.properties?.name ?? "";
  const others =
    pickNearbyRidingDistractorFeatures(correct, ridingFeatures, k - 1, rng) ??
    takeUniqueWhere(
      ridingFeatures,
      (f) => f.properties?.name === correctName,
      k - 1,
      rng,
    );
  if (!others || others.length < k - 1) return null;
  const names = shuffle(
    [correctName, ...others.map((f) => f.properties?.name ?? "")],
    rng,
  );

  const rKey = correct.properties?.ridingKey ?? "";
  const mlaForRiding =
    bundle.mlas.find((m) => m.ridingMatchKey === rKey && rKey) ??
    bundle.mlas.find((m) => m.ridingName === correctName) ??
    null;

  return {
    type: 3,
    prompt: "Which riding is outlined below?",
    options: names.map((n) => ({ id: `nm:${n}`, label: n })),
    correctOptionId: `nm:${correctName}`,
    reveal: {
      riding: correctName,
      ...(mlaForRiding
        ? { name: mlaForRiding.name, ...mlaPartyAndRoleReveal(mlaForRiding) }
        : {}),
    },
    _feature: correct,
    _mla: mlaForRiding,
  };
}

function buildType4(bundle, rng, k) {
  const { ridingFeatures } = pools(bundle);
  const candidates = bundle.mlas.filter((m) => m.photoUrl);
  if (candidates.length < 1) return null;
  const allRidingNames = [
    ...new Set(ridingFeatures.map((f) => f.properties?.name).filter(Boolean)),
  ];
  if (allRidingNames.length < k) return null;
  const correct = candidates[randomInt(0, candidates.length - 1, rng)];
  const correctRiding = correct.ridingName;
  const correctFeature = findRidingFeatureByMla(
    ridingFeatures,
    correctRiding,
    correct.ridingMatchKey ?? correct.ridingKey,
  );
  let finalOtherNames;
  if (correctFeature) {
    const nearFeats = pickNearbyRidingDistractorFeatures(
      correctFeature,
      ridingFeatures,
      k - 1,
      rng,
    );
    if (nearFeats && nearFeats.length === k - 1) {
      const ns = nearFeats.map((f) => f.properties?.name ?? "");
      if (ns.every(Boolean)) finalOtherNames = ns;
    }
  }
  if (!finalOtherNames) {
    finalOtherNames = pickRandomRidingNameDistractors(allRidingNames, correctRiding, k - 1, rng);
  }
  if (!finalOtherNames || finalOtherNames.length < k - 1) return null;
  const labels = shuffle([correctRiding, ...finalOtherNames], rng);
  return {
    type: 4,
    prompt: `Which riding does ${correct.name} represent?`,
    options: labels.map((n) => ({ id: `nm:${n}`, label: n })),
    correctOptionId: `nm:${correctRiding}`,
    reveal: {
      riding: correctRiding,
      mla: correct.name,
      ...mlaPartyAndRoleReveal(correct),
    },
    _mla: correct,
  };
}

function buildType5(bundle, rng, k) {
  const { withPhoto } = pools(bundle);
  if (withPhoto.length < 1) return null;

  const withExec = withPhoto.filter((m) => m.executiveTitle);
  const withBackbench = withPhoto.filter((m) => !m.executiveTitle);

  let correctMla;
  let correct;

  const preferExec = withExec.length >= 2 && rng() < 0.85;
  if (preferExec) {
    correctMla = withExec[randomInt(0, withExec.length - 1, rng)];
    correct = correctMla.executiveTitle;
  } else if (withBackbench.length >= 1 && withExec.length >= 1 && rng() < 0.35) {
    correctMla = withBackbench[randomInt(0, withBackbench.length - 1, rng)];
    correct = BACKBENCH_ROLE_LABEL;
  } else if (withExec.length >= 1) {
    correctMla = withExec[randomInt(0, withExec.length - 1, rng)];
    correct = correctMla.executiveTitle;
  } else if (withBackbench.length >= 1) {
    correctMla = withBackbench[randomInt(0, withBackbench.length - 1, rng)];
    correct = BACKBENCH_ROLE_LABEL;
  } else {
    return null;
  }

  const pool = allExecutiveRoleOptionPool(bundle.mlas);
  const labels = pickRoleOptions(correct, pool, k, rng);
  const correctIndex = labels.indexOf(correct);
  return {
    type: 5,
    prompt: `What is ${correctMla.name}'s cabinet or legislative role? (${correctMla.ridingName})`,
    options: labels.map((label, i) => ({ id: `role-${i}`, label })),
    correctOptionId: `role-${correctIndex >= 0 ? correctIndex : 0}`,
    reveal: {
      name: correctMla.name,
      riding: correctMla.ridingName,
      ...mlaPartyAndRoleReveal(correctMla),
      role: correct,
    },
    _mla: correctMla,
  };
}

function buildType6(bundle, rng, k) {
  const { withPhoto } = pools(bundle);
  if (withPhoto.length < k) return null;
  const headlines = headlinesWithMatches(bundle.mlas, { requirePhoto: true });
  if (headlines.length === 0) return null;
  const headline = headlines[randomInt(0, headlines.length - 1, rng)];
  const holders = withPhoto.filter((m) => m.executiveTitle && headline.test(m.executiveTitle));
  if (holders.length === 0) return null;
  const correct = holders[randomInt(0, holders.length - 1, rng)];
  const others = takeUniqueWhere(withPhoto, (m) => m.id === correct.id, k - 1, rng);
  if (others.length < k - 1) return null;
  const optionMlAs = shuffle([correct, ...others], rng);
  return {
    type: 6,
    prompt: headline.prompt,
    options: optionMlAs.map((m) => ({
      id: m.id,
      label: m.name,
      imageUrl: m.photoUrl,
    })),
    correctOptionId: correct.id,
    reveal: {
      name: correct.name,
      riding: correct.ridingName,
      role: correct.executiveTitle,
      ...mlaPartyAndRoleReveal(correct),
    },
    _mla: correct,
  };
}

const factories = {
  1: buildType1,
  2: buildType2,
  3: buildType3,
  4: buildType4,
  5: buildType5,
  6: buildType6,
};

/**
 * @param {import("../hooks/useQuizData.js").QuizBundle} bundle
 * @param {number} count
 * @param {number[]} [enabledTypes] — subset of question type ids; default all
 * @param {number} [choiceCount] — options per question (clamped 3–8)
 */
export function buildSession(bundle, count, enabledTypes = QUESTION_TYPE_IDS, choiceCount = 5) {
  const rng = Math.random;
  const k = clampChoiceCount(choiceCount);
  const pool = enabledTypes.filter((t) => factories[t]);
  if (pool.length === 0) return { questions: [] };

  const questions = [];
  const maxAttempts = count * 40;
  let attempts = 0;
  while (questions.length < count && attempts < maxAttempts) {
    attempts += 1;
    const order = shuffle(pool, rng);
    let added = false;
    for (const t of order) {
      const q = factories[t](bundle, rng, k);
      if (q && q.correctOptionId) {
        questions.push(q);
        added = true;
        break;
      }
    }
    if (!added) break;
  }
  return { questions };
}

/**
 * @param {QuizQuestion} q
 * @param {import("../hooks/useQuizData.js").QuizBundle} bundle
 */
export function resolveQuestionMapFeature(q, bundle) {
  if (q.type !== 3) return null;
  if (q._feature) return q._feature;
  const name = q.reveal?.riding;
  return bundle.ridings.features.find((f) => f.properties?.name === name) ?? null;
}

/**
 * Riding boundary feature for an MLA (type 4 / type 5 map beside portrait).
 * @param {object | null | undefined} mla
 * @param {import("../hooks/useQuizData.js").QuizBundle} bundle
 */
export function resolveMlaRidingFeature(mla, bundle) {
  if (!mla || !bundle?.ridings?.features?.length) return null;
  const rKey = mla.ridingMatchKey ?? mla.ridingKey ?? "";
  if (rKey) {
    const byKey = bundle.ridings.features.find(
      (f) => f.properties?.ridingKey === rKey && f.geometry,
    );
    if (byKey) return byKey;
  }
  const name = mla.ridingName ?? "";
  if (name) {
    return (
      bundle.ridings.features.find((f) => f.properties?.name === name && f.geometry) ?? null
    );
  }
  return null;
}
