import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRight, DollarSign, Percent, TrendingUp, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { formatCurrency, formatMultiplier, formatPercent } from '../utils/financialEngine';
import { CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from '../data/historicalData';

interface QuickCalculatorWidgetProps {
  initialCapital: number;
  expectedReturn: number;
  horizonYears: number;
  annualContribution: number;
  onApplyToSimulation: (capital: number, contribution: number, years: number, ret: number) => void;
  currency?: CurrencyCode;
  liveRates?: Record<CurrencyCode, number>;
  onOpenFullCalculator?: () => void;
}

export const QuickCalculatorWidget: React.FC<QuickCalculatorWidgetProps> = ({
  initialCapital,
  expectedReturn,
  horizonYears,
  annualContribution,
  onApplyToSimulation,
  currency = 'USD',
  liveRates,
  onOpenFullCalculator
}) => {
  const currCfg = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['USD'];
  const sym = currCfg.symbol;
  const rateToUsd = liveRates?.[currency] ?? currCfg.rateToUsd ?? 1.0;

  const [calcCapital, setCalcCapital] = useState<number>(initialCapital);
  const [calcMonthlySavings, setCalcMonthlySavings] = useState<number>(Math.round(annualContribution / 12));
  const [calcYears, setCalcYears] = useState<number>(Math.min(50, horizonYears));
  const [calcReturnPct, setCalcReturnPct] = useState<number>(expectedReturn * 100);
  const [earlyWithdrawalAmount, setEarlyWithdrawalAmount] = useState<number>(Math.max(10, Math.round(initialCapital * 0.25)));
  const [earlyWithdrawalYear, setEarlyWithdrawalYear] = useState<number>(5);

  // Sync state when props change due to currency conversion or parent updates
  React.useEffect(() => {
    setCalcCapital(initialCapital);
    setCalcMonthlySavings(Math.round(annualContribution / 12));
    setEarlyWithdrawalAmount(Math.max(10, Math.round(initialCapital * 0.25)));
  }, [initialCapital, annualContribution, currency]);

  // Dynamic compound calculation
  const calculations = useMemo(() => {
    const annualReturn = calcReturnPct / 100;
    const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const totalMonths = calcYears * 12;

    // Total invested
    const totalDeposits = calcCapital + calcMonthlySavings * 12 * calcYears;

    // Terminal wealth WITHOUT any early withdrawals
    // FV = P * (1 + r)^t + PMT * [((1 + r_m)^n - 1) / r_m]
    let terminalWithout = calcCapital * Math.pow(1 + annualReturn, calcYears);
    if (monthlyRate > 0 && calcMonthlySavings > 0) {
      terminalWithout += calcMonthlySavings * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    }

    // Compound interest earned
    const interestEarned = Math.max(0, terminalWithout - totalDeposits);

    // Terminal wealth WITH early withdrawal at earlyWithdrawalYear
    // What would that withdrawn amount grow to by terminal year?
    const remainingYears = Math.max(0, calcYears - earlyWithdrawalYear);
    const counterfactualValueOfWithdrawn = earlyWithdrawalAmount * Math.pow(1 + annualReturn, remainingYears);
    const forfeitedGrowth = Math.max(0, counterfactualValueOfWithdrawn - earlyWithdrawalAmount);

    const terminalWith = Math.max(0, terminalWithout - counterfactualValueOfWithdrawn);
    const netActualPlusCash = terminalWith + earlyWithdrawalAmount;

    return {
      totalDeposits,
      terminalWithout,
      interestEarned,
      compoundMultiple: calcCapital > 0 ? terminalWithout / (calcCapital + calcMonthlySavings * 12 * calcYears) : 1,
      counterfactualValueOfWithdrawn,
      forfeitedGrowth,
      terminalWith,
      netActualPlusCash
    };
  }, [calcCapital, calcMonthlySavings, calcYears, calcReturnPct, earlyWithdrawalAmount, earlyWithdrawalYear]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Instant Investment & Opportunity Cost Calculator
            </h3>
            <span className="text-[11px] text-slate-400">
              Interactive financial arithmetic · Compounding vs. Early Withdrawal Penalty
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFullCalculator && (
            <button
              onClick={onOpenFullCalculator}
              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Open the detailed Tab 2 Withdrawal & Opportunity Cost Calculator"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Tab 2 Calculator</span>
              <ExternalLink className="w-3 h-3 ml-0.5 text-amber-400" />
            </button>
          )}

          <button
            onClick={() =>
              onApplyToSimulation(calcCapital, calcMonthlySavings * 12, calcYears, calcReturnPct / 100)
            }
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            title="Transfer these inputs into the full Monte Carlo Forecaster"
          >
            <span>Sync with Forecaster</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Input controls grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 font-medium truncate">Starting Capital ({sym})</label>
          </div>
          <input
            type="number"
            step={rateToUsd >= 100 ? 500000 : 5000}
            value={calcCapital}
            onChange={(e) => setCalcCapital(Math.max(0, Number(e.target.value)))}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
          />
          {currency !== 'USD' && (
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              ≈ ${Math.round(calcCapital / rateToUsd).toLocaleString()} USD
            </div>
          )}
          {/* Quick preset buttons adjusted by rateToUsd */}
          <div className="flex gap-1 mt-1">
            {[10000, 50000, 100000].map((baseAmt) => {
              const scaled = Math.round((baseAmt * rateToUsd) / (rateToUsd >= 100 ? 10000 : 1000)) * (rateToUsd >= 100 ? 10000 : 1000);
              return (
                <button
                  key={baseAmt}
                  type="button"
                  onClick={() => setCalcCapital(scaled)}
                  className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800"
                >
                  {sym}{scaled >= 1000000 ? `${(scaled / 1000000).toFixed(1)}M` : `${Math.round(scaled / 1000)}k`}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 font-medium truncate">Monthly Savings ({sym})</label>
          </div>
          <input
            type="number"
            step={rateToUsd >= 100 ? 25000 : 100}
            value={calcMonthlySavings}
            onChange={(e) => setCalcMonthlySavings(Math.max(0, Number(e.target.value)))}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
          />
          {currency !== 'USD' && (
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              ≈ ${Math.round(calcMonthlySavings / rateToUsd).toLocaleString()}/mo
            </div>
          )}
          <div className="flex gap-1 mt-1">
            {[0, 250, 500, 1000].map((baseAmt) => {
              const scaled = baseAmt === 0 ? 0 : Math.round((baseAmt * rateToUsd) / (rateToUsd >= 100 ? 1000 : 100)) * (rateToUsd >= 100 ? 1000 : 100);
              return (
                <button
                  key={baseAmt}
                  type="button"
                  onClick={() => setCalcMonthlySavings(scaled)}
                  className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800"
                >
                  {baseAmt === 0 ? '0' : `${sym}${scaled >= 1000 ? `${Math.round(scaled / 1000)}k` : scaled}`}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-medium">Investment Horizon (Years)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={calcYears}
            onChange={(e) => setCalcYears(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
          />
          <div className="flex gap-1 mt-1">
            {[5, 10, 20, 30].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setCalcYears(yr)}
                className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800"
              >
                {yr}y
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-medium">Expected Real Return (% p.a.)</label>
          <input
            type="number"
            step={0.5}
            value={calcReturnPct}
            onChange={(e) => setCalcReturnPct(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
          />
          <div className="flex gap-1 mt-1">
            {[4.0, 6.5, 8.0].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setCalcReturnPct(r)}
                className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800"
              >
                {r}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output Comparison Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[11px] mb-0.5">Total Out-of-Pocket Deposits</span>
          <span className="text-base sm:text-lg font-bold font-mono text-slate-200">
            {formatCurrency(calculations.totalDeposits, 0, currency)}
          </span>
          {currency !== 'USD' && (
            <span className="text-[10px] text-emerald-400 font-mono block">
              ≈ {formatCurrency(calculations.totalDeposits / rateToUsd, 0, 'USD')} USD
            </span>
          )}
          <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
            Initial + {sym}{(calcMonthlySavings * 12).toLocaleString()}/yr
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/10">
          <span className="text-cyan-400 block text-[11px] mb-0.5">Expected Terminal Wealth (Hold)</span>
          <span className="text-base sm:text-lg font-bold font-mono text-cyan-200">
            {formatCurrency(calculations.terminalWithout, 0, currency)}
          </span>
          {currency !== 'USD' && (
            <span className="text-[10px] text-emerald-400 font-mono block font-semibold">
              ≈ {formatCurrency(calculations.terminalWithout / rateToUsd, 0, 'USD')} USD
            </span>
          )}
          <span className="text-[10px] text-cyan-400/80 block font-mono mt-0.5">
            {formatMultiplier(calculations.compoundMultiple)} total growth
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/10">
          <span className="text-emerald-400 block text-[11px] mb-0.5">Pure Compound Interest</span>
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-300">
            +{formatCurrency(calculations.interestEarned, 0, currency)}
          </span>
          {currency !== 'USD' && (
            <span className="text-[10px] text-emerald-400 font-mono block">
              ≈ +{formatCurrency(calculations.interestEarned / rateToUsd, 0, 'USD')} USD
            </span>
          )}
          <span className="text-[10px] text-emerald-500 block font-mono mt-0.5">
            Growth on growth
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-rose-500/20 bg-rose-950/10">
          <span className="text-rose-400 block text-[11px] mb-0.5">
            Opportunity Cost of Withdrawing {sym}{earlyWithdrawalAmount.toLocaleString()} at Y{earlyWithdrawalYear}
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-rose-300">
            -{formatCurrency(calculations.forfeitedGrowth, 0, currency)}
          </span>
          {currency !== 'USD' && (
            <span className="text-[10px] text-rose-400/90 font-mono block">
              ≈ -{formatCurrency(calculations.forfeitedGrowth / rateToUsd, 0, 'USD')} USD
            </span>
          )}
          <span className="text-[10px] text-rose-400/80 block font-mono mt-0.5">
            Gains forfeited by cash-out
          </span>
        </div>
      </div>
    </div>
  );
};
