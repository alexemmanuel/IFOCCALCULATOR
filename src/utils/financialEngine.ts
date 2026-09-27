/**
 * Core Financial & Monte Carlo Analytical Engine
 * Faithfully implements the specifications in System Specification v1.0
 */

import {
  SimulationParameters,
  SimulationResult,
  PercentilePoint,
  SensitivityMatrix,
  SensitivityCell,
  CashFlowEvent,
  WithdrawalAnalysisResult,
  WithdrawalPathDataPoint,
  HistoricalYearRecord,
  CurrencyCode
} from '../types';
import { CURRENCY_CONFIGS } from '../data/historicalData';
import { sampleStandardNormal, sampleStudentT, createPRNG } from './mathRandom';

/**
 * Runs a complete Monte Carlo multi-path simulation.
 * Uses high-performance typed arrays for fast path evaluation up to 200-year horizons.
 */
export function runMonteCarloSimulation(params: SimulationParameters): SimulationResult {
  const startTime = performance.now();
  const {
    initialCapital,
    annualContribution,
    expectedRealReturn,
    annualVolatility,
    horizonYears,
    numPaths,
    valuationDragPct,
    valuationDragYears,
    modelType,
    tDegreesOfFreedom = 5,
    jumpProbability = 0.03,
    jumpMean = -0.25,
    jumpStdDev = 0.08,
    goodProfitThresholdMultiplier,
    failureThresholdMultiplier,
    stabilityFloorPct,
    stabilityStartYear,
    seed,
    widenedConfidenceBand = false,
    enableFxOverlay = false,
    fxVolatilityOverlayPct = 0.03
  } = params;

  const rng = seed !== undefined ? createPRNG(seed) : Math.random;

  // Drift parameter: in log-normal dynamics, d(ln W) = alpha * dt + sigma * dW
  // To ensure the geometric compound median return exactly matches expectedRealReturn (mu_g):
  // Median(exp(alpha * t + sigma * sqrt(t) * Z)) = exp(alpha * t) = (1 + mu_g)^t
  // Therefore alpha = ln(1 + mu_g).
  const baseAlpha = Math.log(1 + expectedRealReturn);
  
  // Total annual volatility including FX overlay risk if enabled
  const sigma = annualVolatility + (enableFxOverlay ? fxVolatilityOverlayPct : 0);

  // Horizon adjustment: for horizons >= 80 years or Tier B/C markets, widen confidence bands to reflect epistemic uncertainty
  // as mandated by Specification Section 3 and 5.4.
  const epistemicStdError = (horizonYears >= 80 ? 0.007 * Math.sqrt((horizonYears - 70) / 30) : 0) +
    (widenedConfidenceBand ? 0.015 : 0) +
    (enableFxOverlay ? fxVolatilityOverlayPct * 0.4 : 0);

  // We store all paths terminal wealth and year-by-year values for percentiles
  // For memory efficiency, allocate a Float64Array for paths x years
  // rows: numPaths, cols: horizonYears + 1
  const numYears = horizonYears;
  const pathValues = new Float64Array(numPaths * (numYears + 1));

  // Initialize year 0
  for (let p = 0; p < numPaths; p++) {
    pathValues[p * (numYears + 1) + 0] = initialCapital;
  }

  // Pre-calculate sample paths indices to collect for visualization (e.g. 12 representative trajectories)
  const sampleIndices = new Set<number>();
  const step = Math.max(1, Math.floor(numPaths / 12));
  for (let i = 0; i < 12 && i * step < numPaths; i++) {
    sampleIndices.add(i * step);
  }

  let pathsMeetingStability = 0;

  // Simulate paths
  for (let p = 0; p < numPaths; p++) {
    const pathOffset = p * (numYears + 1);
    let currentWealth = initialCapital;
    let peakWealth = initialCapital;
    let failedStability = false;

    // Epistemic regime shock per path if in long exploratory horizon:
    const pathAlphaDrift = baseAlpha + (epistemicStdError > 0 ? sampleStandardNormal(rng) * epistemicStdError : 0);

    for (let yr = 1; yr <= numYears; yr++) {
      // Valuation drag applied to the initial years (e.g. high CAPE)
      const currentValuationDrag = yr <= valuationDragYears ? valuationDragPct : 0;

      // Sample standardized shock Z based on model type
      let shock = 0;
      if (modelType === 'student_t') {
        shock = sampleStudentT(tDegreesOfFreedom, rng);
      } else if (modelType === 'mean_reversion') {
        // Mild mean reversion: return shock dampened if previous wealth diverged sharply from trend
        const trendWealth = initialCapital * Math.pow(1 + expectedRealReturn, yr);
        const logDev = Math.log(Math.max(1, currentWealth) / trendWealth);
        const meanReversionPull = -0.08 * logDev;
        shock = sampleStandardNormal(rng) + meanReversionPull;
      } else {
        // Standard Log-Normal
        shock = sampleStandardNormal(rng);
      }

      // Discrete Jump component (Black swan shock)
      let jumpReturnEffect = 0;
      if (modelType === 'jump_diffusion') {
        if (rng() < jumpProbability) {
          const jumpSize = jumpMean + sampleStandardNormal(rng) * jumpStdDev;
          jumpReturnEffect = jumpSize;
        }
      }

      // Calculate annual real return multiplier
      // exp(alpha + drag + sigma * shock) - 1 + jump
      const logReturn = (pathAlphaDrift + currentValuationDrag) + sigma * shock;
      const annualReturn = Math.exp(logReturn) - 1 + jumpReturnEffect;

      // Apply return to wealth and add annual contribution
      // Cap at >= 0 to avoid negative wealth
      currentWealth = Math.max(0, currentWealth * (1 + annualReturn) + annualContribution);
      pathValues[pathOffset + yr] = currentWealth;

      // Track rolling peak and stability
      if (currentWealth > peakWealth) {
        peakWealth = currentWealth;
      } else if (yr >= stabilityStartYear) {
        const drawdown = (peakWealth - currentWealth) / (peakWealth || 1);
        if (drawdown > stabilityFloorPct || currentWealth < initialCapital) {
          failedStability = true;
        }
      }
    }

    if (!failedStability) {
      pathsMeetingStability++;
    }
  }

  // Compute Percentiles for every year
  const percentiles: PercentilePoint[] = [];
  const yearBuffer = new Float64Array(numPaths);

  for (let yr = 0; yr <= numYears; yr++) {
    for (let p = 0; p < numPaths; p++) {
      yearBuffer[p] = pathValues[p * (numYears + 1) + yr];
    }
    yearBuffer.sort();

    const p5Idx = Math.floor(numPaths * 0.05);
    const p25Idx = Math.floor(numPaths * 0.25);
    const p50Idx = Math.floor(numPaths * 0.50);
    const p75Idx = Math.floor(numPaths * 0.75);
    const p95Idx = Math.floor(numPaths * 0.95);

    let sum = 0;
    for (let p = 0; p < numPaths; p++) sum += yearBuffer[p];
    const meanVal = sum / numPaths;

    percentiles.push({
      year: yr,
      p5: yearBuffer[p5Idx],
      p25: yearBuffer[p25Idx],
      p50: yearBuffer[p50Idx],
      p75: yearBuffer[p75Idx],
      p95: yearBuffer[p95Idx],
      mean: meanVal
    });
  }

  // Extract Terminal values (at year numYears)
  for (let p = 0; p < numPaths; p++) {
    yearBuffer[p] = pathValues[p * (numYears + 1) + numYears];
  }
  yearBuffer.sort();

  const terminalWealthP5 = yearBuffer[Math.floor(numPaths * 0.05)];
  const terminalWealthP25 = yearBuffer[Math.floor(numPaths * 0.25)];
  const terminalWealthMedian = yearBuffer[Math.floor(numPaths * 0.50)];
  const terminalWealthP75 = yearBuffer[Math.floor(numPaths * 0.75)];
  const terminalWealthP95 = yearBuffer[Math.floor(numPaths * 0.95)];

  // Success and Failure calculation
  const goodProfitThreshold = initialCapital * goodProfitThresholdMultiplier;
  const failureThreshold = initialCapital * failureThresholdMultiplier;

  let goodProfitsCount = 0;
  let failureCount = 0;
  for (let p = 0; p < numPaths; p++) {
    const val = yearBuffer[p];
    if (val >= goodProfitThreshold) goodProfitsCount++;
    if (val <= failureThreshold) failureCount++;
  }

  const probGoodProfits = goodProfitsCount / numPaths;
  const probFailure = failureCount / numPaths;
  const medianCAGR = numYears > 0 ? Math.pow(terminalWealthMedian / initialCapital, 1 / numYears) - 1 : 0;
  const stabilityPercentage = pathsMeetingStability / numPaths;

  // Extract sample paths for visual fan chart overlays
  const samplePaths: number[][] = [];
  sampleIndices.forEach(idx => {
    const path: number[] = [];
    for (let yr = 0; yr <= numYears; yr++) {
      path.push(pathValues[idx * (numYears + 1) + yr]);
    }
    samplePaths.push(path);
  });

  // Calculate terminal distribution histogram buckets
  const minVal = yearBuffer[0];
  const maxVal = yearBuffer[numPaths - 1];
  const numBuckets = 24;
  // Use log-spaced or linear buckets depending on spread
  const terminalDistribution: { bucket: string; min: number; max: number; count: number; percentage: number }[] = [];
  const logMin = Math.log(Math.max(1, minVal));
  const logMax = Math.log(Math.max(2, maxVal));
  const logStep = (logMax - logMin) / numBuckets;

  for (let b = 0; b < numBuckets; b++) {
    const bMin = Math.exp(logMin + b * logStep);
    const bMax = Math.exp(logMin + (b + 1) * logStep);
    let count = 0;
    for (let p = 0; p < numPaths; p++) {
      if (yearBuffer[p] >= bMin && (b === numBuckets - 1 ? yearBuffer[p] <= bMax : yearBuffer[p] < bMax)) {
        count++;
      }
    }
    terminalDistribution.push({
      bucket: `${formatCurrencyCompact(bMin)} - ${formatCurrencyCompact(bMax)}`,
      min: bMin,
      max: bMax,
      count,
      percentage: count / numPaths
    });
  }

  const executionTimeMs = performance.now() - startTime;

  return {
    params,
    percentiles,
    terminalWealthP5,
    terminalWealthP25,
    terminalWealthMedian,
    terminalWealthP75,
    terminalWealthP95,
    probGoodProfits,
    probFailure,
    medianCAGR,
    samplePaths,
    stabilityPercentage,
    executionTimeMs,
    terminalDistribution
  };
}

/**
 * Computes 2D Sensitivity Matrix for Return x Volatility (Section 5.1 & Page 6)
 */
export function computeSensitivityMatrix(
  baseParams: SimulationParameters,
  returns = [0.04, 0.05, 0.065, 0.075],
  volatilities = [0.15, 0.19, 0.22]
): SensitivityMatrix {
  const matrix: SensitivityCell[][] = [];

  for (let rIdx = 0; rIdx < returns.length; rIdx++) {
    const row: SensitivityCell[] = [];
    for (let vIdx = 0; vIdx < volatilities.length; vIdx++) {
      const r = returns[rIdx];
      const v = volatilities[vIdx];

      // Run a rapid 2,000-path calibration simulation for each matrix cell
      const sim = runMonteCarloSimulation({
        ...baseParams,
        expectedRealReturn: r,
        annualVolatility: v,
        numPaths: 2000,
        seed: 42 + rIdx * 10 + vIdx
      });

      row.push({
        expectedReturn: r,
        volatility: v,
        medianTerminalWealth: sim.terminalWealthMedian,
        medianMultiple: sim.terminalWealthMedian / baseParams.initialCapital,
        probGoodProfits: sim.probGoodProfits,
        probFailure: sim.probFailure,
        p5Multiple: sim.terminalWealthP5 / baseParams.initialCapital,
        p95Multiple: sim.terminalWealthP95 / baseParams.initialCapital
      });
    }
    matrix.push(row);
  }

  return {
    returns,
    volatilities,
    matrix
  };
}

/**
 * Withdrawal & Opportunity-Cost Calculator Engine (Specification Section 7 & Tab 2)
 * Answers: "If I remove capital after a profit (or to cut a loss), how much additional gain do I forgo,
 * or how much further loss do I avoid, measured over the same subsequent intervals?"
 */
export function calculateWithdrawalImpact(
  initialCapital: number,
  horizonYears: number,
  annualRealReturns: number[], // Array of length >= horizonYears
  cashFlowEvents: CashFlowEvent[],
  inflationRate = 0.025,
  intervalStartYear?: number,
  intervalEndYear?: number
): WithdrawalAnalysisResult {
  const timeSeries: WithdrawalPathDataPoint[] = [];

  // Group events by year for rapid lookup
  const eventsByYear = new Map<number, CashFlowEvent[]>();
  cashFlowEvents.forEach(e => {
    const list = eventsByYear.get(e.year) || [];
    list.push(e);
    eventsByYear.set(e.year, list);
  });

  let valWith = initialCapital;
  let valWithout = initialCapital;
  let cumWithdrawn = 0;
  let cumCashflow = 0;

  // Year 0
  timeSeries.push({
    year: 0,
    nominalReturn: 0,
    realReturn: 0,
    valueWithWithdrawal: initialCapital,
    valueWithoutWithdrawal: initialCapital,
    cumulativeWithdrawn: 0,
    cumulativeCashflow: 0,
    lostGainsToDate: 0,
    avoidedLossesToDate: 0,
    deltaFromCounterfactual: 0
  });

  for (let yr = 1; yr <= horizonYears; yr++) {
    const realRet = annualRealReturns[yr - 1] ?? 0.065;
    const nominalRet = (1 + realRet) * (1 + inflationRate) - 1;

    // Apply return to both paths before cash flows
    valWith = valWith * (1 + realRet);
    valWithout = valWithout * (1 + realRet);

    // Apply cash flows at end of year
    const yearEvents = eventsByYear.get(yr) || [];
    let yearNetCashflow = 0;

    for (const ev of yearEvents) {
      let flowAmount = ev.amount;
      if (ev.isPercentage) {
        flowAmount = valWith * ev.amount;
      }

      if (ev.type === 'withdrawal') {
        flowAmount = Math.min(valWith, Math.abs(flowAmount));
        valWith = Math.max(0, valWith - flowAmount);
        cumWithdrawn += flowAmount;
        yearNetCashflow -= flowAmount;
      } else {
        valWith += Math.abs(flowAmount);
        valWithout += Math.abs(flowAmount);
        yearNetCashflow += Math.abs(flowAmount);
      }
    }

    cumCashflow += yearNetCashflow;

    // Counterfactual delta:
    // If capital had remained invested:
    // Terminal position with withdrawals + cumulative cash extracted = valWith + cumWithdrawn
    // Counterfactual position = valWithout
    const netActualPlusExtracted = valWith + cumWithdrawn;
    const delta = valWithout - netActualPlusExtracted;

    const lostGains = Math.max(0, delta);
    const avoidedLosses = Math.max(0, -delta);

    timeSeries.push({
      year: yr,
      nominalReturn: nominalRet,
      realReturn: realRet,
      valueWithWithdrawal: valWith,
      valueWithoutWithdrawal: valWithout,
      cumulativeWithdrawn: cumWithdrawn,
      cumulativeCashflow: cumCashflow,
      lostGainsToDate: lostGains,
      avoidedLossesToDate: avoidedLosses,
      deltaFromCounterfactual: delta
    });
  }

  const terminalPoint = timeSeries[timeSeries.length - 1];
  const terminalWithWithdrawal = terminalPoint.valueWithWithdrawal;
  const terminalWithoutWithdrawal = terminalPoint.valueWithoutWithdrawal;
  const totalWithdrawn = terminalPoint.cumulativeWithdrawn;
  const terminalLostGains = terminalPoint.lostGainsToDate;
  const terminalAvoidedLosses = terminalPoint.avoidedLossesToDate;
  const netOpportunityCost = terminalPoint.deltaFromCounterfactual;

  // Annualized opportunity cost: difference in compound annual growth rates (CAGRs)
  const cagrWithout = horizonYears > 0 ? Math.pow(Math.max(1, terminalWithoutWithdrawal) / initialCapital, 1 / horizonYears) - 1 : 0;
  const effectiveTerminalWith = terminalWithWithdrawal + totalWithdrawn;
  const cagrWith = horizonYears > 0 ? Math.pow(Math.max(1, effectiveTerminalWith) / initialCapital, 1 / horizonYears) - 1 : 0;
  const annualizedOpportunityCost = cagrWithout - cagrWith;

  // Opportunity-cost multiple: how many times larger the withdrawn capital would have grown
  const withdrawnCounterfactualValue = terminalWithoutWithdrawal - (initialCapital * Math.pow(1 + (annualizedOpportunityCost || 0), horizonYears));
  const opportunityCostMultiple = totalWithdrawn > 0 ? Math.max(0, (terminalWithoutWithdrawal - terminalWithWithdrawal) / totalWithdrawn) : 1;

  // Interval analysis between user-selected dates
  let intervalAnalysis: WithdrawalAnalysisResult['intervalAnalysis'] = undefined;
  if (intervalStartYear !== undefined && intervalEndYear !== undefined && intervalEndYear > intervalStartYear) {
    const sYr = Math.max(0, Math.min(horizonYears, intervalStartYear));
    const eYr = Math.max(0, Math.min(horizonYears, intervalEndYear));

    const pStart = timeSeries[sYr];
    const pEnd = timeSeries[eYr];

    const intervalCashExtracted = pEnd.cumulativeWithdrawn - pStart.cumulativeWithdrawn;
    const intervalWithDelta = pEnd.valueWithWithdrawal - pStart.valueWithWithdrawal;
    const intervalWithoutDelta = pEnd.valueWithoutWithdrawal - pStart.valueWithoutWithdrawal;

    const intervalNetImpact = intervalWithoutDelta - (intervalWithDelta + intervalCashExtracted);
    const intervalLostGains = Math.max(0, intervalNetImpact);
    const intervalAvoidedLosses = Math.max(0, -intervalNetImpact);

    intervalAnalysis = {
      startYear: sYr,
      endYear: eYr,
      intervalLostGains,
      intervalAvoidedLosses,
      intervalNetImpact
    };
  }

  return {
    pathSource: 'monte_carlo_median',
    initialCapital,
    horizonYears,
    timeSeries,
    terminalWithWithdrawal,
    terminalWithoutWithdrawal,
    totalWithdrawn,
    terminalLostGains,
    terminalAvoidedLosses,
    netOpportunityCost,
    annualizedOpportunityCost,
    opportunityCostMultiple,
    intervalAnalysis
  };
}

/**
 * Extracts return series from a chosen Monte Carlo simulation path
 */
export function extractReturnsFromSimPath(simResult: SimulationResult, pathType: 'median' | 'p25' | 'p5' | 'p75'): number[] {
  const returns: number[] = [];
  const percentiles = simResult.percentiles;

  for (let yr = 1; yr < percentiles.length; yr++) {
    const prev = percentiles[yr - 1];
    const curr = percentiles[yr];
    let prevVal = prev.p50;
    let currVal = curr.p50;

    if (pathType === 'p25') {
      prevVal = prev.p25;
      currVal = curr.p25;
    } else if (pathType === 'p5') {
      prevVal = prev.p5;
      currVal = curr.p5;
    } else if (pathType === 'p75') {
      prevVal = prev.p75;
      currVal = curr.p75;
    }

    const r = prevVal > 0 ? (currVal / prevVal) - 1 : 0.065;
    returns.push(r);
  }

  return returns;
}

/**
 * Helper to extract returns from historical dataset between start and end year
 */
export function extractHistoricalReturns(
  dataset: HistoricalYearRecord[],
  startYear: number,
  endYear: number,
  assetType: 'equity' | 'bond' | 'balanced' = 'equity'
): number[] {
  const filtered = dataset
    .filter(d => d.year >= startYear && d.year <= endYear)
    .sort((a, b) => a.year - b.year);

  return filtered.map(d => {
    if (assetType === 'bond') return d.bondRealReturn;
    if (assetType === 'balanced') return 0.6 * d.equityRealReturn + 0.4 * d.bondRealReturn;
    return d.equityRealReturn;
  });
}

/**
 * Number formatting utilities with multi-currency support
 */
export function formatCurrency(val: number, decimals = 0, currency: CurrencyCode = 'USD'): string {
  if (isNaN(val)) return '$0';
  const cfg = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['USD'];
  const sym = cfg.symbol;

  if (Math.abs(val) >= 1e9) {
    return `${sym}${(val / 1e9).toFixed(2)}B`;
  }
  if (Math.abs(val) >= 1e6) {
    return `${sym}${(val / 1e6).toFixed(2)}M`;
  }
  return `${sym}${val.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  })}`;
}

export function formatCurrencyCompact(val: number, currency: CurrencyCode = 'USD'): string {
  if (isNaN(val)) return '$0';
  const cfg = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['USD'];
  const sym = cfg.symbol;

  if (Math.abs(val) >= 1e12) return `${sym}${(val / 1e12).toFixed(1)}T`;
  if (Math.abs(val) >= 1e9) return `${sym}${(val / 1e9).toFixed(1)}B`;
  if (Math.abs(val) >= 1e6) return `${sym}${(val / 1e6).toFixed(1)}M`;
  if (Math.abs(val) >= 1e3) return `${sym}${(val / 1e3).toFixed(0)}k`;
  return `${sym}${Math.round(val).toLocaleString()}`;
}

export function formatPercent(val: number, decimals = 1): string {
  if (isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(decimals)}%`;
}

export function formatMultiplier(val: number, decimals = 2): string {
  if (isNaN(val)) return '0.00x';
  return `${val.toFixed(decimals)}x`;
}
