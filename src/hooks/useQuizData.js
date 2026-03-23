import { useCallback, useEffect, useState } from "react";

/**
 * @typedef {object} QuizBundle
 * @property {import("geojson").FeatureCollection} ridings
 * @property {object[]} mlas
 * @property {{ fetchedAt?: string }} meta
 */

/**
 * @returns {{ status: string, error: string|null, bundle: QuizBundle|null, reload: () => void }}
 */
export function useQuizData() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [bundle, setBundle] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [ridingsRes, mlasRes, sourcesRes] = await Promise.all([
        fetch(`${import.meta.env.BASE_URL}data/ridings.geojson`),
        fetch(`${import.meta.env.BASE_URL}data/mlas.json`),
        fetch(`${import.meta.env.BASE_URL}sources.json`),
      ]);
      if (!ridingsRes.ok) throw new Error(`ridings.geojson: HTTP ${ridingsRes.status}`);
      if (!mlasRes.ok) throw new Error(`mlas.json: HTTP ${mlasRes.status}`);

      const ridings = await ridingsRes.json();
      const mlasPayload = await mlasRes.json();
      const mlas = mlasPayload.mlas ?? [];
      const meta = {
        ...(mlasPayload.meta ?? {}),
      };

      if (sourcesRes.ok) {
        const sources = await sourcesRes.json();
        if (sources?.fetchedAt) meta.fetchedAt = sources.fetchedAt;
      }

      if (!ridings?.features?.length) throw new Error("Riding dataset is empty.");
      if (!mlas.length) throw new Error("MLA list is empty.");

      setBundle({ ridings, mlas, meta });
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      setBundle(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { status, error, bundle, reload: load };
}
