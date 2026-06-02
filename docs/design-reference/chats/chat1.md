# Global AI Availability Map

_Started 2026-05-31 13:51 UTC_

---

## User

Create an interactive web page with a world map showing the availability of ChatGPT, Claude, and Gemini in different countries.

## Assistant

_[tool: questions_v2]_

I'll help you build an interactive availability map. Since this is a fresh project with no design system attached, let me get a few preferences nailed down first so I build something that matches your taste — then I'll research current availability data and build it.

## User

Questions answered:
- vibe: Explore a few options
- color_mood: Decide for me
- map_mode: Overlay all three at once (blended/combined view)
- country_detail: Availability + count of how many of the 3 work there, Availability + short notes (e.g. 'EU launch delayed')
- data_accuracy: I'll supply the data myself
- extras: Search box to find a country, Summary stats (e.g. '180 countries have ChatGPT'), List view of unavailable countries

## Assistant

_[tool: copy_starter_component]_

_[tool: update_todos]_

Great — that gives me a clear direction:
- **Combined overlay** as the hero view, colored by how many of the 3 work (0–3), with a per-AI view switcher as a bonus.
- **Detail on select**: availability for each AI + count + a short note.
- **Search, summary stats, and an unavailable-countries list.**
- A few **visual directions** exposed as tweaks (since you want to explore).
- Seed it with best-effort current data, but structure it so **you can edit the data easily**.

Let me set up the scaffold and grab the tweaks panel.

_[tool: write_file]_

The tweaks panel is React. Cleanest path: build the whole thing in React with `d3-geo` for projection (paths computed once), so theme/view changes are just re-renders. Let me write the data file first, then the map components.

_[tool: write_file]_

Data seeded. Now the map component (React + `d3-geo` so paths compute once and theme/view changes are pure re-renders).

_[tool: write_file]_

Now the main App with stats, view switcher, search, detail panel, unavailable list, and tweaks.

_[tool: write_file]_

Now the HTML shell with the three themes' CSS and script wiring.Let me check it loads cleanly.

_[tool: show_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: str_replace_edit]_

Key collision — some features have `id: "-99"` (disputed territories). Let me key by index.Let me take a screenshot to see how it looks.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: save_screenshot]_

Looks strong. There's a title/subtitle overlap near the headline — let me re-check after fonts fully settle.

_[tool: view_image]_

_[tool: eval_js]_

The overlap is real and persistent. Let me inspect the actual geometry.

_[tool: eval_js]_

_[tool: eval_js]_

The DOM here reports one line with no overlap — the screenshot was at a narrower width. Let me reproduce at 909px to confirm whether wrapping breaks the layout.

_[tool: save_screenshot]_

That confirms it — steady-state it's one clean line; the overlap was a font-swap race during capture, not a real layout bug. Let me see the full map and sidebar.

_[tool: view_image]_

_[tool: eval_js]_

The map and sidebar look great. But there's a black band below the map where the body background should be paper. Let me check what's painting black.

_[tool: str_replace_edit]_

Found it: `height: 100%` pins body to viewport height, so content past the fold falls onto transparent html → black. Fix: background on html + min-height.

_[tool: show_html]_

Let me verify the fix and check the other themes render well.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: save_screenshot]_

Dark "control" theme looks excellent. Let me confirm the editorial background fix lower down and test a single-AI view with a selection.

_[tool: view_image]_

_[tool: eval_js]_

Background fixed — paper everywhere. The seg control looks like it didn't track the view change in that capture. Let me verify the live state.

_[tool: eval_js]_

Live state is correct — the screenshot just caught a pre-paint frame. Let me confirm the detail panel + note render on selection, then finalize.

_[tool: eval_js]_

React hadn't re-rendered yet when I read. Let me re-check after a tick.

_[tool: eval_js]_

_[tool: done]_

Everything works — themes, view switcher, search, detail panel with notes, summary stats, and the unavailable list. Let me surface it to you.

_[tool: fork_verifier_agent]_

Done — here's your interactive **AI Availability Map**.

**Core view:** a combined Equal Earth map where each country's color encodes how many of the three assistants (ChatGPT, Claude, Gemini) officially work there — *none → all three*. Hover for a quick tooltip; click any country (or a list item) for a detail panel with per-assistant status, a count badge, and a short context note.

**Also included:**
- **View switcher** — Combined, or a single-assistant available/not-available map.
- **Summary stats** — countries available per assistant.
- **Search** + a **"Not available everywhere"** list (jump straight to the blocked/limited countries).
- **Tweaks panel** (toolbar toggle) with three visual directions to explore — *Editorial* (warm paper + serif), *Control* (dark control-room), *Minimal* (mono + teal) — plus projection and border/graticule options.

**On the data:** since you said you'd supply your own, I seeded a best-effort 2026 snapshot — the universally-blocked set (China, Russia, North Korea, Iran, Cuba, Syria, Belarus) plus a couple of countries with noteworthy history (Italy, Germany). Everything else defaults to all-three-available. **All of it lives in `data.js`**, keyed by country — edit one entry and the map, stats, and lists update automatically. Add `1/3` or `2/3` cases there and the gradient fills in.

Want me to refine the seed data, pin a specific default theme, or add anything like a regional breakdown?

## User

If I want to show some specific features in AI products, such as Gemini Spark, which is only available in the US..

## Assistant

_[tool: str_replace_edit]_

Yes — that's a great extension. Right now the map only knows *product*-level availability. To spotlight a feature like **Gemini Spark (US-only)**, I'll add a **feature layer** concept: each feature belongs to a product and carries its own country allow-list. You'll be able to pick it from a "Feature spotlight" selector, and the map, legend, detail panel, and side-list all adapt to show exactly where that one feature lives.

Let me wire it up. First the data model:Now update MapView to support feature layers (fill + tooltip):

_[tool: str_replace_edit]_

_[tool: write_file]_

Now rewrite App.jsx to add the feature selector and adapt the detail panel, legend, and side-list:Now add CSS for the feature picker, spotlight bar, and availability pill:

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Let me check it loads cleanly and the feature spotlight works.

_[tool: show_html]_

_[tool: get_webview_logs]_

No errors. Let me select the Gemini Spark feature and screenshot.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: eval_js]_

Feature spotlight works great — map isolates the US, detail panel and spotlight bar both update. Let me confirm the dropdown label reflects the selection (it showed the placeholder in that frame).

_[tool: done]_

The dropdown is correct — that was another pre-paint frame. Everything's wired up. Let me finalize.

_[tool: fork_verifier_agent]_

Done — you can now spotlight individual features. Here's how it works:

**Feature spotlight selector** (next to the view tabs) lets you pick any feature, grouped by product. When one is active:
- The map flips to that feature's footprint — **available** vs **not yet** — so *Gemini Spark* lights up only the US.
- A **spotlight bar** summarizes it ("Gemini · available in 1 country (United States)").
- The **detail panel** shows the feature's status in the clicked country *plus* the parent product's overall status (so you can see "feature not here, but Gemini itself is").
- The **side list** switches to "Available in" — every country where the feature is live.

**Adding your own features** — they live in the `features` array in `data.js`. Each entry is just:
```js
{ id: "gemini-spark", product: "gemini", name: "Gemini Spark",
  countries: ["840"],   // ISO numeric ids — US 840, UK 826, etc.
  note: "Launched in the US first." }
```
Add an entry and it appears in the dropdown automatically. I seeded four illustrative ones (Gemini Spark, ChatGPT Operator, Advanced Voice, Claude for Chrome) — **edit the names, country lists, and notes** to match real footprints, since I marked them illustrative.

Want me to add a feature comparison view (e.g. two features side by side), or pull the country allow-lists from a simpler input like country names instead of ISO codes?

## User

It seems Gemini is divided into different platforms and tiers, like the web version, the mobile app, and paid plans. OpenAI also separates its offerings into ChatGPT and the OpenAI API. However, I think 'ChatGPT' alone is enough to represent their product, as everyday users don't use the API.

## Assistant

That matches how the map is already scoped, and I think your instinct is right. A few thoughts to lock in the model:

**Keep the three base layers as the consumer assistant only.** ChatGPT, Claude, and Gemini each represent the everyday web + mobile app — *not* the developer API. So "ChatGPT" already excludes the OpenAI API exactly as you want; nothing to change there. (The API's country list is different and irrelevant to a "where can people use it" map.)

**Tiers and platforms are usually the *same* footprint — only split them when they genuinely differ.** Gemini's free web, the mobile app, and the paid plan are available in *mostly* the same countries. Where they diverge, it's the narrower thing that's interesting — e.g. a paid tier or a specific app that launched in fewer places. That's exactly what the **feature spotlight** layer is for. So rather than adding new top-level products (which would clutter the combined "how many of 3 work" count), model the exceptions as spotlights:

- `Gemini Advanced (paid)` → its own country list
- `Gemini app (Android/iOS)` → if the app footprint ≠ web

They drop into the same `features` array, grouped under Gemini in the dropdown, and the base "Gemini" layer stays the broad consumer answer.

So the principle is: **base layer = the broadest consumer footprint of each assistant; spotlights = anything narrower (a feature, a tier, or a platform).**

Two small things I can do if you want:
1. **Clarify the scope in the UI** — a short line noting the map covers consumer apps (web + mobile), not APIs, so the distinction is explicit to viewers.
2. **Seed a couple of real Gemini tier/platform spotlights** (e.g. Gemini Advanced) so you can see the pattern — though you'd want to supply the accurate country lists.

Want me to do either, or keep the model as-is?

Yes — the dropdown is just one point in a fairly rich design space. Here are the main patterns, organized by how the options get revealed:

**Always-visible (good while you have a handful of features)**
- **Chip row** — feature pills laid out inline under the tabs (small product label on each), tap to spotlight. Everything's visible at a glance; wraps gracefully; reads as "extra layers."
- **Cards** — a row of small cards (feature name · product · "live in N countries"), click to activate. Room for a one-line description, more visual weight.
- **Sidebar layer list** — a persistent "Features" panel listing products with their features nested, like a GIS layer switcher. Browsable; great if features get descriptions.

**Hierarchical (keeps product context)**
- **Two-tier tabs** — the current product tabs stay; selecting a product reveals a second row of *that product's* feature tabs. Clean mental model: product → its features.

**Hidden until invoked (scales to many features)**
- **Dropdown (current)** — compact, grouped, scales well, but hides choices.
- **Command palette / unified search** — merge it into the search box so typing "spark" spotlights the feature and typing "Japan" finds the country. Keyboard-friendly and scales infinitely; lower discoverability.

**Spatial**
- **Map pins** — drop markers where notable features launched; click a pin to spotlight. Evocative but clutters fast.

**My read:** with ~4–8 features, a **chip row** or **two-tier tabs** beats the dropdown on discoverability. If the feature list is likely to grow past ~15, fold it into the **search box** as a unified command palette so it never crowds the toolbar.

Want me to wire a **"Selector style" tweak** so you can switch between, say, *Dropdown / Chips / Two-tier* live and feel which fits? I can have those three on a toggle in a few minutes — or I'll just commit to whichever one you like best.

## User

ok

## Assistant

_[tool: str_replace_edit]_

On it — I'll add a **"Selector style"** tweak so you can switch the feature picker between **Dropdown**, **Chips**, and **Two-tier** live.Now add the derived helpers and replace the toolbar with the three-style selector:

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Now add the tweak control in the panel:

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Now the CSS for chips and the two-tier subtabs:Let me verify it loads and check each selector style renders.

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: grep]_

Clean. Let me check how to drive the tweak so I can screenshot the other two styles.

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

The panel starts from defaults each load, so I'll temporarily flip the default to screenshot each style, then revert. Chips first:

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: str_replace_edit]_

Chips look great. Now the two-tier style:

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: eval_js]_

The capture caught a pre-paint frame again. Let me verify the live state is consistent.

_[tool: str_replace_edit]_

All consistent live — Gemini tab + Gemini Spark subtab active, map/legend/spotlight all in sync. The screenshots just catch pre-paint frames. Let me revert the default to dropdown.

_[tool: done]_

_[tool: fork_verifier_agent]_

Done. Open **Tweaks → Feature selector → Style** to switch the picker live between three implementations:

- **Dropdown** *(default)* — compact, grouped by product, scales to many features.
- **Chips** — every feature visible as a pill (with a product-colored dot); tap to spotlight, tap again to clear.
- **Two-tier** — pick a product tab and a second row reveals *that product's* features as sub-tabs (Overall · Gemini Spark · …), so the hierarchy reads clearly.

All three drive the same underlying state, so the map, spotlight bar, detail panel, and side-list stay in sync no matter which you use. Try each and let me know which one to keep as the default — I can also drop the other two once you decide, or keep the tweak so you can demo the comparison.

## User

No chips, I like the twoTier, but if users don't click, they won't find them.

## Assistant

_[tool: str_replace_edit]_

Good call — twoTier it is, and discoverability is the real problem to solve. Two fixes:

1. **Always-visible feature shelf** — the second row stays present even before you pick a product, showing a short prompt ("Feature spotlights — open a product to highlight…"), so the concept is never hidden.
2. **Count badges on the product tabs** — each assistant tab shows how many feature spotlights it has, so users see there's something to open.

Let me make twoTier the default, drop chips, and add both affordances.

_[tool: str_replace_edit]_

_[tool: grep]_

Let me check the current chips block text.

_[tool: read_file]_

Now I have the exact text. Let me apply all edits:

_[tool: str_replace_edit]_

Now the CSS — add `.seg-count` and `.subtabs-hint`, and remove the now-unused chips styles:

_[tool: str_replace_edit]_

_[tool: grep]_

I may have duplicated the chips CSS. Let me check.

_[tool: read_file]_

_[tool: str_replace_edit]_

Both chips blocks are now unused — let me remove them entirely.Now let me verify the result — the always-on shelf and tab count badges.

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: eval_js]_

Discoverability is solved — tabs show counts (ChatGPT 2, Claude 1, Gemini 1) and the shelf is always visible. But the count badges wrapped *below* the labels, making the tabs uneven in height. Let me check why.

_[tool: str_replace_edit]_

The button only wraps at narrow widths where the seg gets shrunk. Let me lock the tabs to a single line.

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: done]_

The tabs now show inline count badges and clicking a product reveals its feature sub-tabs. Discoverability is solved — counts hint there's more, and the always-on shelf explains the concept before any click. Let me finalize.

_[tool: fork_verifier_agent]_

Done — **two-tier is now the default**, chips are gone, and discoverability is handled two ways:

- **Count badges on the product tabs** (ChatGPT ², Claude ¹, Gemini ¹) — visible at rest, so users see each assistant has spotlights to open.
- **An always-on feature shelf** — the second row stays present even before you click, showing the prompt *"Feature spotlights — open a product above to highlight features…"*. Pick a product and it fills with that product's sub-tabs (Overall · Operator · Advanced Voice …).

So nothing's hidden behind an unprompted click anymore. The dropdown remains available under **Tweaks → Feature selector** if you ever want the compact version, but twoTier loads by default.

One thing to confirm when you have real data: the tab counts come straight from the `features` array, so as you add/correct spotlights the badges update automatically.

## User

Where can I list the info sources

## Assistant

_[tool: str_replace_edit]_

Good question — right now there's nowhere to cite sources. I'll add a proper place for them in **two spots**, both editable from `data.js`:

1. **Global "Sources" list** in the footer — the official availability pages you're citing overall.
2. **Per-entry source links** — an optional `source` on any country override or feature, shown as a "Source ↗" link in the detail panel, so a specific claim can point to its evidence.

Let me wire it up.Now wire it into the app — include `source` in the status, render a link in the detail panel, and build the footer sources list:

_[tool: str_replace_edit]_

Now the CSS for the source link and footer sources:

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: show_html]_

_[tool: get_webview_logs]_

Let me screenshot the footer sources and a detail-panel source link.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: save_screenshot]_

The per-entry source link shows ("OpenAI supported countries ↗"). Now the footer sources list:

_[tool: view_image]_

_[tool: done]_

Both source slots are live. Let me finalize.

_[tool: fork_verifier_agent]_

You can now list info sources in two places, both edited in **`data.js`**:

**1. Global sources** → `meta.sources` — shown as a "Sources" list in the footer:
```js
sources: [
  { label: "OpenAI — supported countries & territories", url: "https://…" },
  { label: "Anthropic — supported countries", url: "https://…" },
  …
]
```

**2. Per-entry sources** → add an optional `source` to any country override or feature — renders as a "Source ↗" link inside that country's detail panel:
```js
"156": { name: "China", chatgpt: false, …, note: "…",
         source: { label: "OpenAI supported countries", url: "https://…" } },
```

I seeded the three providers' official availability pages plus example per-entry links on China and Gemini Spark. **Please replace the URLs with the exact pages you're citing** — I used the providers' general availability docs as placeholders and haven't verified each links to the precise claim. Want me to also add a small "last updated" date stamp next to each source, or a methodology note?

## User

a methodology note

## Assistant

_[tool: str_replace_edit]_

On it — I'll add an editable methodology note as a tidy expandable disclosure in the footer (so it's available but doesn't clutter the map). Content lives in `data.js`.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: show_html]_

court

_[tool: save_screenshot]_

_[tool: view_image]_

The methodology disclosure renders cleanly — a "Methodology & scope" toggle in the footer that expands to four paragraphs (scope, default assumption, feature spotlights, caveats), sitting alongside the Sources list. Let me finalize.

_[tool: done]_

_[tool: fork_verifier_agent]_

Added a **"Methodology & scope"** note in the footer — a collapsed toggle that expands to four short paragraphs:

- **Scope** — consumer web + mobile apps only; APIs excluded (the distinction you raised earlier).
- **Default assumption** — countries are all-three-available unless listed as an exception.
- **Feature spotlights** — how narrower feature footprints work.
- **Caveats** — tiers, payment methods, VPNs don't count, best-effort snapshot.

It's collapsed by default so it doesn't crowd the map, and all four paragraphs live in `meta.methodology` in `data.js` — edit, add, or remove any of them and the note updates. Tweak the wording to match how you actually compiled your data.

