import React, { useState, useEffect } from 'react';
import {
  SimulationParameters,
  SimulationResult,
  SensitivityMatrix,
  AssetClassId,
  DistributionModel,
  CurrencyCode
} from '../types';
import { ASSET_CLASS_PRESETS, HORIZON_BANDS, CURRENCY_CONFIGS } from '../data/historicalData';
import { FanChart } from './FanChart';
import { DistributionChart } from './DistributionChart';
import { SensitivityTable } from './SensitivityTable';
import { StabilityGauge } from './StabilityGauge';
import { QuickCalculatorWidget } from './QuickCalculatorWidget';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatMultiplier,
  convertCurrency,
  getExchangeRatio,
  cleanRoundCurrency
} from '../utils/financialEngine';
import {
  TrendingUp,
  AlertOctagon,
  Activity,
  Layers,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Play,
  Calculator,
  ArrowRight,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Info,
  FileDown,
  Loader2,
  ArrowRightLeft,
  Check,
  RefreshCw
} from 'lucide-react';

interface ForecastTabProps {
  params: SimulationParameters;
  setParams: React.Dispatch<React.SetStateAction<SimulationParameters>>;
  simResult: SimulationResult;
  sensitivityMatrix: SensitivityMatrix;
  onRunSimulation: (overrideParams?: SimulationParameters) => void;
  isNominal: boolean;
  selectedAssetClass: AssetClassId;
  setSelectedAssetClass: (id: AssetClassId) => void;
  currency?: CurrencyCode;
  onCurrencyChange?: (c: CurrencyCode) => void;
  liveRates?: Record<CurrencyCode, number>;
  lastRatesUpdated?: string;
  isLoadingRates?: boolean;
  onRefreshLiveRates?: () => void;
  onApplyPortfolioCapital?: (capital: number, targetCurrency?: CurrencyCode) => void;
  currencyMode?: 'local_real' | 'common_base';
  onCurrencyModeChange?: (m: 'local_real' | 'common_base') => void;
  enableFxOverlay?: boolean;
  onToggleFxOverlay?: () => void;
  onSelectTab?: (tab: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology') => void;
  onDownloadReport?: () => void;
  isGeneratingPdf?: boolean;
}

export const ForecastTab: React.FC<ForecastTabProps> = ({
  params,
  setParams,
  simResult,
  sensitivityMatrix,
  onRunSimulation,
  isNominal,
  selectedAssetClass,
  setSelectedAssetClass,
  currency = 'USD',
  onCurrencyChange,
  liveRates,
  lastRatesUpdated = 'Live FX Feed',
  isLoadingRates = false,
  onRefreshLiveRates,
  onApplyPortfolioCapital,
  currencyMode = 'local_real',
  onCurrencyModeChange,
  enableFxOverlay = false,
  onToggleFxOverlay,
  onSelectTab,
  onDownloadReport,
  isGeneratingPdf = false
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showSampleGhostPaths, setShowSampleGhostPaths] = useState(true);

  const currConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['USD'];
  const sym = currConfig.symbol;
  const isAfricanCurrency = currConfig.isAfrican;
  const currentPreset = ASSET_CLASS_PRESETS.find(p => p.id === selectedAssetClass);
  const isTierBorC = currentPreset?.tier === 'Tier B' || currentPreset?.tier === 'Tier C';

  // User can select ANY comparison currency in the converter, dynamically defaulting to active reporting currency (or EUR if active is USD)
  const [converterCurrency, setConverterCurrency] = useState<CurrencyCode>(() => {
    return currency !== 'USD' ? currency : 'EUR';
  });

  // Whenever user picks a different currency in the navbar, automatically update the converter comparison to that country!
  useEffect(() => {
    if (currency !== 'USD') {
      setConverterCurrency(currency);
    }
  }, [currency]);

  const converterCfg = CURRENCY_CONFIGS[converterCurrency] || CURRENCY_CONFIGS['EUR'];
  const converterRateToUsd = liveRates?.[converterCurrency] ?? converterCfg.rateToUsd ?? 1.0;
  const rateToUsd = liveRates?.[currency] ?? currConfig.rateToUsd ?? 1.0;

  // Real-time Dollar & Comparison Currency Equivalents
  const usdCapitalEquivalent = currency === 'USD' ? params.initialCapital : params.initialCapital / rateToUsd;
  const targetCapitalEquivalent = currency === converterCurrency
    ? params.initialCapital
    : (currency === 'USD' ? params.initialCapital * converterRateToUsd : (params.initialCapital / rateToUsd) * converterRateToUsd);

  const usdSavingsEquivalent = currency === 'USD' ? params.annualContribution : params.annualContribution / rateToUsd;
  const targetSavingsEquivalent = currency === converterCurrency
    ? params.annualContribution
    : (currency === 'USD' ? params.annualContribution * converterRateToUsd : (params.annualContribution / rateToUsd) * converterRateToUsd);

  // Two-Way Interactive Currency Converter State
  const [converterUsd, setConverterUsd] = useState<number>(() => {
    if (currency === 'USD') return params.initialCapital;
    return Math.round(params.initialCapital / rateToUsd);
  });

  const [converterTarget, setConverterTarget] = useState<number>(() => {
    if (currency === converterCurrency) return params.initialCapital;
    const usdVal = currency === 'USD' ? params.initialCapital : params.initialCapital / rateToUsd;
    return cleanRoundCurrency(usdVal * converterRateToUsd, converterCurrency);
  });

  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Keep converter in sync when initialCapital, currency, converterCurrency, or liveRates updates
  useEffect(() => {
    if (currency === 'USD') {
      setConverterUsd(params.initialCapital);
      setConverterTarget(cleanRoundCurrency(params.initialCapital * converterRateToUsd, converterCurrency));
    } else if (currency === converterCurrency) {
      setConverterTarget(params.initialCapital);
      setConverterUsd(converterRateToUsd > 0 ? Math.round(params.initialCapital / converterRateToUsd) : params.initialCapital);
    } else {
      const usdVal = Math.round(params.initialCapital / rateToUsd);
      setConverterUsd(usdVal);
      setConverterTarget(cleanRoundCurrency(usdVal * converterRateToUsd, converterCurrency));
    }
  }, [params.initialCapital, currency, converterCurrency, converterRateToUsd, rateToUsd]);

  const handleUsdInputChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setConverterUsd(safeVal);
    setConverterTarget(cleanRoundCurrency(safeVal * converterRateToUsd, converterCurrency));
  };

  const handleTargetInputChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setConverterTarget(safeVal);
    setConverterUsd(converterRateToUsd > 0 ? Math.round(safeVal / converterRateToUsd) : safeVal);
  };

  const handleApplyConverterToPortfolio = () => {
    const targetAmount = currency === 'USD' ? converterUsd : (currency === converterCurrency ? converterTarget : Math.round(converterUsd * rateToUsd));
    if (onApplyPortfolioCapital) {
      onApplyPortfolioCapital(targetAmount, currency);
    } else {
      const updated = { ...params, initialCapital: targetAmount };
      setParams(updated);
      onRunSimulation(updated);
    }
    setApplySuccessMessage(`Applied ${formatCurrency(targetAmount, 0, currency)} to Portfolio simulation`);
    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  const handleSwitchCurrencyAndApply = () => {
    const newCurrency: CurrencyCode = currency === 'USD' ? converterCurrency : (currency === converterCurrency ? 'USD' : converterCurrency);
    const targetAmount = newCurrency === 'USD' ? converterUsd : converterTarget;
    if (onApplyPortfolioCapital) {
      onApplyPortfolioCapital(targetAmount, newCurrency);
    } else if (onCurrencyChange) {
      onCurrencyChange(newCurrency);
    }
    setApplySuccessMessage(`Switched to ${newCurrency} and set Portfolio to ${formatCurrency(targetAmount, 0, newCurrency)}`);
    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  const handleAssetPresetChange = (presetId: AssetClassId) => {
    setSelectedAssetClass(presetId);
    const preset = ASSET_CLASS_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setParams(prev => ({
        ...prev,
        expectedRealReturn: preset.expectedRealReturn,
        annualVolatility: preset.annualVolatility,
        widenedConfidenceBand: preset.widenedConfidenceBand ?? false
      }));
    }
  };

  const handleHorizonBandClick = (years: number) => {
    setParams(prev => ({ ...prev, horizonYears: years }));
  };

  const isExploratoryHorizon = params.horizonYears >= 80;

  return (
    <div className="space-y-6">
      {/* Active Currency Live FX Banner (when non-USD) */}
      {currency !== 'USD' && (
        <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Reporting in <strong>{currency} ({sym} · {currConfig.name})</strong> · Live Market Rate: 1 USD = {sym}{rateToUsd >= 100 ? rateToUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : rateToUsd.toFixed(2)} {currency}
            </span>
          </div>
          {onToggleFxOverlay && isAfricanCurrency && (
            <button
              onClick={onToggleFxOverlay}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors shrink-0 self-start sm:self-auto ${
                enableFxOverlay
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-slate-800'
              }`}
            >
              {enableFxOverlay ? 'FX Overlay Active (+3% Vol Drag)' : 'Enable FX Overlay (+3% Vol Drag)'}
            </button>
          )}
        </div>
      )}

      {/* Mandatory Tier B / C Data Note (Compact) */}
      {isTierBorC && (
        <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-3 flex items-start gap-2.5 text-amber-200 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold text-amber-300">Data Note: {currentPreset?.name} ({currentPreset?.tier})</span> — Shorter historical observation history. Confidence percentile bands are widened.
          </div>
        </div>
      )}

      {/* Exploratory Horizon Note (Compact) */}
      {isExploratoryHorizon && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 flex items-start gap-2 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            <strong className="font-semibold text-amber-200">Exploratory Horizon ({params.horizonYears} Years):</strong> Mathematical illustration of compounding over multi-generational spans; epistemic uncertainty bands widened.
          </span>
        </div>
      )}

      {/* Main Grid: Controls on left, Results & Fan Chart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Currency Converter & Simulation Parameters */}
        <div className="lg:col-span-4 space-y-4">
          {/* Dedicated Currency Ratio & Portfolio Converter */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Currency Ratio & Portfolio Converter
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-md font-semibold">
                {currency} ({sym})
              </span>
            </div>

            {/* Live Real-Time Market Exchange Engine (Dynamic for selected currency) */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full ${isLoadingRates ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'} shrink-0`} />
                <span className="text-slate-300 font-semibold truncate">
                  1 USD = {converterCfg.symbol}{converterRateToUsd >= 100 ? converterRateToUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : converterRateToUsd.toFixed(2)} {converterCurrency}
                </span>
                <span className="text-[10px] text-emerald-400 font-sans hidden sm:inline shrink-0">Live Market</span>
              </div>

              {onRefreshLiveRates && (
                <button
                  onClick={onRefreshLiveRates}
                  disabled={isLoadingRates}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  title={`Live FX Engine (${lastRatesUpdated}). Click to sync latest real-time rates.`}
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isLoadingRates ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
              )}
            </div>

            {/* Two-Way Linked Converter: Dollar ⇄ Target Currency */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 font-medium text-[11px] block mb-1">
                  US Dollar ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    step={1000}
                    min="0"
                    value={converterUsd}
                    onChange={(e) => handleUsdInputChange(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
                    placeholder="e.g. 100000"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 gap-1">
                  <label className="text-slate-400 font-medium text-[11px] truncate">
                    {converterCfg.name}
                  </label>
                  {/* Currency Selector for comparison */}
                  <select
                    value={converterCurrency}
                    onChange={(e) => {
                      const newCurr = e.target.value as CurrencyCode;
                      setConverterCurrency(newCurr);
                      const newCfg = CURRENCY_CONFIGS[newCurr] || CURRENCY_CONFIGS['EUR'];
                      const newRate = liveRates?.[newCurr] ?? newCfg.rateToUsd ?? 1.0;
                      setConverterTarget(cleanRoundCurrency(converterUsd * newRate, newCurr));
                    }}
                    className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-[10px] rounded px-1.5 py-0.5 focus:outline-hidden cursor-pointer"
                    title="Select currency to compare with USD"
                  >
                    <optgroup label="Global Reserves" className="bg-slate-900 text-slate-100">
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (CA$)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="JPY">JPY (¥)</option>
                    </optgroup>
                    <optgroup label="African & Emerging" className="bg-slate-900 text-slate-100">
                      <option value="NGN">NGN (₦)</option>
                      <option value="ZAR">ZAR (R)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="EGP">EGP (E£)</option>
                      <option value="GHS">GHS (GH₵)</option>
                      <option value="MAD">MAD (DH)</option>
                      <option value="TND">TND (DT)</option>
                      <option value="XOF">XOF (CFA)</option>
                    </optgroup>
                  </select>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono">
                    {converterCfg.symbol}
                  </span>
                  <input
                    type="number"
                    step={converterRateToUsd >= 100 ? 50000 : 1000}
                    min="0"
                    value={converterTarget}
                    onChange={(e) => handleTargetInputChange(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
                    placeholder={`e.g. ${cleanRoundCurrency(100000 * converterRateToUsd, converterCurrency)}`}
                  />
                </div>
              </div>
            </div>

            {/* Converter Action Buttons: Apply to Portfolio & Switch Currency */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={handleApplyConverterToPortfolio}
                className="flex-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Immediately set this exact converted amount into the Portfolio Simulation"
              >
                <Check className="w-3.5 h-3.5 text-cyan-200" />
                <span>Apply to Portfolio</span>
              </button>

              <button
                onClick={handleSwitchCurrencyAndApply}
                className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 active:scale-95 shrink-0 cursor-pointer"
                title={`Switch active app currency to ${currency === converterCurrency ? 'USD' : converterCurrency} and apply value`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{currency === converterCurrency ? 'Switch to USD' : `Switch to ${converterCurrency}`}</span>
              </button>
            </div>

            {/* Confirmation Feedback */}
            {applySuccessMessage && (
              <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{applySuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Simulation Parameters Console */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Simulation Parameters
                </h2>
              </div>
              <button
                onClick={() => onRunSimulation()}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate</span>
              </button>
            </div>

            {/* Stress Test: Early Sequence Risk Toggle */}
            <div
              onClick={() => {
                const nextVal = !params.enableStressTest;
                const updated = { ...params, enableStressTest: nextVal };
                setParams(updated);
                onRunSimulation(updated);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                params.enableStressTest
                  ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/30 shadow-xs'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1 rounded-md ${
                    params.enableStressTest ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">
                        Stress Test (Sequence Risk)
                      </span>
                      {params.enableStressTest ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 animate-pulse">
                          -37.0% Drawdown Shift · Y1–Y3 Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                          Standard
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Forces the simulation to use the 1st percentile of historical market drawdowns (-37.0% p.a.) as a baseline shift for the first 3 years of the projection, highlighting the impact of early-stage sequence risk.
                    </p>
                  </div>
                </div>

                {/* Switch Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextVal = !params.enableStressTest;
                    const updated = { ...params, enableStressTest: nextVal };
                    setParams(updated);
                    onRunSimulation(updated);
                  }}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    params.enableStressTest ? 'bg-rose-600' : 'bg-slate-800'
                  }`}
                  role="switch"
                  aria-checked={!!params.enableStressTest}
                  title="Toggle early sequence risk stress test"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      params.enableStressTest ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {params.enableStressTest && (
                <div className="mt-2.5 pt-2 border-t border-rose-900/40 flex items-center justify-between text-[11px] font-mono text-rose-300">
                  <span>Shock Window: Years 1 → 3</span>
                  <span className="font-semibold text-rose-200">
                    Baseline Shift: -37.0% p.a. (1st Percentile Drawdown)
                  </span>
                </div>
              )}
            </div>

            {/* Initial Capital & Annual Contribution */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium truncate">Initial Capital ({sym})</label>
                  {currency !== 'USD' && (
                    <span className="text-[10px] text-cyan-400/90 font-mono hidden sm:inline">
                      1$ = {sym}{rateToUsd >= 100 ? rateToUsd.toLocaleString() : rateToUsd.toFixed(2)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={params.initialCapital}
                  step={rateToUsd >= 100 ? 500000 : 10000}
                  min={10}
                  onChange={(e) =>
                    setParams(p => ({ ...p, initialCapital: Math.max(10, Number(e.target.value)) }))
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-hidden"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                  {currency !== 'USD' ? (
                    <>
                      <span className="text-emerald-400 font-bold">
                        ≈ ${Math.round(usdCapitalEquivalent).toLocaleString()} USD
                      </span>
                      <span className="text-[10px] text-slate-500">Live Market</span>
                    </>
                  ) : (
                    <>
                      <span className="text-cyan-400 font-medium">
                        ≈ {converterCfg.symbol}{cleanRoundCurrency(targetCapitalEquivalent, converterCurrency).toLocaleString()} {converterCurrency}
                      </span>
                      <span className="text-[10px] text-emerald-400/90 font-semibold">1$ = {converterCfg.symbol}{converterRateToUsd >= 100 ? Math.round(converterRateToUsd).toLocaleString() : converterRateToUsd.toFixed(2)} Live</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium truncate">Annual Savings ({sym}/yr)</label>
                </div>
                <input
                  type="number"
                  value={params.annualContribution}
                  step={rateToUsd >= 100 ? 50000 : 1000}
                  min={0}
                  onChange={(e) =>
                    setParams(p => ({ ...p, annualContribution: Math.max(0, Number(e.target.value)) }))
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-hidden"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                  {currency !== 'USD' ? (
                    <span className="text-emerald-400/90 font-medium">
                      ≈ ${Math.round(usdSavingsEquivalent).toLocaleString()} USD/yr (Live)
                    </span>
                  ) : (
                    <span className="text-cyan-400/90 font-medium">
                      ≈ {converterCfg.symbol}{cleanRoundCurrency(targetSavingsEquivalent, converterCurrency).toLocaleString()} {converterCurrency}/yr (Live)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Asset Class Preset Selector Grouped */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 block text-xs font-medium">
                  Asset Class Benchmark Selector
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Page 5 Table 9 + Africa Tiers</span>
              </div>

              {/* Africa Tiers Section */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <span>🌍 African Market Tiers (A – D)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ASSET_CLASS_PRESETS.filter(p => p.region === 'Africa').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleAssetPresetChange(preset.id)}
                      className={`text-left p-2 rounded-lg border text-xs transition-colors ${
                        selectedAssetClass === preset.id
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/40'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold line-clamp-1">{preset.name}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono shrink-0 ${
                          preset.dataConfidence === 'High'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                            : preset.dataConfidence === 'Low'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                        }`}>
                          {preset.tier}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {(preset.expectedRealReturn * 100).toFixed(1)}% ret · {(preset.annualVolatility * 100).toFixed(1)}% vol
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Global Developed & Emerging Section */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                  <span>🌐 Global, Developed & Emerging Markets</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ASSET_CLASS_PRESETS.filter(p => p.region !== 'Africa').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleAssetPresetChange(preset.id)}
                      className={`text-left p-2 rounded-lg border text-xs transition-colors ${
                        selectedAssetClass === preset.id
                          ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="font-semibold line-clamp-1">{preset.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {(preset.expectedRealReturn * 100).toFixed(1)}% ret · {(preset.annualVolatility * 100).toFixed(1)}% vol
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Expected Return & Volatility Sliders */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Expected Real Geometric Return</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {(params.expectedRealReturn * 100).toFixed(1)}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.12"
                  step="0.001"
                  value={params.expectedRealReturn}
                  onChange={(e) => {
                    setSelectedAssetClass('custom');
                    setParams(p => ({ ...p, expectedRealReturn: parseFloat(e.target.value) }));
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Conservative: 4.0%</span>
                  <span>Shiller DMS: 6.5%</span>
                  <span>Optimistic: 8.0%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Annual Volatility (Std. Dev.)</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {(params.annualVolatility * 100).toFixed(1)}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min="0.04"
                  max="0.35"
                  step="0.005"
                  value={params.annualVolatility}
                  onChange={(e) => {
                    setSelectedAssetClass('custom');
                    setParams(p => ({ ...p, annualVolatility: parseFloat(e.target.value) }));
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Bonds: 9.5%</span>
                  <span>60/40: 11%</span>
                  <span>Equities: 19%</span>
                  <span>High: 25%</span>
                </div>
              </div>
            </div>

            {/* Horizon Selection Buttons & Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium">Forecast Horizon</span>
                <span className="font-mono font-bold text-slate-100 text-sm">
                  {params.horizonYears} Years
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 text-[11px]">
                {[5, 15, 30, 50, 75, 100, 150, 200].map(yr => (
                  <button
                    key={yr}
                    onClick={() => handleHorizonBandClick(yr)}
                    className={`py-1 px-1.5 rounded-md border text-center font-mono transition-colors ${
                      params.horizonYears === yr
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {yr}y
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="3"
                max="200"
                step="1"
                value={params.horizonYears}
                onChange={(e) => setParams(p => ({ ...p, horizonYears: parseInt(e.target.value) }))}
                className="w-full accent-cyan-500 cursor-pointer mt-1"
              />
            </div>

            {/* Advanced Modeling Toggle */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="w-full py-1 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between"
              >
                <span>Model Risk & Valuation Drag Options</span>
                <span className="text-[10px] font-mono">{showAdvancedSettings ? 'Hide ▲' : 'Expand ▼'}</span>
              </button>

              {showAdvancedSettings && (
                <div className="mt-3 space-y-3 p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs">
                  {/* Distributional Model */}
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Distributional Geometry</label>
                    <select
                      value={params.modelType}
                      onChange={(e) =>
                        setParams(p => ({ ...p, modelType: e.target.value as DistributionModel }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-hidden"
                    >
                      <option value="lognormal">Standard Log-Normal (Geometric Brownian)</option>
                      <option value="student_t">Fat-Tailed (Student-t, df=5)</option>
                      <option value="jump_diffusion">Jump-Diffusion (Black Swan Crashes)</option>
                      <option value="mean_reversion">Regime Mean-Reverting Returns</option>
                    </select>
                  </div>

                  {/* Valuation Drag (Starting CAPE) */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Valuation Drag (High CAPE starting)</span>
                      <span className="font-mono text-amber-400">
                        {(params.valuationDragPct * 100).toFixed(1)}% p.a.
                      </span>
                    </div>
                    <select
                      value={params.valuationDragPct}
                      onChange={(e) =>
                        setParams(p => ({ ...p, valuationDragPct: parseFloat(e.target.value) }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-hidden"
                    >
                      <option value="0">0.0% (Neutral starting valuation)</option>
                      <option value="-0.01">-1.0% p.a. for first decade (Elevated CAPE)</option>
                      <option value="-0.015">-1.5% p.a. for first decade (Bubble starting)</option>
                      <option value="-0.02">-2.0% p.a. for first decade (Severe overvaluation)</option>
                    </select>
                  </div>

                  {/* Monte Carlo Paths */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Simulation Paths</span>
                      <span className="font-mono text-cyan-400">
                        {params.numPaths.toLocaleString()} paths
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[11px]">
                      {[3000, 5000, 10000].map(n => (
                        <button
                          key={n}
                          onClick={() => setParams(p => ({ ...p, numPaths: n }))}
                          className={`py-1 rounded border text-center font-mono ${
                            params.numPaths === n
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {n / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ghost paths toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Show sample paths overlay</span>
                    <input
                      type="checkbox"
                      checked={showSampleGhostPaths}
                      onChange={(e) => setShowSampleGhostPaths(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Outcomes, Percentile Fan Chart, Distribution & Sensitivity */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Section Header with Instant Report Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Simulation Outcomes & Wealth Trajectory</span>
                <span className="text-[11px] font-normal text-slate-400">
                  ({params.horizonYears}y · {params.numPaths.toLocaleString()} paths)
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Multi-horizon probabilistic quantiles with explicit epistemic uncertainty modeling
              </p>
            </div>

            {onDownloadReport && (
              <button
                onClick={onDownloadReport}
                disabled={isGeneratingPdf}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs ${
                  isGeneratingPdf
                    ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-700/50 cursor-wait'
                    : 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400/60 active:scale-95'
                }`}
                title="Generate and download institutional summary PDF"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Building PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Report (PDF)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Stress Test Active Notification */}
          {params.enableStressTest && (
            <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-xs text-rose-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong className="text-rose-300">Stress Test Active:</strong> Simulation forces a <strong>-37.0%</strong> baseline shift (1st percentile of historical market drawdowns) for the first 3 years to highlight early-stage sequence-of-returns risk.
                </span>
              </div>
              <button
                onClick={() => {
                  const updated = { ...params, enableStressTest: false };
                  setParams(updated);
                  onRunSimulation(updated);
                }}
                className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 transition-colors shrink-0 cursor-pointer"
              >
                Disable
              </button>
            </div>
          )}

          {/* Key Metrics Cards (Specification Section 10) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Probability of Good Profits */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>P(Good Profits)</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {formatPercent(simResult.probGoodProfits)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Real wealth ≥ {params.goodProfitThresholdMultiplier}x capital
              </div>
            </div>

            {/* Probability of Failure */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>P(Failure)</span>
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 tabular-nums">
                {formatPercent(simResult.probFailure)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Real wealth ≤ {params.failureThresholdMultiplier}x capital
              </div>
            </div>

            {/* Median Terminal Wealth */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>50th Median Result</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300 tabular-nums">
                {formatCurrency(simResult.terminalWealthMedian, 0, currency)}
              </div>
              {currency !== 'USD' ? (
                <div className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                  ≈ {formatCurrency(simResult.terminalWealthMedian / rateToUsd, 0, 'USD')} USD
                </div>
              ) : (
                <div className="text-[11px] text-cyan-400 font-mono font-semibold mt-0.5">
                  ≈ {formatCurrency(simResult.terminalWealthMedian * converterRateToUsd, 0, converterCurrency)} {converterCurrency}
                </div>
              )}
              <div className="text-[10px] text-cyan-400/80 font-mono mt-1">
                {formatMultiplier(simResult.terminalWealthMedian / params.initialCapital)} ({formatPercent(simResult.medianCAGR)} CAGR)
              </div>
            </div>

            {/* 5th to 95th Percentile Spread */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>90% Confidence Span</span>
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xs sm:text-sm font-semibold font-mono text-slate-200 mt-1">
                {formatCurrencyCompact(simResult.terminalWealthP5, currency)} → {formatCurrencyCompact(simResult.terminalWealthP95, currency)}
              </div>
              {currency !== 'USD' ? (
                <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                  ≈ {formatCurrencyCompact(simResult.terminalWealthP5 / rateToUsd, 'USD')} → {formatCurrencyCompact(simResult.terminalWealthP95 / rateToUsd, 'USD')} USD
                </div>
              ) : (
                <div className="text-[10px] text-cyan-400/90 font-mono mt-0.5">
                  ≈ {formatCurrencyCompact(simResult.terminalWealthP5 * converterRateToUsd, converterCurrency)} → {formatCurrencyCompact(simResult.terminalWealthP95 * converterRateToUsd, converterCurrency)} {converterCurrency}
                </div>
              )}
              <div className="text-[10px] text-slate-500 mt-1.5 font-mono">
                5th: {formatMultiplier(simResult.terminalWealthP5 / params.initialCapital)} · 95th: {formatMultiplier(simResult.terminalWealthP95 / params.initialCapital)}
              </div>
            </div>
          </div>

          {/* Visual Stability Floor Radial Gauge & Progress Component (Real-Time Tracking) */}
          <StabilityGauge
            stabilityPercentage={simResult.stabilityPercentage}
            stabilityFloorPct={params.stabilityFloorPct}
            stabilityStartYear={params.stabilityStartYear}
            numPaths={params.numPaths}
            horizonYears={params.horizonYears}
            onUpdateStabilityParams={(floorPct, startYr) => {
              setParams(p => ({
                ...p,
                stabilityFloorPct: floorPct,
                stabilityStartYear: startYr
              }));
            }}
          />

          {/* Percentile Fan Chart */}
          <FanChart
            percentiles={simResult.percentiles}
            samplePaths={simResult.samplePaths}
            initialCapital={params.initialCapital}
            goodProfitThreshold={params.initialCapital * params.goodProfitThresholdMultiplier}
            failureThreshold={params.initialCapital * params.failureThresholdMultiplier}
            showSamplePaths={showSampleGhostPaths}
            nominalInflationRate={params.inflationRate}
            isNominal={isNominal}
            currency={currency}
            liveRates={liveRates}
            enableStressTest={params.enableStressTest}
          />

          {/* Instant Interactive Compounding & Opportunity Cost Calculator Widget */}
          <QuickCalculatorWidget
            initialCapital={params.initialCapital}
            expectedReturn={params.expectedRealReturn}
            horizonYears={params.horizonYears}
            annualContribution={params.annualContribution}
            currency={currency}
            liveRates={liveRates}
            onOpenFullCalculator={() => onSelectTab && onSelectTab('withdrawal')}
            onApplyToSimulation={(cap, contrib, yrs, ret) => {
              const updated = {
                ...params,
                initialCapital: cap,
                annualContribution: contrib,
                horizonYears: yrs,
                expectedRealReturn: ret
              };
              setParams(updated);
              onRunSimulation(updated);
            }}
          />

          {/* Terminal Wealth Probability Density Distribution */}
          <DistributionChart
            distribution={simResult.terminalDistribution}
            initialCapital={params.initialCapital}
            goodProfitThreshold={params.initialCapital * params.goodProfitThresholdMultiplier}
            failureThreshold={params.initialCapital * params.failureThresholdMultiplier}
            probGoodProfits={simResult.probGoodProfits}
            probFailure={simResult.probFailure}
            currency={currency}
          />

          {/* Parameter Sensitivity Matrix (Section 5.1 & Page 6) */}
          <SensitivityTable
            matrix={sensitivityMatrix}
            currentReturn={params.expectedRealReturn}
            currentVolatility={params.annualVolatility}
            currency={currency}
            onApplyParameters={(expRet, vol) => {
              setSelectedAssetClass('custom');
              setParams(p => ({
                ...p,
                expectedRealReturn: expRet,
                annualVolatility: vol
              }));
              onRunSimulation();
            }}
          />
        </div>
      </div>
    </div>
  );
};
