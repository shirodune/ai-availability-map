import { test } from "node:test";
import assert from "node:assert/strict";
import { sliceSection } from "../scripts/scrape/sources.js";

const page = "intro commercial API access: Albania Brazil Claude.ai access: Chile Denmark";

test("slices between two markers", () => {
  const s = sliceSection(page, "commercial API access", "Claude.ai access");
  assert.ok(s.includes("Albania") && s.includes("Brazil"));
  assert.ok(!s.includes("Chile"), "must stop before the next section");
});

test("slices from a marker to end when no 'to'", () => {
  const s = sliceSection(page, "Claude.ai access");
  assert.ok(s.includes("Chile") && s.includes("Denmark"));
  assert.ok(!s.includes("Albania"));
});

test("throws when the 'from' marker is missing (don't silently mis-scope)", () => {
  assert.throws(() => sliceSection(page, "NOT PRESENT"), /marker not found/);
});

test("throws when the 'to' marker is missing", () => {
  assert.throws(() => sliceSection(page, "commercial API access", "NOT PRESENT"), /marker not found/);
});
