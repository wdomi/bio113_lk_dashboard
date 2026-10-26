# =============================================================================
# models.R: the population-genetic equations (deterministic part)
# -----------------------------------------------------------------------------
# One locus, two alleles: A (frequency p) and a (frequency q = 1 - p).
# Notation follows the Bio 113 lectures (Keller, Vorlesungen 7-9):
#
#   Hardy-Weinberg     p^2 + 2pq + q^2 = 1
#   Inbreeding (F)     f11 = p^2 + Fpq,  f12 = 2pq(1 - F),  f22 = q^2 + Fpq
#   Selection          w11, w12, w22  (or w11 = 1, w12 = 1 - hs, w22 = 1 - s)
#   Mutation           u: A -> a,  v: a -> A,   delta p = v - p(u + v)
#   Migration          p_I' = (1 - m) p_I + m p_C   (one-island model)
#
# Every function does ONE thing, has no side effects and works on vectors
# (e.g. one value of p per replicate population). Try them in RStudio:
#   source("popgen/R/models.R"); genotype_freqs(0.3)
# =============================================================================

#' Keep frequencies inside [0, 1] (guards against rounding errors).
clamp01 <- function(x) pmin(1, pmax(0, x))

#' Genotype frequencies from the allele frequency of A.
#' With F = 0 these are the Hardy-Weinberg proportions p^2, 2pq, q^2.
#' @param p frequency of A (vector allowed)
#' @param F inbreeding coefficient (0 = random mating, 1 = complete inbreeding)
#' @return list(f11, f12, f22)
genotype_freqs <- function(p, F = 0) {
  q <- 1 - p
  list(
    f11 = p^2 + F * p * q,
    f12 = 2 * p * q * (1 - F),
    f22 = q^2 + F * p * q
  )
}

#' Allele frequency of A from genotype frequencies: p = f11 + f12 / 2.
allele_freq <- function(g) clamp01(g$f11 + g$f12 / 2)

#' Lecture parametrisation: w11 = 1, w12 = 1 - h s, w22 = 1 - s.
#' h = 0: A dominant; h = 0.5: additive; h = 1: A recessive.
fitness_from_sh <- function(s = 0, h = 0.5) {
  list(w11 = 1, w12 = 1 - h * s, w22 = 1 - s)
}

#' Mean fitness  w_bar = f11 w11 + f12 w12 + f22 w22.
mean_fitness <- function(g, w) g$f11 * w$w11 + g$f12 * w$w12 + g$f22 * w$w22

#' Viability selection: weight each genotype by its fitness, divide by w_bar.
apply_selection <- function(g, w) {
  wbar <- mean_fitness(g, w)
  if (any(wbar <= 0)) return(g) # everyone dies: keep the frequencies (edge case)
  list(
    f11 = g$f11 * w$w11 / wbar,
    f12 = g$f12 * w$w12 / wbar,
    f22 = g$f22 * w$w22 / wbar
  )
}

#' Recurrent mutation: p' = p (1 - u) + (1 - p) v   (so delta p = v - p (u + v)).
apply_mutation <- function(p, u = 0, v = 0) clamp01(p * (1 - u) + (1 - p) * v)

#' One-island migration: p_I' = (1 - m) p_I + m p_C.
apply_migration <- function(p, m = 0, pC = 0.5) clamp01((1 - m) * p + m * pC)

#' Equilibrium frequency of A under mutation alone: p_hat = v / (u + v).
mutation_equilibrium <- function(u, v) if (u + v > 0) v / (u + v) else NA_real_

#' Mutation alone has a closed-form solution:
#' p_t = p_hat + (p0 - p_hat) (1 - u - v)^t.
#' Used for very long time spans (100 000 generations) where a loop is slow.
#' @return data.frame(gen, p, q)
mutation_trajectory <- function(p0 = 1, u = 1e-4, v = 1e-5, generations = 50000, points = 500) {
  gen <- unique(round(seq(0, generations, length.out = points)))
  p_hat <- if (u + v > 0) v / (u + v) else p0
  p <- p_hat + (p0 - p_hat) * (1 - u - v)^gen
  data.frame(gen = gen, p = p, q = 1 - p)
}

#' Approximate mutation-selection balance for a deleterious allele a.
#' Recessive (h = 0): q_hat ~ sqrt(u / s); otherwise q_hat ~ u / (h s).
mutation_selection_balance <- function(u, s, h = 0) {
  if (s <= 0) return(NA_real_)
  if (h == 0) sqrt(u / s) else min(1, u / (h * s))
}

#' Expected heterozygosity after t generations of drift: H_t = H_0 (1 - 1/(2N))^t.
expected_heterozygosity <- function(H0, N, t) H0 * (1 - 1 / (2 * N))^t

#' Heterozygosity of a population with allele frequency p: H = 2pq.
heterozygosity <- function(p) 2 * p * (1 - p)

#' Chi-square test for Hardy-Weinberg proportions (1 degree of freedom).
#' @return data.frame with one row per genotype; p, chi2 and p_value repeated
hwe_test <- function(n11, n12, n22) {
  n <- n11 + n12 + n22
  p <- if (n > 0) (2 * n11 + n12) / (2 * n) else NA_real_
  g <- genotype_freqs(p)
  expected <- c(g$f11, g$f12, g$f22) * n
  observed <- c(n11, n12, n22)
  chi2 <- sum(ifelse(expected > 0, (observed - expected)^2 / expected, 0))
  data.frame(
    genotype = c("AA", "Aa", "aa"),
    observed = observed,
    expected = expected,
    p = p,
    n = n,
    chi2 = chi2,
    p_value = stats::pchisq(chi2, df = 1, lower.tail = FALSE)
  )
}

#' p^2, 2pq and q^2 as functions of p (for the Hardy-Weinberg plot).
#' @param p allele frequencies to evaluate (default: a grid from 0 to 1)
#' @return long data.frame(p, genotype, freq)
hw_curves <- function(p = seq(0, 1, by = 0.01)) {
  g <- genotype_freqs(p)
  data.frame(
    p = rep(p, 3),
    genotype = rep(c("AA", "Aa", "aa"), each = length(p)),
    freq = c(g$f11, g$f12, g$f22)
  )
}

#' Turn frequencies into whole numbers that add up to exactly N
#' (largest remainder: round down, then give the leftovers to the
#' largest fractional parts). Example: round_counts(c(0.09, 0.42, 0.49), 20)
round_counts <- function(freqs, N) {
  raw <- freqs * N
  n <- floor(raw + 1e-9)
  left <- N - sum(n)
  if (left > 0) {
    extra <- order(raw - n, decreasing = TRUE)[seq_len(left)]
    n[extra] <- n[extra] + 1
  }
  n
}

#' One turn of the Hardy-Weinberg life cycle (lecture figure with the mice),
#' counted in a small population of N mice:
#'   adults -> gametes (N sperm + N eggs) -> zygotes -> juveniles.
#' Adults are in HW proportions p^2, 2pq, q^2. Each adult passes on both of
#' its alleles: half of the 2N alleles go into sperm, half into eggs.
#' Sperm and eggs meet at random, so zygotes are again in HW proportions.
#' Without selection, juveniles are the zygotes grown up.
#' @param p frequency of A in the adults
#' @param N number of mice (also the number of sperm and of eggs)
#' @return long data.frame(stage, class, count, p): one row per genotype
#'   (adults, zygotes, juveniles) or allele (sperm, eggs); p = frequency of A
#'   in that stage
hw_life_cycle <- function(p = 0.5, N = 20) {
  stage_rows <- function(stage, class, count) {
    p_stage <- if (length(class) == 3) (2 * count[1] + count[2]) / (2 * N) else count[1] / N
    data.frame(stage = stage, class = class, count = count, p = p_stage)
  }
  g <- genotype_freqs(p)
  adults <- round_counts(c(g$f11, g$f12, g$f22), N)
  n_A <- 2 * adults[1] + adults[2] # copies of A among the 2N alleles
  eggs_A <- ceiling(n_A / 2)
  sperm_A <- n_A - eggs_A
  pe <- eggs_A / N
  ps <- sperm_A / N
  zygotes <- round_counts(c(pe * ps, pe * (1 - ps) + (1 - pe) * ps, (1 - pe) * (1 - ps)), N)
  rbind(
    stage_rows("adults", c("AA", "Aa", "aa"), adults),
    stage_rows("sperm", c("A", "a"), c(sperm_A, N - sperm_A)),
    stage_rows("eggs", c("A", "a"), c(eggs_A, N - eggs_A)),
    stage_rows("zygotes", c("AA", "Aa", "aa"), zygotes),
    stage_rows("juveniles", c("AA", "Aa", "aa"), zygotes)
  )
}

#' Genotype frequencies with and without inbreeding, for a bar chart.
inbreeding_genotypes <- function(p = 0.5, F = 0.2) {
  g0 <- genotype_freqs(p, 0)
  gF <- genotype_freqs(p, F)
  data.frame(
    genotype = rep(c("AA", "Aa", "aa"), 2),
    mating = rep(c("Zufallspaarung (F = 0)", sprintf("Inzucht (F = %s)", F)), each = 3),
    freq = c(g0$f11, g0$f12, g0$f22, gF$f11, gF$f12, gF$f22),
    p = rep(c(allele_freq(g0), allele_freq(gF)), each = 3) # unchanged by F!
  )
}

#' Mean fitness as a function of F when aa has fitness 1 - s (inbreeding depression).
inbreeding_depression <- function(q = 0.1, s = 0.5, points = 101) {
  F <- seq(0, 1, length.out = points)
  g <- genotype_freqs(1 - q, F)
  data.frame(F = F, wbar = mean_fitness(g, list(w11 = 1, w12 = 1, w22 = 1 - s)))
}
