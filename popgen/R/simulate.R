# =============================================================================
# simulate.R: runs populations through many generations
# -----------------------------------------------------------------------------
# Life cycle used for every generation (same order on every page):
#
#   adults --> gametes (p) --> mutation --> migration --> zygotes (with F)
#     ^                                                       |
#     |                                          drift: draw N individuals
#     |                                                       |
#     +------------ selection (viability) <---- census (recorded here)
#
# The census (what the plots show) is taken on the zygotes, i.e. after drift
# and before selection. With N = Inf there is no drift: the result is exact.
#
# All replicate populations are simulated at once (vectors), so 100
# replicates cost little more than one.
#
# To add a new force: write a function in models.R, call it at the right
# place in the loop below and give it a "no effect" default argument.
# =============================================================================

#' Population size in generation t (handles bottlenecks).
pop_size_at <- function(t, N, bottleneck = NULL) {
  if (!is.null(bottleneck) &&
      t >= bottleneck$start && t < bottleneck$start + bottleneck$duration) {
    return(bottleneck$size)
  }
  N
}

#' Draw N diploid individuals for each replicate (multinomial over the three
#' genotypes, done as two binomial draws so it is vectorised over replicates).
drift_sample <- function(g, N) {
  R <- length(g$f11)
  n11 <- stats::rbinom(R, N, clamp01(g$f11))
  rest <- 1 - g$f11
  p12 <- ifelse(rest > 0, clamp01(g$f12 / rest), 0)
  n12 <- stats::rbinom(R, N - n11, p12)
  list(f11 = n11 / N, f12 = n12 / N, f22 = (N - n11 - n12) / N)
}

#' Simulate one or several populations.
#'
#' With the defaults nothing evolves (Hardy-Weinberg). Change one argument at
#' a time to see its effect.
#'
#' @param p0 starting frequency of A1
#' @param N population size (individuals); Inf = no drift
#' @param generations number of generations
#' @param replicates number of independent populations
#' @param w11,w12,w22 genotype fitnesses
#' @param s,h alternative to w: if s is given, w11 = 1, w12 = 1 - h s, w22 = 1 - s
#' @param u,v mutation rates A1 -> A2 and A2 -> A1
#' @param m,pC migration rate and A1 frequency of the source (continent)
#' @param F inbreeding coefficient
#' @param bottleneck NULL or list(start, duration, size)
#' @param seed random seed (same seed = same result)
#' @return data.frame(rep, gen, p, q, f11, f12, f22, N), one row per
#'   replicate and generation (0 ... generations)
#' @examples
#' d <- simulate(N = 50, replicates = 20, generations = 100)
#' plot(p ~ gen, data = d[d$rep == 1, ], type = "l", ylim = c(0, 1))
simulate <- function(p0 = 0.5, N = Inf, generations = 100, replicates = 1,
                     w11 = 1, w12 = 1, w22 = 1, s = NULL, h = 0.5,
                     u = 0, v = 0, m = 0, pC = 0.5, F = 0,
                     bottleneck = NULL, seed = 1) {
  if (is.null(N) || is.na(N)) N <- Inf
  if (!is.finite(N)) replicates <- 1 # without drift all replicates are identical
  w <- if (is.null(s)) list(w11 = w11, w12 = w12, w22 = w22) else fitness_from_sh(s, h)
  set.seed(seed)

  R <- replicates
  T <- generations
  # results: one row per generation, one column per replicate
  out_f11 <- out_f12 <- out_f22 <- matrix(NA_real_, nrow = T + 1, ncol = R)
  out_N <- numeric(T + 1)

  # generation 0: Hardy-Weinberg (or inbred) proportions at p0
  zyg <- genotype_freqs(rep(p0, R), F)
  Nt <- pop_size_at(0, N, bottleneck)

  for (t in 0:T) {
    if (t > 0) {
      p <- allele_freq(adults)                 # 1. gametes
      p <- apply_mutation(p, u, v)             # 2. mutation
      p <- apply_migration(p, m, pC)           # 3. migration
      zyg <- genotype_freqs(p, F)              # 4. zygotes (random union / inbreeding)
      Nt <- pop_size_at(t, N, bottleneck)
      if (is.finite(Nt)) zyg <- drift_sample(zyg, round(Nt)) # 5. drift
    }
    out_f11[t + 1, ] <- zyg$f11                #    census
    out_f12[t + 1, ] <- zyg$f12
    out_f22[t + 1, ] <- zyg$f22
    out_N[t + 1] <- Nt
    adults <- apply_selection(zyg, w)          # 6. selection
  }

  p <- clamp01(as.vector(out_f11) + as.vector(out_f12) / 2)
  data.frame(
    rep = rep(seq_len(R), each = T + 1),
    gen = rep(0:T, times = R),
    p = p,
    q = 1 - p,
    f11 = as.vector(out_f11),
    f12 = as.vector(out_f12),
    f22 = as.vector(out_f22),
    N = rep(out_N, times = R)
  )
}

#' Run several *different* settings side by side (e.g. N = 10, 100, 1000).
#' @param scenarios named list: names are labels, values are lists of
#'   arguments for simulate(), e.g. list("N = 10" = list(N = 10), ...)
#' @param ... arguments shared by all scenarios (e.g. generations, replicates)
#' @return simulate() output with an extra column `scenario`
simulate_scenarios <- function(scenarios, ...) {
  shared <- list(...)
  parts <- lapply(names(scenarios), function(label) {
    args <- utils::modifyList(shared, scenarios[[label]])
    d <- do.call(simulate, args)
    d$scenario <- label
    d
  })
  do.call(rbind, parts)
}
