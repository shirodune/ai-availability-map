import { test } from "node:test";
import assert from "node:assert/strict";
import { makeStatusFor } from "../src/lib/data.js";

const base = {
  products: ["chatgpt"],
  layers: ["web"],
  sourceStatus: { chatgpt: { web: { ok: true, stale: false } } },
  // China, Puerto Rico, Hong Kong, Palestine listed unavailable
  unavailable: { chatgpt: { web: ["156", "630", "344", "275"] } },
};
const iso = {
  "840": { kind: "country" },
  "156": { kind: "country" },
  "32": { kind: "country" },
  "630": { kind: "region", parent: "840" }, // Puerto Rico → US (available)
  "344": { kind: "region", parent: "156" }, // Hong Kong → China (unavailable)
  "275": { kind: "region" }, // Palestine — no parent
};
const names = { "840": "US", "156": "China", "32": "Argentina", "630": "Puerto Rico", "344": "Hong Kong", "275": "Palestine" };
const status = makeStatusFor(base, "web", names, iso);

test("country in unavailable → unavailable", () => assert.equal(status("156").chatgpt, "unavailable"));
test("country not listed → available", () => assert.equal(status("32").chatgpt, "available"));
test("territory inherits an AVAILABLE parent (Puerto Rico → US)", () => assert.equal(status("630").chatgpt, "available"));
test("territory inherits an UNAVAILABLE parent (Hong Kong → China)", () => assert.equal(status("344").chatgpt, "unavailable"));
test("parentless region falls back to its own listed status", () => assert.equal(status("275").chatgpt, "unavailable"));

test("explicitly-listed territory (not in unavailable) stays available", () => {
  const s = makeStatusFor({ ...base, unavailable: { chatgpt: { web: [] } } }, "web", names, iso);
  assert.equal(s("344").chatgpt, "available");
});

test("stale source → unknown", () => {
  const s = makeStatusFor({ ...base, sourceStatus: { chatgpt: { web: { ok: false, stale: true } } } }, "web", names, iso);
  assert.equal(s("156").chatgpt, "unknown");
  assert.equal(s("156").anyUnknown, true);
});
