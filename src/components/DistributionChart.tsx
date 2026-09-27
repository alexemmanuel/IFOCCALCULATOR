import React from 'react';
import { formatCurrencyCompact, formatPercent } from '../utils/financialEngine';
import { CurrencyCode } from '../types';

interface DistributionChartProps {
  distribution: { bucket: string; min: number; max: number; count: number; percentage: number }[];
  initialCapital: number;
  goodProfitThreshold: number;
  failureThreshold: number;
  probGoodProfits: number;
  probFailure: number;
  currency?: CurrencyCode;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  initialCapital,
  goodProfitThreshold,
  failureThreshold,
  probGoodProfits,
  probFailure,
  currency = 'USD'
}) => {
  if (!distribution || distribution.length === 0) return null;

  const maxPercentage = Math.max(...distribution.map(d => d.percentage), 0.05);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Terminal Real Wealth Probability Density</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical distribution of paths across log-spaced wealth outcomes
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-300">
              Good Profits (≥{(goodProfitThreshold / initialCapital).toFixed(1)}x):{' '}
              <strong className="text-emerald-400 font-mono tabular-nums">{formatPercent(probGoodProfits)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-300">
              Failure (≤{(failureThreshold / initialCapital).toFixed(1)}x):{' '}
              <strong className="text-rose-400 font-mono tabular-nums">{formatPercent(probFailure)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Histogram Bar visualization */}
      <div className="h-44 w-full flex items-end gap-1 pt-6 pb-2 px-1 border-b border-slate-800">
        {distribution.map((bin, i) => {
          const heightPct = (bin.percentage / maxPercentage) * 100;
          const isFailureZone = bin.max <= failureThreshold;
          const isProfitZone = bin.min >= goodProfitThreshold;

          let barColor = 'bg-cyan-500/50 hover:bg-cyan-400';
          if (isFailureZone) barColor = 'bg-rose-500/60 hover:bg-rose-400';
          else if (isProfitZone) barColor = 'bg-emerald-500/60 hover:bg-emerald-400';

          return (
            <div
              key={i}
              className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-slate-100 border border-slate-700 p-2 rounded-md shadow-xl text-[11px] whitespace-nowrap z-20 pointer-events-none">
                <span className="font-semibold">{bin.bucket}</span>
                <span className="text-slate-400 font-mono">
                  {formatPercent(bin.percentage, 2)} ({bin.count} paths)
                </span>
              </div>

              {/* Bar */}
              <div
                style={{ height: `${Math.max(4, heightPct)}%` }}
                className={`w-full rounded-t-xs transition-all ${barColor}`}
              />
            </div>
          );
        })}
      </div>

      {/* Range Labels below bars */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono tabular-nums px-1">
        <span>Low: {formatCurrencyCompact(distribution[0]?.min || 0, currency)}</span>
        <span>Median: {formatCurrencyCompact(distribution[Math.floor(distribution.length / 2)]?.min || 0, currency)}</span>
        <span>High: {formatCurrencyCompact(distribution[distribution.length - 1]?.max || 0, currency)}</span>
      </div>
    </div>
  );
};
