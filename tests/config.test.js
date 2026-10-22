// Checks config/scenarios.json so a typo there cannot silently break the Explorer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_PARAMS, simulate } from "../js/popgen/simulate.js";

const file = JSON.parse(readFileSync(new URL("../config/scenarios.json", import.meta.url)));
const known = new Set([...Object.keys(DEFAULT_PARAMS), "replicates"]);

test("scenarios.json has unique ids, labels and known parameters", () => {
  const ids = new Set();
  for (const s of file.scenarios) {
    assert.ok(s.id && s.label, `scenario without id/label: ${JSON.stringify(s)}`);
    assert.ok(!ids.has(s.id), `duplicate id ${s.id}`);
    ids.add(s.id);
    for (const key of Object.keys(s.params)) assert.ok(known.has(key), `${s.id}: unknown parameter "${key}"`);
  }
});

test("every scenario runs without producing NaN", () => {
  for (const s of file.scenarios) {
    const params = { ...s.params, N: s.params.N ?? Infinity };
    const rows = simulate(params);
    assert.ok(rows.every((r) => Number.isFinite(r.p) && r.p >= 0 && r.p <= 1), s.id);
  }
});
