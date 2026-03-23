import { distanceKm, featureCentroidLngLat } from "../geo/turfHelpers.js";
import { shuffle, takeUniqueWhere } from "./shuffle.js";

/**
 * Pick `need` distractor riding features that are geographically close to `correctFeature`
 * (centroid distance), shuffled from a pool of the nearest ~max(need*5, 20) ridings so options
 * stay regional but not identical every time.
 *
 * @param {import("geojson").Feature} correctFeature
 * @param {import("geojson").Feature[]} ridingFeatures
 * @param {number} need
 * @param {() => number} rng
 * @returns {import("geojson").Feature[] | null}
 */
export function pickNearbyRidingDistractorFeatures(correctFeature, ridingFeatures, need, rng) {
  if (need < 1) return [];
  const origin = featureCentroidLngLat(correctFeature);
  if (!origin) return null;

  const correctName = correctFeature.properties?.name ?? "";
  const scored = [];
  for (const f of ridingFeatures) {
    const n = f.properties?.name ?? "";
    if (!n || n === correctName) continue;
    const c = featureCentroidLngLat(f);
    if (!c) continue;
    scored.push({ f, dist: distanceKm(origin, c) });
  }
  scored.sort((a, b) => a.dist - b.dist);

  if (scored.length < need) return null;

  const poolSize = Math.min(scored.length, Math.max(need * 5, 20));
  const pool = scored.slice(0, poolSize).map((s) => s.f);
  const picked = shuffle(pool, rng).slice(0, need);
  return picked.length === need ? picked : null;
}

/**
 * @param {import("geojson").Feature[]} ridingFeatures
 * @param {string} ridingName
 * @param {string} [ridingMatchKey]
 */
export function findRidingFeatureByMla(ridingFeatures, ridingName, ridingMatchKey) {
  if (ridingName) {
    const byName = ridingFeatures.find((f) => f.properties?.name === ridingName);
    if (byName) return byName;
  }
  if (ridingMatchKey) {
    return ridingFeatures.find((f) => f.properties?.ridingKey === ridingMatchKey) ?? null;
  }
  return null;
}

/**
 * @param {string[]} allRidingNames
 * @param {string} correctRiding
 * @param {number} need
 * @param {() => number} rng
 */
export function pickRandomRidingNameDistractors(allRidingNames, correctRiding, need, rng) {
  return takeUniqueWhere(
    allRidingNames,
    (n) => n === correctRiding,
    need,
    rng,
  );
}
