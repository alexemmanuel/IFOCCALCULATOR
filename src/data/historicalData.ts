import { AssetClassPreset, HorizonBandDefinition, HistoricalYearRecord, CurrencyConfig } from '../types';

/**
 * Standard Asset Class Presets from Specification Page 5 Table 9 + Global & Africa Tiers:
 * Long-run real returns from Dimson-Marsh-Staunton (DMS) database, Shiller data, and African exchanges (1900–2025).
 */
export const ASSET_CLASS_PRESETS: AssetClassPreset[] = [
  // Developed & Global
  {
    id: 'us_equities',
    name: 'US Equities (S&P 500)',
    expectedRealReturn: 0.065, // 6.5% p.a.
    annualVolatility: 0.19,    // 19.0%
    description: 'Broad US stock market (S&P 500 / CRSP total real return series).',
    sourceNotes: 'Dimson-Marsh-Staunton (DMS) & Robert Shiller total-return series (1900–2025).',
    region: 'North America',
    tier: 'Developed',
    dataConfidence: 'High'
  },
  {
    id: 'world_equities',
    name: 'World Equities (MSCI World)',
    expectedRealReturn: 0.052, // 5.2% p.a.
    annualVolatility: 0.18,    // 18.0%
    description: 'Global developed market equities across 23 developed nations.',
    sourceNotes: 'DMS World Equity Index covering 23 developed national markets.',
    region: 'Global',
    tier: 'Developed',
    dataConfidence: 'High'
  },
  {
    id: 'europe_equities',
    name: 'Europe Equities (MSCI Europe)',
    expectedRealReturn: 0.054, // 5.4% p.a.
    annualVolatility: 0.185,   // 18.5%
    description: 'Leading European enterprises across UK, Germany, France, Switzerland, and Netherlands.',
    sourceNotes: 'DMS European multi-country composite database (1900–2025).',
    region: 'Europe',
    tier: 'Developed',
    dataConfidence: 'High'
  },
  {
    id: 'japan_equities',
    name: 'Japan Equities (TOPIX / Nikkei)',
    expectedRealReturn: 0.048, // 4.8% p.a.
    annualVolatility: 0.195,   // 19.5%
    description: 'Japanese equities reflecting pre-bubble growth, lost decades, and corporate governance revival.',
    sourceNotes: 'Bank of Japan & DMS long-run real return series.',
    region: 'Asia',
    tier: 'Developed',
    dataConfidence: 'High'
  },
  {
    id: 'emerging_markets',
    name: 'Emerging Markets (MSCI EM)',
    expectedRealReturn: 0.062, // 6.2% p.a.
    annualVolatility: 0.23,    // 23.0%
    description: 'Developing market equities across Asia, Latin America, and EMEA.',
    sourceNotes: 'MSCI Emerging Markets historical database (post-1987).',
    region: 'Emerging',
    tier: 'Emerging',
    dataConfidence: 'Medium',
    uncertaintyLabel: 'Shorter historical observation record (post-1987). Higher cyclical volatility.'
  },
  {
    id: 'global_balanced',
    name: 'Global Balanced (60/40 World)',
    expectedRealReturn: 0.045, // 4.5% p.a.
    annualVolatility: 0.115,   // 11.5%
    description: 'Diversified worldwide multi-asset blend: 60% global equities, 40% sovereign bonds.',
    sourceNotes: 'Blended global parameters with multi-currency diversification.',
    region: 'Global',
    tier: 'Developed',
    dataConfidence: 'High'
  },
  {
    id: 'us_bonds',
    name: 'US Government Bonds',
    expectedRealReturn: 0.018, // 1.8% p.a.
    annualVolatility: 0.095,   // 9.5%
    description: 'US 10-year Treasury & intermediate/long sovereign bonds.',
    sourceNotes: 'DMS / Federal Reserve long-term government bond real returns.',
    region: 'North America',
    tier: 'Developed',
    dataConfidence: 'High'
  },
  {
    id: 'balanced_60_40',
    name: '60/40 US Balanced',
    expectedRealReturn: 0.042, // 4.2% p.a.
    annualVolatility: 0.11,    // 11.0%
    description: 'Classic diversified asset mix: 60% US equities, 40% government bonds.',
    sourceNotes: 'Blended historical parameters with annual rebalancing and diversification bonus.',
    region: 'North America',
    tier: 'Developed',
    dataConfidence: 'High'
  },
  {
    id: 'treasury_bills',
    name: 'Treasury Bills (Cash Liquidity)',
    expectedRealReturn: 0.006, // 0.6% p.a.
    annualVolatility: 0.02,    // 2.0%
    description: 'Short-term US 3-month Treasury bills / cash liquidity proxy.',
    sourceNotes: 'Real cash proxy from historical short rates net of consumer inflation.',
    region: 'North America',
    tier: 'Developed',
    dataConfidence: 'High'
  },

  // Tiered Africa Presets
  {
    id: 'africa_tier_a_sa',
    name: 'South Africa Equities (JSE - Tier A)',
    expectedRealReturn: 0.071, // 7.1% p.a. (7.0 - 7.2%)
    annualVolatility: 0.21,    // 21.0% (20 - 22%)
    description: 'Johannesburg Stock Exchange (JSE) All Share real return benchmark. Continuous continuous data since 1900.',
    sourceNotes: 'DMS / Credit Suisse Global Investment Returns Yearbook (South Africa series 1900–2025).',
    region: 'Africa',
    tier: 'Tier A',
    dataConfidence: 'High',
    uncertaintyLabel: 'Long continuous history (since 1900). Highest confidence among African markets.'
  },
  {
    id: 'africa_tier_b_major',
    name: 'Major African Markets (Tier B)',
    expectedRealReturn: 0.068, // 6.8% p.a. (5.0 - 8.0%)
    annualVolatility: 0.26,    // 26.0% (22 - 30%)
    description: 'Composite of Nigeria (NGX), Egypt (EGX), Kenya (NSE), Morocco (BVC), and Ghana (GSE).',
    sourceNotes: 'African Securities Exchanges Association (ASEA) & sovereign exchange datasets (post-1990).',
    region: 'Africa',
    tier: 'Tier B',
    dataConfidence: 'Medium',
    uncertaintyLabel: 'Shorter reliable history (mostly post-1990). Results are more exploratory. Wider uncertainty bands applied automatically.',
    widenedConfidenceBand: true
  },
  {
    id: 'africa_tier_c_frontier',
    name: 'Sub-Saharan Frontier Composite (Tier C)',
    expectedRealReturn: 0.055, // 5.5% p.a. (4.0 - 7.0%)
    annualVolatility: 0.31,    // 31.0% (25 - 35%+)
    description: 'Frontier Sub-Saharan African economies with developing capital market infrastructure.',
    sourceNotes: 'Frontier market syntheses, IMF country papers, and central bank records.',
    region: 'Africa',
    tier: 'Tier C',
    dataConfidence: 'Low',
    uncertaintyLabel: 'Limited multi-decade data. High inflation, currency and liquidity risk. Use for illustration only. Confidence bands significantly widened.',
    widenedConfidenceBand: true
  },
  {
    id: 'africa_tier_d_balanced',
    name: 'Africa Balanced (SA + Major - Tier D)',
    expectedRealReturn: 0.06,  // 6.0% p.a. (5.5 - 6.5%)
    annualVolatility: 0.20,    // 20.0% (18 - 24%)
    description: 'Blended portfolio: 65% South Africa (JSE) + 35% Major African Markets (Nigeria, Egypt, Kenya, Morocco).',
    sourceNotes: 'Pan-African blended parameters with cross-regional diversification.',
    region: 'Africa',
    tier: 'Tier D',
    dataConfidence: 'Medium-High',
    uncertaintyLabel: 'Blended South Africa (higher weight) + major African markets. Moderate confidence.'
  }
];

/**
 * Currency Configurations & Conversion Factors
 */
export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUsd: 1.0, isAfrican: false, country: 'United States' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUsd: 0.92, isAfrican: false, country: 'Eurozone' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUsd: 0.78, isAfrican: false, country: 'United Kingdom' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rateToUsd: 18.2, isAfrican: true, country: 'South Africa' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rateToUsd: 1650.0, isAfrican: true, country: 'Nigeria' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rateToUsd: 129.0, isAfrican: true, country: 'Kenya' },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', rateToUsd: 48.5, isAfrican: true, country: 'Egypt' },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rateToUsd: 16.2, isAfrican: true, country: 'Ghana' },
  MAD: { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', rateToUsd: 9.8, isAfrican: true, country: 'Morocco' },
  TND: { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar', rateToUsd: 3.1, isAfrican: true, country: 'Tunisia' },
  XOF: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rateToUsd: 605.0, isAfrican: true, country: 'WAEMU / UEMOA' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUsd: 152.0, isAfrican: false, country: 'Japan' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToUsd: 1.52, isAfrican: false, country: 'Australia' }
};

/**
 * Standard Horizon Bands from Specification Section 3 (Pages 2–3)
 */
export const HORIZON_BANDS: HorizonBandDefinition[] = [
  {
    id: 'h_3_5',
    rangeLabel: '3–5 years',
    minYear: 3,
    maxYear: 5,
    typicalYears: 5,
    typicalUseCase: 'Near-term goals, capital expenditure, down payments, cash needs',
    dominantRiskDrivers: 'Sequence risk, starting valuation, short-term market volatility',
    isExploratory: false
  },
  {
    id: 'h_10_20',
    rangeLabel: '10–20 years',
    minYear: 10,
    maxYear: 20,
    typicalYears: 15,
    typicalUseCase: 'Retirement accumulation, higher education funding',
    dominantRiskDrivers: 'Mean reversion, inflation regimes, cyclical valuation shifts',
    isExploratory: false
  },
  {
    id: 'h_40_60',
    rangeLabel: '40–60 years',
    minYear: 40,
    maxYear: 60,
    typicalYears: 50,
    typicalUseCase: 'Career-long wealth accumulation, early generational planning',
    dominantRiskDrivers: 'Structural real return assumptions, productivity trends, tax policy',
    isExploratory: false
  },
  {
    id: 'h_60_80',
    rangeLabel: '60–80 years',
    minYear: 60,
    maxYear: 80,
    typicalYears: 70,
    typicalUseCase: 'Full adult lifetime investment horizon, family legacy',
    dominantRiskDrivers: 'Parameter uncertainty dominates: small return deltas cause 10x terminal variations',
    isExploratory: false
  },
  {
    id: 'h_80_110',
    rangeLabel: '80–110 years',
    minYear: 80,
    maxYear: 110,
    typicalYears: 100,
    typicalUseCase: 'Multi-generational dynasty trusts, family office transfers',
    dominantRiskDrivers: 'Regime shifts, structural breaks, geopolitical rupture, model risk extreme',
    isExploratory: true
  },
  {
    id: 'h_110_140',
    rangeLabel: '110–140 years',
    minYear: 110,
    maxYear: 140,
    typicalYears: 125,
    typicalUseCase: 'Endowments, philanthropic foundations, perpetual trusts',
    dominantRiskDrivers: 'Historical empirical sample size collapses; epistemic uncertainty overrides precision',
    isExploratory: true
  },
  {
    id: 'h_150_180',
    rangeLabel: '150–180 years',
    minYear: 150,
    maxYear: 180,
    typicalYears: 165,
    typicalUseCase: 'Exploratory & educational modeling of super-long horizon compounding',
    dominantRiskDrivers: 'Illustration of compounding mathematics under high epistemic uncertainty',
    isExploratory: true
  },
  {
    id: 'h_200',
    rangeLabel: '200 years',
    minYear: 190,
    maxYear: 200,
    typicalYears: 200,
    typicalUseCase: 'Theoretical upper bound for long-run financial economics',
    dominantRiskDrivers: 'Uncertainty bands become extremely wide; civilization-scale structural assumptions',
    isExploratory: true
  }
];

/**
 * Historical Annual Real Returns (Shiller / DMS 1900–2025)
 * Capturing the complete 126-year empirical distribution for equities, bonds, cash, inflation, and notable regimes.
 */
export const HISTORICAL_ANNUAL_RETURNS: HistoricalYearRecord[] = [
  { year: 1900, equityRealReturn: 0.201, bondRealReturn: 0.042, cashRealReturn: 0.031, cpiInflation: 0.012, regimeTag: 'Pre-WWI Expansion' },
  { year: 1901, equityRealReturn: 0.178, bondRealReturn: 0.021, cashRealReturn: 0.028, cpiInflation: 0.012 },
  { year: 1902, equityRealReturn: -0.012, bondRealReturn: 0.015, cashRealReturn: 0.018, cpiInflation: 0.013 },
  { year: 1903, equityRealReturn: -0.145, bondRealReturn: 0.032, cashRealReturn: 0.021, cpiInflation: 0.024 },
  { year: 1904, equityRealReturn: 0.324, bondRealReturn: 0.048, cashRealReturn: 0.012, cpiInflation: 0.011 },
  { year: 1905, equityRealReturn: 0.218, bondRealReturn: 0.011, cashRealReturn: 0.021, cpiInflation: -0.009 },
  { year: 1906, equityRealReturn: -0.048, bondRealReturn: -0.012, cashRealReturn: 0.025, cpiInflation: 0.022 },
  { year: 1907, equityRealReturn: -0.292, bondRealReturn: -0.018, cashRealReturn: 0.015, cpiInflation: 0.045, regimeTag: 'Panic of 1907' },
  { year: 1908, equityRealReturn: 0.428, bondRealReturn: 0.065, cashRealReturn: 0.018, cpiInflation: -0.031 },
  { year: 1909, equityRealReturn: 0.142, bondRealReturn: 0.012, cashRealReturn: 0.014, cpiInflation: -0.010 },
  { year: 1910, equityRealReturn: -0.082, bondRealReturn: 0.028, cashRealReturn: 0.019, cpiInflation: 0.044 },
  { year: 1911, equityRealReturn: 0.045, bondRealReturn: 0.039, cashRealReturn: 0.018, cpiInflation: 0.000 },
  { year: 1912, equityRealReturn: 0.038, bondRealReturn: 0.015, cashRealReturn: 0.015, cpiInflation: 0.022 },
  { year: 1913, equityRealReturn: -0.162, bondRealReturn: 0.011, cashRealReturn: 0.022, cpiInflation: 0.021 },
  { year: 1914, equityRealReturn: -0.115, bondRealReturn: 0.020, cashRealReturn: 0.025, cpiInflation: 0.010, regimeTag: 'WWI Outbreak' },
  { year: 1915, equityRealReturn: 0.352, bondRealReturn: 0.018, cashRealReturn: 0.015, cpiInflation: 0.020 },
  { year: 1916, equityRealReturn: -0.052, bondRealReturn: -0.082, cashRealReturn: -0.091, cpiInflation: 0.126, regimeTag: 'WWI Inflation Shock' },
  { year: 1917, equityRealReturn: -0.315, bondRealReturn: -0.164, cashRealReturn: -0.142, cpiInflation: 0.181 },
  { year: 1918, equityRealReturn: 0.012, bondRealReturn: -0.121, cashRealReturn: -0.155, cpiInflation: 0.204 },
  { year: 1919, equityRealReturn: 0.085, bondRealReturn: -0.118, cashRealReturn: -0.108, cpiInflation: 0.145 },
  { year: 1920, equityRealReturn: -0.248, bondRealReturn: -0.102, cashRealReturn: -0.085, cpiInflation: 0.156, regimeTag: 'Post-War Recession' },
  { year: 1921, equityRealReturn: 0.265, bondRealReturn: 0.245, cashRealReturn: 0.185, cpiInflation: -0.108, regimeTag: 'Deflationary Boom' },
  { year: 1922, equityRealReturn: 0.342, bondRealReturn: 0.125, cashRealReturn: 0.098, cpiInflation: -0.061 },
  { year: 1923, equityRealReturn: -0.021, bondRealReturn: 0.021, cashRealReturn: 0.022, cpiInflation: 0.018 },
  { year: 1924, equityRealReturn: 0.262, bondRealReturn: 0.082, cashRealReturn: 0.031, cpiInflation: 0.000 },
  { year: 1925, equityRealReturn: 0.231, bondRealReturn: 0.038, cashRealReturn: 0.028, cpiInflation: 0.035, regimeTag: 'Roaring Twenties' },
  { year: 1926, equityRealReturn: 0.134, bondRealReturn: 0.072, cashRealReturn: 0.045, cpiInflation: -0.011 },
  { year: 1927, equityRealReturn: 0.408, bondRealReturn: 0.105, cashRealReturn: 0.052, cpiInflation: -0.023 },
  { year: 1928, equityRealReturn: 0.452, bondRealReturn: 0.022, cashRealReturn: 0.051, cpiInflation: -0.012 },
  { year: 1929, equityRealReturn: -0.089, bondRealReturn: 0.048, cashRealReturn: 0.045, cpiInflation: 0.006, regimeTag: '1929 Crash Peak' },
  { year: 1930, equityRealReturn: -0.231, bondRealReturn: 0.089, cashRealReturn: 0.051, cpiInflation: -0.064, regimeTag: 'Great Depression' },
  { year: 1931, equityRealReturn: -0.378, bondRealReturn: -0.025, cashRealReturn: 0.075, cpiInflation: -0.093 },
  { year: 1932, equityRealReturn: -0.025, bondRealReturn: 0.185, cashRealReturn: 0.112, cpiInflation: -0.103, regimeTag: 'Depression Trough' },
  { year: 1933, equityRealReturn: 0.532, bondRealReturn: -0.012, cashRealReturn: -0.005, cpiInflation: 0.008, regimeTag: 'New Deal Rebound' },
  { year: 1934, equityRealReturn: -0.042, bondRealReturn: 0.078, cashRealReturn: -0.012, cpiInflation: 0.015 },
  { year: 1935, equityRealReturn: 0.445, bondRealReturn: 0.062, cashRealReturn: -0.025, cpiInflation: 0.030 },
  { year: 1936, equityRealReturn: 0.318, bondRealReturn: 0.055, cashRealReturn: -0.011, cpiInflation: 0.014 },
  { year: 1937, equityRealReturn: -0.365, bondRealReturn: -0.012, cashRealReturn: -0.028, cpiInflation: 0.029, regimeTag: '1937 Tightening' },
  { year: 1938, equityRealReturn: 0.345, bondRealReturn: 0.072, cashRealReturn: 0.025, cpiInflation: -0.028 },
  { year: 1939, equityRealReturn: -0.015, bondRealReturn: 0.061, cashRealReturn: 0.002, cpiInflation: 0.000 },
  { year: 1940, equityRealReturn: -0.105, bondRealReturn: 0.045, cashRealReturn: -0.008, cpiInflation: 0.007 },
  { year: 1941, equityRealReturn: -0.178, bondRealReturn: -0.078, cashRealReturn: -0.088, cpiInflation: 0.099, regimeTag: 'WWII Mobilization' },
  { year: 1942, equityRealReturn: 0.112, bondRealReturn: -0.055, cashRealReturn: -0.081, cpiInflation: 0.090 },
  { year: 1943, equityRealReturn: 0.224, bondRealReturn: -0.008, cashRealReturn: -0.028, cpiInflation: 0.030 },
  { year: 1944, equityRealReturn: 0.172, bondRealReturn: 0.005, cashRealReturn: -0.021, cpiInflation: 0.023 },
  { year: 1945, equityRealReturn: 0.335, bondRealReturn: 0.062, cashRealReturn: -0.020, cpiInflation: 0.022 },
  { year: 1946, equityRealReturn: -0.215, bondRealReturn: -0.155, cashRealReturn: -0.165, cpiInflation: 0.181, regimeTag: 'Post-War Inflation Spike' },
  { year: 1947, equityRealReturn: -0.038, bondRealReturn: -0.098, cashRealReturn: -0.082, cpiInflation: 0.088 },
  { year: 1948, equityRealReturn: 0.028, bondRealReturn: 0.008, cashRealReturn: -0.022, cpiInflation: 0.030 },
  { year: 1949, equityRealReturn: 0.215, bondRealReturn: 0.085, cashRealReturn: 0.032, cpiInflation: -0.021 },
  { year: 1950, equityRealReturn: 0.245, bondRealReturn: -0.052, cashRealReturn: -0.045, cpiInflation: 0.058, regimeTag: '1950s Golden Age' },
  { year: 1951, equityRealReturn: 0.178, bondRealReturn: -0.085, cashRealReturn: -0.042, cpiInflation: 0.060 },
  { year: 1952, equityRealReturn: 0.172, bondRealReturn: 0.015, cashRealReturn: 0.012, cpiInflation: 0.008 },
  { year: 1953, equityRealReturn: -0.008, bondRealReturn: 0.032, cashRealReturn: 0.011, cpiInflation: 0.007 },
  { year: 1954, equityRealReturn: 0.528, bondRealReturn: 0.075, cashRealReturn: 0.018, cpiInflation: -0.007 },
  { year: 1955, equityRealReturn: 0.312, bondRealReturn: -0.012, cashRealReturn: 0.015, cpiInflation: 0.004 },
  { year: 1956, equityRealReturn: 0.038, bondRealReturn: -0.082, cashRealReturn: -0.005, cpiInflation: 0.030 },
  { year: 1957, equityRealReturn: -0.138, bondRealReturn: 0.045, cashRealReturn: -0.002, cpiInflation: 0.029 },
  { year: 1958, equityRealReturn: 0.412, bondRealReturn: -0.085, cashRealReturn: -0.008, cpiInflation: 0.018 },
  { year: 1959, equityRealReturn: 0.105, bondRealReturn: -0.032, cashRealReturn: 0.018, cpiInflation: 0.017 },
  { year: 1960, equityRealReturn: -0.012, bondRealReturn: 0.125, cashRealReturn: 0.012, cpiInflation: 0.014 },
  { year: 1961, equityRealReturn: 0.258, bondRealReturn: 0.015, cashRealReturn: 0.015, cpiInflation: 0.007 },
  { year: 1962, equityRealReturn: -0.098, bondRealReturn: 0.062, cashRealReturn: 0.016, cpiInflation: 0.013 },
  { year: 1963, equityRealReturn: 0.212, bondRealReturn: 0.012, cashRealReturn: 0.015, cpiInflation: 0.016 },
  { year: 1964, equityRealReturn: 0.152, bondRealReturn: 0.032, cashRealReturn: 0.022, cpiInflation: 0.012 },
  { year: 1965, equityRealReturn: 0.108, bondRealReturn: -0.012, cashRealReturn: 0.019, cpiInflation: 0.019 },
  { year: 1966, equityRealReturn: -0.128, bondRealReturn: 0.002, cashRealReturn: 0.015, cpiInflation: 0.034 },
  { year: 1967, equityRealReturn: 0.208, bondRealReturn: -0.112, cashRealReturn: 0.012, cpiInflation: 0.030 },
  { year: 1968, equityRealReturn: 0.062, bondRealReturn: -0.022, cashRealReturn: 0.008, cpiInflation: 0.047 },
  { year: 1969, equityRealReturn: -0.142, bondRealReturn: -0.115, cashRealReturn: 0.009, cpiInflation: 0.062, regimeTag: 'Stagflation Beginning' },
  { year: 1970, equityRealReturn: -0.015, bondRealReturn: 0.075, cashRealReturn: 0.008, cpiInflation: 0.056 },
  { year: 1971, equityRealReturn: 0.108, bondRealReturn: 0.088, cashRealReturn: 0.012, cpiInflation: 0.033 },
  { year: 1972, equityRealReturn: 0.152, bondRealReturn: 0.015, cashRealReturn: 0.005, cpiInflation: 0.034 },
  { year: 1973, equityRealReturn: -0.225, bondRealReturn: -0.078, cashRealReturn: -0.018, cpiInflation: 0.087, regimeTag: 'Oil Crisis Bear Market' },
  { year: 1974, equityRealReturn: -0.348, bondRealReturn: -0.075, cashRealReturn: -0.041, cpiInflation: 0.123, regimeTag: '1974 Market Bottom' },
  { year: 1975, equityRealReturn: 0.285, bondRealReturn: 0.022, cashRealReturn: -0.012, cpiInflation: 0.069 },
  { year: 1976, equityRealReturn: 0.185, bondRealReturn: 0.115, cashRealReturn: 0.002, cpiInflation: 0.049 },
  { year: 1977, equityRealReturn: -0.135, bondRealReturn: -0.075, cashRealReturn: -0.015, cpiInflation: 0.067 },
  { year: 1978, equityRealReturn: -0.025, bondRealReturn: -0.092, cashRealReturn: -0.018, cpiInflation: 0.090 },
  { year: 1979, equityRealReturn: 0.048, bondRealReturn: -0.138, cashRealReturn: -0.031, cpiInflation: 0.133, regimeTag: 'Volcker Tightening' },
  { year: 1980, equityRealReturn: 0.185, bondRealReturn: -0.145, cashRealReturn: -0.012, cpiInflation: 0.125 },
  { year: 1981, equityRealReturn: -0.128, bondRealReturn: 0.012, cashRealReturn: 0.045, cpiInflation: 0.089 },
  { year: 1982, equityRealReturn: 0.175, bondRealReturn: 0.345, cashRealReturn: 0.072, cpiInflation: 0.038, regimeTag: '1982 Bull Market Start' },
  { year: 1983, equityRealReturn: 0.185, bondRealReturn: -0.028, cashRealReturn: 0.048, cpiInflation: 0.038 },
  { year: 1984, equityRealReturn: 0.022, bondRealReturn: 0.115, cashRealReturn: 0.058, cpiInflation: 0.039 },
  { year: 1985, equityRealReturn: 0.278, bondRealReturn: 0.265, cashRealReturn: 0.045, cpiInflation: 0.038 },
  { year: 1986, equityRealReturn: 0.175, bondRealReturn: 0.225, cashRealReturn: 0.048, cpiInflation: 0.011 },
  { year: 1987, equityRealReturn: 0.012, bondRealReturn: -0.065, cashRealReturn: 0.012, cpiInflation: 0.044, regimeTag: 'Black Monday 1987' },
  { year: 1988, equityRealReturn: 0.122, bondRealReturn: 0.032, cashRealReturn: 0.021, cpiInflation: 0.044 },
  { year: 1989, equityRealReturn: 0.265, bondRealReturn: 0.135, cashRealReturn: 0.035, cpiInflation: 0.046 },
  { year: 1990, equityRealReturn: -0.088, bondRealReturn: 0.021, cashRealReturn: 0.015, cpiInflation: 0.061 },
  { year: 1991, equityRealReturn: 0.265, bondRealReturn: 0.155, cashRealReturn: 0.025, cpiInflation: 0.031 },
  { year: 1992, equityRealReturn: 0.045, bondRealReturn: 0.048, cashRealReturn: 0.005, cpiInflation: 0.029 },
  { year: 1993, equityRealReturn: 0.075, bondRealReturn: 0.152, cashRealReturn: 0.002, cpiInflation: 0.027 },
  { year: 1994, equityRealReturn: -0.012, bondRealReturn: -0.108, cashRealReturn: 0.015, cpiInflation: 0.027, regimeTag: 'Bond Market Massacre' },
  { year: 1995, equityRealReturn: 0.342, bondRealReturn: 0.205, cashRealReturn: 0.030, cpiInflation: 0.025, regimeTag: 'Tech Expansion' },
  { year: 1996, equityRealReturn: 0.195, bondRealReturn: -0.028, cashRealReturn: 0.018, cpiInflation: 0.033 },
  { year: 1997, equityRealReturn: 0.312, bondRealReturn: 0.135, cashRealReturn: 0.032, cpiInflation: 0.017 },
  { year: 1998, equityRealReturn: 0.265, bondRealReturn: 0.125, cashRealReturn: 0.031, cpiInflation: 0.016 },
  { year: 1999, equityRealReturn: 0.182, bondRealReturn: -0.115, cashRealReturn: 0.018, cpiInflation: 0.027, regimeTag: 'Dot-Com Peak' },
  { year: 2000, equityRealReturn: -0.118, bondRealReturn: 0.138, cashRealReturn: 0.022, cpiInflation: 0.034, regimeTag: 'Dot-Com Crash' },
  { year: 2001, equityRealReturn: -0.132, bondRealReturn: 0.035, cashRealReturn: 0.018, cpiInflation: 0.016 },
  { year: 2002, equityRealReturn: -0.235, bondRealReturn: 0.128, cashRealReturn: 0.005, cpiInflation: 0.024 },
  { year: 2003, equityRealReturn: 0.262, bondRealReturn: -0.015, cashRealReturn: -0.009, cpiInflation: 0.019 },
  { year: 2004, equityRealReturn: 0.075, bondRealReturn: 0.008, cashRealReturn: -0.021, cpiInflation: 0.033 },
  { year: 2005, equityRealReturn: 0.015, bondRealReturn: -0.012, cashRealReturn: -0.005, cpiInflation: 0.034 },
  { year: 2006, equityRealReturn: 0.125, bondRealReturn: -0.008, cashRealReturn: 0.021, cpiInflation: 0.025 },
  { year: 2007, equityRealReturn: 0.012, bondRealReturn: 0.058, cashRealReturn: 0.005, cpiInflation: 0.041 },
  { year: 2008, equityRealReturn: -0.372, bondRealReturn: 0.201, cashRealReturn: 0.012, cpiInflation: 0.001, regimeTag: 'Global Financial Crisis' },
  { year: 2009, equityRealReturn: 0.235, bondRealReturn: -0.135, cashRealReturn: -0.025, cpiInflation: 0.027, regimeTag: 'Zero-Rate Recovery' },
  { year: 2010, equityRealReturn: 0.132, bondRealReturn: 0.068, cashRealReturn: -0.014, cpiInflation: 0.015 },
  { year: 2011, equityRealReturn: -0.018, bondRealReturn: 0.125, cashRealReturn: -0.028, cpiInflation: 0.030 },
  { year: 2012, equityRealReturn: 0.138, bondRealReturn: 0.018, cashRealReturn: -0.015, cpiInflation: 0.017 },
  { year: 2013, equityRealReturn: 0.295, bondRealReturn: -0.108, cashRealReturn: -0.014, cpiInflation: 0.015 },
  { year: 2014, equityRealReturn: 0.125, bondRealReturn: 0.098, cashRealReturn: -0.008, cpiInflation: 0.008 },
  { year: 2015, equityRealReturn: 0.008, bondRealReturn: -0.002, cashRealReturn: -0.005, cpiInflation: 0.007 },
  { year: 2016, equityRealReturn: 0.098, bondRealReturn: -0.012, cashRealReturn: -0.018, cpiInflation: 0.021 },
  { year: 2017, equityRealReturn: 0.192, bondRealReturn: 0.012, cashRealReturn: -0.011, cpiInflation: 0.021 },
  { year: 2018, equityRealReturn: -0.062, bondRealReturn: -0.018, cashRealReturn: -0.002, cpiInflation: 0.019 },
  { year: 2019, equityRealReturn: 0.285, bondRealReturn: 0.072, cashRealReturn: 0.002, cpiInflation: 0.023 },
  { year: 2020, equityRealReturn: 0.168, bondRealReturn: 0.068, cashRealReturn: -0.011, cpiInflation: 0.014, regimeTag: 'COVID-19 Shock & Rally' },
  { year: 2021, equityRealReturn: 0.215, bondRealReturn: -0.108, cashRealReturn: -0.068, cpiInflation: 0.070 },
  { year: 2022, equityRealReturn: -0.238, bondRealReturn: -0.198, cashRealReturn: -0.052, cpiInflation: 0.065, regimeTag: 'Global Inflation & Rate Hikes' },
  { year: 2023, equityRealReturn: 0.228, bondRealReturn: 0.012, cashRealReturn: 0.018, cpiInflation: 0.034, regimeTag: 'AI Surge & Recovery' },
  { year: 2024, equityRealReturn: 0.212, bondRealReturn: 0.005, cashRealReturn: 0.022, cpiInflation: 0.028 },
  { year: 2025, equityRealReturn: 0.125, bondRealReturn: 0.025, cashRealReturn: 0.020, cpiInflation: 0.025, regimeTag: 'Recent Baseline' }
];

/**
 * Pre-defined historical test scenarios for the Opportunity Cost / Withdrawal Calculator
 */
export const HISTORICAL_SCENARIOS = [
  {
    id: 'great_depression',
    name: '1929 Great Depression Peak (1929–1940)',
    description: 'Severe multi-year equity crash (-80% peak-to-trough) followed by sharp 1933 rebound.',
    startYear: 1929,
    endYear: 1940
  },
  {
    id: 'stagflation_1970s',
    name: '1970s Stagflation & Oil Shock (1972–1982)',
    description: 'High sustained inflation (8-13%), negative real bond yields, and prolonged sideways real equities.',
    startYear: 1972,
    endYear: 1982
  },
  {
    id: 'dot_com_bust',
    name: 'Dot-Com Bust & 9/11 (2000–2007)',
    description: 'Three consecutive down years in tech/equities followed by mid-decade expansion.',
    startYear: 2000,
    endYear: 2007
  },
  {
    id: 'gfc_2008',
    name: '2008 Financial Crisis & Bull Run (2007–2020)',
    description: 'Deep banking crisis drawdown (-37% real in 2008) followed by historic 11-year zero-rate bull run.',
    startYear: 2007,
    endYear: 2020
  },
  {
    id: 'full_century',
    name: 'Complete Century (1925–2025)',
    description: '100-year real market trajectory capturing all modern economic regimes.',
    startYear: 1925,
    endYear: 2025
  }
];
