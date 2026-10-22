# Tests for the simulation loop (R/simulate.R) and summaries (R/stats.R)

test_that("infinite population without forces stays at p0 (Hardy-Weinberg)", {
  d <- simulate(p0 = 0.27, generations = 50)
  expect_equal(nrow(d), 51)
  expect_equal(d$p, rep(0.27, 51))
})

test_that("same seed gives the same result, different seed a different one", {
  a <- simulate(N = 50, generations = 30, replicates = 5, seed = 42)
  expect_identical(a, simulate(N = 50, generations = 30, replicates = 5, seed = 42))
  expect_false(identical(a$p, simulate(N = 50, generations = 30, replicates = 5, seed = 43)$p))
})

test_that("small populations drift more than large ones", {
  small <- summarize_final(simulate(N = 10, generations = 50, replicates = 100, seed = 3))
  large <- summarize_final(simulate(N = 10000, generations = 50, replicates = 100, seed = 3))
  expect_gt(small$sd, 3 * large$sd)
  expect_gt(small$fixed + small$lost, 50)
})

test_that("migration pulls the island towards the continent", {
  d <- simulate(p0 = 0, m = 0.2, pC = 0.8, generations = 50)
  expect_equal(tail(d$p, 1), 0.8, tolerance = 1e-3)
})

test_that("HHMI case study 1 (lactase): A1 rises from 0.05 to ~0.95 in 200 generations", {
  d <- simulate(p0 = 0.05, generations = 200, w11 = 1, w12 = 1, w22 = 0.9)
  expect_gt(tail(d$p, 1), 0.9)
  expect_lt(tail(d$p, 1), 0.99)
})

test_that("s/h parametrisation equals the matching fitness values", {
  a <- simulate(p0 = 0.1, s = 0.2, h = 0.5, generations = 20)
  b <- simulate(p0 = 0.1, w11 = 1, w12 = 0.9, w22 = 0.8, generations = 20)
  expect_equal(a$p, b$p)
})

test_that("bottleneck reduces N only during the bottleneck", {
  d <- simulate(N = 1000, generations = 30, bottleneck = list(start = 10, duration = 3, size = 5))
  expect_equal(d$N[d$gen %in% c(9, 10, 12, 13)], c(1000, 5, 5, 1000))
})

test_that("mutation-selection balance is close to sqrt(u/s) for a recessive allele", {
  d <- simulate(p0 = 1, s = 0.1, h = 0, u = 1e-3, generations = 3000)
  expect_equal(tail(d$q, 1), mutation_selection_balance(1e-3, 0.1, 0), tolerance = 0.1)
})

test_that("drift_by_size returns one summary row per size", {
  res <- drift_by_size(replicates = 10, generations = 20)
  expect_equal(res$summary$scenario, paste("N =", c(10, 100, 1000, 10000)))
})
