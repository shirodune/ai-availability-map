/* ----------------------------------------------------------------------------
 * AI Availability data
 * ----------------------------------------------------------------------------
 * Default assumption: a country has all three assistants (ChatGPT, Claude,
 * Gemini) available. Only list EXCEPTIONS below — keyed by the numeric
 * ISO 3166-1 code used by the world-atlas TopoJSON (feature.id).
 *
 * Each override: { name, chatgpt, claude, gemini, note }
 *   - true  = officially available
 *   - false = not officially available / blocked
 *   - note  = short context string (optional)
 *
 * This is a BEST-EFFORT seed as of 2026 and is meant to be edited.
 * Fix anything here and the map, stats, and lists update automatically.
 * -------------------------------------------------------------------------- */
window.AI_DATA = {
  meta: {
    assistants: ["chatgpt", "claude", "gemini"],
    labels: { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini" },
    providers: { chatgpt: "OpenAI", claude: "Anthropic", gemini: "Google" },
    updated: "2026 · best-effort, editable",

    // Methodology — how to read this map. Each string is a paragraph.
    // Shown in an expandable note in the footer. Edit freely.
    methodology: [
      "Scope: this map tracks official consumer availability of each assistant's web and mobile apps. Developer APIs (e.g. the OpenAI API) are intentionally excluded, since everyday users don't rely on them and their country lists differ.",
      "Default assumption: a country is treated as having all three assistants unless listed as an exception in the data. Exceptions cover places where one or more assistants are not officially supported — typically due to sanctions, regulation, or a phased rollout.",
      "Feature spotlights show individual features (like Gemini Spark or Operator) that launched in a narrower set of countries than the parent product. A feature can be unavailable somewhere even when the product itself works there.",
      "Caveats: availability shifts frequently and can vary by product tier, payment method, and account type. VPN access is not counted as official availability. Figures are a best-effort snapshot as of the date shown, not legal guidance.",
    ],

    // -----------------------------------------------------------------------
    // INFO SOURCES — the references behind this data. Edit / replace these
    // with the exact pages you're citing. Shown in the footer of the map.
    // -----------------------------------------------------------------------
    sources: [
      { label: "OpenAI — supported countries & territories",
        url: "https://platform.openai.com/docs/supported-countries" },
      { label: "Anthropic — supported countries",
        url: "https://www.anthropic.com/supported-countries" },
      { label: "Google — Gemini available countries & languages",
        url: "https://support.google.com/gemini/answer/13575153" },
    ],
  },

  // Everything not listed here is assumed 3/3 available.
  overrides: {
    "156": { name: "China", chatgpt: false, claude: false, gemini: false,
      note: "No official consumer access to any of the three. Domestic models (DeepSeek, Qwen, Ernie) fill the gap.",
      source: { label: "OpenAI supported countries", url: "https://platform.openai.com/docs/supported-countries" } },
    "643": { name: "Russia", chatgpt: false, claude: false, gemini: false,
      note: "Not officially supported by OpenAI, Anthropic, or Google; reachable only via VPN." },
    "408": { name: "North Korea", chatgpt: false, claude: false, gemini: false,
      note: "No access — comprehensive international sanctions." },
    "364": { name: "Iran", chatgpt: false, claude: false, gemini: false,
      note: "Unavailable under U.S. sanctions." },
    "192": { name: "Cuba", chatgpt: false, claude: false, gemini: false,
      note: "Unavailable under U.S. sanctions." },
    "760": { name: "Syria", chatgpt: false, claude: false, gemini: false,
      note: "Historically blocked under sanctions; access remains unsupported." },
    "112": { name: "Belarus", chatgpt: false, claude: false, gemini: false,
      note: "Restricted under sanctions; none of the three are officially supported." },

    // Available everywhere, but with a noteworthy history:
    "380": { name: "Italy", chatgpt: true, claude: true, gemini: true,
      note: "ChatGPT was briefly banned by the data-protection authority in 2023, then restored after privacy changes." },
    "276": { name: "Germany", chatgpt: true, claude: true, gemini: true,
      note: "Claude and Gemini both launched here months after their U.S. debut due to EU rollout timing." },
  },

  /* --------------------------------------------------------------------------
   * FEATURE SPOTLIGHTS
   * --------------------------------------------------------------------------
   * Individual features inside a product that have a NARROWER footprint than
   * the product itself (e.g. a US-only launch). Each feature is "available"
   * only in the countries listed (by numeric ISO id). Everything else is
   * treated as not-yet-available for that feature.
   *
   * Illustrative seed — edit names, products, country lists, and notes freely.
   * ISO ids: US 840 · Canada 124 · UK 826 · India 356 · Japan 392 · Australia 36
   * ------------------------------------------------------------------------ */
  features: [
    { id: "gemini-spark", product: "gemini", name: "Gemini Spark",
      countries: ["840"],
      note: "Launched in the United States first; not yet rolled out elsewhere.",
      source: { label: "Google — Gemini help", url: "https://support.google.com/gemini" } },
    { id: "chatgpt-operator", product: "chatgpt", name: "Operator (agentic browsing)",
      countries: ["840"],
      note: "Debuted as a U.S.-only research preview." },
    { id: "chatgpt-voice", product: "chatgpt", name: "Advanced Voice",
      countries: ["840", "124", "826", "36", "356", "392"],
      note: "Early access in a handful of English-speaking markets before a wider rollout." },
    { id: "claude-chrome", product: "claude", name: "Claude for Chrome",
      countries: ["840"],
      note: "Pilot extension limited to U.S. users at launch." },
  ],
};
