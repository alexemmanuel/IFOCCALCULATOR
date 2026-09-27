import React, { useState } from 'react';
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
  formatMultiplier
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
  Info
} from 'lucide-react';

interface ForecastTabProps {
  params: SimulationParameters;
  setParams: React.Dispatch<React.SetStateAction<SimulationParameters>>;
  simResult: SimulationResult;
  sensitivityMatrix: SensitivityMatrix;
  onRunSimulation: () => void;
  isNominal: boolean;
  selectedAssetClass: AssetClassId;
  setSelectedAssetClass: (id: AssetClassId) => void;
  currency?: CurrencyCode;
  onCurrencyChange?: (c: CurrencyCode) => void;
  currencyMode?: 'local_real' | 'common_base';
  onCurrencyModeChange?: (m: 'local_real' | 'common_base') => void;
  enableFxOverlay?: boolean;
  onToggleFxOverlay?: () => void;
  onSelectTab?: (tab: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology') => void;
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
  currencyMode = 'local_real',
  onCurrencyModeChange,
  enableFxOverlay = false,
  onToggleFxOverlay,
  onSelectTab
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showSampleGhostPaths, setShowSampleGhostPaths] = useState(true);

  const currConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['USD'];
  const sym = currConfig.symbol;
  const isAfricanCurrency = currConfig.isAfrican;
  const currentPreset = ASSET_CLASS_PRESETS.find(p => p.id === selectedAssetClass);
  const isTierBorC = currentPreset?.tier === 'Tier B' || currentPreset?.tier === 'Tier C';

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
      {/* Navigation Banner for Users Looking for the Withdrawal & Opportunity Cost Calculator (Tab 2) */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-100 block sm:inline">
              Looking for the Withdrawal & Opportunity Cost Calculator?
            </span>{' '}
            <span className="text-[11px] text-indigo-300/80">
              Tab 1 simulates forward market trajectories, while Tab 2 measures the opportunity cost of withdrawing profits vs. remaining invested. An instant compound calculator is also provided below.
            </span>
          </div>
        </div>
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('withdrawal')}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <span>Open Tab 2 Calculator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mandatory Tier B / C Data Note specified in Specification */}
      {isTierBorC && (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-4 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
              <span>Data Note — {currentPreset?.name} ({currentPreset?.tier})</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                Wider Percentile Bands Applied
              </span>
            </div>
            <p>
              This market has a significantly shorter clean historical record than South Africa or developed markets. Long-horizon forecasts (especially beyond 30–40 years) carry higher uncertainty. The percentile bands have been widened and sensitivity analysis is strongly recommended.
            </p>
            {currentPreset?.uncertaintyLabel && (
              <p className="font-mono text-[11px] text-amber-300/90 pt-0.5">
                <strong>Model Note:</strong> "{currentPreset.uncertaintyLabel}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* African Currency purchasing power & FX Overlay Notice */}
      {isAfricanCurrency && (
        <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cyan-200">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Results are shown in <strong>{currency}</strong> purchasing power. Currency risk versus USD/EUR is not fully modelled in the base simulation unless the FX overlay option is enabled.
            </span>
          </div>
          {onToggleFxOverlay && (
            <button
              onClick={onToggleFxOverlay}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors shrink-0 ${
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

      {/* Always Shown Label: Results expressed in [Currency] purchasing power (real terms) */}
      <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-2 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
          <span>Results expressed in <strong>{currency} ({sym})</strong> purchasing power (real terms).</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Mode:</span>
          <button
            onClick={() => onCurrencyModeChange && onCurrencyModeChange('local_real')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              currencyMode === 'local_real' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Local-Currency Real
          </button>
          <button
            onClick={() => onCurrencyModeChange && onCurrencyModeChange('common_base')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              currencyMode === 'common_base' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Common USD Base
          </button>
        </div>
      </div>

      {/* Top Notification for Exploratory Horizon (Section 3 & 5.4) */}
      {isExploratoryHorizon && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 flex items-start gap-3 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="text-xs leading-relaxed">
            <strong className="font-semibold text-amber-200 block text-sm mb-0.5">
              Exploratory / Educational Horizon ({params.horizonYears} Years)
            </strong>
            Specification Section 5.4: Beyond roughly 50–80 years, the number of non-overlapping historical observations collapses to 2–3 independent blocks. Results for {params.horizonYears} years are presented primarily to illustrate the mathematics of compounding under uncertainty. Epistemic uncertainty bands are widened accordingly.
          </div>
        </div>
      )}

      {/* Main Grid: Controls on left / top, Results & Fan Chart on right / center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Configuration Console */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Simulation Parameters
                </h2>
              </div>
              <button
                onClick={onRunSimulation}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate</span>
              </button>
            </div>

            {/* Initial Capital & Annual Contribution */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Initial Capital ({sym})</label>
                <input
                  type="number"
                  value={params.initialCapital}
                  step={10000}
                  min={100}
                  onChange={(e) =>
                    setParams(p => ({ ...p, initialCapital: Math.max(10, Number(e.target.value)) }))
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Annual Savings ({sym}/yr)</label>
                <input
                  type="number"
                  value={params.annualContribution}
                  step={1000}
                  min={0}
                  onChange={(e) =>
                    setParams(p => ({ ...p, annualContribution: Math.max(0, Number(e.target.value)) }))
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-hidden"
                />
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
          />

          {/* Instant Interactive Compounding & Opportunity Cost Calculator Widget */}
          <QuickCalculatorWidget
            initialCapital={params.initialCapital}
            expectedReturn={params.expectedRealReturn}
            horizonYears={params.horizonYears}
            annualContribution={params.annualContribution}
            currency={currency}
            onOpenFullCalculator={() => onSelectTab && onSelectTab('withdrawal')}
            onApplyToSimulation={(cap, contrib, yrs, ret) => {
              setParams(p => ({
                ...p,
                initialCapital: cap,
                annualContribution: contrib,
                horizonYears: yrs,
                expectedRealReturn: ret
              }));
              onRunSimulation();
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
