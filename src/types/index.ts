/**
 * Comprehensive analytical types for Investment Forecasting & Opportunity Cost Calculator
 * Implements specifications from System Specification v1.0
 */

export type AssetClassId =
  | 'us_equities'
  | 'world_equities'
  | 'europe_equities'
  | 'japan_equities'
  | 'emerging_markets'
  | 'global_balanced'
  | 'us_bonds'
  | 'balanced_60_40'
  | 'treasury_bills'
  | 'africa_tier_a_sa'
  | 'africa_tier_b_major'
  | 'africa_tier_c_frontier'
  | 'africa_tier_d_balanced'
  | 'custom';

export type ConfidenceTier = 'Tier A' | 'Tier B' | 'Tier C' | 'Tier D' | 'Developed' | 'Emerging';

export interface AssetClassPreset {
  id: AssetClassId;
  name: string;
  expectedRealReturn: number; // e.g. 0.065 for 6.5%
  annualVolatility: number;    // e.g. 0.19 for 19%
  description: string;
  sourceNotes: string;
  region: 'North America' | 'Global' | 'Europe' | 'Asia' | 'Emerging' | 'Africa';
  tier?: ConfidenceTier;
  dataConfidence: 'High' | 'Medium' | 'Low' | 'Medium-High';
  uncertaintyLabel?: string;
  widenedConfidenceBand?: boolean;
}

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'ZAR'
  | 'NGN'
  | 'KES'
  | 'EGP'
  | 'GHS'
  | 'MAD'
  | 'TND'
  | 'XOF'
  | 'JPY'
  | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToUsd: number; // units of local currency per 1 USD
  isAfrican: boolean;
  country: string;
}

export type DistributionModel = 'lognormal' | 'student_t' | 'jump_diffusion' | 'mean_reversion';

export interface SimulationParameters {
  initialCapital: number;             // e.g. 100,000
  annualContribution: number;         // e.g. 0 or regular savings
  expectedRealReturn: number;         // geometric mean, e.g. 0.065 (6.5%)
  annualVolatility: number;           // e.g. 0.19 (19%)
  inflationRate: number;              // e.g. 0.025 (2.5%) for nominal conversion
  horizonYears: number;               // 3 to 200
  numPaths: number;                   // e.g. 5,000 to 10,000
  valuationDragPct: number;           // e.g. -0.01 (-1% p.a.)
  valuationDragYears: number;         // e.g. 10 years
  modelType: DistributionModel;       // 'lognormal' | 'student_t' | 'jump_diffusion' | 'mean_reversion'
  tDegreesOfFreedom?: number;         // e.g. 5 for heavy tails
  jumpProbability?: number;           // e.g. 0.03 (3% per year)
  jumpMean?: number;                  // e.g. -0.25 (-25% drop)
  jumpStdDev?: number;                // e.g. 0.08
  goodProfitThresholdMultiplier: number; // e.g. 2.0x
  failureThresholdMultiplier: number;    // e.g. 1.0x or 0.70x
  stabilityFloorPct: number;             // e.g. 0.40 (never drop >40% below rolling peak after year N)
  stabilityStartYear: number;            // e.g. 5
  seed?: number;                         // optional seed for reproducibility
  currency?: CurrencyCode;
  currencyMode?: 'local_real' | 'common_base';
  enableFxOverlay?: boolean;
  fxVolatilityOverlayPct?: number;       // e.g. 0.03 for 3% extra volatility drag
  widenedConfidenceBand?: boolean;
}

export interface HorizonBandDefinition {
  id: string;
  rangeLabel: string;
  minYear: number;
  maxYear: number;
  typicalYears: number;
  typicalUseCase: string;
  dominantRiskDrivers: string;
  isExploratory: boolean;
}

export interface PercentilePoint {
  year: number;
  p5: number;
  p25: number;
  p50: number; // median
  p75: number;
  p95: number;
  mean: number;
}

export interface SimulationResult {
  params: SimulationParameters;
  percentiles: PercentilePoint[];
  terminalWealthP5: number;
  terminalWealthP25: number;
  terminalWealthMedian: number;
  terminalWealthP75: number;
  terminalWealthP95: number;
  probGoodProfits: number;      // 0 to 1
  probFailure: number;          // 0 to 1
  medianCAGR: number;           // annualized geometric return
  samplePaths: number[][];      // 10-15 representative paths for fan chart overlay
  stabilityPercentage: number;  // % of paths meeting rolling floor criteria
  executionTimeMs: number;
  terminalDistribution: { bucket: string; min: number; max: number; count: number; percentage: number }[];
}

export interface SensitivityCell {
  expectedReturn: number;
  volatility: number;
  medianTerminalWealth: number;
  medianMultiple: number;
  probGoodProfits: number;
  probFailure: number;
  p5Multiple: number;
  p95Multiple: number;
}

export interface SensitivityMatrix {
  returns: number[];
  volatilities: number[];
  matrix: SensitivityCell[][];
}

export type CashFlowType = 'withdrawal' | 'contribution';

export interface CashFlowEvent {
  id: string;
  year: number;
  type: CashFlowType;
  amount: number;             // absolute dollar amount or percentage
  isPercentage: boolean;      // if true, amount is fraction of current portfolio (e.g. 0.20 for 20%)
  label: string;              // e.g. "Profit realization", "Down payment", "Retirement living"
}

export interface WithdrawalPathDataPoint {
  year: number;
  nominalReturn: number;
  realReturn: number;
  valueWithWithdrawal: number;
  valueWithoutWithdrawal: number; // counterfactual: cash stayed invested
  cumulativeWithdrawn: number;
  cumulativeCashflow: number;
  lostGainsToDate: number;        // if counterfactual > actual + cash
  avoidedLossesToDate: number;    // if counterfactual < actual + cash
  deltaFromCounterfactual: number; // counterfactual - (valueWithWithdrawal + cumulativeWithdrawn)
}

export interface WithdrawalAnalysisResult {
  pathSource: 'monte_carlo_median' | 'monte_carlo_p25' | 'monte_carlo_p5' | 'monte_carlo_p75' | 'historical' | 'custom';
  historicalSeriesName?: string;
  initialCapital: number;
  horizonYears: number;
  timeSeries: WithdrawalPathDataPoint[];
  terminalWithWithdrawal: number;
  terminalWithoutWithdrawal: number;
  totalWithdrawn: number;
  terminalLostGains: number;
  terminalAvoidedLosses: number;
  netOpportunityCost: number;     // terminalWithoutWithdrawal - (terminalWithWithdrawal + totalWithdrawn)
  annualizedOpportunityCost: number; // percentage-point difference in CAGR
  opportunityCostMultiple: number;  // how many times the withdrawn capital would have grown
  intervalAnalysis?: {
    startYear: number;
    endYear: number;
    intervalLostGains: number;
    intervalAvoidedLosses: number;
    intervalNetImpact: number;
  };
}

export interface HistoricalYearRecord {
  year: number;
  equityRealReturn: number;
  bondRealReturn: number;
  cashRealReturn: number;
  cpiInflation: number;
  capeRatio?: number;
  regimeTag?: string;
  notes?: string;
}
