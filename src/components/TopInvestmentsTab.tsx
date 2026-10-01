import React, { useState, useMemo } from 'react';
import { TOP_INVESTMENTS, TopInvestment, US_GDP_BILLIONS, GLOBAL_GDP_BILLIONS } from '../data/topInvestments';
import { InvestmentModal } from './InvestmentModal';
import { formatPercent, formatMultiplier } from '../utils/financialEngine';
import { CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from '../data/historicalData';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Building2,
  PieChart,
  BarChart3,
  ArrowRight,
  Flame,
  ShieldAlert,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

interface TopInvestmentsTabProps {
  onSimulateAsset: (inv: TopInvestment) => void;
  onAnalyzeWithdrawals: (inv: TopInvestment) => void;
  reportingCurrency?: CurrencyCode;
  liveRates?: Record<CurrencyCode, number>;
}

export const TopInvestmentsTab: React.FC<TopInvestmentsTabProps> = ({
  onSimulateAsset,
  onAnalyzeWithdrawals,
  reportingCurrency = 'USD',
  liveRates
}) => {
  const currCfg = CURRENCY_CONFIGS[reportingCurrency] || CURRENCY_CONFIGS['USD'];
  const sym = currCfg.symbol;
  const rateToUsd = liveRates?.[reportingCurrency] ?? currCfg.rateToUsd ?? 1.0;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company' | 'africa' | 'institutional' | 'etf' | 'losses'>('all');
  const [sortBy, setSortBy] = useState<'market_cap' | 'percent_gdp' | 'cagr' | 'volatility' | 'drawdown'>('percent_gdp');
  const [selectedInvestment, setSelectedInvestment] = useState<TopInvestment | null>(null);

  // Filter and sort items
  const filteredInvestments = useMemo(() => {
    return TOP_INVESTMENTS.filter(inv => {
      const matchSearch =
        searchQuery === '' ||
        inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.sector.toLowerCase().includes(searchQuery.toLowerCase());

      let matchFilter = true;
      if (filterType === 'company') matchFilter = inv.type === 'company' && inv.fiveYearCagr > 0;
      else if (filterType === 'africa') matchFilter = inv.region === 'Africa';
      else if (filterType === 'institutional') matchFilter = inv.type === 'institutional';
      else if (filterType === 'etf') matchFilter = inv.type === 'etf';
      else if (filterType === 'losses') matchFilter = inv.fiveYearCagr < 0 || inv.currentYearReturn < 0 || inv.maxDrawdown < -0.50;

      return matchSearch && matchFilter;
    }).sort((a, b) => {
      if (sortBy === 'market_cap') return b.marketCapBillions - a.marketCapBillions;
      if (sortBy === 'percent_gdp') return b.percentUsGdp - a.percentUsGdp;
      if (sortBy === 'cagr') return b.fiveYearCagr - a.fiveYearCagr;
      if (sortBy === 'volatility') return b.annualVolatility - a.annualVolatility;
      if (sortBy === 'drawdown') return a.maxDrawdown - b.maxDrawdown; // deepest loss first
      return 0;
    });
  }, [searchQuery, filterType, sortBy]);

  // Aggregate Macro Metrics
  const macroStats = useMemo(() => {
    const totalCap = TOP_INVESTMENTS.reduce((sum, inv) => sum + inv.marketCapBillions, 0);
    const topCap = [...TOP_INVESTMENTS].sort((a, b) => b.fiveYearCagr - a.fiveYearCagr)[0];
    const deepestLoss = [...TOP_INVESTMENTS].sort((a, b) => a.maxDrawdown - b.maxDrawdown)[0];

    return {
      totalCap,
      percentOfUsGdp: (totalCap / US_GDP_BILLIONS) * 100,
      topGainer: topCap,
      deepestLoss
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span>Top Global Investments, Companies & Portfolio Explorer</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-4xl">
              Search and analyze leading global corporations, sovereign wealth funds, and ETFs by
              <strong> Market Capitalization</strong>, <strong>% of US GDP</strong>, 5-Year CAGR, and <strong>Maximum Historical Drawdown / Losses</strong>.
              One-click simulation lets you stress-test any company's return and volatility in the Monte Carlo engine.
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
            US GDP Benchmark: <strong className="text-slate-100">$28.5 Trillion</strong>
          </div>
        </div>
      </div>

      {/* Macro Insight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block mb-0.5">Tracked Asset Capitalization</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-cyan-300 tabular-nums">
            ${(macroStats.totalCap / 1000).toFixed(1)} Trillion
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono mt-1 block">
            {macroStats.percentOfUsGdp.toFixed(1)}% of US GDP
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block mb-0.5">US GDP Dominance Leader</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tabular-nums">
            AAPL (12.1% GDP)
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            $3.45 Trillion Market Cap
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block mb-0.5">Highest 5-Year Growth Leader</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-cyan-300 tabular-nums">
            {macroStats.topGainer.ticker} (+{(macroStats.topGainer.fiveYearCagr * 100).toFixed(1)}%)
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Vol: {(macroStats.topGainer.annualVolatility * 100).toFixed(1)}%
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block mb-0.5">Deepest Loss / Drawdown Profile</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-400 tabular-nums">
            {macroStats.deepestLoss.ticker} ({(macroStats.deepestLoss.maxDrawdown * 100).toFixed(1)}%)
          </div>
          <span className="text-[10px] text-rose-400/80 font-mono mt-1 block">
            Severe Drawdown Stress Case
          </span>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company name, ticker (e.g. AAPL, NVDA, Berkshire), or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500 font-sans"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 shrink-0 hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden font-sans"
            >
              <option value="percent_gdp">% of US GDP (Largest to Smallest)</option>
              <option value="market_cap">Market Cap ($ Billions / Trillions)</option>
              <option value="cagr">5-Year Real CAGR (Top Gainers)</option>
              <option value="drawdown">Deepest Drawdown (Max Losses)</option>
              <option value="volatility">Annual Volatility (Risk)</option>
            </select>
          </div>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            All Assets ({TOP_INVESTMENTS.length})
          </button>
          <button
            onClick={() => setFilterType('africa')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterType === 'africa'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Africa Tiers A & B ({TOP_INVESTMENTS.filter(i => i.region === 'Africa').length})
          </button>
          <button
            onClick={() => setFilterType('company')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterType === 'company'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Global Mega-Caps
          </button>
          <button
            onClick={() => setFilterType('institutional')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterType === 'institutional'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Institutional Portfolios
          </button>
          <button
            onClick={() => setFilterType('etf')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterType === 'etf'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Index ETFs (SPY, QQQ)
          </button>
          <button
            onClick={() => setFilterType('losses')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterType === 'losses'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Severe Drawdowns & Loss Cases
          </button>
        </div>
      </div>

      {/* Investment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvestments.map((inv) => {
          const isGainer = inv.fiveYearCagr >= 0;
          const isLoss = inv.fiveYearCagr < 0 || inv.currentYearReturn < 0;

          return (
            <div
              key={inv.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header Lockup */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">
                        {inv.ticker}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                        {inv.type}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">
                      {inv.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-400 font-mono">{inv.country}</span>
                      <span className="text-slate-600">·</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        inv.tier === 'Tier A'
                          ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-300'
                          : inv.tier === 'Tier B'
                          ? 'bg-amber-950/60 border border-amber-800/40 text-amber-300'
                          : inv.tier === 'Tier C'
                          ? 'bg-rose-950/60 border border-rose-800/40 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {inv.tier}
                      </span>
                    </div>
                  </div>

                  {/* Return badge */}
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-bold ${
                      isGainer
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                    }`}
                  >
                    {isGainer ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {isGainer ? '+' : ''}
                      {(inv.fiveYearCagr * 100).toFixed(1)}% 5Y
                    </span>
                  </div>
                </div>

                {/* Subtitle / Sector */}
                <div className="text-[11px] text-slate-400 mt-2 truncate">
                  {inv.sector}
                </div>

                {/* Core Stats Matrix */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Market Cap</span>
                    <span className="font-bold text-slate-100">
                      ${(inv.marketCapBillions >= 1000 ? inv.marketCapBillions / 1000 : inv.marketCapBillions).toFixed(1)}
                      {inv.marketCapBillions >= 1000 ? 'T' : 'B'}
                    </span>
                    {reportingCurrency !== 'USD' && (
                      <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">
                        ≈ {sym}{((inv.marketCapBillions * rateToUsd) >= 1000 ? (inv.marketCapBillions * rateToUsd) / 1000 : (inv.marketCapBillions * rateToUsd)).toFixed(1)}
                        {(inv.marketCapBillions * rateToUsd) >= 1000 ? 'T' : 'B'}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/10">
                    <span className="text-[10px] text-cyan-400 block font-sans">% of US GDP</span>
                    <span className="font-bold text-cyan-300">
                      {inv.percentUsGdp.toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Annual Volatility</span>
                    <span className="font-semibold text-indigo-300">
                      {(inv.annualVolatility * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Max Drawdown</span>
                    <span className="font-semibold text-rose-400">
                      {(inv.maxDrawdown * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Holdings Preview if available */}
                {inv.holdingsSummary && (
                  <div className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <PieChart className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Top: {inv.holdingsSummary.slice(0, 2).map(h => h.name.split(' ')[0]).join(', ')}...</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setSelectedInvestment(inv)}
                  className="text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onAnalyzeWithdrawals(inv)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-md font-medium text-[11px] transition-colors"
                    title="Analyze opportunity cost of withdrawing from this investment"
                  >
                    Withdrawals
                  </button>

                  <button
                    onClick={() => onSimulateAsset(inv)}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                    title="Load this asset's CAGR and volatility into Monte Carlo Forecaster"
                  >
                    <span>Simulate</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Investment Detail Modal */}
      <InvestmentModal
        investment={selectedInvestment}
        onClose={() => setSelectedInvestment(null)}
        onSimulateAsset={(inv) => {
          setSelectedInvestment(null);
          onSimulateAsset(inv);
        }}
        onAnalyzeWithdrawals={(inv) => {
          setSelectedInvestment(null);
          onAnalyzeWithdrawals(inv);
        }}
      />
    </div>
  );
};
