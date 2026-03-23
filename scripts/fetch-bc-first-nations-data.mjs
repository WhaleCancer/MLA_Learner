/**
 * Data pipeline: BC provincial electoral district polygons (GeoJSON) + current MLAs (OpenNorth).
 * Output: public/data/ridings.geojson, public/data/mlas.json, public/sources.json
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "data");

const RIDINGS_LAYER =
  "https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_admin_boundaries/MapServer/6/query";

const REPRESENT_BASE = "https://represent.opennorth.ca/representatives/bc-legislature/";

const CABINET_PAGE_URL =
  "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/cabinet/cabinet-ministers";

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&lsquo;|&#8216;/g, "'")
    .replace(/&ldquo;|&#8220;/g, '"')
    .replace(/&rdquo;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

function normalizeExecutivePersonName(s) {
  return s
    .replace(/^honourable\s+/i, "")
    .replace(/,?\s*mla\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * @param {string} html
 * @returns {{ rawName: string, title: string }[]}
 */
function parseCabinetRolesHtml(html) {
  const entries = [];
  const h3re = /<h3[^>]*class="bc_h3"[^>]*>([\s\S]*?)<\/h3>/gi;
  let m;
  while ((m = h3re.exec(html)) !== null) {
    const nameHtml = m[1];
    const rest = html.slice(m.index + m[0].length, m.index + m[0].length + 8000);
    const h4m = /<h4[^>]*class="bc_h4"[^>]*>([\s\S]*?)<\/h4>/i.exec(rest);
    if (!h4m) continue;
    const rawName = stripTags(nameHtml);
    const title = stripTags(h4m[1]);
    if (!rawName || !title) continue;
    entries.push({ rawName, title });
  }
  return entries;
}

async function fetchExecutiveRoles() {
  const res = await fetch(CABINET_PAGE_URL);
  if (!res.ok) throw new Error(`Cabinet page HTTP ${res.status}`);
  return parseCabinetRolesHtml(await res.text());
}

/**
 * Match cabinet-page names to OpenNorth `mla.name` (may include Indigenous or preferred names).
 * @param {object[]} mlas
 * @param {{ rawName: string, title: string }[]} roleEntries
 */
function mergeExecutiveTitles(mlas, roleEntries) {
  const rows = roleEntries.map(({ rawName, title }) => ({
    nameKey: normalizeExecutivePersonName(rawName),
    title,
  }));

  /**
   * @param {string} mlaName
   */
  function titleForMlaName(mlaName) {
    const mk = normalizeExecutivePersonName(mlaName);
    const direct = rows.find((r) => r.nameKey === mk);
    if (direct) return direct.title;

    const suffixHits = rows.filter(
      (r) =>
        r.nameKey.length >= 10 &&
        (mk.endsWith(r.nameKey) ||
          mk.includes(`- ${r.nameKey}`) ||
          mk.includes(`– ${r.nameKey}`)),
    );
    if (suffixHits.length === 1) return suffixHits[0].title;
    return null;
  }

  let matched = 0;
  const out = mlas.map((mla) => {
    const executiveTitle = titleForMlaName(mla.name);
    if (executiveTitle) matched += 1;
    return { ...mla, executiveTitle };
  });
  return { mlas: out, matched, roleCount: roleEntries.length };
}

function ridingKeyFromName(name) {
  return String(name || "")
    .normalize("NFKC")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Map OpenNorth ridingKey -> ArcGIS ridingKey when names differ between datasets */
const OPENNORTH_TO_ARCGIS_RIDING_KEY = {
  // "opennorth-key": "arcgis-key",
};

function arcgisRidingKey(opennorthKey) {
  return OPENNORTH_TO_ARCGIS_RIDING_KEY[opennorthKey] ?? opennorthKey;
}

async function fetchArcgisGeoJson() {
  const pageSize = 200;
  let offset = 0;
  const features = [];

  for (;;) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      f: "geojson",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
    });
    const res = await fetch(`${RIDINGS_LAYER}?${params}`);
    if (!res.ok) throw new Error(`ArcGIS HTTP ${res.status}`);
    const gj = await res.json();
    const batch = gj.features ?? [];
    if (batch.length === 0) break;
    features.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return {
    type: "FeatureCollection",
    features: features.map((f, i) => {
      const attrs = f.properties ?? {};
      const name =
        attrs.ED_NAME ?? attrs.ELECTORAL_DISTRICT_NAME ?? attrs.FEATURE_NAME ?? `District ${i + 1}`;
      const id =
        attrs.ELECTORAL_DISTRICT_ID ??
        attrs.OBJECTID ??
        attrs.FID ??
        `riding-${i + 1}`;
      const key = ridingKeyFromName(name);
      return {
        ...f,
        properties: {
          ...attrs,
          id: String(id),
          name: String(name),
          ridingKey: key,
        },
      };
    }),
  };
}

async function fetchAllMlas() {
  const limit = 100;
  let offset = 0;
  const objects = [];

  for (;;) {
    const url = new URL(REPRESENT_BASE);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenNorth HTTP ${res.status}`);
    const data = await res.json();
    const batch = data.objects ?? [];
    objects.push(...batch);
    const total = data.meta?.total_count ?? objects.length;
    offset += batch.length;
    if (batch.length === 0 || offset >= total) break;
  }

  return objects.map((o, i) => {
    const district = o.district_name ?? "";
    const onKey = ridingKeyFromName(district);
    const matchKey = arcgisRidingKey(onKey);
    return {
      id: `mla-${i + 1}-${ridingKeyFromName(o.name ?? "")}`,
      name: o.name ?? `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim(),
      firstName: o.first_name ?? "",
      lastName: o.last_name ?? "",
      ridingName: district,
      ridingKey: onKey,
      ridingMatchKey: matchKey,
      party: o.party_name ?? "Unknown",
      photoUrl: o.photo_url || "",
      gender: typeof o.gender === "string" ? o.gender.trim() : "",
      offices: o.offices ?? [],
    };
  });
}

function shortPartyName(full) {
  const m = {
    "British Columbia New Democratic Party": "BC NDP",
    "Conservative Party of British Columbia": "BC Conservative",
    "Green Party of British Columbia": "BC Greens",
    "BC United": "BC United",
    "British Columbia Liberal Party": "BC Liberal",
  };
  return m[full] ?? full;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const fetchedAt = new Date().toISOString();

  const [ridings, mlasRaw] = await Promise.all([fetchArcgisGeoJson(), fetchAllMlas()]);

  let roleEntries = [];
  try {
    roleEntries = await fetchExecutiveRoles();
  } catch (e) {
    console.warn("Cabinet / parliamentary secretary scrape failed:", e?.message ?? e);
  }

  const ridingByKey = new Map();
  for (const f of ridings.features) {
    const k = f.properties?.ridingKey;
    if (k && !ridingByKey.has(k)) ridingByKey.set(k, f);
  }

  const withParty = mlasRaw.map((m) => ({
    ...m,
    partyShort: shortPartyName(m.party),
    hasRidingGeometry: ridingByKey.has(m.ridingMatchKey),
  }));

  const { mlas, matched: rolesMatched, roleCount } = mergeExecutiveTitles(withParty, roleEntries);

  const sources = {
    fetchedAt,
    sources: [
      {
        name: "Current Provincial Electoral Districts of British Columbia",
        provider: "Province of British Columbia (DataBC / BC Geographic Warehouse)",
        url: RIDINGS_LAYER,
        license: "Open Government Licence - British Columbia",
      },
      {
        name: "Legislative Assembly of British Columbia representatives (OpenNorth Represent API)",
        provider: "OpenNorth / Legislative Assembly of BC",
        url: REPRESENT_BASE,
        license: "See OpenNorth and source_url on each representative",
      },
      {
        name: "Executive Council and Parliamentary Secretaries of B.C.",
        provider: "Province of British Columbia",
        url: CABINET_PAGE_URL,
        license: "Open Government Licence - British Columbia",
      },
    ],
    notes:
      "Riding boundaries are joined to MLAs by normalized riding name. Minister and parliamentary secretary titles are scraped from the cabinet page and matched to MLAs by name. Update OPENNORTH_TO_ARCGIS_RIDING_KEY if riding names diverge.",
  };

  await writeFile(path.join(OUT_DIR, "ridings.geojson"), JSON.stringify(ridings), "utf8");
  await writeFile(
    path.join(OUT_DIR, "mlas.json"),
    JSON.stringify({ meta: { fetchedAt }, mlas }, null, 2),
    "utf8",
  );
  await writeFile(path.join(ROOT, "public", "sources.json"), JSON.stringify(sources, null, 2), "utf8");

  const ridingMatched = mlas.filter((m) => m.hasRidingGeometry).length;
  console.log(
    `Wrote ${ridings.features.length} ridings, ${mlas.length} MLAs (${ridingMatched} matched to a riding polygon).`,
  );
  console.log(
    `Executive / parliamentary roles: ${roleCount} entries from cabinet page, ${rolesMatched} matched to MLAs by name.`,
  );
  console.log(`sources.json + public/data updated at ${fetchedAt}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
