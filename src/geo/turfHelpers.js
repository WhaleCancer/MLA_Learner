import bearing from "@turf/bearing";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import centroid from "@turf/centroid";
import distance from "@turf/distance";
import { point } from "@turf/helpers";

/**
 * @param {import("geojson").Feature} feature
 * @returns {[number, number]|null} [lng, lat] centroid
 */
export function featureCentroidLngLat(feature) {
  if (!feature?.geometry) return null;
  const c = centroid(feature);
  return c.geometry.coordinates;
}

/**
 * @param {import("geojson").Feature} polygonFeature
 * @param {[number, number]} lngLat
 */
export function isPointInRiding(polygonFeature, lngLat) {
  if (!polygonFeature?.geometry || !lngLat) return false;
  return booleanPointInPolygon(point(lngLat), polygonFeature);
}

/**
 * @param {[number, number]} fromLngLat
 * @param {[number, number]} toLngLat
 */
export function bearingDegrees(fromLngLat, toLngLat) {
  return bearing(point(fromLngLat), point(toLngLat));
}

/**
 * @param {[number, number]} aLngLat
 * @param {[number, number]} bLngLat
 */
export function distanceKm(aLngLat, bLngLat) {
  return distance(point(aLngLat), point(bLngLat), { units: "kilometers" });
}
