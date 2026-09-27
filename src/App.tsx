/**
 * Investment Forecasting & Opportunity Cost Calculator
 * Full System Implementation based on System Specification v1.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  SimulationParameters,
  SimulationResult,
  SensitivityMatrix,
  AssetClassId,
  HistoricalYearRecord,
  CurrencyCode
} from './types';
import { HISTORICAL_ANNUAL_RETURNS, CURRENCY_CONFIGS } from './data/historicalData';
import { runMonteCarloSimulation, computeSensitivityMatrix } from './utils/financialEngine';
import { Header } from './components/Header';
import { MarqueeTicker } from './components/MarqueeTicker';
import { ForecastTab } from './components/ForecastTab';
import { WithdrawalTab } from './components/WithdrawalTab';
import { TopInvestmentsTab } from './components/TopInvestmentsTab';
import { MultiHorizonTab } from './components/MultiHorizonTab';
import { HistoricalTab } from './components/HistoricalTab';
import { MethodologyTab } from './components/MethodologyTab';
import { DisclaimersModal } from './components/DisclaimersModal';
import { InvestmentModal } from './components/InvestmentModal';
import { TopInvestment } from './data/topInvestments';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

const DEFAULT_PARAMS: SimulationParameters = {
  initialCapital: 100000,
  annualContribution: 0,
  expectedRealReturn: 0.065, // 6.5% p.a. US Equities DMS/Shiller baseline
  annualVolatility: 0.19,    // 19.0% standard deviation
  inflationRate: 0.025,      // 2.5% inflation
  horizonYears: 30,          // 30 years default
  numPaths: 5000,            // 5,000 paths for percentile stability
  valuationDragPct: 0.0,     // 0% neutral (optional -1% for high CAPE)
  valuationDragYears: 10,
  modelType: 'lognormal',
  tDegreesOfFreedom: 5,
  jumpProbability: 0.03,
  jumpMean: -0.25,
  jumpStdDev: 0.08,
  goodProfitThresholdMultiplier: 2.0, // terminal wealth >= 2x starting capital
  failureThresholdMultiplier: 1.0,    // terminal wealth <= 1x starting capital
  stabilityFloorPct: 0.40,            // never drop >40% below rolling peak
  stabilityStartYear: 5,
  seed: 42,
  currency: 'USD',
  currencyMode: 'local_real',
  enableFxOverlay: false,
  fxVolatilityOverlayPct: 0.03,
  widenedConfidenceBand: false
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology'>('forecast');
  const [params, setParams] = useState<SimulationParameters>(DEFAULT_PARAMS);
  const [selectedAssetClass, setSelectedAssetClass] = useState<AssetClassId>('us_equities');
  const [isNominal, setIsNominal] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isDisclaimersOpen, setIsDisclaimersOpen] = useState<boolean>(false);
  const [historicalData, setHistoricalData] = useState<HistoricalYearRecord[]>(HISTORICAL_ANNUAL_RETURNS);
  const [selectedInvestmentModal, setSelectedInvestmentModal] = useState<TopInvestment | null>(null);

  // Currency & FX overlay controls
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [currencyMode, setCurrencyMode] = useState<'local_real' | 'common_base'>('local_real');
  const [enableFxOverlay, setEnableFxOverlay] = useState<boolean>(false);

  // Sync currency and FX overlay to simulation parameters
  const handleCurrencyChange = useCallback((newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    setParams(prev => ({
      ...prev,
      currency: newCurrency
    }));
  }, []);

  const handleToggleFxOverlay = useCallback(() => {
    setEnableFxOverlay(prev => {
      const next = !prev;
      setParams(p => ({
        ...p,
        enableFxOverlay: next
      }));
      return next;
    });
  }, []);

  // Compute Monte Carlo Simulation Result
  const [simResult, setSimResult] = useState<SimulationResult>(() =>
    runMonteCarloSimulation(DEFAULT_PARAMS)
  );

  // Compute 2D Sensitivity Matrix
  const [sensitivityMatrix, setSensitivityMatrix] = useState<SensitivityMatrix>(() =>
    computeSensitivityMatrix(DEFAULT_PARAMS)
  );

  // Run simulation handler
  const handleRunSimulation = useCallback(() => {
    const res = runMonteCarloSimulation(params);
    setSimResult(res);

    // Update sensitivity matrix if return/volatility or horizon changed
    const sens = computeSensitivityMatrix(params);
    setSensitivityMatrix(sens);
  }, [params]);

  // Re-run simulation when core parameters change
  useEffect(() => {
    handleRunSimulation();
  }, [
    params.horizonYears,
    params.expectedRealReturn,
    params.annualVolatility,
    params.initialCapital,
    params.modelType,
    params.valuationDragPct,
    params.currency,
    params.enableFxOverlay,
    params.widenedConfidenceBand,
    handleRunSimulation
  ]);

  // Handler to load any investment into the Monte Carlo Forecaster
  const handleSimulateAsset = useCallback((inv: TopInvestment) => {
    setSelectedAssetClass('custom');
    setParams(prev => ({
      ...prev,
      expectedRealReturn: inv.fiveYearCagr,
      annualVolatility: inv.annualVolatility,
      widenedConfidenceBand: inv.tier === 'Tier B' || inv.tier === 'Tier C'
    }));
    setActiveTab('forecast');
  }, []);

  // Handler to load any investment into the Withdrawal Calculator
  const handleAnalyzeWithdrawalAsset = useCallback((inv: TopInvestment) => {
    setSelectedAssetClass('custom');
    setParams(prev => ({
      ...prev,
      expectedRealReturn: inv.fiveYearCagr,
      annualVolatility: inv.annualVolatility,
      widenedConfidenceBand: inv.tier === 'Tier B' || inv.tier === 'Tier C'
    }));
    setActiveTab('withdrawal');
  }, []);

  // Click on marquee ticker
  const handleSelectFromMarquee = useCallback((inv: TopInvestment) => {
    setSelectedInvestmentModal(inv);
  }, []);

  // Export Data Handler (CSV or JSON)
  const handleExportData = () => {
    const exportObject = {
      title: "Investment Forecasting & Opportunity Cost Calculator",
      version: "1.0",
      generatedAt: new Date().toISOString(),
      parameters: params,
      simulationMetrics: {
        reportingCurrency: currency,
        currencyMode: currencyMode,
        fxOverlayEnabled: enableFxOverlay,
        medianTerminalWealth: simResult.terminalWealthMedian,
        terminalWealthP5: simResult.terminalWealthP5,
        terminalWealthP25: simResult.terminalWealthP25,
        terminalWealthP75: simResult.terminalWealthP75,
        terminalWealthP95: simResult.terminalWealthP95,
        probabilityGoodProfits: simResult.probGoodProfits,
        probabilityFailure: simResult.probFailure,
        medianCAGR: simResult.medianCAGR,
        stabilityPercentage: simResult.stabilityPercentage
      },
      percentileTrajectory: simResult.percentiles.map(p => ({
        year: p.year,
        p5: p.p5,
        p25: p.p25,
        p50_median: p.p50,
        p75: p.p75,
        p95: p.p95
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `investment_forecast_${params.horizonYears}y_${currency}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetDefaults = () => {
    setParams(DEFAULT_PARAMS);
    setSelectedAssetClass('us_equities');
    setIsNominal(false);
    setCurrency('USD');
    setCurrencyMode('local_real');
    setEnableFxOverlay(false);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/90 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isNominal={isNominal}
        setIsNominal={setIsNominal}
        inflationRate={params.inflationRate}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        enableFxOverlay={enableFxOverlay}
        onToggleFxOverlay={handleToggleFxOverlay}
        onOpenDisclaimers={() => setIsDisclaimersOpen(true)}
        onExportData={handleExportData}
        onResetDefaults={handleResetDefaults}
      />

      {/* Dynamic Marquee Sliding Ticker Showing Leading Investments, % GDP, Gains & Losses */}
      <MarqueeTicker onSelectInvestment={handleSelectFromMarquee} />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'forecast' && (
          <ForecastTab
            params={params}
            setParams={setParams}
            simResult={simResult}
            sensitivityMatrix={sensitivityMatrix}
            onRunSimulation={handleRunSimulation}
            isNominal={isNominal}
            selectedAssetClass={selectedAssetClass}
            setSelectedAssetClass={setSelectedAssetClass}
            currency={currency}
            onCurrencyChange={handleCurrencyChange}
            currencyMode={currencyMode}
            onCurrencyModeChange={setCurrencyMode}
            enableFxOverlay={enableFxOverlay}
            onToggleFxOverlay={handleToggleFxOverlay}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'withdrawal' && (
          <WithdrawalTab
            initialCapital={params.initialCapital}
            simResult={simResult}
            historicalData={historicalData}
            inflationRate={params.inflationRate}
            currency={currency}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'investments' && (
          <TopInvestmentsTab
            onSimulateAsset={handleSimulateAsset}
            onAnalyzeWithdrawals={handleAnalyzeWithdrawalAsset}
            reportingCurrency={currency}
          />
        )}

        {activeTab === 'horizons' && (
          <MultiHorizonTab
            baseParams={params}
            currency={currency}
            onSelectHorizon={(yr) => {
              setParams(p => ({ ...p, horizonYears: yr }));
              setActiveTab('forecast');
            }}
          />
        )}

        {activeTab === 'historical' && (
          <HistoricalTab
            historicalData={historicalData}
            onCustomDataLoaded={(data) => {
              setHistoricalData(data);
              setActiveTab('withdrawal');
            }}
          />
        )}

        {activeTab === 'methodology' && <MethodologyTab />}
      </main>

      {/* Persistent Mandatory Disclaimers Footer Bar (Specification Section 11) */}
      <footer className="w-full border-t border-slate-800 bg-slate-950/90 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Regulatory & Model Notice:</strong> Past performance is not a guarantee of future results. All figures are mathematical illustrations under user-chosen parametric assumptions, not financial advice.
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-slate-500 font-mono text-[11px]">
            <button
              onClick={() => setIsDisclaimersOpen(true)}
              className="text-cyan-400 hover:underline"
            >
              Full Disclaimers (Section 11)
            </button>
            <span>·</span>
            <span>v1.0 System Specification</span>
          </div>
        </div>
      </footer>

      {/* Disclaimers Modal */}
      <DisclaimersModal
        isOpen={isDisclaimersOpen}
        onClose={() => setIsDisclaimersOpen(false)}
      />

      {/* Investment Details & Holdings Modal */}
      <InvestmentModal
        investment={selectedInvestmentModal}
        onClose={() => setSelectedInvestmentModal(null)}
        onSimulateAsset={(inv) => {
          setSelectedInvestmentModal(null);
          handleSimulateAsset(inv);
        }}
        onAnalyzeWithdrawals={(inv) => {
          setSelectedInvestmentModal(null);
          handleAnalyzeWithdrawalAsset(inv);
        }}
      />
    </div>
  );
}
