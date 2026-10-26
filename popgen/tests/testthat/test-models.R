# Tests for the deterministic equations (R/models.R)

test_that("Hardy-Weinberg proportions are p^2, 2pq, q^2 and sum to 1", {
  g <- genotype_freqs(0.3)
  expect_equal(c(g$f11, g$f12, g$f22), c(0.09, 0.42, 0.49))
  expect_equal(g$f11 + g$f12 + g$f22, 1)
})

test_that("inbreeding F = 1 removes heterozygotes but keeps p", {
  g <- genotype_freqs(0.3, F = 1)
  expect_equal(g$f12, 0)
  expect_equal(allele_freq(g), 0.3)
})

test_that("lecture example: 2 AA, 3 Aa, 1 aa gives p = 7/12", {
  expect_equal(allele_freq(list(f11 = 2 / 6, f12 = 3 / 6, f22 = 1 / 6)), 7 / 12)
})

test_that("equal fitness changes nothing; selection against aa increases p", {
  g <- genotype_freqs(0.4)
  expect_equal(apply_selection(g, list(w11 = 1, w12 = 1, w22 = 1)), g)
  expect_gt(allele_freq(apply_selection(genotype_freqs(0.5), fitness_from_sh(0.5, 0))), 0.5)
})

test_that("mutation: delta p = v - p(u + v)", {
  p <- 0.8; u <- 1e-4; v <- 1e-5
  expect_equal(apply_mutation(p, u, v) - p, v - p * (u + v))
  expect_equal(mutation_equilibrium(u, v), v / (u + v))
})

test_that("closed-form mutation trajectory matches the recursion", {
  traj <- mutation_trajectory(p0 = 1, u = 1e-3, v = 1e-4, generations = 100, points = 101)
  p <- 1
  for (t in 1:100) p <- apply_mutation(p, 1e-3, 1e-4)
  expect_equal(traj$p[traj$gen == 100], p)
})

test_that("migration: delta p_I = m (p_C - p_I)", {
  expect_equal(apply_migration(0.2, 0.1, 0.7) - 0.2, 0.1 * (0.7 - 0.2))
})

test_that("chi-square is 0 for perfect HW counts and matches the lecture example", {
  expect_equal(hwe_test(25, 50, 25)$chi2[1], 0)
  expect_equal(hwe_test(2, 3, 1)$p[1], 7 / 12)
})

test_that("whole-number counts add up to N", {
  expect_equal(round_counts(c(0.09, 0.42, 0.49), 20), c(2, 8, 10))
  expect_equal(round_counts(c(0.36, 0.48, 0.16), 100), c(36, 48, 16))
  for (p in seq(0, 1, by = 0.01)) {
    g <- genotype_freqs(p)
    expect_equal(sum(round_counts(c(g$f11, g$f12, g$f22), 20)), 20)
  }
})

test_that("mouse life cycle: lecture numbers 36 / 48 / 16 and p stays 0.6", {
  d <- hw_life_cycle(0.6, N = 100)
  adults <- d[d$stage == "adults", ]
  expect_equal(adults$count, c(36, 48, 16))
  expect_equal(d$count[d$stage == "juveniles"], adults$count)
  expect_equal(sum(d$count[d$stage == "sperm"]), 100)
  expect_equal(d$count[d$stage == "sperm" & d$class == "A"] + d$count[d$stage == "eggs" & d$class == "A"], 120)
  expect_equal(unique(d$p[d$stage %in% c("adults", "juveniles")]), 0.6)
})

test_that("mouse life cycle keeps p (up to rounding) for every slider value", {
  for (p in seq(0, 1, by = 0.01)) {
    d <- hw_life_cycle(p, N = 20)
    expect_equal(sum(d$count[d$stage == "zygotes"]), 20)
    expect_lt(abs(d$p[d$stage == "juveniles"][1] - p), 0.05)
  }
})

test_that("mean fitness falls with inbreeding when allele a is deleterious and recessive", {
  d <- inbreeding_depression(q = 0.1, s = 0.5)
  expect_true(all(diff(d$wbar) < 0))
})
