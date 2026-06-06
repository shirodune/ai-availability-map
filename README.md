# AI Availability Map

**Live: <https://ai-availability-map.vercel.app>**

An interactive world map of where **ChatGPT, Claude, and Gemini** are officially
available, by country — for both **consumer apps** and **developer APIs**, with
feature spotlights, a sortable table, and an auto-generated changelog.

Built with **Vite + React** and **@visx/geo** (d3-geo). The UI recreates a
[Claude Design](https://claude.ai/design) handoff (archived in
`docs/design-reference/`); the data is refreshed by a scheduled scraper.

## Quick start

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # serve the production build
```

## How it works

- **Static SPA.** The app loads `public/data/*.json` at runtime and renders the
  map/table/changelog. No backend.
- **Scheduled scraper.** A GitHub Action runs the scraper daily, regenerates the
  data, and commits any changes. Git history is the audit trail behind the
  changelog; the commit triggers a Pages redeploy.

```
schedule → scrape providers → normalize → validate → write JSON → diff → commit → deploy
```

## Data model (`public/data/`)

Countries are keyed by **ISO 3166-1 numeric** code (matching the world-atlas
TopoJSON). Availability uses **exception semantics**: a country is *available*
for a product + layer unless it's listed in that layer's `unavailable` set, or
*unknown* if the source is stale / not-yet-fetched.

| File | What it holds | Who edits it |
|---|---|---|
| `availability.json` | `unavailable` lists per product × layer + `sourceStatus` | scraper (or by hand) |
| `notes.json` | hand-curated annotations (gov-block, history, caveats) | you |
| `features.json` | app-layer feature spotlights (e.g. Gemini Spark) | you |
| `changelog.json` | availability flips over time | scraper |

Edit any file and the map, stats, lists, and table update automatically. See
`docs/superpowers/specs/2026-06-01-ai-availability-map-design.md` for the full
schema.

## The scraper

```bash
npm run scrape       # fetch, regenerate data, write files
npm run scrape:dry   # fetch + report only, write nothing
```

Each source has an adapter (`scripts/scrape/sources.js`) that fetches a
provider's official supported-country page and resolves country names to ISO
codes (`scripts/scrape/iso.js`). It is **safe by design**: a source that fails
validation (HTTP error, too few countries, or a sanity-guard trip) keeps its
last-known-good data and is flagged **stale** — a broken page can never blank
the map.

**Known limitations (best-effort scraping):**

- `chatgpt/app` (help.openai.com) is bot-protected and returns **403** to a
  plain fetch — it stays stale until a headless fetch (e.g. Playwright) is added.
- `gemini/api` (ai.google.dev) renders its region list client-side; a plain
  fetch under-parses it, so it stays stale.
- Territory naming can differ between providers and the world-atlas (e.g.
  Greenland, Puerto Rico), occasionally producing a wrong flag. The committed
  default data is a **curated seed**; review scraper diffs before trusting them.

## Deployment (GitHub Pages)

1. Push to GitHub. In **Settings → Pages**, set the source to **GitHub Actions**.
2. `deploy.yml` builds and publishes on every push to `main`, on demand, and
   after the scraper commits. Project Pages are served from `/<repo>/`; the
   build sets `VITE_BASE` accordingly. For a root domain, set `VITE_BASE=/`.

Any static host works — `npm run build` and serve `dist/`.

## Caveats

Availability shifts frequently and varies by tier, payment method, and account
type. VPN access doesn't count. This is a best-effort snapshot, **not legal
guidance**.
