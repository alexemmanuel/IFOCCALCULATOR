/**
 * High-performance statistical generators for Monte Carlo simulation
 * Supports Standard Gaussian, Student-t (Fat Tails), and Jump-Diffusion processes.
 */

// Mulberry32 fast 32-bit PRNG
export function createPRNG(seed = 123456789) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for standard normal random variables N(0, 1)
 */
export function sampleStandardNormal(rng: () => number = Math.random): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Gamma distribution sampler (Marsaglia and Tsang method)
 * Used to construct Student-t innovations: t_v = Z / sqrt(V / v), where V ~ ChiSquared(v)
 */
function sampleGamma(shape: number, rng: () => number = Math.random): number {
  if (shape < 1) {
    return sampleGamma(shape + 1, rng) * Math.pow(rng(), 1.0 / shape);
  }
  const d = shape - 1.0 / 3.0;
  const c = 1.0 / Math.sqrt(9.0 * d);
  while (true) {
    let z = sampleStandardNormal(rng);
    let v = 1.0 + c * z;
    if (v <= 0) continue;
    v = v * v * v;
    const u = rng();
    if (u < 1.0 - 0.0331 * z * z * z * z) {
      return d * v;
    }
    if (Math.log(u) < 0.5 * z * z + d * (1.0 - v + Math.log(v))) {
      return d * v;
    }
  }
}

/**
 * Sample from Chi-squared distribution with degrees of freedom df
 */
function sampleChiSquared(df: number, rng: () => number = Math.random): number {
  return 2.0 * sampleGamma(df / 2.0, rng);
}

/**
 * Student-t distribution with df degrees of freedom (normalized to unit variance: var = df / (df - 2))
 */
export function sampleStudentT(df = 5, rng: () => number = Math.random): number {
  const z = sampleStandardNormal(rng);
  const v = sampleChiSquared(df, rng);
  const rawT = z / Math.sqrt(v / df);
  // Scale so standard deviation is 1 if df > 2:
  if (df > 2) {
    return rawT * Math.sqrt((df - 2) / df);
  }
  return rawT;
}

/**
 * Poisson random variable sampler (for discrete jump events)
 */
export function samplePoisson(lambda: number, rng: () => number = Math.random): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}
