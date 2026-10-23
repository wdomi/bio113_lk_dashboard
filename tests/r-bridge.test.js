// Tests for js/r-bridge.js. They start a real webR in Node.js and call the R
// package, so they need the npm package "webr" (npm install). Skipped otherwise.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { toR, rCall, createR } from "../js/r-bridge.js";

test("JavaScript values are translated to R code", () => {
  assert.equal(toR(Infinity), "Inf");
  assert.equal(toR(null), "NULL");
  assert.equal(toR(true), "TRUE");
  assert.equal(toR([1, 2]), "c(1, 2)");
  assert.equal(toR({ start: 20, size: 5 }), "list(`start` = 20, `size` = 5)");
  assert.equal(rCall("simulate", { N: 50, bottleneck: null }), "simulate(`N` = 50, `bottleneck` = NULL)");
});

let webrDist = null;
try {
  const req = createRequire(import.meta.url);
  webrDist = path.dirname(req.resolve("webr"));
} catch {}

test("R package runs through webR and returns JavaScript data", { skip: !webrDist && "npm package webr not installed", timeout: 120000 }, async () => {
  const sources = ["models", "simulate", "stats"].map((f) =>
    readFileSync(new URL(`../popgen/R/${f}.R`, import.meta.url), "utf8"),
  );
  const R = await createR(sources, { webrUrl: pathToFileURL(webrDist + "/").href, baseUrl: webrDist + "/" });
  const rows = await R.call("simulate", { N: 20, replicates: 3, generations: 10 });
  assert.equal(rows.length, 33);
  assert.deepEqual(Object.keys(rows[0]), ["rep", "gen", "p", "q", "f11", "f12", "f22", "N"]);
  const hw = await R.call("simulate", { N: Infinity, p0: 0.3, generations: 2 });
  assert.equal(hw[2].p, 0.3);
  assert.equal(hw[0].N, Infinity);
  const res = await R.call("drift_experiment", { N: 30, replicates: 5, generations: 10 });
  assert.deepEqual(Object.keys(res), ["rows", "summary", "heterozygosity"]);
  assert.equal(res.summary[0].n, 5);
  // latest-only: two queued calls with the same key both get the newest result
  const [a, b] = await Promise.all([
    R.call("simulate", { p0: 0.1, generations: 1 }, { key: "k" }),
    R.call("simulate", { p0: 0.9, generations: 1 }, { key: "k" }),
  ]);
  assert.ok(a.length === 2 && b.length === 2);
  R.webR.close();
});
