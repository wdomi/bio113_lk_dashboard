// Tests for the deterministic equations (js/popgen/models.js).
// Run with:  npm test   (or: node --test tests/)
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../js/popgen/models.js";

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);

test("Hardy–Weinberg proportions sum to 1 and match p², 2pq, q²", () => {
  const g = M.genotypeFreqs(0.3);
  close(g.f11, 0.09);
  close(g.f12, 0.42);
  close(g.f22, 0.49);
  close(g.f11 + g.f12 + g.f22, 1);
});

test("inbreeding F = 1 removes all heterozygotes but keeps p", () => {
  const g = M.genotypeFreqs(0.3, 1);
  close(g.f12, 0);
  close(M.alleleFreqFromGenotypes(g), 0.3);
});

test("lecture example: 2 A1A1, 3 A1A2, 1 A2A2 → p = 7/12", () => {
  close(M.alleleFreqFromGenotypes({ f11: 2 / 6, f12: 3 / 6, f22: 1 / 6 }), 7 / 12);
});

test("selection with equal fitness changes nothing", () => {
  const g = M.genotypeFreqs(0.4);
  const g2 = M.applySelection(g, { w11: 1, w12: 1, w22: 1 });
  close(g2.f11, g.f11);
  close(g2.f22, g.f22);
});

test("selection against A2A2 increases p", () => {
  const g = M.applySelection(M.genotypeFreqs(0.5), M.fitnessFromSH(0.5, 0));
  assert.ok(M.alleleFreqFromGenotypes(g) > 0.5);
});

test("mutation: Δp = v − p(u + v)", () => {
  const p = 0.8, u = 1e-4, v = 1e-5;
  close(M.applyMutation(p, u, v) - p, v - p * (u + v), 1e-15);
  close(M.mutationEquilibrium(u, v), v / (u + v));
});

test("migration: Δp_I = m(p_C − p_I)", () => {
  close(M.applyMigration(0.2, 0.1, 0.7) - 0.2, 0.1 * (0.7 - 0.2));
});

test("chi-square is 0 for perfect HW counts", () => {
  const { chi2 } = M.hweChiSquare(25, 50, 25);
  close(chi2, 0);
});
