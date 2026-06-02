# Re-plan (2026-06-02) — Coverage & Sources

Supersedes the coverage/source decisions in the 2026-06-01 spec; everything else there still holds.

## Coverage — countries vs regions
- **Identity:** ISO 3166-1 **numeric** codes (unchanged).
- **Classification:** every ISO entry tagged `kind: "country" | "region"`, anchored on **Natural Earth's sovereignty field** (chosen 2026-06-02) — the same authority that draws the map.
  - `country` ≈ **197** — Natural Earth "sovereign" states (≡ UN 193 + 2 observers + Taiwan + Kosovo).
  - `region` ≈ **52** — dependencies/territories (Hong Kong, Puerto Rico, Greenland, Réunion, Guam, …).
  - **Total ≈ 249.** Encoded as an ISO-numeric → `country`/`region` lookup (our bundled TopoJSON stripped NE's TYPE/SOVEREIGNT, so we carry it as a small table).
  - **Map geometry: Natural Earth 1:50m (confirmed 2026-06-02)** — coarsest scale that still has a shape for every sovereign country.
- **Map → countries only** (~197). Geometry = Natural Earth **50m** (has all small sovereigns), rendered filtered to `country`-tagged features; served as a cached asset (not bundled).
- **List/table → toggle:** **Countries** (default, ~197) ⇄ **Countries + Regions** (~249). Regions are list-only (no map shape needed; names from the ISO reference).
- **Stat-chip denominator:** countries (~197).
- Edge cases to settle in code: Taiwan, Kosovo, Western Sahara, Palestine.

## Facets — per product (not global)
Render only the facets a product actually has:
- **ChatGPT:** Web · API
- **Claude:** Web · API
- **Gemini:** Web · API · **AI Plus** · **AI Pro/Ultra**

(Mobile dropped — ≈ web. Paid deferred for ChatGPT/Claude — no clean per-country source.)

## Sources (7 URLs)
| Provider | Facet | URL | Scrape status |
|---|---|---|---|
| OpenAI | ChatGPT Web | help.openai.com/…/7947663-chatgpt-supported-countries | 403 → stale (headless later) |
| OpenAI | API | developers.openai.com/api/docs/supported-countries | ✅ |
| Anthropic | Claude Web | anthropic.com/supported-countries | ✅ |
| Anthropic | API | platform.claude.com/docs/en/api/supported-regions | ✅ |
| Google | Gemini Web | support.google.com/gemini/answer/13575153 | ✅ |
| Google | Gemini API | ai.google.dev/gemini-api/docs/available-regions | use **`.md.txt`** (clean ~219) |
| Google | **Gemini Paid** | support.google.com/gemini/answer/16275805 | two collapsible sections → **AI Plus (123)** + **AI Pro/Ultra (151)**, both in static HTML |

- Gemini-paid **display link** = the anchored URL (auto-expands both sections); **scraper** reads the base page.
- Committed default = **curated seed** (accurate); scraper refreshes on schedule; trusted after reviewing the commit diff.

## Implementation steps
1. ISO reference + `country`/`region` classification → `public/data/iso-regions.json`.
2. Data model → **per-product facets**; add Gemini `paidPlus` / `paidProUltra`; seed the 123 / 151 lists.
3. Loader + App: map renders countries only; list/table **Countries ⇄ Countries+Regions** toggle (full ISO); per-product facet sub-tabs.
4. `facetLabels`: Web / API / AI Plus / AI Pro·Ultra. Stat denominator = countries.
5. Scraper: per-product source config; **Gemini Paid** adapter (parse the two sections); **Gemini API** → `.md.txt`; keep validation + last-known-good.
6. Verify: build, headless render checks, scraper dry-run.

## Must verify before trusting
- **"Google AI Plus excludes US/UK/Canada/Japan"** — counterintuitive parse result; confirm by reading the page before seeding it as fact.
