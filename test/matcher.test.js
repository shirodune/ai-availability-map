import { test } from "node:test";
import assert from "node:assert/strict";
import { matchCountriesIn } from "../scripts/scrape/iso.js";
import { cleanForMatch } from "../scripts/scrape/sources.js";

test("matches plain names with word boundaries", () => {
  const ids = matchCountriesIn("Albania, Algeria, France, United States");
  for (const id of ["8", "12", "250", "840"]) assert.ok(ids.includes(id), `expected ${id}`);
});

test("longest-first masking: Equatorial Guinea does not trip Guinea", () => {
  const ids = matchCountriesIn("Equatorial Guinea");
  assert.ok(ids.includes("226"), "Equatorial Guinea (226)");
  assert.ok(!ids.includes("324"), "must NOT match Guinea (324)");
});

test("all Guinea variants coexist when each is present", () => {
  const ids = matchCountriesIn("Guinea, Equatorial Guinea, Papua New Guinea, Guinea-Bissau");
  for (const id of ["324", "226", "598", "624"]) assert.ok(ids.includes(id), `expected ${id}`);
});

test("South Sudan does not leave a bare Sudan match", () => {
  const ids = matchCountriesIn("South Sudan");
  assert.ok(ids.includes("728"));
  assert.ok(!ids.includes("729"), "must NOT match Sudan (729)");
});

test("Niger vs Nigeria word boundaries", () => {
  assert.ok(!matchCountriesIn("Nigeria").includes("562"), "Nigeria is not Niger");
  assert.ok(matchCountriesIn("Niger").includes("562"));
});

test("i18n aliases catch short forms (Bahamas, Cyprus)", () => {
  const ids = matchCountriesIn("Bahamas, Cyprus");
  assert.ok(ids.includes("44") && ids.includes("196"));
});

test("cleanForMatch disambiguates the two Congos", () => {
  assert.ok(matchCountriesIn(cleanForMatch("Congo (DRC)")).includes("180"), "DR Congo");
  assert.ok(matchCountriesIn(cleanForMatch("Congo (Brazzaville)")).includes("178"), "Rep. of Congo");
});

test("cleanForMatch drops enterprise-only entries but keeps neighbours", () => {
  const ids = matchCountriesIn(cleanForMatch("Chile, mainland China (workspace only), Colombia"));
  assert.ok(!ids.includes("156"), "China must be dropped (workspace only)");
  assert.ok(ids.includes("152") && ids.includes("170"), "Chile + Colombia survive");
});

test("cleanForMatch strips sovereign annotations: Hong Kong (China)", () => {
  const ids = matchCountriesIn(cleanForMatch("Hong Kong (China)"));
  assert.ok(ids.includes("344"), "Hong Kong");
  assert.ok(!ids.includes("156"), "must NOT match China");
});
