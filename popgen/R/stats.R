# =============================================================================
# stats.R: summaries of simulation output, and "experiments" that bundle a
# simulation with its summaries for the website
# =============================================================================

#' Rows of the last generation of each replicate (and scenario).
final_rows <- function(d) {
  last <- stats::ave(d$gen, d$rep, if (is.null(d$scenario)) 1 else d$scenario, FUN = max)
  d[d$gen == last, , drop = FALSE]
}

#' Summary of final allele frequencies across replicates, one row per scenario.
#' fixed = A1 reached 1, lost = A1 reached 0.
summarize_final <- function(d, tol = 1e-9) {
  f <- final_rows(d)
  if (is.null(f$scenario)) f$scenario <- ""
  groups <- split(f$p, factor(f$scenario, levels = unique(f$scenario)))
  data.frame(
    scenario = names(groups),
    n = vapply(groups, length, integer(1)),
    mean = vapply(groups, mean, numeric(1)),
    sd = vapply(groups, function(x) if (length(x) > 1) stats::sd(x) else NA_real_, numeric(1)),
    fixed = vapply(groups, function(x) sum(x >= 1 - tol), integer(1)),
    lost = vapply(groups, function(x) sum(x <= tol), integer(1)),
    row.names = NULL
  )
}

#' Genotype frequencies in long format (one row per genotype and generation),
#' with the Hardy-Weinberg expectation at the same p in column `hw`.
#' @param d simulate() output (use one replicate)
genotypes_long <- function(d) {
  hw <- genotype_freqs(d$p)
  data.frame(
    rep = rep(d$rep, 3),
    gen = rep(d$gen, 3),
    genotype = rep(c("A1A1", "A1A2", "A2A2"), each = nrow(d)),
    freq = c(d$f11, d$f12, d$f22),
    hw = c(hw$f11, hw$f12, hw$f22)
  )
}

#' Mean expected heterozygosity 2pq over replicates, per generation, next to
#' the theoretical decay H_0 (1 - 1/2N)^t.
heterozygosity_decay <- function(d, N, p0) {
  H <- 2 * d$p * (1 - d$p)
  obs <- stats::aggregate(H, by = list(gen = d$gen), FUN = mean)
  data.frame(
    gen = obs$gen,
    observed = obs$x,
    expected = expected_heterozygosity(2 * p0 * (1 - p0), N, obs$gen)
  )
}

#' Simulation + summary in one call (what most pages need).
#' Takes the same arguments as simulate().
#' @return list(rows = simulate() output, summary = summarize_final(),
#'   genotypes = genotypes_long() of replicate 1)
experiment <- function(...) {
  d <- simulate(...)
  list(rows = d, summary = summarize_final(d), genotypes = genotypes_long(d[d$rep == 1, ]))
}

#' Drift experiment: simulation, summary and heterozygosity decay.
drift_experiment <- function(N = 50, p0 = 0.5, ...) {
  d <- simulate(N = N, p0 = p0, ...)
  list(rows = d, summary = summarize_final(d), heterozygosity = heterozygosity_decay(d, N, p0))
}

#' Compare several population sizes (worksheet: N = 10, 100, 1000, 10000).
drift_by_size <- function(sizes = c(10, 100, 1000, 10000), ...) {
  scenarios <- stats::setNames(lapply(sizes, function(n) list(N = n)), paste("N =", sizes))
  d <- simulate_scenarios(scenarios, ...)
  list(rows = final_rows(d), summary = summarize_final(d))
}

#' Bottleneck experiment: with and without bottleneck, same seed.
bottleneck_experiment <- function(N = 1000, size = 25, start = 20, duration = 5,
                                  replicates = 20, p0 = 0.5, seed = 1) {
  generations <- max(80, start + duration + 40)
  b <- list(start = start, duration = duration, size = size)
  with_b <- simulate(N = N, p0 = p0, generations = generations, replicates = replicates,
                     bottleneck = b, seed = seed)
  without <- simulate(N = N, p0 = p0, generations = generations, replicates = replicates,
                      seed = seed)
  het <- function(d, label) {
    h <- stats::aggregate(2 * d$p * (1 - d$p), by = list(gen = d$gen), FUN = mean)
    data.frame(gen = h$gen, value = h$x, kind = label)
  }
  list(
    rows = with_b,
    heterozygosity = rbind(het(with_b, "mit Flaschenhals"), het(without, "ohne Flaschenhals"))
  )
}
