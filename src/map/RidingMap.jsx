import { useEffect } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { CARTO_LIGHT_TILE, TILE_ATTRIBUTION } from "./basemap.js";

const DEFAULT_MAP_HEIGHT_PX = 300;

/** Leaflet often measures 0×0 if the container laid out after first paint (e.g. React StrictMode). */
function InvalidateSizeAndFit({ geojson }) {
  const map = useMap();
  useEffect(() => {
    const run = () => {
      map.invalidateSize({ animate: false });
      if (!geojson) return;
      const layer = L.geoJSON(geojson);
      const b = layer.getBounds();
      if (b.isValid()) {
        map.fitBounds(b, { padding: [24, 24], maxZoom: 11, animate: false });
      }
    };
    const t = window.setTimeout(run, 0);
    return () => clearTimeout(t);
  }, [map, geojson]);
  return null;
}

/**
 * @param {{
 *   feature: import("geojson").Feature | null;
 *   interactive?: boolean;
 *   heightPx?: number;
 * }} props
 */
export function RidingMap({ feature, interactive = false, heightPx = DEFAULT_MAP_HEIGHT_PX }) {
  const bcCenter = [54.5, -125.5];
  const zoom = 5;

  if (!feature?.geometry) {
    return (
      <div className="map-wrap muted" style={{ display: "grid", placeItems: "center" }}>
        No map geometry for this riding.
      </div>
    );
  }

  // High-contrast outline so the BC Data boundary reads on a light basemap
  const style = {
    color: "#0ea5e9",
    weight: 3,
    fillColor: "#38bdf8",
    fillOpacity: 0.28,
  };

  const mapKey =
    feature.properties?.id ??
    feature.properties?.ridingKey ??
    feature.properties?.name ??
    "riding";

  return (
    <MapContainer
      key={String(mapKey)}
      className="map-wrap riding-map-container"
      style={{ height: heightPx, width: "100%" }}
      center={bcCenter}
      zoom={zoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      touchZoom={interactive}
      attributionControl
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={CARTO_LIGHT_TILE} />
      <GeoJSON data={feature} style={() => style} interactive={false} />
      <InvalidateSizeAndFit geojson={feature} />
    </MapContainer>
  );
}
