// Per-source adapters. Each fetches a provider page and returns the set of
// supported-country ISO-numeric ids via a dictionary scan of the page text
// (matchCountriesIn): every known country/alias matched with word boundaries +
// longest-first masking — robust to list markup and far fewer false misses.
import * as cheerio from "cheerio";
import { matchCountriesIn } from "./iso.js";

export const SOURCES = [
  { product: "chatgpt", layer: "web", expectMin: 120,
    url: "https://help.openai.com/en/articles/7947663-chatgpt-supported-countries" },
  { product: "chatgpt", layer: "api", expectMin: 120,
    url: "https://developers.openai.com/api/docs/supported-countries" },
  { product: "claude", layer: "web", expectMin: 100,
    url: "https://www.anthropic.com/supported-countries" },
  { product: "claude", layer: "api", expectMin: 100,
    url: "https://platform.claude.com/docs/en/api/supported-regions" },
  { product: "gemini", layer: "web", expectMin: 120,
    url: "https://support.google.com/gemini/answer/13575153" },
  // The HTML page is JS-gated; the raw .md.txt serves a clean list.
  { product: "gemini", layer: "api", expectMin: 120, type: "text",
    url: "https://ai.google.dev/gemini-api/docs/available-regions.md.txt" },
];

// Gemini paid tiers live on ONE page as two collapsible sections; parsed into
// feature-spotlight allow-lists (features.json), not the availability layers.
export const PAID = {
  url: "https://support.google.com/gemini/answer/16275805?hl=en",
  sections: [
    { featureId: "gemini-ai-plus", name: "AI Plus", start: "Where Google AI Plus is available", end: "Where Google AI Pro", expectMin: 80 },
    { featureId: "gemini-ai-pro-ultra", name: "AI Pro/Ultra", start: "Where Google AI Pro", end: "Need more help", expectMin: 100 },
  ],
};

// A complete browser-like header set. OpenAI's help center sits behind Cloudflare
// and 403s a bare user-agent, but serves normally when the sec-ch-ua / sec-fetch
// headers are present (verified reliable, 5/5).
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};

const SIMPLE = { "user-agent": "Mozilla/5.0 (compatible; ai-availability-map scraper)" };

async function fetchOnce(url, headers, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, redirect: "follow", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// Try the rich browser headers first (needed past Cloudflare, e.g. OpenAI help
// center); fall back to a minimal UA for endpoints that reject the rich set
// (e.g. ai.google.dev's raw .md.txt).
export async function fetchText(url, timeoutMs = 20000) {
  try {
    return await fetchOnce(url, HEADERS, timeoutMs);
  } catch {
    return await fetchOnce(url, SIMPLE, timeoutMs);
  }
}

// Main-content text of an HTML page, with each list element kept on its own
// line so adjacent names don't run together and break word boundaries.
export function mainText(html) {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, header, footer").remove();
  const parts = [];
  $("li, td, th, p, h1, h2, h3, h4, a").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t && t.length < 200) parts.push(t);
  });
  return parts.length > 20 ? parts.join("\n") : $("body").text();
}

// Prepare page text for matching:
//  1. Drop entries qualified as enterprise-only (e.g. "mainland China (workspace
//     only)") — those aren't generally/consumer available.
//  2. Strip remaining "(China)"-style sovereign annotations so "Hong Kong (China)"
//     matches Hong Kong, not China.
function cleanForMatch(text) {
  return text
    // Disambiguate the two Congos BEFORE the generic paren-strip — otherwise both
    // "Congo (DRC)" and "Congo (Brazzaville)" collapse to a bare, ambiguous "Congo".
    .replace(/\bcongo\s*\(\s*(?:drc|kinshasa)\s*\)/gi, "Democratic Republic of the Congo")
    .replace(/\bcongo\s*\(\s*brazzaville\s*\)/gi, "Republic of the Congo")
    // Drop enterprise-only qualified entries (not general availability).
    .replace(/[\w'’.-]+(?:\s+[\w'’.-]+){0,1}\s*\([^)]*\b(?:workspace|enterprise|business|beta|waitlist|coming soon)\b[^)]*\)/gi, " ")
    // Strip remaining "(China)"-style sovereign annotations.
    .replace(/\([^)]*\)/g, " ");
}

export async function fetchSupported(src, { timeoutMs = 20000 } = {}) {
  const body = await fetchText(src.url, timeoutMs);
  const raw = src.type === "text" ? body : mainText(body);
  return matchCountriesIn(cleanForMatch(raw));
}

// Parse the two paid-tier sections from the single Gemini paid page.
export async function fetchPaidSections() {
  const $ = cheerio.load(await fetchText(PAID.url, 25000));
  $("script, style").remove();
  const text = $("body").text().replace(/ /g, " ");
  const out = {};
  for (const sec of PAID.sections) {
    const i = text.indexOf(sec.start);
    if (i < 0) { out[sec.featureId] = { ids: [], ok: false }; continue; }
    let j = sec.end ? text.indexOf(sec.end, i + sec.start.length) : -1;
    if (j < 0) j = text.length;
    const ids = matchCountriesIn(text.slice(i, j)).sort((a, b) => Number(a) - Number(b));
    out[sec.featureId] = { ids, ok: ids.length >= sec.expectMin };
  }
  return out;
}
