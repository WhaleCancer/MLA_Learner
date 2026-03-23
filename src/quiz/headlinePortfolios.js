/**
 * “Headline” Executive Council roles for title → person questions.
 * Each entry’s `test` receives a normalized executive title string.
 */

/** @param {string} t */
export function normExecTitle(t) {
  return String(t || "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @typedef {{ prompt: string; test: (title: string) => boolean }} HeadlinePortfolio
 */

/** @type {HeadlinePortfolio[]} — order: specific before loose; Premier before other “Premier” mentions */
export const HEADLINE_PORTFOLIOS = [
  {
    prompt: "Who is the Premier?",
    test: (title) => /^The Premier$/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Attorney General?",
    test: (title) => /Attorney General/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Health?",
    test: (title) => /Minister of Health/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Finance?",
    test: (title) => /Minister of Finance/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Education and Child Care?",
    test: (title) => /Education and Child Care/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Public Safety and Solicitor General?",
    test: (title) => /Public Safety and Solicitor General/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Indigenous Relations and Reconciliation?",
    test: (title) => /Indigenous Relations and Reconciliation/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Environment and Parks?",
    test: (title) => /Environment and Parks/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Transportation and Transit?",
    test: (title) => /Transportation and Transit/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Housing and Municipal Affairs?",
    test: (title) => /Housing and Municipal Affairs/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Social Development and Poverty Reduction?",
    test: (title) => /Social Development and Poverty Reduction/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Post-Secondary Education and Future Skills?",
    test: (title) => /Post-Secondary Education and Future Skills/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Emergency Management and Climate Readiness?",
    test: (title) => /Emergency Management and Climate Readiness/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Children and Family Development?",
    test: (title) => /Children and Family Development/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Forests?",
    test: (title) => /\bMinister of Forests\b/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Agriculture and Food?",
    test: (title) => /Agriculture and Food/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Labour?",
    test: (title) => /\bMinister of Labour\b/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Energy and Climate Solutions?",
    test: (title) => /Energy and Climate Solutions/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Citizens' Services?",
    test: (title) => {
      const n = normExecTitle(title);
      return (
        n.includes("Citizens' Services") || n.includes(`Citizens\u2019 Services`)
      );
    },
  },
  {
    prompt: "Who is the Minister of Jobs and Economic Growth?",
    test: (title) => /Jobs and Economic Growth/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Mining and Critical Minerals?",
    test: (title) => /Mining and Critical Minerals/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Water, Land and Resource Stewardship?",
    test: (title) => /Water, Land and Resource Stewardship/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Tourism, Arts, Culture and Sport?",
    test: (title) => /Tourism, Arts, Culture and Sport/i.test(normExecTitle(title)),
  },
  {
    prompt: "Who is the Minister of Infrastructure?",
    test: (title) => /\bMinister of Infrastructure\b/i.test(normExecTitle(title)),
  },
];

/**
 * Headlines that have at least one MLA in `mlas` whose title matches.
 * @param {object[]} mlas
 * @param {{ requirePhoto?: boolean }} [opts]
 */
export function headlinesWithMatches(mlas, opts = {}) {
  const { requirePhoto = false } = opts;
  const pool = requirePhoto ? mlas.filter((m) => m.photoUrl) : mlas;
  return HEADLINE_PORTFOLIOS.filter((h) =>
    pool.some((m) => m.executiveTitle && h.test(m.executiveTitle)),
  );
}
