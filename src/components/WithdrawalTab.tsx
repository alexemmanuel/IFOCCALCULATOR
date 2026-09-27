import React, { useState, useMemo } from 'react';
import {
  CashFlowEvent,
  WithdrawalAnalysisResult,
  HistoricalYearRecord,
  SimulationResult,
  CurrencyCode
} from '../types';
import { HISTORICAL_SCENARIOS, HISTORICAL_ANNUAL_RETURNS, CURRENCY_CONFIGS } from '../data/historicalData';
import { TrajectoryChart } from './TrajectoryChart';
import {
  calculateWithdrawalImpact,
  extractReturnsFromSimPath,
  extractHistoricalReturns,
  formatCurrency,
  formatPercent,
  formatMultiplier
} from '../utils/financialEngine';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Percent,
  History,
  Sparkles,
  Calculator
} from 'lucide-react';

interface WithdrawalTabProps {
  initialCapital: number;
  simResult: SimulationResult;
  historicalData: HistoricalYearRecord[];
  inflationRate: number;
  currency?: CurrencyCode;
  onSelectTab?: (tab: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology') => void;
}

export const WithdrawalTab: React.FC<WithdrawalTabProps> = ({
  initialCapital,
  simResult,
  historicalData,
  inflationRate,
  currency = 'USD',
  onSelectTab
}) => {
  const sym = CURRENCY_CONFIGS[currency]?.symbol || '$';
  // Mode: Simulated path vs Historical scenario
  const [operatingMode, setOperatingMode] = useState<'simulated' | 'historical'>('simulated');
  const [selectedSimPath, setSelectedSimPath] = useState<'median' | 'p25' | 'p5' | 'p75'>('median');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('gfc_2008');

  // Interval selection
  const [intervalStart, setIntervalStart] = useState<number>(1);
  const [intervalEnd, setIntervalEnd] = useState<number>(10);

  // Cash flow events list
  const [cashFlows, setCashFlows] = useState<CashFlowEvent[]>([
    {
      id: 'cf-1',
      year: 3,
      type: 'withdrawal',
      amount: 0.25,
      isPercentage: true,
      label: 'Realize 25% profit after early bull run'
    },
    {
      id: 'cf-2',
      year: 7,
      type: 'withdrawal',
      amount: 40000,
      isPercentage: false,
      label: 'Capital expenditure / down payment'
    }
  ]);

  // Form for adding new cash flow
  const [newYear, setNewYear] = useState<number>(5);
  const [newType, setNewType] = useState<'withdrawal' | 'contribution'>('withdrawal');
  const [newAmount, setNewAmount] = useState<number>(30000);
  const [newIsPercentage, setNewIsPercentage] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('Strategic rebalancing cash-out');

  // Calculate return series based on selected mode
  const currentScenario = HISTORICAL_SCENARIOS.find(s => s.id === selectedScenarioId) || HISTORICAL_SCENARIOS[3];

  const { returnSeries, horizonYears, seriesTitle } = useMemo(() => {
    if (operatingMode === 'historical') {
      const rets = extractHistoricalReturns(
        historicalData,
        currentScenario.startYear,
        currentScenario.endYear,
        'equity'
      );
      return {
        returnSeries: rets,
        horizonYears: rets.length,
        seriesTitle: `${currentScenario.name} (${rets.length} years)`
      };
    } else {
      const rets = extractReturnsFromSimPath(simResult, selectedSimPath);
      const labelMap = {
        median: 'Monte Carlo 50th Median Path',
        p25: 'Monte Carlo 25th Percentile Path (Mild Bear)',
        p5: 'Monte Carlo 5th Percentile Path (Severe Stress)',
        p75: 'Monte Carlo 75th Percentile Path (Strong Bull)'
      };
      return {
        returnSeries: rets,
        horizonYears: Math.min(rets.length, 30), // keep withdrawal analysis focused on 10-30y
        seriesTitle: labelMap[selectedSimPath]
      };
    }
  }, [operatingMode, selectedSimPath, selectedScenarioId, historicalData, simResult]);

  // Compute withdrawal impact
  const analysisResult: WithdrawalAnalysisResult = useMemo(() => {
    const validEnd = Math.max(intervalStart + 1, Math.min(horizonYears, intervalEnd));
    return calculateWithdrawalImpact(
      initialCapital,
      horizonYears,
      returnSeries,
      cashFlows,
      inflationRate,
      intervalStart,
      validEnd
    );
  }, [initialCapital, horizonYears, returnSeries, cashFlows, inflationRate, intervalStart, intervalEnd]);

  // Add new cashflow event
  const handleAddCashFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmount <= 0) return;
    const newEvent: CashFlowEvent = {
      id: `cf-${Date.now()}`,
      year: Math.min(horizonYears, Math.max(1, newYear)),
      type: newType,
      amount: newIsPercentage ? newAmount / 100 : newAmount,
      isPercentage: newIsPercentage,
      label: newLabel || (newType === 'withdrawal' ? 'Cash Withdrawal' : 'Capital Contribution')
    };
    setCashFlows(prev => [...prev, newEvent].sort((a, b) => a.year - b.year));
  };

  const handleRemoveCashFlow = (id: string) => {
    setCashFlows(prev => prev.filter(cf => cf.id !== id));
  };

  // Preset templates
  const loadPresetTemplate = (templateName: string) => {
    if (templateName === 'profit_taker') {
      setCashFlows([
        { id: '1', year: 3, type: 'withdrawal', amount: 0.20, isPercentage: true, label: 'Take 20% profits' },
        { id: '2', year: 6, type: 'withdrawal', amount: 0.20, isPercentage: true, label: 'Take second 20% tranche' }
      ]);
    } else if (templateName === 'retirement_4pct') {
      const flows: CashFlowEvent[] = [];
      for (let yr = 1; yr <= Math.min(horizonYears, 25); yr++) {
        flows.push({
          id: `swr-${yr}`,
          year: yr,
          type: 'withdrawal',
          amount: initialCapital * 0.04,
          isPercentage: false,
          label: `Year ${yr} 4% SWR distribution`
        });
      }
      setCashFlows(flows);
    } else if (templateName === 'panic_seller') {
      setCashFlows([
        { id: '1', year: 2, type: 'withdrawal', amount: 0.50, isPercentage: true, label: 'Panic sell 50% during drop' }
      ]);
    } else if (templateName === 'clear') {
      setCashFlows([]);
    }
  };

  const intervalData = analysisResult.intervalAnalysis;

  return (
    <div className="space-y-6">
      {/* Header explanation banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              <span>Opportunity Cost & Profit Withdrawal Calculator (Tab 2)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-4xl">
              <strong>Why Tab 2?</strong> Tab 1 generates the forward Monte Carlo market paths. Tab 2 executes the core counterfactual analysis from the specification:
              <em> "If you pull out profits or cash out during a dip, what happens to your compounding over time?"</em> Quantifies <strong>Lost Compounding Gains</strong> in rising markets and <strong>Avoided Losses</strong> in market crashes.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              Currency: <strong className="text-cyan-400">{currency} ({sym})</strong>
            </span>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('forecast')}
                className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors font-medium"
              >
                ← Tab 1 (Forecast)
              </button>
            )}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Trajectory Mode:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setOperatingMode('simulated')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  operatingMode === 'simulated'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Forward Monte Carlo Path
              </button>
              <button
                onClick={() => setOperatingMode('historical')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  operatingMode === 'historical'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Historical Empirical Path
              </button>
            </div>
          </div>

          {operatingMode === 'simulated' ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Monte Carlo Trajectory:</span>
              <select
                value={selectedSimPath}
                onChange={(e) => setSelectedSimPath(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
              >
                <option value="median">50th Percentile (Expected Median)</option>
                <option value="p25">25th Percentile (Below Average)</option>
                <option value="p5">5th Percentile (Severe Bear Market)</option>
                <option value="p75">75th Percentile (Bull Expansion)</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Historical Era:</span>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
              >
                {HISTORICAL_SCENARIOS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Trajectory Graph & Core Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Dual Trajectory Chart */}
          <TrajectoryChart
            timeSeries={analysisResult.timeSeries}
            initialCapital={initialCapital}
            currency={currency}
            highlightInterval={{
              startYear: intervalStart,
              endYear: Math.min(horizonYears, intervalEnd)
            }}
          />

          {/* Core Metrics Cards (Page 4-5 Table) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block mb-0.5">Terminal with Cash-Outs</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-amber-300 tabular-nums">
                {formatCurrency(analysisResult.terminalWithWithdrawal, 0, currency)}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Cash Extracted: {formatCurrency(analysisResult.totalWithdrawn, 0, currency)}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-cyan-500/20 bg-cyan-950/10 rounded-xl p-3.5">
              <span className="text-[11px] text-cyan-400 block mb-0.5">Counterfactual (No Withdrawals)</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-cyan-200 tabular-nums">
                {formatCurrency(analysisResult.terminalWithoutWithdrawal, 0, currency)}
              </div>
              <span className="text-[10px] text-cyan-400/80 font-mono mt-1 block">
                {formatMultiplier(analysisResult.terminalWithoutWithdrawal / initialCapital)} of starting
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block mb-0.5">Annualized Opportunity Cost</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-200 tabular-nums">
                {formatPercent(analysisResult.annualizedOpportunityCost)}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                CAGR drag from withdrawal timing
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block mb-0.5">Opportunity-Cost Multiple</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-200 tabular-nums">
                {formatMultiplier(analysisResult.opportunityCostMultiple)}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Growth of withdrawn cash if left invested
              </span>
            </div>
          </div>

          {/* Interval Impact Selector (Page 4 & 5 Core Requirement) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Interval Impact Analysis (Strict Date-to-Date Window)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specification Section 7: Measure lost gains or avoided losses strictly between any two user-chosen years.
                </p>
              </div>

              {/* Year Selectors */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">From Year:</span>
                  <select
                    value={intervalStart}
                    onChange={(e) => setIntervalStart(parseInt(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 font-mono text-xs"
                  >
                    {Array.from({ length: horizonYears }, (_, i) => i).map(yr => (
                      <option key={yr} value={yr}>
                        Y{yr}
                      </option>
                    ))}
                  </select>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">To Year:</span>
                  <select
                    value={intervalEnd}
                    onChange={(e) => setIntervalEnd(parseInt(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 font-mono text-xs"
                  >
                    {Array.from({ length: horizonYears }, (_, i) => i + 1).map(yr => (
                      <option key={yr} value={yr} disabled={yr <= intervalStart}>
                        Y{yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Interval Outcome Box */}
            {intervalData && (
              <div className={`p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4 ${
                intervalData.intervalNetImpact >= 0
                  ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                  : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
              }`}>
                <div>
                  <span className="text-xs font-semibold block uppercase tracking-wider opacity-80">
                    {intervalData.intervalNetImpact >= 0
                      ? 'Net Forfeited Compounding Gains in Interval'
                      : 'Net Avoided Market Losses in Interval'}
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono mt-0.5">
                    {formatCurrency(Math.abs(intervalData.intervalNetImpact), 0, currency)}
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    {intervalData.intervalNetImpact >= 0
                      ? `Between Year ${intervalData.startYear} and Year ${intervalData.endYear}, market returns exceeded cash preservation, resulting in ${formatCurrency(intervalData.intervalLostGains, 0, currency)} forfeited upside.`
                      : `Between Year ${intervalData.startYear} and Year ${intervalData.endYear}, withdrawing capital successfully prevented ${formatCurrency(intervalData.intervalAvoidedLosses, 0, currency)} in portfolio destruction during downturn.`}
                  </p>
                </div>

                <div className="text-right font-mono text-xs space-y-1">
                  <div>
                    <span className="opacity-70">Interval Lost Gains: </span>
                    <strong>{formatCurrency(intervalData.intervalLostGains, 0, currency)}</strong>
                  </div>
                  <div>
                    <span className="opacity-70">Interval Avoided Losses: </span>
                    <strong>{formatCurrency(intervalData.intervalAvoidedLosses, 0, currency)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cashflow Event Management */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Presets */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Withdrawal Scenarios</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => loadPresetTemplate('profit_taker')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800/40 text-left text-slate-300"
              >
                <div className="font-semibold text-cyan-300">Profit Taker</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sell 20% in Y3 & Y6</div>
              </button>
              <button
                onClick={() => loadPresetTemplate('panic_seller')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800/40 text-left text-slate-300"
              >
                <div className="font-semibold text-rose-300">Panic Seller</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sell 50% in Y2 crash</div>
              </button>
              <button
                onClick={() => loadPresetTemplate('retirement_4pct')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800/40 text-left text-slate-300"
              >
                <div className="font-semibold text-emerald-300">4% SWR Rule</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Annual retirement draws</div>
              </button>
              <button
                onClick={() => loadPresetTemplate('clear')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800/40 text-left text-slate-400"
              >
                <div className="font-semibold">Reset to None</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Zero cash-outs</div>
              </button>
            </div>
          </div>

          {/* Add Cash Flow Form */}
          <form
            onSubmit={handleAddCashFlow}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
          >
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Cash-Flow Event</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Occurs in Year</label>
                <input
                  type="number"
                  min={1}
                  max={horizonYears}
                  value={newYear}
                  onChange={(e) => setNewYear(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
                >
                  <option value="withdrawal">Withdrawal (Cash Out)</option>
                  <option value="contribution">Contribution (Add Cash)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">
                    {newIsPercentage ? 'Percentage (%)' : `Amount (${sym})`}
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewIsPercentage(!newIsPercentage)}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Switch to {newIsPercentage ? sym : '%'}
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  step={newIsPercentage ? 1 : 1000}
                  value={newAmount}
                  onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description / Reason</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Realize profits"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Event</span>
            </button>
          </form>

          {/* Events List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Scheduled Cash Flows ({cashFlows.length})
              </h3>
              {cashFlows.length > 0 && (
                <button
                  onClick={() => setCashFlows([])}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {cashFlows.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No intermediate withdrawals recorded.
                <br />
                Capital remains 100% invested.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {cashFlows.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-bold">Year {ev.year}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          ev.type === 'withdrawal'
                            ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                            : 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                        }`}>
                          {ev.type === 'withdrawal' ? 'Withdrawal' : 'Contribution'}
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {ev.isPercentage ? `${(ev.amount * 100).toFixed(0)}%` : formatCurrency(ev.amount, 0, currency)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        {ev.label}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCashFlow(ev.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
