import React from 'react';
import { TopInvestment, US_GDP_BILLIONS, GLOBAL_GDP_BILLIONS } from '../data/topInvestments';
import { formatPercent, formatMultiplier } from '../utils/financialEngine';
import {
  X,
  TrendingUp,
  TrendingDown,
  Building2,
  PieChart,
  ArrowRight,
  ShieldAlert,
  Percent,
  Activity,
  Globe
} from 'lucide-react';

interface InvestmentModalProps {
  investment: TopInvestment | null;
  onClose: () => void;
  onSimulateAsset: (inv: TopInvestment) => void;
  onAnalyzeWithdrawals: (inv: TopInvestment) => void;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  investment,
  onClose,
  onSimulateAsset,
  onAnalyzeWithdrawals
}) => {
  if (!investment) return null;

  const isGainer = investment.fiveYearCagr >= 0;
  const isLoss = investment.fiveYearCagr < 0 || investment.currentYearReturn < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Lockup */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-cyan-400 text-lg shrink-0">
            {investment.ticker}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                {investment.name}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                {investment.type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>{investment.sector}</span>
              <span aria-hidden="true">·</span>
              <span>{investment.headquarters}</span>
              <span aria-hidden="true">·</span>
              <span>Est. {investment.foundedYear}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          {investment.description}
        </p>

        {/* Financial & GDP Scale Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Market Cap / AUM</span>
            <span className="text-base font-bold font-mono text-slate-100">
              ${(investment.marketCapBillions >= 1000 ? investment.marketCapBillions / 1000 : investment.marketCapBillions).toFixed(2)}
              {investment.marketCapBillions >= 1000 ? ' Trillion' : ' Billion'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/10">
            <span className="text-[11px] text-cyan-400 block mb-0.5">% of US GDP</span>
            <span className="text-base font-bold font-mono text-cyan-300">
              {investment.percentUsGdp.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              of $28.5T US GDP
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">5-Year Real CAGR</span>
            <span className={`text-base font-bold font-mono ${isGainer ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isGainer ? '+' : ''}{formatPercent(investment.fiveYearCagr, 1)}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              YTD: {investment.currentYearReturn >= 0 ? '+' : ''}{formatPercent(investment.currentYearReturn, 1)}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Annual Volatility</span>
            <span className="text-base font-bold font-mono text-indigo-300">
              {formatPercent(investment.annualVolatility, 1)}
            </span>
            <span className="text-[10px] text-rose-400/90 block font-mono">
              Max DD: {formatPercent(investment.maxDrawdown, 1)}
            </span>
          </div>
        </div>

        {/* Holdings Breakdown (if fund/institutional portfolio) */}
        {investment.holdingsSummary && investment.holdingsSummary.length > 0 && (
          <div className="mt-4 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                <span>Primary Portfolio Asset Allocation & Holdings</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Portfolio Weight</span>
            </div>

            <div className="space-y-1.5">
              {investment.holdingsSummary.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-sans">{h.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, h.weightPct * 1.5)}%` }}
                      />
                    </div>
                    <span className="font-mono font-semibold text-cyan-300 tabular-nums text-xs">
                      {h.weightPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loss & Drawdown Analysis Notice */}
        {isLoss && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <strong className="font-semibold block text-rose-200">Loss & Drawdown Stress Profile:</strong>
              This asset exhibits significant historical downside ({formatPercent(investment.maxDrawdown)} peak drawdown). Testing this asset in the Monte Carlo Forecaster and Withdrawal Calculator shows the counterfactual value of taking profits or cutting losses before such drawdowns occur.
            </div>
          </div>
        )}

        {/* Action Buttons to Bridge Directly to Tab 1 (Forecast) & Tab 2 (Withdrawal) */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3 text-xs">
          <button
            onClick={() => onAnalyzeWithdrawals(investment)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 rounded-lg font-medium transition-colors flex items-center gap-1.5"
          >
            <span>Analyze Withdrawal Impact</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSimulateAsset(investment)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Simulate in Monte Carlo Forecaster</span>
          </button>
        </div>
      </div>
    </div>
  );
};
