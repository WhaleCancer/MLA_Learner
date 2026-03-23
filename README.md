# BC Ridings, MLAs & Ministers — MLA Learner

A small **Vite + React** quiz for practicing **BC provincial electoral districts**, **MLA portraits and names**, and **cabinet / parliamentary roles**. Map outlines use official boundary data; MLA names and photos come from OpenNorth / Legislative Assembly sources.

**Live site (after you enable Pages):**  
[https://whalecancer.github.io/MLA_Learner/](https://whalecancer.github.io/MLA_Learner/)

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview   # optional local check of dist/
```

### Refresh data (MLAs, ridings GeoJSON, sources)

Requires **Node** and network access:

```bash
npm run fetch:data
```

This updates `public/data/` and related metadata used by the app.

### Lint

```bash
npm run lint
```

## GitHub Pages

1. Repo **Settings → Pages → Build and deployment**: set **Source** to **GitHub Actions**.
2. Push to `main`; the **Deploy GitHub Pages** workflow builds with `base` `/MLA_Learner/` and publishes `dist/`.

Local builds use `base: ./` so `npm run preview` and file-based previews keep working.

## Credits & licenses

| Asset | Source |
|--------|--------|
| Electoral boundaries | [BC Government Open Data / DataBC](https://catalogue.data.gov.bc.ca/) |
| Basemap | [OpenStreetMap](https://www.openstreetmap.org/copyright) · [CARTO](https://carto.com/) |
| MLA names & portraits | [OpenNorth Represent API](https://opennorth.ca/) / Legislative Assembly |
| Correct / wrong SFX | [Mixkit](https://mixkit.co/) — see `public/sounds/SOURCE.txt` |

This project is for education and practice; verify critical facts against official government sources.

## Repository

[github.com/WhaleCancer/MLA_Learner](https://github.com/WhaleCancer/MLA_Learner)
